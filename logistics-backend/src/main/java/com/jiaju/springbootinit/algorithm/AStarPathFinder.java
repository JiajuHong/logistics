package com.jiaju.springbootinit.algorithm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.*;
import com.jiaju.springbootinit.model.entity.Station;
import java.util.stream.Collectors;

/**
 * A*路径查找算法实现
 */
public class AStarPathFinder {
    private static final Logger log = LoggerFactory.getLogger(AStarPathFinder.class);
    
    private final LogisticsNetwork network;
    
    // 添加权重系数属性
    private double distanceWeight = 0.5;
    private double timeWeight = 0.3;
    private double costWeight = 0.2;
    
    // 长距离阈值和惩罚系数（新增）
    private static final double LONG_DISTANCE_THRESHOLD = 300.0; // 300公里以上视为长距离
    private static final double LONG_DISTANCE_PENALTY = 1.5; // 长距离直连惩罚系数
    
    // 跨区域限制（新增）
    private boolean enforceRegionalTransfer = false; // 是否强制跨区域通过枢纽站点中转
    
    public AStarPathFinder(LogisticsNetwork network) {
        this.network = network;
    }
    
    /**
     * 查找从起点到终点的最优路径
     * @param sourceId 起点站点ID
     * @param targetId 终点站点ID
     * @return 最优路径结果，如果无法找到路径则返回null
     */
    public OptimalRoute findPath(Long sourceId, Long targetId) {
        // 获取起点和终点的区域
        Long sourceRegionId = network.getStationRegionId(sourceId);
        Long targetRegionId = network.getStationRegionId(targetId);
        
        // 如果起点和终点在不同区域且启用了区域强制中转
        if (enforceRegionalTransfer && sourceRegionId != null && targetRegionId != null 
                && !sourceRegionId.equals(targetRegionId)) {
            // 获取最短区域路径
            List<Long> regionPath = findRegionPath(sourceRegionId, targetRegionId);
            
            // 使用区域路径进行分段路径规划
            return findMultiRegionPath(sourceId, targetId, regionPath);
        }
        
        // 如果同区域或禁用强制中转，使用原有A*算法
        return originalAStarFindPath(sourceId, targetId);
    }
    
