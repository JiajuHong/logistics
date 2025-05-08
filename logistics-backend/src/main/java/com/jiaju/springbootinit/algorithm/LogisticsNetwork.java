package com.jiaju.springbootinit.algorithm;

import com.jiaju.springbootinit.model.entity.DirectDistance;
import com.jiaju.springbootinit.model.entity.Route;
import com.jiaju.springbootinit.model.entity.Station;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 物流网络图结构
 */
public class LogisticsNetwork {
    private static final Logger log = LoggerFactory.getLogger(LogisticsNetwork.class);
    
    // 站点信息映射
    private final Map<Long, Station> stationMap = new HashMap<>();
    
    // 站点邻接表
    private final Map<Long, List<Edge>> adjacencyList = new HashMap<>();
    
    // 直线距离缓存
    private final Map<String, Double> directDistanceMap = new HashMap<>();
    
    // 枢纽站点缓存（新增）
    private final Set<Long> hubStations = new HashSet<>();
    
    /**
     * 添加站点
     */
    public void addStation(Station station) {
        if (station != null && station.getId() != null) {
            // 检查站点坐标是否完整
            boolean hasValidCoordinates = station.getLongitude() != null && 
                                         station.getLatitude() != null &&
                                         isValidCoordinate(station.getLongitude().doubleValue(), station.getLatitude().doubleValue());
            
            // 添加站点到地图
            stationMap.put(station.getId(), station);
            
            // 确保该站点在邻接表中有一个空列表
            if (!adjacencyList.containsKey(station.getId())) {
                adjacencyList.put(station.getId(), new ArrayList<>());
            }
            
            // 检查是否为枢纽站点（新增）
            if (station.getCode() != null && station.getCode().contains("ZX")) {
                hubStations.add(station.getId());
                log.debug("标记枢纽站点: ID={}, 名称={}", station.getId(), station.getName());
            }
            
            // 如果坐标无效，记录日志
            if (!hasValidCoordinates) {
                log.warn("站点[ID={}，名称={}]的坐标数据无效或缺失，可能影响路径计算", 
                        station.getId(), station.getName());
            }
        }
    }
    
    /**
     * 验证坐标是否在合理范围内
     */
    private boolean isValidCoordinate(Double longitude, Double latitude) {
        // 简单验证经纬度是否在合理范围内
        return longitude >= -180 && longitude <= 180 && 
               latitude >= -90 && latitude <= 90;
    }
    
    /**
     * 添加边(路线)
     */
    public void addEdge(Long fromStationId, Long toStationId, Double distance, 
                        Integer travelTime, Double transportCost) {
        if (fromStationId == null || toStationId == null || distance == null) {
            return;
        }
        
        // 获取或创建起点的邻接边列表
        List<Edge> edges = adjacencyList.computeIfAbsent(fromStationId, k -> new ArrayList<>());
        
        // 创建边对象并添加到列表
        Edge edge = new Edge();
        edge.setTargetStationId(toStationId);
        edge.setDistance(distance);
        edge.setTravelTime(travelTime != null ? travelTime : 0);
        edge.setTransportCost(transportCost != null ? transportCost : 0.0);
        
        edges.add(edge);
    }
    
    /**
     * 添加从Route实体创建边
     */
    public void addEdge(Route route) {
        if (route != null && route.getFromStationId() != null && route.getToStationId() != null) {
            addEdge(
                route.getFromStationId(), 
                route.getToStationId(), 
                route.getDistance() != null ? route.getDistance().doubleValue() : null,
                route.getTravelTime(), 
                route.getTransportCost() != null ? route.getTransportCost().doubleValue() : null
            );
        }
    }
    
    /**
     * 添加直线距离
     */
    public void addDirectDistance(Long stationId1, Long stationId2, Double distance) {
        if (stationId1 == null || stationId2 == null || distance == null) {
            return;
        }
        
        // 存储两个方向的键
        String key1 = getDirectDistanceKey(stationId1, stationId2);
        String key2 = getDirectDistanceKey(stationId2, stationId1);
        
        directDistanceMap.put(key1, distance);
        directDistanceMap.put(key2, distance); // 对称存储
    }
    
    /**
     * 添加DirectDistance实体
     */
    public void addDirectDistance(DirectDistance directDistance) {
        if (directDistance != null) {
            addDirectDistance(
                directDistance.getStationId1(), 
                directDistance.getStationId2(), 
                directDistance.getDistance()
            );
        }
    }
    
    /**
     * 获取站点的所有邻接边
     */
    public List<Edge> getAdjacentEdges(Long stationId) {
        return adjacencyList.getOrDefault(stationId, Collections.emptyList());
    }
    
    /**
     * 查找特定的边
     */
    public Edge findEdge(Long fromStationId, Long toStationId) {
        List<Edge> edges = getAdjacentEdges(fromStationId);
        for (Edge edge : edges) {
            if (edge.getTargetStationId().equals(toStationId)) {
                return edge;
            }
        }
        return null;
    }
    
