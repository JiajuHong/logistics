import java.sql.*;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 站点连通图生成工具
 * <p>
 * 该工具用于根据station表中的站点数据，生成以下数据：
 * 1. 所有站点对之间的直线距离(direct_distance表)
 * 2. 站点之间的路线连接(route表)
 * <p>
 * 运行方法: java -cp "你的classpath:包含mysql-connector-java.jar" com.logistics.backend.sql.StationGraphGenerator
 */
public class StationGraphGenerator {

    // 数据库连接配置 - 请根据实际环境修改
    private static final String JDBC_URL = "jdbc:mysql://localhost:3306/logistics?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true";
    private static final String USERNAME = "root";
    private static final String PASSWORD = "123456";

    // 地球半径（单位：千米）
    private static final double EARTH_RADIUS = 6371.0;

    // 添加一个常量定义批处理大小
    private static final int BATCH_SIZE = 300; // 根据服务器性能调整

    public static void main(String[] args) {
        try {
            // 加载JDBC驱动
            Class.forName("com.mysql.cj.jdbc.Driver");

            // 获取数据库连接
            try (Connection conn = DriverManager.getConnection(JDBC_URL, USERNAME, PASSWORD)) {
                System.out.println("数据库连接成功！");

                // 检查route表是否已有数据
                if (hasExistingRoutes(conn)) {
                    System.out.println("检测到已有路线数据，请选择操作：");
                    System.out.println("1. 清空并重新生成所有数据");
                    System.out.println("2. 增量更新（只添加新站点的数据）");
                    System.out.println("3. 取消操作");

                    try (Scanner scanner = new Scanner(System.in)) {
                        String answer = scanner.nextLine().trim();

                        if (answer.equals("1")) {
                            clearExistingData(conn);
                            // 执行完整的数据生成
                            // ...现有逻辑...
                        } else if (answer.equals("2")) {
                            // 执行增量更新
                            incrementalUpdate(conn, getAllStations(conn));
                            return;
                        } else {
                            System.out.println("操作已取消。");
                            return;
                        }
                    }
                }

                // 获取所有站点
                List<Station> stations = getAllStations(conn);
                if (stations.isEmpty()) {
                    System.out.println("没有找到站点数据，请先导入站点数据。");
                    return;
                }

                System.out.println("找到 " + stations.size() + " 个站点，开始生成连通图...");

                // 计算并保存所有站点对之间的直线距离
                initializeDirectDistances(conn, stations);

                // 为每个站点创建到附近站点的连接，形成连通图
                initializeRoutes(conn, stations);

                // 验证并修复图的连通性
                ensureConnectivity(conn, stations);

                System.out.println("站点连通图生成完成！");

                // 路径连通性测试
                testPathConnectivity(conn, stations);
            }
        } catch (Exception e) {
            System.err.println("发生错误: " + e.getMessage());
            e.printStackTrace();
        }
    }

