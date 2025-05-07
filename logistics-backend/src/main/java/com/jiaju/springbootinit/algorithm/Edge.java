package com.jiaju.springbootinit.algorithm;

import lombok.Data;

/**
 * 边类表示从一个站点到另一个站点的连接
 */
@Data
public class Edge {
    // 目标站点ID
    private Long targetStationId;
    
    // 距离(公里)
    private Double distance;
    
    // 行驶时间(分钟)
    private Integer travelTime;
    
    // 运输成本
    private Double transportCost;
    
    /**
     * 获取综合权重 (考虑距离、时间和成本的综合评分)
     * @param distanceWeight 距离权重系数
     * @param timeWeight 时间权重系数
     * @param costWeight 成本权重系数
     * @return 综合权重值
     */
    public double getCompositeWeight(double distanceWeight, double timeWeight, double costWeight) {
        // 归一化处理，确保权重系数之和为1
        double totalWeight = distanceWeight + timeWeight + costWeight;
        distanceWeight = distanceWeight / totalWeight;
        timeWeight = timeWeight / totalWeight;
        costWeight = costWeight / totalWeight;
        
        // 距离部分（km）- 直接使用距离值
        double distanceFactor = this.distance;
        
        // 时间部分（分钟）- 考虑单位不同，进行适当缩放
        double timeFactor = this.travelTime * 0.1; // 缩放系数使时间与距离在同一数量级
        
        // 成本部分（元）- 考虑单位不同，进行适当缩放
        double costFactor = this.transportCost * 0.5; // 缩放系数使成本与距离在同一数量级
        
        // 计算综合权重
        return distanceWeight * distanceFactor + 
               timeWeight * timeFactor + 
               costWeight * costFactor;
    }
}