    /**
     * 查找区域间的最短路径
     * 使用改进的Dijkstra算法查找从源区域到目标区域的最短路径
     * 新增地理位置权重，使路径更合理
     */
    private List<Long> findRegionPath(Long sourceRegionId, Long targetRegionId) {
        // 如果源区域和目标区域相同，直接返回包含该区域的列表
        if (sourceRegionId.equals(targetRegionId)) {
            return Arrays.asList(sourceRegionId);
        }
        
        log.info("计算从区域{}到区域{}的最短区域路径", sourceRegionId, targetRegionId);
        
        // 获取系统中所有区域ID
        Set<Long> allRegionIds = new HashSet<>();
        for (Station station : network.getAllStations()) {
            if (station.getRegionId() != null) {
                allRegionIds.add(station.getRegionId());
            }
        }
        
        // 计算各区域的地理中心位置
        Map<Long, double[]> regionCenters = calculateRegionCenters(allRegionIds);
        
        // 构建区域连通图（优先考虑地理位置相邻的区域）
        Map<Long, Set<Long>> regionGraph = new HashMap<>();
        Map<String, Double> regionDistanceMap = new HashMap<>(); // 缓存区域间距离
        
        for (Long regionId : allRegionIds) {
            regionGraph.put(regionId, new HashSet<>());
        }
        
        // 基于地理距离构建潜在的区域邻接关系
        Map<Long, List<Long>> geographicNeighbors = buildRegionGeographicNeighbors(allRegionIds, regionCenters);
        
        // 查找连接的区域（同时考虑物理连接和地理邻近性）
        for (Long regionId1 : allRegionIds) {
            List<Station> stations1 = getRegionStations(regionId1);
            List<Long> potentialNeighbors = geographicNeighbors.get(regionId1);
            
            if (potentialNeighbors == null) {
                potentialNeighbors = new ArrayList<>(allRegionIds);
                potentialNeighbors.remove(regionId1);
            }
            
            // 优先检查地理上邻近的区域
            for (Long regionId2 : potentialNeighbors) {
                if (!regionId1.equals(regionId2)) {
                    List<Station> stations2 = getRegionStations(regionId2);
                    
                    // 检查两个区域之间是否有任何连接
                    boolean connected = false;
                    for (Station station1 : stations1) {
                        if (connected) break;
                        for (Station station2 : stations2) {
                            if (network.findEdge(station1.getId(), station2.getId()) != null) {
                                connected = true;
                                break;
                            }
                        }
                    }
                    
                    // 如果有连接，添加到区域图中
                    if (connected) {
                        regionGraph.get(regionId1).add(regionId2);
                        
                        // 计算并缓存区域间的距离
                        double distance = calculateRegionDistance(regionId1, regionId2);
                        String key = regionId1 + "-" + regionId2;
                        regionDistanceMap.put(key, distance);
                    }
                }
            }
        }
        
        // 使用Dijkstra算法计算最短区域路径
        Map<Long, Double> distances = new HashMap<>();
        Map<Long, Long> prev = new HashMap<>();
        Set<Long> settled = new HashSet<>();
        PriorityQueue<RegionNode> priorityQueue = new PriorityQueue<>(
                Comparator.comparingDouble(RegionNode::getDistance));
        
        // 初始化距离
        for (Long regionId : allRegionIds) {
            distances.put(regionId, Double.MAX_VALUE);
        }
        distances.put(sourceRegionId, 0.0);
        priorityQueue.add(new RegionNode(sourceRegionId, 0.0));
        
        // 地理启发函数：计算到目标区域的直线距离
        Map<Long, Double> heuristics = new HashMap<>();
        for (Long regionId : allRegionIds) {
            if (regionCenters.containsKey(regionId) && regionCenters.containsKey(targetRegionId)) {
                double[] center1 = regionCenters.get(regionId);
                double[] center2 = regionCenters.get(targetRegionId);
                double geoDistance = calculateGeoDistance(center1[0], center1[1], center2[0], center2[1]);
                heuristics.put(regionId, geoDistance);
            } else {
                heuristics.put(regionId, 0.0); // 没有坐标数据时不使用启发
            }
        }
        
        // Dijkstra算法 + 地理启发
        while (!priorityQueue.isEmpty()) {
            RegionNode current = priorityQueue.poll();
            Long currentRegionId = current.getRegionId();
            
            if (settled.contains(currentRegionId)) continue;
            
            settled.add(currentRegionId);
            
            if (currentRegionId.equals(targetRegionId)) {
                break; // 找到目标区域
            }
            
            for (Long neighborRegionId : regionGraph.getOrDefault(currentRegionId, Collections.emptySet())) {
                if (!settled.contains(neighborRegionId)) {
                    // 获取缓存的区域间距离
                    String key = currentRegionId + "-" + neighborRegionId;
                    double edgeWeight = regionDistanceMap.getOrDefault(key, Double.MAX_VALUE);
                    
                    // 如果没有缓存，重新计算
                    if (edgeWeight == Double.MAX_VALUE) {
                        edgeWeight = calculateRegionDistance(currentRegionId, neighborRegionId);
                        regionDistanceMap.put(key, edgeWeight);
                    }
                    
                    // 计算距离兼顾地理启发
                    double newDistance = distances.get(currentRegionId) + edgeWeight;
                    
                    if (newDistance < distances.get(neighborRegionId)) {
                        distances.put(neighborRegionId, newDistance);
                        prev.put(neighborRegionId, currentRegionId);
                        
                        // 使用A*算法思想，加入地理启发值
                        double heuristic = heuristics.getOrDefault(neighborRegionId, 0.0);
                        priorityQueue.add(new RegionNode(neighborRegionId, newDistance + heuristic * 0.5));
                    }
                }
            }
        }
        
        // 如果没有找到目标区域的路径
        if (!prev.containsKey(targetRegionId) && !sourceRegionId.equals(targetRegionId)) {
            log.warn("无法找到从区域{}到区域{}的完整路径", sourceRegionId, targetRegionId);
            
            // 尝试找到最接近目标区域的区域
            Long closestRegion = findClosestReachableRegion(targetRegionId, distances, regionCenters);
            if (closestRegion != null && !closestRegion.equals(sourceRegionId)) {
                log.info("使用最接近的可达区域: {}", closestRegion);
                
                // 构建从源区域到最接近区域的路径
                List<Long> partialPath = new ArrayList<>();
                Long current = closestRegion;
                while (current != null) {
                    partialPath.add(0, current);
                    current = prev.get(current);
                }
                
                // 添加目标区域
                partialPath.add(targetRegionId);
                return partialPath;
            }
            
            // 如果无法找到合适的中间区域，返回直接路径
            return Arrays.asList(sourceRegionId, targetRegionId);
        }
        
        // 重建路径
        List<Long> path = new ArrayList<>();
        Long current = targetRegionId;
        while (current != null) {
            path.add(0, current);
            current = prev.get(current);
        }
        
        log.info("找到区域路径: {} (长度: {})", path, path.size());
        
        return path;
    }
    