    /**
     * 检查route表是否已有数据
     */
    private static boolean hasExistingRoutes(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT COUNT(*) FROM logistics.route")) {
            if (rs.next()) {
                return rs.getInt(1) > 0;
            }
        }
        return false;
    }

    /**
     * 清空route和direct_distance表中的数据
     */
    private static void clearExistingData(Connection conn) throws SQLException {
        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM logistics.route");
            stmt.executeUpdate("DELETE FROM logistics.direct_distance");
            System.out.println("已清空现有数据。");
        }
    }

    /**
     * 获取所有站点数据并验证坐标
     */
    private static List<Station> getAllStations(Connection conn) throws SQLException {
        List<Station> stations = new ArrayList<>();
        List<Station> invalidStations = new ArrayList<>();

        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT id, name, code, region_id, longitude, latitude FROM logistics.station WHERE is_delete = 0 AND status = 1")) {

            while (rs.next()) {
                Station station = new Station();
                station.setId(rs.getLong("id"));
                station.setName(rs.getString("name"));
                station.setCode(rs.getString("code"));
                station.setRegionId(rs.getLong("region_id"));

                // 获取经纬度并处理NULL值
                double longitude = rs.getDouble("longitude");
                double latitude = rs.getDouble("latitude");

                if (rs.wasNull() || !isValidCoordinate(longitude, latitude)) {
                    // 坐标无效，记录站点信息
                    station.setLongitude(null);
                    station.setLatitude(null);
                    invalidStations.add(station);
                } else {
                    station.setLongitude(longitude);
                    station.setLatitude(latitude);
                    stations.add(station);
                }
            }
        }

        // 报告无效坐标的站点
        if (!invalidStations.isEmpty()) {
            System.out.println("警告：发现 " + invalidStations.size() + " 个站点坐标无效或缺失：");
            for (Station station : invalidStations) {
                System.out.println("  - 站点ID: " + station.getId() + ", 名称: " + station.getName());
            }
            System.out.println("这些站点将不参与直线距离计算，可能影响路径规划效果");
        }

        return stations;
    }

    /**
     * 验证坐标是否在合理范围内
     */
    private static boolean isValidCoordinate(double longitude, double latitude) {
        // 验证经纬度是否在合理范围内且不为0（0,0常为默认值）
        boolean validRange = longitude >= -180 && longitude <= 180 &&
                latitude >= -90 && latitude <= 90;

        // 检查是否为原点（常见的默认值）
        boolean isOrigin = Math.abs(longitude) < 0.00001 && Math.abs(latitude) < 0.00001;

        return validRange && !isOrigin;
    }

    /**
     * 初始化所有站点对之间的直线距离
     */
    private static void initializeDirectDistances(Connection conn, List<Station> stations) throws SQLException {
        System.out.println("开始计算站点间直线距离...");

        // 准备插入语句
        String sql = "INSERT INTO logistics.direct_distance (station_id1, station_id2, distance) VALUES (?, ?, ?)";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            // 禁用自动提交，批量处理
            conn.setAutoCommit(false);

            int count = 0;
            for (int i = 0; i < stations.size(); i++) {
                Station station1 = stations.get(i);

                for (int j = i + 1; j < stations.size(); j++) {
                    Station station2 = stations.get(j);

                    // 计算两站点间的直线距离
                    double distance = calculateDistance(
                            station1.getLatitude(), station1.getLongitude(),
                            station2.getLatitude(), station2.getLongitude());

                    // 添加方向1的距离
                    pstmt.setLong(1, station1.getId());
                    pstmt.setLong(2, station2.getId());
                    pstmt.setBigDecimal(3, new java.math.BigDecimal(distance));
                    pstmt.addBatch();

                    // 添加方向2的距离
                    pstmt.setLong(1, station2.getId());
                    pstmt.setLong(2, station1.getId());
                    pstmt.setBigDecimal(3, new java.math.BigDecimal(distance));
                    pstmt.addBatch();

                    count += 2;

                    // 使用可配置的批处理大小
                    if (count % BATCH_SIZE == 0) {
                        pstmt.executeBatch();
                        conn.commit();
                        // 添加内存管理和性能监控
                        if (count % (BATCH_SIZE * 10) == 0) {
                            System.out.println("已处理 " + count + " 条记录...");
                            System.gc(); // 建议垃圾收集（在实际生产环境中谨慎使用）
                        }
                    }
                }
            }

            // 执行剩余的批处理
            pstmt.executeBatch();
            conn.commit();

            // 恢复自动提交
            conn.setAutoCommit(true);

            System.out.println("已创建 " + count + " 条直线距离记录");
        }
    }

    /**
     * a初始化站点之间的路线连接
     * 策略：
     * 1. 每个站点连接到同区域的所有站点
     * 2. 每个站点连接到不同区域的部分站点（每个区域选择一个枢纽站点）
     * 3. 确保图是连通的
     */
    private static void initializeRoutes(Connection conn, List<Station> stations) throws SQLException {
        System.out.println("开始创建站点路线连接...");
        
        // 清空现有route表数据
        try (Statement stmt = conn.createStatement()) {
            stmt.executeUpdate("DELETE FROM logistics.route");
            System.out.println("已清空现有路线数据");
        }

        // 使用内存Set跟踪已添加的路线
        Set<String> addedRoutes = new HashSet<>();
        
        // 准备插入语句
        String sql = "INSERT INTO logistics.route (from_station_id, to_station_id, distance, travel_time, transport_cost, status) VALUES (?, ?, ?, ?, ?, 1)";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            // 禁用自动提交，批量处理
            conn.setAutoCommit(false);
            
            // 按区域分组
            Map<Long, List<Station>> regionStations = new HashMap<>();
            for (Station station : stations) {
                regionStations.computeIfAbsent(station.getRegionId(), k -> new ArrayList<>()).add(station);
            }

            // 为每个区域找到所有枢纽站点
            Map<Long, List<Station>> regionHubStations = new HashMap<>();
            for (Map.Entry<Long, List<Station>> entry : regionStations.entrySet()) {
                Long regionId = entry.getKey();
                List<Station> regionStationList = entry.getValue();

                // 找到区域内的所有枢纽站点
                List<Station> hubs = regionStationList.stream()
                        .filter(s -> s.getCode() != null && s.getCode().contains("ZX"))
                        .collect(Collectors.toList());
                
                // 如果没有找到枢纽站点，添加第一个站点作为默认枢纽
                if (hubs.isEmpty()) {
                    hubs.add(regionStationList.get(0));
                }
                
                regionHubStations.put(regionId, hubs);
            }

            int count = 0;

            // 连接同区域内的站点
            for (List<Station> regionStationList : regionStations.values()) {
                for (int i = 0; i < regionStationList.size(); i++) {
                    Station station1 = regionStationList.get(i);

                    for (int j = i + 1; j < regionStationList.size(); j++) {
                        Station station2 = regionStationList.get(j);

                        // 计算两站点间的距离作为路线距离
                        double distance = calculateDistance(
                                station1.getLatitude(), station1.getLongitude(),
                                station2.getLatitude(), station2.getLongitude());

                        // 预计行驶时间（假设平均速度为60km/h）
                        int travelTime = (int) Math.ceil(distance / 60 * 60); // 转换为分钟

                        // 创建双向路线
                        count += addRoute(pstmt, station1, station2, distance, travelTime, conn, addedRoutes);
                        count += addRoute(pstmt, station2, station1, distance, travelTime, conn, addedRoutes);

                        // 使用可配置的批处理大小
                        if (count % BATCH_SIZE == 0) {
                            pstmt.executeBatch();
                            conn.commit();
                            // 添加内存管理和性能监控
                            if (count % (BATCH_SIZE * 10) == 0) {
                                System.out.println("已处理 " + count + " 条记录...");
                                System.gc(); // 建议垃圾收集（在实际生产环境中谨慎使用）
                            }
                        }
                    }
                }
            }

            // 连接不同区域的枢纽站点 - 更新逻辑
            Map<Long, List<Long>> regionNeighbors = buildRegionGeographicNeighbors(stations);
            
            // 只连接地理上相邻的区域
            for (Long regionId : regionHubStations.keySet()) {
                List<Long> neighbors = regionNeighbors.get(regionId);
                if (neighbors == null) continue;
                
                for (Long neighborRegionId : neighbors) {
                    // 连接相邻区域的枢纽站点
                    connectHubStations(regionHubStations.get(regionId), 
                                      regionHubStations.get(neighborRegionId),
                                      pstmt, conn, addedRoutes);
                }
            }

            // 执行剩余的批处理
            pstmt.executeBatch();
            conn.commit();

            // 恢复自动提交
            conn.setAutoCommit(true);

            System.out.println("已创建 " + count + " 条路线连接");
        }
    }

    /**
     * 添加路线到批处理中
     */
    private static int addRoute(PreparedStatement pstmt, Station from, Station to, double distance, 
                              int travelTime, Connection conn, Set<String> addedRoutes) throws SQLException {
        // 使用内存中的Set检查
        String routeKey = from.getId() + "-" + to.getId();
        if (addedRoutes.contains(routeKey)) {
            return 0;
        }
        
        addedRoutes.add(routeKey);
        
        double transportCost = distance * 0.8;
        pstmt.setLong(1, from.getId());
        pstmt.setLong(2, to.getId());
        pstmt.setBigDecimal(3, new java.math.BigDecimal(distance));
        pstmt.setInt(4, travelTime);
        pstmt.setBigDecimal(5, new java.math.BigDecimal(transportCost));
        pstmt.addBatch();
        
        return 1;
    }

    /**
     * 使用Haversine公式计算两个经纬度坐标之间的距离（单位：千米）
     */
    private static double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        // 转换为弧度
        double radLat1 = Math.toRadians(lat1);
        double radLon1 = Math.toRadians(lon1);
        double radLat2 = Math.toRadians(lat2);
        double radLon2 = Math.toRadians(lon2);

        // 差值
        double deltaLat = radLat2 - radLat1;
        double deltaLon = radLon2 - radLon1;

        // Haversine公式
        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                Math.cos(radLat1) * Math.cos(radLat2) *
                        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        // 地球半径乘以弧度差即为距离
        double distance = EARTH_RADIUS * c;

        // 保留两位小数
        return Math.round(distance * 100) / 100.0;
    }

    /**
     * 验证生成的图是否完全连通
     */
    private static boolean verifyConnectivity(Connection conn, List<Station> stations) throws SQLException {
        // 使用并查集算法验证图的连通性
        UnionFind unionFind = new UnionFind(stations.size());
        Map<Long, Integer> stationIndexMap = new HashMap<>();

        // 创建站点ID到索引的映射
        for (int i = 0; i < stations.size(); i++) {
            stationIndexMap.put(stations.get(i).getId(), i);
        }

        // 查询所有路线
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT from_station_id, to_station_id FROM logistics.route WHERE status = 1")) {

            while (rs.next()) {
                Long fromId = rs.getLong("from_station_id");
                Long toId = rs.getLong("to_station_id");

                Integer fromIndex = stationIndexMap.get(fromId);
                Integer toIndex = stationIndexMap.get(toId);

                if (fromIndex != null && toIndex != null) {
                    unionFind.union(fromIndex, toIndex);
                }
            }
        }

        // 检查是否所有站点都在同一个集合中
        int firstRoot = unionFind.find(0);
        for (int i = 1; i < stations.size(); i++) {
            if (unionFind.find(i) != firstRoot) {
                return false; // 发现不连通的部分
            }
        }

        return true;
    }

    /**
     * 修复图的连通性问题，确保所有站点可达
     */
    private static void ensureConnectivity(Connection conn, List<Station> stations) throws SQLException {
        if (verifyConnectivity(conn, stations)) {
            System.out.println("图已完全连通，无需修复");
            return;
        }

        System.out.println("检测到图不完全连通，开始修复...");

        // 使用并查集找出所有连通分量
        UnionFind unionFind = new UnionFind(stations.size());
        Map<Long, Integer> stationIndexMap = new HashMap<>();
        Map<Integer, Long> indexStationMap = new HashMap<>();

        // 创建双向映射
        for (int i = 0; i < stations.size(); i++) {
            stationIndexMap.put(stations.get(i).getId(), i);
            indexStationMap.put(i, stations.get(i).getId());
        }

        // 查询所有现有路线并构建并查集
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT from_station_id, to_station_id FROM logistics.route WHERE status = 1")) {

            while (rs.next()) {
                Long fromId = rs.getLong("from_station_id");
                Long toId = rs.getLong("to_station_id");

                Integer fromIndex = stationIndexMap.get(fromId);
                Integer toIndex = stationIndexMap.get(toId);

                if (fromIndex != null && toIndex != null) {
                    unionFind.union(fromIndex, toIndex);
                }
            }
        }

        // 找出所有连通分量的代表元素
        Map<Integer, List<Integer>> components = new HashMap<>();
        for (int i = 0; i < stations.size(); i++) {
            int root = unionFind.find(i);
            components.computeIfAbsent(root, k -> new ArrayList<>()).add(i);
        }

        // 如果只有一个连通分量，无需修复
        if (components.size() == 1) {
            System.out.println("图已完全连通，无需修复");
            return;
        }

        System.out.println("发现 " + components.size() + " 个不连通的子图，开始连接...");

        // 连接不同的连通分量
        List<Integer> componentRoots = new ArrayList<>(components.keySet());

        String sql = "INSERT INTO logistics.route (from_station_id, to_station_id, distance, travel_time, transport_cost, status) VALUES (?, ?, ?, ?, ?, 1)";
        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            conn.setAutoCommit(false);

            for (int i = 0; i < componentRoots.size() - 1; i++) {
                // 获取当前分量的一个站点
                int fromIndex = components.get(componentRoots.get(i)).get(0);
                // 获取下一个分量的一个站点
                int toIndex = components.get(componentRoots.get(i + 1)).get(0);

                Long fromId = indexStationMap.get(fromIndex);
                Long toId = indexStationMap.get(toIndex);

                Station fromStation = stations.stream().filter(s -> s.getId().equals(fromId)).findFirst().orElse(null);
                Station toStation = stations.stream().filter(s -> s.getId().equals(toId)).findFirst().orElse(null);

                if (fromStation != null && toStation != null) {
                    // 计算距离
                    double distance = calculateDistance(
                            fromStation.getLatitude(), fromStation.getLongitude(),
                            toStation.getLatitude(), toStation.getLongitude());

                    // 设置行驶时间（使用较高速度估计，因为这是跨区域连接）
                    int travelTime = (int) Math.ceil(distance / 80 * 60);

                    // 创建双向连接
                    addRoute(pstmt, fromStation, toStation, distance, travelTime, conn, new HashSet<>());
                    addRoute(pstmt, toStation, fromStation, distance, travelTime, conn, new HashSet<>());

                    // 合并并查集中的两个分量
                    unionFind.union(fromIndex, toIndex);

                    System.out.println("已连接站点: " + fromStation.getName() + " <-> " + toStation.getName());
                }
            }

            pstmt.executeBatch();
            conn.commit();
            conn.setAutoCommit(true);
        }

        // 再次验证连通性
        if (verifyConnectivity(conn, stations)) {
            System.out.println("图连通性修复成功");
        } else {
            System.out.println("图连通性修复失败，可能需要手动检查");
        }
    }

    /**
     * 并查集实现，用于检测图的连通性
     */
    static class UnionFind {
        private int[] parent;
        private int[] rank;

        public UnionFind(int size) {
            parent = new int[size];
            rank = new int[size];

            // 初始化，每个元素自成一派
            for (int i = 0; i < size; i++) {
                parent[i] = i;
                rank[i] = 0;
            }
        }

        // 查找元素所属的集合（带路径压缩）
        public int find(int x) {
            if (parent[x] != x) {
                parent[x] = find(parent[x]);
            }
            return parent[x];
        }

        // 合并两个集合（按秩合并）
        public void union(int x, int y) {
            int rootX = find(x);
            int rootY = find(y);

            if (rootX == rootY) return;

            if (rank[rootX] < rank[rootY]) {
                parent[rootX] = rootY;
            } else if (rank[rootX] > rank[rootY]) {
                parent[rootY] = rootX;
            } else {
                parent[rootY] = rootX;
                rank[rootX]++;
            }
        }
    }

    /**
     * 站点实体类
     */
    static class Station {
        private Long id;
        private String name;
        private String code;
        private Long regionId;
        private Double longitude;
        private Double latitude;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public Long getRegionId() {
            return regionId;
        }

        public void setRegionId(Long regionId) {
            this.regionId = regionId;
        }

        public Double getLongitude() {
            return longitude;
        }

        public void setLongitude(Double longitude) {
            this.longitude = longitude;
        }

        public Double getLatitude() {
            return latitude;
        }

        public void setLatitude(Double latitude) {
            this.latitude = latitude;
        }
    }

    /**
     * 增量更新路线数据
     * 只处理新增的站点和路线，不删除现有数据
     */
    private static void incrementalUpdate(Connection conn, List<Station> allStations) throws SQLException {
        // 获取已有站点ID
        Set<Long> existingStationIds = new HashSet<>();
        try (Statement stmt = conn.createStatement();
             ResultSet rs = stmt.executeQuery("SELECT DISTINCT station_id1 FROM logistics.direct_distance")) {
            while (rs.next()) {
                existingStationIds.add(rs.getLong("station_id1"));
            }
        }

        // 找出新增站点
        List<Station> newStations = allStations.stream()
                .filter(s -> !existingStationIds.contains(s.getId()))
                .collect(Collectors.toList());

        if (newStations.isEmpty()) {
            System.out.println("没有新增站点，无需更新");
            return;
        }

        System.out.println("发现 " + newStations.size() + " 个新增站点，开始增量更新...");

        // 计算新站点与所有站点之间的直线距离
        initializeDirectDistancesForNewStations(conn, newStations, allStations);

        // 为新站点创建路线连接
        initializeRoutesForNewStations(conn, newStations, allStations);

        // 验证并修复图的连通性
        ensureConnectivity(conn, allStations);

        System.out.println("增量更新完成");
    }

    // 实现新增站点的直线距离计算
    private static void initializeDirectDistancesForNewStations(Connection conn, List<Station> newStations,
                                                                List<Station> allStations) throws SQLException {
        // 类似initializeDirectDistances的实现，但只处理新站点与所有站点的关系
        // ...
    }

    // 实现新增站点的路线连接
    private static void initializeRoutesForNewStations(Connection conn, List<Station> newStations,
                                                       List<Station> allStations) throws SQLException {
        // 类似initializeRoutes的实现，但只处理新站点与所有站点的关系
        // ...
    }

    /**
     * 路径连通性测试
     */
    private static void testPathConnectivity(Connection conn, List<Station> stations) throws SQLException {
        System.out.println("\n开始路径连通性测试...");

        // 随机选择10对站点测试
        Random random = new Random();
        int testCount = Math.min(10, stations.size() * (stations.size() - 1) / 200);
        int successCount = 0;

        for (int i = 0; i < testCount; i++) {
            // 随机选择两个不同的站点
            int index1 = random.nextInt(stations.size());
            int index2;
            do {
                index2 = random.nextInt(stations.size());
            } while (index1 == index2);

            Station station1 = stations.get(index1);
            Station station2 = stations.get(index2);

            // 查询是否存在路径（使用BFS算法）
            if (hasPath(conn, station1.getId(), station2.getId())) {
                successCount++;
                System.out.println("测试 " + (i + 1) + ": " + station1.getName() + " -> " + station2.getName() + " - 成功");
            } else {
                System.out.println("测试 " + (i + 1) + ": " + station1.getName() + " -> " + station2.getName() + " - 失败");
            }
        }

        System.out.println("连通性测试完成: " + successCount + "/" + testCount + " 通过");
    }

    /**
     * 使用BFS检查两个站点间是否存在路径
     */
    private static boolean hasPath(Connection conn, Long sourceId, Long targetId) throws SQLException {
        // 使用广度优先搜索检查路径存在性
        Set<Long> visited = new HashSet<>();
        Queue<Long> queue = new LinkedList<>();

        queue.offer(sourceId);
        visited.add(sourceId);

        while (!queue.isEmpty()) {
            Long current = queue.poll();

            if (current.equals(targetId)) {
                return true;
            }

            // 获取所有相邻站点
            try (PreparedStatement pstmt = conn.prepareStatement(
                    "SELECT to_station_id FROM logistics.route WHERE from_station_id = ? AND status = 1")) {
                pstmt.setLong(1, current);
                try (ResultSet rs = pstmt.executeQuery()) {
                    while (rs.next()) {
                        Long neighbor = rs.getLong("to_station_id");
                        if (!visited.contains(neighbor)) {
                            visited.add(neighbor);
                            queue.offer(neighbor);
                        }
                    }
                }
            }
        }

        return false;
    }

    // Add this method to check if a route already exists
    private static boolean routeExists(Connection conn, Long fromId, Long toId) throws SQLException {
        try (PreparedStatement stmt = conn.prepareStatement(
                "SELECT 1 FROM logistics.route WHERE from_station_id = ? AND to_station_id = ?")) {
            stmt.setLong(1, fromId);
            stmt.setLong(2, toId);
            try (ResultSet rs = stmt.executeQuery()) {
                return rs.next();
            }
        }
    }

    /**
     * 初始化区域枢纽站点
     */
    private static void initializeHubStations(Connection conn, List<Station> stations) throws SQLException {
        System.out.println("开始标识区域枢纽站点...");
        
        // 按区域分组站点
        Map<Long, List<Station>> regionStations = new HashMap<>();
        for (Station station : stations) {
            if (station.getRegionId() != null) {
                regionStations.computeIfAbsent(station.getRegionId(), k -> new ArrayList<>()).add(station);
            }
        }
        
        // 处理每个区域
        for (Map.Entry<Long, List<Station>> entry : regionStations.entrySet()) {
            Long regionId = entry.getKey();
            List<Station> stationList = entry.getValue();
            
            // 找出该区域的所有可能枢纽站点
            List<Station> hubCandidates = new ArrayList<>();
            for (Station station : stationList) {
                // 条件1: 编码包含ZX
                boolean codeCondition = station.getCode() != null && station.getCode().contains("ZX");
                
                // 条件2: 名称包含关键词
                boolean nameCondition = station.getName() != null && 
                    (station.getName().contains("中转") || 
                     station.getName().contains("枢纽") || 
                     station.getName().contains("物流中心") ||
                     station.getName().contains("物流园"));
                    
                if (codeCondition || nameCondition) {
                    hubCandidates.add(station);
                }
            }
            
            // 至少标记一个枢纽站点
            if (hubCandidates.isEmpty() && !stationList.isEmpty()) {
                // 如果没有找到合适的候选站点，选择该区域中最中心的站点
                Station centralStation = findCentralStation(stationList);
                if (centralStation != null) {
                    hubCandidates.add(centralStation);
                    System.out.println("区域 " + regionId + " 没有明确的枢纽站点，选择 " + centralStation.getName() + " 作为默认枢纽");
                }
            }
            
            // 更新站点状态为枢纽站点
            for (Station hub : hubCandidates) {
                try {
                    String updateSql = "UPDATE station SET is_hub = 1 WHERE id = ?";
                    PreparedStatement pstmt = conn.prepareStatement(updateSql);
                    pstmt.setLong(1, hub.getId());
                    pstmt.executeUpdate();
                    pstmt.close();
                    
                    System.out.println("标记枢纽站点: " + hub.getName() + " (ID=" + hub.getId() + ", 区域=" + regionId + ")");
                } catch (SQLException e) {
                    System.err.println("标记枢纽站点时出错: " + e.getMessage());
                }
            }
        }
        
        System.out.println("枢纽站点标识完成");
    }

    /**
     * 找出一组站点中最中心的站点
     */
    private static Station findCentralStation(List<Station> stations) {
        if (stations.isEmpty()) {
            return null;
        }
        
        // 计算区域中心点
        double avgLat = 0, avgLon = 0;
        int count = 0;
        
        for (Station station : stations) {
            if (station.getLatitude() != null && station.getLongitude() != null) {
                avgLat += station.getLatitude().doubleValue();
                avgLon += station.getLongitude().doubleValue();
                count++;
            }
        }
        
        if (count == 0) {
            return stations.get(0);  // 如果没有坐标，返回第一个站点
        }
        
        avgLat /= count;
        avgLon /= count;
        
        // 找到距离中心点最近的站点
        Station nearestStation = null;
        double minDistance = Double.MAX_VALUE;
        
        for (Station station : stations) {
            if (station.getLatitude() != null && station.getLongitude() != null) {
                double lat = station.getLatitude().doubleValue();
                double lon = station.getLongitude().doubleValue();
                
                double distance = Math.sqrt(Math.pow(lat - avgLat, 2) + Math.pow(lon - avgLon, 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestStation = station;
                }
            }
        }
        
        return nearestStation;
    }

    /**
     * 构建区域地理邻接关系
     * 返回每个区域的相邻区域列表
     */
    private static Map<Long, List<Long>> buildRegionGeographicNeighbors(List<Station> stations) {
        Map<Long, List<Long>> neighbors = new HashMap<>();
        
        // 获取所有区域及其中心坐标
        Map<Long, double[]> regionCenters = calculateRegionCenters(stations);
        
        // 计算区域间的地理邻接关系
        for (Long regionId1 : regionCenters.keySet()) {
            neighbors.putIfAbsent(regionId1, new ArrayList<>());
            double[] center1 = regionCenters.get(regionId1);
            
            for (Long regionId2 : regionCenters.keySet()) {
                if (regionId1.equals(regionId2)) continue;
                
                double[] center2 = regionCenters.get(regionId2);
                double distance = calculateDistance(center1[0], center1[1], center2[0], center2[1]);
                
                // 相邻距离阈值 (例如: 500公里以内视为相邻)
                if (distance < 500) {
                    neighbors.get(regionId1).add(regionId2);
                }
            }
        }
        
        return neighbors;
    }

    /**
     * 计算每个区域的中心坐标
     */
    private static Map<Long, double[]> calculateRegionCenters(List<Station> stations) {
        Map<Long, double[]> regionCenters = new HashMap<>();
        Map<Long, Integer> regionCounts = new HashMap<>();
        
        // 计算每个区域的所有站点坐标平均值
        for (Station station : stations) {
            if (station.getRegionId() != null && station.getLatitude() != null && station.getLongitude() != null) {
                Long regionId = station.getRegionId();
                double lat = station.getLatitude();
                double lon = station.getLongitude();
                
                regionCenters.putIfAbsent(regionId, new double[]{0, 0});
                regionCounts.putIfAbsent(regionId, 0);
                
                double[] center = regionCenters.get(regionId);
                center[0] += lat;
                center[1] += lon;
                regionCounts.put(regionId, regionCounts.get(regionId) + 1);
            }
        }
        
        // 计算每个区域的平均坐标
        for (Long regionId : regionCenters.keySet()) {
            double[] center = regionCenters.get(regionId);
            int count = regionCounts.get(regionId);
            
            if (count > 0) {
                center[0] /= count;  // 平均纬度
                center[1] /= count;  // 平均经度
            }
        }
        
        return regionCenters;
    }

    /**
     * 连接两个区域的枢纽站点
     */
    private static void connectHubStations(List<Station> hubs1, List<Station> hubs2, 
                                         PreparedStatement pstmt, Connection conn, 
                                         Set<String> addedRoutes) throws SQLException {
        for (Station hub1 : hubs1) {
            for (Station hub2 : hubs2) {
                double distance = calculateDistance(
                    hub1.getLatitude(), hub1.getLongitude(),
                    hub2.getLatitude(), hub2.getLongitude());
                
                // 枢纽站点间预计行驶时间（平均速度为80km/h）
                int travelTime = (int) Math.ceil(distance / 80 * 60);
                
                // 创建双向路线
                addRoute(pstmt, hub1, hub2, distance, travelTime, conn, addedRoutes);
                addRoute(pstmt, hub2, hub1, distance, travelTime, conn, addedRoutes);
            }
        }
    }
} 