package com.jiaju.springbootinit.algorithm;

import lombok.Data;
import java.util.List;
import java.util.ArrayList;

/**
 * 最优路径结果类
 */
@Data
public class OptimalRoute {
    // 起点站点ID
    private Long fromStationId;
    
    // 终点站点ID
    private Long toStationId;
    
    // 路径节点ID列表
    private List<Long> pathNodes;
    
    // 中转站点ID列表（新增）
    private List<Long> transitStations = new ArrayList<>();
    
    // 总距离(公里)
    private Double totalDistance;
    
    // 估计时间(分钟)
    private Integer estimatedTime;
    
    // 获取途经站点数量
    public int getTransitStationCount() {
        return transitStations.size();
    }
}