    /**
     * 计算两个区域中心点之间的地理距离
     */
    private double calculateGeoDistance(double lat1, double lon1, double lat2, double lon2) {
        // 使用Haversine公式计算球面距离
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
     * 计算区域的地理中心位置
     */
    private Map<Long, double[]> calculateRegionCenters(Set<Long> regionIds) {
        Map<Long, double[]> centers = new HashMap<>();
        
        for (Long regionId : regionIds) {
            List<Station> stations = getRegionStations(regionId);
            
            if (!stations.isEmpty()) {
                double totalLat = 0.0;
                double totalLon = 0.0;
                int validCount = 0;
                
                // 计算所有有效站点的平均经纬度
                for (Station station : stations) {
                    if (station.getLatitude() != null && station.getLongitude() != null) {
                        totalLat += station.getLatitude().doubleValue();
                        totalLon += station.getLongitude().doubleValue();
                        validCount++;
                    }
                }
                
                if (validCount > 0) {
                    centers.put(regionId, new double[] {totalLat / validCount, totalLon / validCount});
                }
            }
        }
        
        return centers;
    }
    
    /**
     * 基于地理距离构建可能的区域邻接关系
     * 为每个区域找出地理位置最接近的几个区域作为潜在邻居
     */
    private Map<Long, List<Long>> buildRegionGeographicNeighbors(Set<Long> regionIds, Map<Long, double[]> regionCenters) {
        Map<Long, List<Long>> neighbors = new HashMap<>();
        final int MAX_NEIGHBORS = 5; // 每个区域最多保留几个最近的邻居
        
        for (Long regionId1 : regionIds) {
            if (!regionCenters.containsKey(regionId1)) continue;
            
            double[] center1 = regionCenters.get(regionId1);
            Map<Long, Double> distances = new HashMap<>();
            
            // 计算到其他所有区域的距离
            for (Long regionId2 : regionIds) {
                if (regionId1.equals(regionId2) || !regionCenters.containsKey(regionId2)) continue;
                
                double[] center2 = regionCenters.get(regionId2);
                double distance = calculateGeoDistance(center1[0], center1[1], center2[0], center2[1]);
                distances.put(regionId2, distance);
            }
            
            // 排序并选取最近的N个区域
            List<Long> closestRegions = distances.entrySet().stream()
                .sorted(Map.Entry.comparingByValue())
                .limit(MAX_NEIGHBORS)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
            
            neighbors.put(regionId1, closestRegions);
        }
        
        return neighbors;
    }
    
    // 找到最接近目标区域的可达区域
    private Long findClosestReachableRegion(Long targetRegionId, Map<Long, Double> distances, Map<Long, double[]> regionCenters) {
        Long closestRegion = null;
        double minDistance = Double.MAX_VALUE;
        
        for (Map.Entry<Long, Double> entry : distances.entrySet()) {
            Long regionId = entry.getKey();
            Double routeDistance = entry.getValue();
            
            if (!regionId.equals(targetRegionId) && routeDistance < Double.MAX_VALUE) {
                // 如果有地理中心数据，计算地理距离；否则使用路径距离
                double distanceToTarget;
                if (regionCenters.containsKey(regionId) && regionCenters.containsKey(targetRegionId)) {
                    double[] center1 = regionCenters.get(regionId);
                    double[] center2 = regionCenters.get(targetRegionId);
                    distanceToTarget = calculateGeoDistance(center1[0], center1[1], center2[0], center2[1]);
                } else {
                    distanceToTarget = calculateRegionDistance(regionId, targetRegionId);
                }
                
                // 综合考虑已知路径距离和到目标的地理距离
                double combinedScore = routeDistance * 0.3 + distanceToTarget * 0.7;
                
                if (combinedScore < minDistance) {
                    minDistance = combinedScore;
                    closestRegion = regionId;
                }
            }
        }
        
        return closestRegion;
    }
    
    // 助手类: 区域节点（用于Dijkstra算法）
    private static class RegionNode {
        private final Long regionId;
        private final double distance;
        
        public RegionNode(Long regionId, double distance) {
            this.regionId = regionId;
            this.distance = distance;
        }
        
        public Long getRegionId() {
            return regionId;
        }
        
        public double getDistance() {
            return distance;
        }
    }
    
    // 获取区域内所有站点
    private List<Station> getRegionStations(Long regionId) {
        return network.getAllStations().stream()
            .filter(s -> regionId.equals(s.getRegionId()))
            .collect(Collectors.toList());
    }
    
    // 计算两个区域之间的距离（基于区域中心点或枢纽站点间的平均距离）
    private double calculateRegionDistance(Long regionId1, Long regionId2) {
        List<Station> stations1 = getRegionStations(regionId1);
        List<Station> stations2 = getRegionStations(regionId2);
        
        // 优先使用枢纽站点计算
        List<Station> hubs1 = stations1.stream()
            .filter(s -> network.isHubStation(s.getId()))
            .collect(Collectors.toList());
        
        List<Station> hubs2 = stations2.stream()
            .filter(s -> network.isHubStation(s.getId()))
            .collect(Collectors.toList());
        
        // 如果两个区域都有枢纽站点，使用枢纽站点计算平均距离
        if (!hubs1.isEmpty() && !hubs2.isEmpty()) {
            return calculateAverageDistance(hubs1, hubs2);
        }
        
        // 否则使用所有站点
        return calculateAverageDistance(stations1, stations2);
    }
    
    // 计算两组站点之间的平均距离
    private double calculateAverageDistance(List<Station> stations1, List<Station> stations2) {
        if (stations1.isEmpty() || stations2.isEmpty()) {
            return Double.MAX_VALUE;
        }
        
        double totalDistance = 0.0;
        int count = 0;
        
        for (Station station1 : stations1) {
            for (Station station2 : stations2) {
                double distance = network.getDirectDistance(station1.getId(), station2.getId());
                totalDistance += distance;
                count++;
            }
        }
        
        return count > 0 ? totalDistance / count : Double.MAX_VALUE;
    }
    
    // 基于区域路径的多段路径规划
    private OptimalRoute findMultiRegionPath(Long sourceId, Long targetId, List<Long> regionPath) {
        // 即使只有两个区域，也应该使用多区域路径规划
        // 移除之前的跳过逻辑
        
        // 存储完整路径的分段结果
        List<Long> completePath = new ArrayList<>();
        Set<Long> transitStations = new HashSet<>();  // 用于记录中转站点
        double totalDistance = 0.0;
        int totalTime = 0;
        
        Long currentId = sourceId;
        completePath.add(currentId);
        
        // 处理每个区域的中转
        for (int i = 0; i < regionPath.size() - 1; i++) {
            Long currentRegion = regionPath.get(i);
            Long nextRegion = regionPath.get(i + 1);
            
            // 当前区域的枢纽站点
            List<Station> currentHubs = network.getRegionHubStations(currentRegion);
            
            // 下一个区域的枢纽站点
            List<Station> nextHubs = network.getRegionHubStations(nextRegion);
            
            // 确定分段的起点和终点
            Long segmentStart = (i == 0) ? sourceId : currentId;
            Long segmentEnd;
            
            // 如果是最后一段，终点是目标站点
            if (i == regionPath.size() - 2) {
                segmentEnd = targetId;
            } else {
                // 找到连接当前区域和下一个区域的最佳枢纽站点对
                Long[] bestHubPair = findBestHubPair(currentRegion, nextRegion);
                if (bestHubPair == null || bestHubPair[1] == null) {
                    log.error("无法找到从区域{}到区域{}的枢纽站点对", currentRegion, nextRegion);
                    return null;
                }
                segmentEnd = bestHubPair[1];
                transitStations.add(segmentEnd);  // 标记为中转站
            }
            
            // 计算当前段路径
            OptimalRoute segmentRoute = originalAStarFindPath(segmentStart, segmentEnd);
            if (segmentRoute == null) {
                log.error("无法规划从{}到{}的路径", segmentStart, segmentEnd);
                return null;
            }
            
            // 添加分段路径（除了起点，避免重复）
            List<Long> pathNodes = segmentRoute.getPathNodes();
            for (int j = 1; j < pathNodes.size(); j++) {
                Long stationId = pathNodes.get(j);
                completePath.add(stationId);
                
                // 如果此站点是枢纽站点但不是终点，标记为中转站
                if (j < pathNodes.size() - 1 && network.isHubStation(stationId)) {
                    transitStations.add(stationId);
                }
            }
            
            // 累计距离和时间
            totalDistance += segmentRoute.getTotalDistance();
            totalTime += segmentRoute.getEstimatedTime();
            
            // 更新当前位置为这段路径的终点
            currentId = segmentEnd;
        }
        
        // 构建完整的最优路径对象
        OptimalRoute result = new OptimalRoute();
        result.setFromStationId(sourceId);
        result.setToStationId(targetId);
        result.setPathNodes(completePath);
        result.setTotalDistance(totalDistance);
        result.setEstimatedTime(totalTime);
        result.setTransitStations(new ArrayList<>(transitStations));
        
        return result;
    }
    
    // 找到两个区域之间最佳的中转枢纽站点对
    private Long[] findBestHubPair(Long fromRegionId, Long toRegionId) {
        List<Station> fromHubs = network.getRegionHubStations(fromRegionId);
        List<Station> toHubs = network.getRegionHubStations(toRegionId);
        
        if (fromHubs.isEmpty() || toHubs.isEmpty()) {
            log.error("区域{}或区域{}没有枢纽站点", fromRegionId, toRegionId);
            return null;
        }
        
        // 找到连接最佳的枢纽站点对
        Long bestFromHub = null;
        Long bestToHub = null;
        double bestScore = Double.MAX_VALUE;
        
        for (Station fromHub : fromHubs) {
            for (Station toHub : toHubs) {
                Edge edge = network.findEdge(fromHub.getId(), toHub.getId());
                if (edge != null) {
                    // 使用综合评分（距离、时间、成本的加权）
                    double score = edge.getCompositeWeight(distanceWeight, timeWeight, costWeight);
                    if (score < bestScore) {
                        bestScore = score;
                        bestFromHub = fromHub.getId();
                        bestToHub = toHub.getId();
                    }
                }
            }
        }
        
        return new Long[]{bestFromHub, bestToHub};
    }
    
    /**
     * 查找从起点到终点的最优路径
     * @param sourceId 起点站点ID
     * @param targetId 终点站点ID
     * @return 最优路径结果，如果无法找到路径则返回null
     */
    private OptimalRoute originalAStarFindPath(Long sourceId, Long targetId) {
        // 检查参数有效性
        if (sourceId == null || targetId == null) {
            throw new IllegalArgumentException("起点和终点ID不能为空");
        }
        
        if (sourceId.equals(targetId)) {
            throw new IllegalArgumentException("起点和终点不能相同");
        }
        
        // 初始化开放列表和关闭列表
        PriorityQueue<PathNode> openList = new PriorityQueue<>(
                Comparator.comparingDouble(PathNode::getTotalCost));
        Set<Long> closedList = new HashSet<>();
        Map<Long, PathNode> allNodes = new HashMap<>();
        
        // 起点加入开放列表
        PathNode startNode = new PathNode(sourceId, null, 0.0, 
                                         calculateHeuristic(sourceId, targetId));
        openList.add(startNode);
        allNodes.put(sourceId, startNode);
        
        int iterations = 0;
        final int MAX_ITERATIONS = 10000; // 防止无限循环
        
        while (!openList.isEmpty() && iterations < MAX_ITERATIONS) {
            iterations++;
            
            // 取出f值最小的节点
            PathNode current = openList.poll();
            
            // 到达目标
            if (current.getStationId().equals(targetId)) {
                log.info("找到路径，从{}到{}，迭代次数: {}", sourceId, targetId, iterations);
                return reconstructPath(current, allNodes);
            }
            
            // 加入关闭列表
            closedList.add(current.getStationId());
            
            // 遍历邻接节点
            for (Edge edge : network.getAdjacentEdges(current.getStationId())) {
                Long neighborId = edge.getTargetStationId();
                
                // 忽略已在关闭列表中的节点
                if (closedList.contains(neighborId)) {
                    continue;
                }
                
                // 获取邻接节点的区域信息（新增）
                Long currentRegionId = network.getStationRegionId(current.getStationId());
                Long neighborRegionId = network.getStationRegionId(neighborId);
                
                // 如果开启了区域强制中转，且当前节点和邻接节点不在同一区域，则检查是否为枢纽站点
                if (enforceRegionalTransfer && currentRegionId != null && neighborRegionId != null 
                    && !currentRegionId.equals(neighborRegionId)) {
                    boolean isCurrentHub = network.isHubStation(current.getStationId());
                    boolean isNeighborHub = network.isHubStation(neighborId);
                    
                    // 放宽条件：只需要其中一端是枢纽站点即可
                    if (!isCurrentHub && !isNeighborHub) {
                        continue;
                    }
                }
                
                // 计算实际距离
                double edgeDistance = edge.getDistance();
                
                // 长距离直连惩罚（新增）
                double distanceMultiplier = 1.0;
                if (edgeDistance > LONG_DISTANCE_THRESHOLD) {
                    distanceMultiplier = LONG_DISTANCE_PENALTY;
                    log.debug("应用长距离惩罚: {}到{}, 距离: {}", current.getStationId(), neighborId, edgeDistance);
                }
                
                // 计算从起点经过当前节点到邻居的代价，考虑长距离惩罚
                double compositeWeight = edge.getCompositeWeight(distanceWeight, timeWeight, costWeight);
                double newG = current.getActualCost() + (compositeWeight * distanceMultiplier);
                
                PathNode neighborNode = allNodes.get(neighborId);
                boolean needUpdate = false;
                
                if (neighborNode == null) {
                    // 邻居节点不在开放列表中
                    neighborNode = new PathNode(neighborId, current.getStationId(), 
                                              newG, calculateHeuristic(neighborId, targetId));
                    allNodes.put(neighborId, neighborNode);
                    needUpdate = true;
                } else if (newG < neighborNode.getActualCost()) {
                    // 邻居在开放列表中且找到更短路径
                    neighborNode.setPrevious(current.getStationId());
                    neighborNode.setActualCost(newG);
                    neighborNode.updateTotalCost();
                    needUpdate = true;
                }
                
                if (needUpdate) {
                    // 更新或添加到开放列表
                    openList.remove(neighborNode); // 确保更新优先级
                    openList.add(neighborNode);
                }
            }
        }
        
        log.warn("路径查找超过最大迭代次数或无法找到路径，从{}到{}", sourceId, targetId);
        return null; // 无法找到路径
    }
    
    /**
     * 计算启发式函数值(直线距离)
     */
    private double calculateHeuristic(Long fromId, Long toId) {
        return network.getDirectDistance(fromId, toId);
    }
    
    /**
     * 重建路径 - 修改以确保包含完整的中转路径
     */
    private OptimalRoute reconstructPath(PathNode targetNode, Map<Long, PathNode> allNodes) {
        List<Long> pathNodes = new ArrayList<>();
        double totalDistance = 0.0;
        int totalTime = 0;
        PathNode current = targetNode;
        
        // 从目标节点回溯到起点
        while (current != null) {
            pathNodes.add(0, current.getStationId());
            Long prevId = current.getPrevious();
            
            // 如果有前驱节点，计算该段路径的距离和时间
            if (prevId != null) {
                Edge edge = network.findEdge(prevId, current.getStationId());
                if (edge != null) {
                    totalDistance += edge.getDistance();
                    totalTime += edge.getTravelTime();
                }
            }
            
            current = prevId != null ? allNodes.get(prevId) : null;
        }
        
        // 记录详细的路径信息
        log.debug("构建路径: 从{}到{}, 包含{}个中转站点", 
                pathNodes.get(0), pathNodes.get(pathNodes.size() - 1), pathNodes.size() - 2);
        for (int i = 0; i < pathNodes.size(); i++) {
            Long stationId = pathNodes.get(i);
            log.debug("路径站点 {}: ID={}", i, stationId);
        }
        
        OptimalRoute route = new OptimalRoute();
        route.setFromStationId(pathNodes.get(0));
        route.setToStationId(pathNodes.get(pathNodes.size() - 1));
        route.setPathNodes(pathNodes);
        route.setTotalDistance(totalDistance > 0 ? totalDistance : targetNode.getActualCost());
        route.setEstimatedTime(totalTime);
        
        return route;
    }
    
    // 添加权重设置方法
    public void setWeights(double distanceWeight, double timeWeight, double costWeight) {
        this.distanceWeight = distanceWeight;
        this.timeWeight = timeWeight;
        this.costWeight = costWeight;
    }
    
    // 设置是否强制区域间中转（新增）
    public void setEnforceRegionalTransfer(boolean enforce) {
        this.enforceRegionalTransfer = enforce;
    }
}
