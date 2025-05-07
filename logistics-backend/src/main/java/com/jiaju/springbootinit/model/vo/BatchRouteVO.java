package com.jiaju.springbootinit.model.vo;

import io.swagger.annotations.ApiModelProperty;
import lombok.Data;
import java.util.List;

@Data
public class BatchRouteVO {
    @ApiModelProperty("批处理执行时间(毫秒)")
    private Long executionTime;
    
    @ApiModelProperty("成功处理的路径数量")
    private Integer successCount;
    
    @ApiModelProperty("失败的路径数量")
    private Integer failedCount;
    
    @ApiModelProperty("路径结果列表")
    private List<BatchRouteResultItem> results;
    
    @Data
    public static class BatchRouteResultItem {
        @ApiModelProperty("起点站点ID")
        private Long fromStationId;
        
        @ApiModelProperty("终点站点ID")
        private Long toStationId;
        
        @ApiModelProperty("优先级")
        private Integer priority;
        
        @ApiModelProperty("是否成功")
        private Boolean success;
        
        @ApiModelProperty("错误信息")
        private String errorMessage;
        
        @ApiModelProperty("路径详情")
        private OptimalRouteVO route;
    }
} 