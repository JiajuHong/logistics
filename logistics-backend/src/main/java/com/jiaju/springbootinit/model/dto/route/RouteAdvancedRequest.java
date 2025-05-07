package com.jiaju.springbootinit.model.dto.route;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

@Data
public class RouteAdvancedRequest {
    @ApiModelProperty("起点站点ID")
    private Long fromStationId;
    
    @ApiModelProperty("终点站点ID")
    private Long toStationId;
    
    @ApiModelProperty("距离权重 (0-1)")
    private Double distanceWeight;
    
    @ApiModelProperty("时间权重 (0-1)")
    private Double timeWeight;
    
    @ApiModelProperty("成本权重 (0-1)")
    private Double costWeight;
    
    @ApiModelProperty("交通因子 (0.8-2.0, 默认1.0)")
    private Double trafficFactor;
    
    @ApiModelProperty("是否强制区域中转")
    private Boolean enforceTransfer;
    
    // getters and setters
}
