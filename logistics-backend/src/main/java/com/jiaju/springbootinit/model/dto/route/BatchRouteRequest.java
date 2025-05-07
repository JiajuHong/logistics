package com.jiaju.springbootinit.model.dto.route;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import java.util.List;

@Data
public class BatchRouteRequest {
    @ApiModelProperty("路径请求列表")
    private List<RouteItem> routes;
    
    @ApiModelProperty("交通因子 (0.8-2.0, 默认1.0)")
    private Double trafficFactor;
    
    @ApiModelProperty("距离权重 (0-1)")
    private Double distanceWeight;
    
    @ApiModelProperty("时间权重 (0-1)")
    private Double timeWeight;
    
    @ApiModelProperty("成本权重 (0-1)")
    private Double costWeight;
    
    @ApiModelProperty("是否强制区域中转")
    private Boolean enforceTransfer;
    
    @Data
    public static class RouteItem {
        @ApiModelProperty("起点站点ID")
        private Long fromStationId;
        
        @ApiModelProperty("终点站点ID")
        private Long toStationId;
        
        @ApiModelProperty("优先级(1-10，默认5)")
        private Integer priority = 5;
    }
} 