    /**
     * 获取两站点间直线距离，并应用校正系数
     */
    public double getDirectDistance(Long fromStationId, Long toStationId) {
        String key = getDirectDistanceKey(fromStationId, toStationId);
        
        // 检查缓存中是否存在
        if (directDistanceMap.containsKey(key)) {
            // 应用校正系数 (根据直线距离范围采用不同系数)
            double directDistance = directDistanceMap.get(key);
            return applyDistanceCorrection(directDistance);
        }
        
        // 如果没有直线距离记录，尝试通过经纬度计算
        Station fromStation = stationMap.get(fromStationId);
        Station toStation = stationMap.get(toStationId);
        
        if (fromStation != null && toStation != null && 
            fromStation.getLongitude() != null && fromStation.getLatitude() != null &&
            toStation.getLongitude() != null && toStation.getLatitude() != null) {
            
            double distance = calculateHaversineDistance(
                fromStation.getLatitude().doubleValue(),
                fromStation.getLongitude().doubleValue(),
                toStation.getLatitude().doubleValue(),
                toStation.getLongitude().doubleValue()
            );
            
            // 缓存计算结果
            directDistanceMap.put(key, distance);
            directDistanceMap.put(getDirectDistanceKey(toStationId, fromStationId), distance);
            
            return applyDistanceCorrection(distance);
        }
        
        // 如果无法计算，返回一个较大的值作为默认启发式值
        log.warn("无法获取站点间直线距离，使用默认值。从{}到{}", fromStationId, toStationId);
        return 1000.0; 
    }
    
    /**
     * 应用距离校正系数，考虑实际道路弯曲因素
     * 校正系数基于经验值:
     * - 短距离(<10km): 系数较大，因为城市道路弯曲较多
     * - 中等距离(10-50km): 中等系数
     * - 长距离(>50km): 系数较小，因为高速公路较直
     */
    private double applyDistanceCorrection(double directDistance) {
        if (directDistance < 10.0) {
            return directDistance * 1.4; // 短距离校正系数1.4
        } else if (directDistance < 50.0) {
            return directDistance * 1.3; // 中等距离校正系数1.3
        } else {
            return directDistance * 1.2; // 长距离校正系数1.2
        }
    }
    
    /**
     * 生成直线距离的键
     */
    private String getDirectDistanceKey(Long stationId1, Long stationId2) {
        return stationId1 + "-" + stationId2;
    }
    
    /**
     * 使用Haversine公式计算两点间的距离（公里）
     */
    private double calculateHaversineDistance(double lat1, double lon1, double lat2, double lon2) {
        int earthRadius = 6371; // 地球半径，单位：公里
        
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                   Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                   Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        
        return earthRadius * c;
    }
    
    /**
     * 获取站点信息
     */
    public Station getStation(Long stationId) {
        return stationMap.get(stationId);
    }
    
    /**
     * 获取站点所属区域ID（新增）
     */
    public Long getStationRegionId(Long stationId) {
        Station station = stationMap.get(stationId);
        if (station != null) {
            return station.getRegionId();
        }
        return null;
    }
    
