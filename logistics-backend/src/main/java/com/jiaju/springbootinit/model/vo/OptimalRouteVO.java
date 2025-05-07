package com.jiaju.springbootinit.model.vo;

import lombok.Data;
import java.util.List;
import io.swagger.annotations.ApiModelProperty;

@Data
public class OptimalRouteVO {
    /**
     * 起点站点ID
     */
    private Long fromStationId;
    
    /**
     * 终点站点ID
     */
    private Long toStationId;
    
    /**
     * 路径点列表
     */
    private List<PathPointVO> pathPoints;
    
    /**
     * 总距离(公里)
     */
    private Double totalDistance;
    
    /**
     * 预计时间(分钟)
     */
    private Integer estimatedTime;
    
    @ApiModelProperty("交通因子")
    private Double trafficFactor;
    
    @Data
    public static class PathPointVO {
        /**
         * 站点ID
         */
        private Long stationId;
        
        /**
         * 站点名称
         */
        private String stationName;
        
        /**
         * 经度
         */
        private Double longitude;
        
        /**
         * 纬度
         */
        private Double latitude;
    }
}
