package com.jiaju.springbootinit.model.vo;

import com.jiaju.springbootinit.algorithm.OptimalRoute;
import com.jiaju.springbootinit.model.entity.Station;
import io.swagger.annotations.ApiModelProperty;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
    
    /**
     * 中转站点数量
     */
    private Integer transitStationCount;
    
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
        
        /**
         * 是否为中转站
         */
        private boolean transit;
    }

    public OptimalRouteVO convertFromRoute(OptimalRoute route, List<Station> stations) {
        OptimalRouteVO vo = new OptimalRouteVO();
        vo.setFromStationId(route.getFromStationId());
        vo.setToStationId(route.getToStationId());
        vo.setTotalDistance(route.getTotalDistance());
        vo.setEstimatedTime(route.getEstimatedTime());
        
        // 设置途经站点数量
        vo.setTransitStationCount(route.getTransitStations().size());
        
        // 构建路径点VO列表
        List<PathPointVO> pathPoints = new ArrayList<>();
        Map<Long, Station> stationMap = stations.stream()
                .collect(Collectors.toMap(Station::getId, s -> s));
        
        for (Long stationId : route.getPathNodes()) {
            Station station = stationMap.get(stationId);
            if (station != null) {
                PathPointVO point = new PathPointVO();
                point.setStationId(station.getId());
                point.setStationName(station.getName());
                point.setLongitude(station.getLongitude().doubleValue());
                point.setLatitude(station.getLatitude().doubleValue());
                // 标记是否为中转站（新增）
                point.setTransit(route.getTransitStations().contains(stationId));
                pathPoints.add(point);
            }
        }
        
        vo.setPathPoints(pathPoints);
        return vo;
    }
}
