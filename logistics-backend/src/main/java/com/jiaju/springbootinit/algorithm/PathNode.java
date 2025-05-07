package com.jiaju.springbootinit.algorithm;

import lombok.Data;

/**
 * 路径节点类
 */
@Data
public class PathNode {
    // 当前站点ID
    private Long stationId;
    
    // 前一个站点ID
    private Long previous;
    
    // 从起点到当前节点的实际代价 g(n)
    private double actualCost;
    
    // 启发式函数值 h(n)
    private double heuristic;
    
    // 总代价 f(n) = g(n) + h(n)
    private double totalCost;
    
    public PathNode(Long stationId, Long previous, double actualCost, double heuristic) {
        this.stationId = stationId;
        this.previous = previous;
        this.actualCost = actualCost;
        this.heuristic = heuristic;
        this.totalCost = actualCost + heuristic;
    }
    
    /**
     * 更新总成本
     */
    public void updateTotalCost() {
        this.totalCost = this.actualCost + this.heuristic;
    }
}