    /**
     * 判断是否为枢纽站点（修改）
     */
    public boolean isHubStation(Long stationId) {
        // 首先检查缓存
        if (hubStations.contains(stationId)) {
            return true;
        }
        
        // 扩展枢纽站点识别条件
        Station station = stationMap.get(stationId);
        if (station != null) {
            // 条件1: 编码包含ZX
            boolean codeCondition = station.getCode() != null && station.getCode().contains("ZX");
            
            // 条件2: 名称包含"中转"、"枢纽"、"物流中心"等关键词
            boolean nameCondition = station.getName() != null && 
                (station.getName().contains("中转") || 
                 station.getName().contains("枢纽") || 
                 station.getName().contains("物流中心") ||
                 station.getName().contains("物流园"));
            
            // 条件3: 连接数量超过阈值（作为选择性条件）
            int connectionCount = getAdjacentEdges(stationId).size();
            boolean connectionCondition = connectionCount >= 5;  // 连接至少5个其他站点
            
            if (codeCondition || nameCondition || connectionCondition) {
                // 添加到缓存
                hubStations.add(stationId);
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 分析物流网络完整性（新增）
     * 用于系统启动时验证网络构建是否正确
     */
    public void analyzeNetworkCompleteness() {
        log.info("开始分析物流网络完整性...");
        
        // 统计站点总数
        int totalStations = stationMap.size();
        
        // 统计区域数量
        Set<Long> regions = new HashSet<>();
        for (Station station : stationMap.values()) {
            if (station.getRegionId() != null) {
                regions.add(station.getRegionId());
            }
        }
        
        // 统计枢纽站点数量
        int hubCount = 0;
        for (Long stationId : stationMap.keySet()) {
            if (isHubStation(stationId)) {
                hubCount++;
            }
        }
        
        // 统计平均连接数
        int totalConnections = 0;
        for (List<Edge> edges : adjacencyList.values()) {
            totalConnections += edges.size();
        }
        double avgConnections = totalStations > 0 ? (double) totalConnections / totalStations : 0;
        
        // 输出统计结果
        log.info("物流网络统计: 站点总数={}, 区域数量={}, 枢纽站点数={}, 连接总数={}, 平均连接数={}",
                totalStations, regions.size(), hubCount, totalConnections, avgConnections);
        
        // 验证区域间连接
        boolean hasInterRegionalIssue = false;
        for (Long regionId1 : regions) {
            for (Long regionId2 : regions) {
                if (!regionId1.equals(regionId2)) {
                    boolean hasConnection = checkRegionsConnected(regionId1, regionId2);
                    if (!hasConnection) {
                        log.warn("区域{}和区域{}之间没有连接路径", regionId1, regionId2);
                        hasInterRegionalIssue = true;
                    }
                }
            }
        }
        
        if (hasInterRegionalIssue) {
            log.warn("存在区域间连接问题，可能导致某些路径无法正确计算");
        } else {
            log.info("所有区域之间都有连接路径");
        }
    }
    
    /**
     * 检查两个区域之间是否有连接路径（新增）
     */
    private boolean checkRegionsConnected(Long regionId1, Long regionId2) {
        // 找出区域1中的枢纽站点
        List<Long> hubs1 = new ArrayList<>();
        for (Station station : stationMap.values()) {
            if (station.getRegionId() != null && station.getRegionId().equals(regionId1) && 
                isHubStation(station.getId())) {
                hubs1.add(station.getId());
            }
        }
        
        // 找出区域2中的枢纽站点
        List<Long> hubs2 = new ArrayList<>();
        for (Station station : stationMap.values()) {
            if (station.getRegionId() != null && station.getRegionId().equals(regionId2) && 
                isHubStation(station.getId())) {
                hubs2.add(station.getId());
            }
        }
        
        // 检查是否有连接
        for (Long hub1 : hubs1) {
            for (Long hub2 : hubs2) {
                if (findEdge(hub1, hub2) != null) {
                    return true;
                }
            }
        }
        
        return false;
    }

    public List<Station> getRegionHubStations(Long regionId) {
        return stationMap.values().stream()
                .filter(s -> regionId.equals(s.getRegionId()) && isHubStation(s.getId()))
                .collect(Collectors.toList());
    }

    /**
     * 获取所有站点
     */
    public List<Station> getAllStations() {
        return new ArrayList<>(stationMap.values());
    }

    /**
     * 确保所有枢纽站点两两之间都有连接
     * 这个方法应在初始化网络后调用，以确保所有区域中转站之间能够直接通行
     */
    public void ensureHubStationsConnectivity() {
        if (hubStations.isEmpty()) {
            log.warn("系统中没有标记任何枢纽站点，无法确保枢纽站点连通性");
            return;
        }
        
        log.info("开始确保枢纽站点间的连通性，共有{}个枢纽站点", hubStations.size());
        
        // 获取所有枢纽站点
        List<Station> hubs = new ArrayList<>();
        for (Long hubId : hubStations) {
            Station hub = stationMap.get(hubId);
            if (hub != null) {
                hubs.add(hub);
            }
        }
        
        int addedEdges = 0;
        
        // 确保所有枢纽站点两两之间都有边
        for (int i = 0; i < hubs.size(); i++) {
            Station hub1 = hubs.get(i);
            
            for (int j = i + 1; j < hubs.size(); j++) {
                Station hub2 = hubs.get(j);
                
                // 检查两个方向是否都有边
                Edge edge1 = findEdge(hub1.getId(), hub2.getId());
                Edge edge2 = findEdge(hub2.getId(), hub1.getId());
                
                // 如果两个枢纽站点间至少有一个方向没有边，则创建双向连接
                if (edge1 == null || edge2 == null) {
                    // 计算两站点间直线距离
                    double distance = getDirectDistance(hub1.getId(), hub2.getId());
                    
                    // 估算运输时间（假设平均速度80km/h）
                    int travelTime = (int) Math.ceil(distance / 80.0 * 60); // 转换为分钟
                    
                    // 估算运输成本（假设每公里5元）
                    double transportCost = distance * 5.0;
                    
                    // 添加双向边
                    if (edge1 == null) {
                        addEdge(hub1.getId(), hub2.getId(), distance, travelTime, transportCost);
                        addedEdges++;
                    }
                    
                    if (edge2 == null) {
                        addEdge(hub2.getId(), hub1.getId(), distance, travelTime, transportCost);
                        addedEdges++;
                    }
                    
                    log.debug("添加枢纽站点连接: {} <-> {}, 距离: {}", 
                              hub1.getName(), hub2.getName(), distance);
                }
            }
        }
        
        log.info("枢纽站点连通性处理完成，添加了{}条连接边", addedEdges);
    }
}
