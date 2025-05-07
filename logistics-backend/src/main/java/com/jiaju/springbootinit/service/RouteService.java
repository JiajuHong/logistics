package com.jiaju.springbootinit.service;

import com.jiaju.springbootinit.model.entity.Route;
import com.baomidou.mybatisplus.extension.service.IService;
import com.jiaju.springbootinit.model.vo.OptimalRouteVO;
import com.jiaju.springbootinit.model.dto.route.BatchRouteRequest;
import com.jiaju.springbootinit.model.vo.BatchRouteVO;

import java.util.List;

public interface RouteService extends IService<Route> {

    /**
     * 计算两站点间最优路径
     * @param fromStationId 起点站点ID
     * @param toStationId 终点站点ID
     * @return 最优路径视图对象
     */
    OptimalRouteVO calculateOptimalRoute(Long fromStationId, Long toStationId);
    
    /**
     * 获取两站点间直接路线
     * @param fromStationId 起点站点ID
     * @param toStationId 终点站点ID
     * @return 路线列表
     */
    List<Route> getRouteList(Long fromStationId, Long toStationId);

    /**
     * 使用高级参数计算两站点间最优路径
     * @param fromStationId 起点站点ID
     * @param toStationId 终点站点ID
     * @param distanceWeight 距离权重
     * @param timeWeight 时间权重
     * @param costWeight 成本权重
     * @param trafficFactor 交通因子
     * @param enforceTransfer 是否强制区域中转
     * @return 最优路径视图对象
     */
    OptimalRouteVO calculateOptimalRouteAdvanced(
            Long fromStationId, 
            Long toStationId,
            Double distanceWeight,
            Double timeWeight,
            Double costWeight,
            Double trafficFactor,
            Boolean enforceTransfer);
            
    /**
     * 批量计算最优路径
     * @param request 批量路径请求
     * @return 批量路径结果
     */
    BatchRouteVO calculateBatchOptimalRoutes(BatchRouteRequest request);
}
