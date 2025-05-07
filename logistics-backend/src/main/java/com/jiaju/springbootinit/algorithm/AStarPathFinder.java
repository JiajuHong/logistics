package com.jiaju.springbootinit.algorithm;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.*;

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
    private boolean enforceRegionalTransfer = true; // 是否强制跨区域通过枢纽站点中转
    
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
