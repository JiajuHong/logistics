package com.jiaju.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jiaju.springbootinit.algorithm.AStarPathFinder;
import com.jiaju.springbootinit.algorithm.LogisticsNetwork;
import com.jiaju.springbootinit.algorithm.OptimalRoute;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.mapper.DirectDistanceMapper;
import com.jiaju.springbootinit.mapper.OptimalRouteCacheMapper;
import com.jiaju.springbootinit.mapper.RouteMapper;
import com.jiaju.springbootinit.mapper.StationMapper;
import com.jiaju.springbootinit.model.dto.route.BatchRouteRequest;
import com.jiaju.springbootinit.model.entity.DirectDistance;
import com.jiaju.springbootinit.model.entity.OptimalRouteCache;
import com.jiaju.springbootinit.model.entity.Route;
import com.jiaju.springbootinit.model.entity.Station;
import com.jiaju.springbootinit.model.vo.BatchRouteVO;
import com.jiaju.springbootinit.model.vo.OptimalRouteVO;
import com.jiaju.springbootinit.service.RouteService;
import org.springframework.stereotype.Service;
import com.alibaba.fastjson.JSON;

import javax.annotation.Resource;
import java.util.*;
import java.util.concurrent.*;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 路线服务实现
 */
@Service
public class RouteServiceImpl extends ServiceImpl<RouteMapper, Route> implements RouteService {

    private static final Logger log = LoggerFactory.getLogger(RouteServiceImpl.class);
    
    @Resource
    private RouteMapper routeMapper;
    
    @Resource
    private StationMapper stationMapper;
    
    @Resource
    private DirectDistanceMapper directDistanceMapper;
    
    @Resource
    private OptimalRouteCacheMapper optimalRouteCacheMapper;
    
    // 距离阈值，超过此距离的路径必须通过中转站（单位：公里）
    private static final double LONG_DISTANCE_THRESHOLD = 300.0;
    
    // 缓存过期时间（小时）
    private static final int CACHE_EXPIRY_HOURS = 24;
    
    public OptimalRouteVO calculateOptimalRoute(Long fromStationId, Long toStationId, 
                                              boolean forceRefresh) {
        if (fromStationId == null || toStationId == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点站点ID不能为空");
        }
        
        if (fromStationId.equals(toStationId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点不能相同");
        }
        
        // 如果强制刷新或者缓存未命中，执行计算
        if (forceRefresh) {
            // 跳过缓存检查，直接计算
        } else {
            // 先检查缓存 - 除非强制刷新，否则优先使用缓存
            OptimalRouteCache cacheResult = checkCache(fromStationId, toStationId);
            if (cacheResult != null && !isCacheExpired(cacheResult)) {
                log.info("命中路径缓存: 从{}到{}", fromStationId, toStationId);
                
                // 更新命中次数
                cacheResult.setHitCount(cacheResult.getHitCount() + 1);
                optimalRouteCacheMapper.updateById(cacheResult);
                
                // 检查缓存中的路径是否合理(中转站点数量)
                List<Long> pathNodes = JSON.parseArray(cacheResult.getPathNodes(), Long.class);
                if (validatePathNodes(pathNodes, cacheResult.getTotalDistance())) {
                    return convertFromCache(cacheResult);
                } else {
                    log.warn("缓存中的路径不合理，重新计算路径。从{}到{}", fromStationId, toStationId);
                    // 缓存路径不合理，需要重新计算
                }
            }
        }
        
        // 构建物流网络
        LogisticsNetwork network = buildNetwork();
        
        // 分析网络完整性（仅在日志级别为DEBUG时执行）
        if (log.isDebugEnabled()) {
            network.analyzeNetworkCompleteness();
        }
        
        // 使用A*算法查找路径，启用区域间中转逻辑
        AStarPathFinder pathFinder = new AStarPathFinder(network);
        
        // 判断起点和终点是否在同一区域
        Long fromRegionId = network.getStationRegionId(fromStationId);
        Long toRegionId = network.getStationRegionId(toStationId);
        boolean sameRegion = fromRegionId != null && toRegionId != null && fromRegionId.equals(toRegionId);
        
        // 获取站点间直线距离
        double directDistance = network.getDirectDistance(fromStationId, toStationId);
        
        // 根据距离和区域信息调整算法参数
        if (!sameRegion || directDistance > LONG_DISTANCE_THRESHOLD) {
            // 跨区域或长距离路径，强制启用区域间中转
            pathFinder.setEnforceRegionalTransfer(true);
            // 调整权重，更注重距离和时间
            pathFinder.setWeights(0.5, 0.4, 0.1); // 距离和时间更平衡
            log.info("使用强制区域中转模式: 从{}(区域{})到{}(区域{}), 直线距离={}km", 
                   fromStationId, fromRegionId, toStationId, toRegionId, directDistance);
        } else {
            // 同区域短距离路径，使用正常模式
            pathFinder.setEnforceRegionalTransfer(false);
            // 均衡权重
            pathFinder.setWeights(0.5, 0.3, 0.2);
            log.info("使用正常模式: 从{}到{}, 直线距离={}km", fromStationId, toStationId, directDistance);
        }
        
        OptimalRoute route = pathFinder.findPath(fromStationId, toStationId);
        
        if (route == null) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "无法找到从起点到终点的路径");
        }
        
        // 验证路径合理性
        if (!validatePathNodes(route.getPathNodes(), route.getTotalDistance())) {
            log.warn("计算出的路径可能不够合理，长距离直连路径没有中转站点。尝试强制启用区域中转...");
            // 强制重新计算一次，无论距离和区域如何，都启用强制区域中转
            pathFinder.setEnforceRegionalTransfer(true);
            pathFinder.setWeights(0.7, 0.2, 0.1); // 更加重视距离因素
            
            OptimalRoute retryRoute = pathFinder.findPath(fromStationId, toStationId);
            if (retryRoute != null && retryRoute.getPathNodes().size() > 2) {
                route = retryRoute;
                log.info("重新计算成功，获得更合理的路径，包含{}个中转站点", 
                        route.getPathNodes().size() - 2);
            }
            
            // 如果多次尝试后仍无法找到包含中转站点的路径，接受直连路径
            if (retryRoute == null || retryRoute.getPathNodes().size() <= 2) {
                log.warn("无法找到包含中转站点的合理路径，将使用直连路径：从{}到{}", 
                        fromStationId, toStationId);
                // 仍使用原始路径
            }
        }
        
        // 记录路径信息
        logPathDetails(route);
        
        // 保存到缓存
        saveRouteToCache(route);
        
        // 转换为VO并返回
        return convertToVO(route, network);
    }
    
    @Override
    public OptimalRouteVO calculateOptimalRoute(Long fromStationId, Long toStationId) {
        // Call the three-parameter version with a default value (false) for forceRefresh
        return calculateOptimalRoute(fromStationId, toStationId, false);
    }
    
    @Override
    public List<Route> getRouteList(Long fromStationId, Long toStationId) {
        if (fromStationId == null || toStationId == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点站点ID不能为空");
        }
        
        LambdaQueryWrapper<Route> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(Route::getFromStationId, fromStationId)
                   .eq(Route::getToStationId, toStationId)
                   .eq(Route::getStatus, 1) // 只查询启用的路线
                   .orderByAsc(Route::getDistance);
        
        return routeMapper.selectList(queryWrapper);
    }
    
    /**
     * 初始化物流网络
     */
    private LogisticsNetwork buildNetwork() {
        LogisticsNetwork network = new LogisticsNetwork();
        
        // 加载所有站点
        List<Station> stations = stationMapper.selectList(null);
        if (stations.isEmpty()) {
            log.error("站点数据为空，无法构建物流网络");
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "站点数据为空");
        }
        log.info("加载了{}个站点到物流网络", stations.size());
        
        for (Station station : stations) {
            network.addStation(station);
        }
        
        // 加载所有路线
        LambdaQueryWrapper<Route> routeQuery = new LambdaQueryWrapper<>();
        routeQuery.eq(Route::getStatus, 1) // 只加载启用的路线
                 .eq(Route::getIsDelete, 0); // 确保未被逻辑删除
        List<Route> routes = routeMapper.selectList(routeQuery);
        if (routes.isEmpty()) {
            log.error("路线数据为空，物流网络将不完整");
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "路线数据为空");
        }
        log.info("加载了{}条路线到物流网络", routes.size());
        
        for (Route route : routes) {
            network.addEdge(route);
        }
        
        // 加载直线距离数据
        List<DirectDistance> distances = directDistanceMapper.selectList(null);
        for (DirectDistance distance : distances) {
            network.addDirectDistance(distance);
        }
        log.info("加载了{}条直线距离记录", distances.size());
        
        // 确保所有枢纽站点间有连接
        network.ensureHubStationsConnectivity();
        
        return network;
    }
    
    /**
     * 检查缓存
     */
    private OptimalRouteCache checkCache(Long fromStationId, Long toStationId) {
        LambdaQueryWrapper<OptimalRouteCache> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(OptimalRouteCache::getFromStationId, fromStationId)
                   .eq(OptimalRouteCache::getToStationId, toStationId)
                   .eq(OptimalRouteCache::getTrafficFactor, 1.0);
        
        return optimalRouteCacheMapper.selectOne(queryWrapper);
    }
    
    /**
     * 检查缓存是否过期
     */
    private boolean isCacheExpired(OptimalRouteCache cache) {
        return cache.getExpireTime() != null && 
               cache.getExpireTime().before(new Date());
    }
    
    /**
     * 将路径保存到缓存
     */
    private void saveRouteToCache(OptimalRoute route) {
        if (route == null) {
            return;
        }
        
        // 先检查是否已存在
        LambdaQueryWrapper<OptimalRouteCache> queryWrapper = new LambdaQueryWrapper<>();
        queryWrapper.eq(OptimalRouteCache::getFromStationId, route.getFromStationId())
                   .eq(OptimalRouteCache::getToStationId, route.getToStationId())
                   .eq(OptimalRouteCache::getTrafficFactor, 1.0);
        
        OptimalRouteCache existingCache = optimalRouteCacheMapper.selectOne(queryWrapper);
        
        // 创建或更新缓存
        OptimalRouteCache cache = existingCache != null ? existingCache : new OptimalRouteCache();
        cache.setFromStationId(route.getFromStationId());
        cache.setToStationId(route.getToStationId());
        cache.setPathNodes(JSON.toJSONString(route.getPathNodes()));
        cache.setTotalDistance(route.getTotalDistance());
        cache.setEstimatedTime(route.getEstimatedTime());
        cache.setTrafficFactor(1.0);
        cache.setCalculationTime(new Date());
        
        // 设置过期时间
        Calendar calendar = Calendar.getInstance();
        calendar.add(Calendar.HOUR, CACHE_EXPIRY_HOURS);
        cache.setExpireTime(calendar.getTime());
        
        if (existingCache == null) {
            cache.setHitCount(0);
            optimalRouteCacheMapper.insert(cache);
        } else {
            optimalRouteCacheMapper.updateById(cache);
        }
        
        log.debug("路径已保存到缓存: 从{}到{}, 中转站点数={}", 
                route.getFromStationId(), route.getToStationId(), route.getPathNodes().size() - 2);
    }
    
    /**
     * 将缓存对象转换为VO
     */
    private OptimalRouteVO convertFromCache(OptimalRouteCache cache) {
        OptimalRouteVO vo = new OptimalRouteVO();
        vo.setFromStationId(cache.getFromStationId());
        vo.setToStationId(cache.getToStationId());
        vo.setTotalDistance(cache.getTotalDistance());
        vo.setEstimatedTime(cache.getEstimatedTime());
        
        // 解析路径节点
        List<Long> pathNodeIds = JSON.parseArray(cache.getPathNodes(), Long.class);
        
        // 获取所有站点信息
        List<Station> stations = stationMapper.selectBatchIds(pathNodeIds);
        Map<Long, Station> stationMap = stations.stream()
                .collect(Collectors.toMap(Station::getId, station -> station));
        
        // 构建路径点VO列表
        List<OptimalRouteVO.PathPointVO> pathPoints = new ArrayList<>();
        for (Long stationId : pathNodeIds) {
            Station station = stationMap.get(stationId);
            if (station != null) {
                OptimalRouteVO.PathPointVO point = new OptimalRouteVO.PathPointVO();
                point.setStationId(station.getId());
                point.setStationName(station.getName());
                point.setLongitude(station.getLongitude().doubleValue());
                point.setLatitude(station.getLatitude().doubleValue());
                pathPoints.add(point);
            }
        }
        
        vo.setPathPoints(pathPoints);
        return vo;
    }
    
    /**
     * 将算法结果转换为VO
     */
    private OptimalRouteVO convertToVO(OptimalRoute route, LogisticsNetwork network) {
        OptimalRouteVO vo = new OptimalRouteVO();
        vo.setFromStationId(route.getFromStationId());
        vo.setToStationId(route.getToStationId());
        vo.setTotalDistance(route.getTotalDistance());
        vo.setEstimatedTime(route.getEstimatedTime());
        
        // 获取所有相关站点
        List<Station> stations = stationMapper.selectBatchIds(route.getPathNodes());
        Map<Long, Station> stationMap = stations.stream()
                .collect(Collectors.toMap(Station::getId, station -> station));
        
        // 构建路径点列表
        List<OptimalRouteVO.PathPointVO> pathPoints = new ArrayList<>();
        for (Long stationId : route.getPathNodes()) {
            Station station = stationMap.get(stationId);
            if (station != null) {
                OptimalRouteVO.PathPointVO point = new OptimalRouteVO.PathPointVO();
                point.setStationId(station.getId());
                point.setStationName(station.getName());
                point.setLongitude(station.getLongitude().doubleValue());
                point.setLatitude(station.getLatitude().doubleValue());
                pathPoints.add(point);
            }
        }
        
        vo.setPathPoints(pathPoints);
        return vo;
    }
    
    /**
     * 验证路径节点合理性（新增）
     * 检查长距离路径是否包含足够的中转站点
     */
    private boolean validatePathNodes(List<Long> pathNodes, double totalDistance) {
        if (pathNodes == null || pathNodes.size() < 2) {
            return false;
        }
        
        // 降低限制：长距离路径无中转站时发出警告但仍返回路径
        if (totalDistance > LONG_DISTANCE_THRESHOLD && pathNodes.size() <= 2) {
            log.warn("长距离路径({}公里)没有中转站点，可能不够合理但仍将返回", totalDistance);
            // 不返回false，继续处理
        }
        
        // 检查起点和终点区域是否相同
        Long fromStationId = pathNodes.get(0);
        Long toStationId = pathNodes.get(pathNodes.size() - 1);
        
        Station fromStation = stationMapper.selectById(fromStationId);
        Station toStation = stationMapper.selectById(toStationId);
        
        if (fromStation != null && toStation != null && 
            fromStation.getRegionId() != null && toStation.getRegionId() != null) {
            
            boolean sameRegion = fromStation.getRegionId().equals(toStation.getRegionId());
            
            // 不同区域且没有中转站点，可能不合理
            if (!sameRegion && pathNodes.size() <= 2) {
                log.warn("跨区域路径没有中转站点，可能不合理。从区域{}到区域{}", 
                          fromStation.getRegionId(), toStation.getRegionId());
                return false;
            }
        }
        
        return true; // 除非明确无效，否则默认验证通过
    }
    
    /**
     * 记录路径详细信息（新增）
     */
    private void logPathDetails(OptimalRoute route) {
        if (!log.isInfoEnabled() || route == null) {
            return;
        }
        
        log.info("路径计算结果: 从{}到{}, 总距离={}公里, 预计时间={}分钟, 中转站点数={}",
                route.getFromStationId(), route.getToStationId(), 
                route.getTotalDistance(), route.getEstimatedTime(),
                route.getPathNodes().size() - 2);
        
        if (log.isDebugEnabled() && route.getPathNodes().size() > 2) {
            List<Station> stations = stationMapper.selectBatchIds(route.getPathNodes());
            Map<Long, Station> stationMap = stations.stream()
                    .collect(Collectors.toMap(Station::getId, station -> station));
            
            StringBuilder pathDetail = new StringBuilder("详细路径: ");
            for (int i = 0; i < route.getPathNodes().size(); i++) {
                Long stationId = route.getPathNodes().get(i);
                Station station = stationMap.get(stationId);
                if (station != null) {
                    pathDetail.append(station.getName());
                    if (i < route.getPathNodes().size() - 1) {
                        pathDetail.append(" -> ");
                    }
                }
            }
            log.debug(pathDetail.toString());
        }
    }

    @Override
    public OptimalRouteVO calculateOptimalRouteAdvanced(
            Long fromStationId, 
            Long toStationId,
            Double distanceWeight,
            Double timeWeight,
            Double costWeight,
            Double trafficFactor,
            Boolean enforceTransfer) {
        
        if (fromStationId == null || toStationId == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点站点ID不能为空");
        }
        
        if (fromStationId.equals(toStationId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点不能相同");
        }
        
        // 设置默认值
        double dWeight = distanceWeight != null ? distanceWeight : 0.5;
        double tWeight = timeWeight != null ? timeWeight : 0.3;
        double cWeight = costWeight != null ? costWeight : 0.2;
        double tFactor = trafficFactor != null ? trafficFactor : 1.0;
        boolean eTransfer = enforceTransfer != null ? enforceTransfer : true;
        
        // 验证权重总和为1
        double totalWeight = dWeight + tWeight + cWeight;
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            // 如果权重和不为1，进行归一化
            dWeight = dWeight / totalWeight;
            tWeight = tWeight / totalWeight;
            cWeight = cWeight / totalWeight;
        }
        
        // 构建物流网络
        LogisticsNetwork network = buildNetwork();
        
        // 使用A*算法查找路径
        AStarPathFinder pathFinder = new AStarPathFinder(network);
        
        // 设置自定义参数
        pathFinder.setWeights(dWeight, tWeight, cWeight);
        pathFinder.setEnforceRegionalTransfer(eTransfer);
        
        // 执行路径查找
        OptimalRoute route = pathFinder.findPath(fromStationId, toStationId);
        
        if (route == null) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "无法找到从起点到终点的路径");
        }
        
        // 应用交通因子
        if (tFactor != 1.0) {
            route.setEstimatedTime((int) (route.getEstimatedTime() * tFactor));
        }
        
        // 记录路径信息
        logPathDetails(route);
        
        // 保存到缓存（可选，根据业务需求决定是否缓存高级参数的结果）
        // saveRouteToCache(route);
        
        // 转换为VO并返回
        OptimalRouteVO result = convertToVO(route, network);
        
        // 添加交通因子信息
        result.setTrafficFactor(tFactor);
        
        return result;
    }

    @Override
    public BatchRouteVO calculateBatchOptimalRoutes(BatchRouteRequest request) {
        if (request == null || request.getRoutes() == null || request.getRoutes().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "批量路径请求不能为空");
        }
        
        // 开始计时
        long startTime = System.currentTimeMillis();
        
        // 预处理请求参数
        double distanceWeight = request.getDistanceWeight() != null ? request.getDistanceWeight() : 0.5;
        double timeWeight = request.getTimeWeight() != null ? request.getTimeWeight() : 0.3;
        double costWeight = request.getCostWeight() != null ? request.getCostWeight() : 0.2;
        double trafficFactor = request.getTrafficFactor() != null ? request.getTrafficFactor() : 1.0;
        boolean enforceTransfer = request.getEnforceTransfer() != null ? request.getEnforceTransfer() : true;
        
        // 归一化权重
        double totalWeight = distanceWeight + timeWeight + costWeight;
        if (Math.abs(totalWeight - 1.0) > 0.01) {
            distanceWeight = distanceWeight / totalWeight;
            timeWeight = timeWeight / totalWeight;
            costWeight = costWeight / totalWeight;
        }
        
        // 构建物流网络(只建一次，供所有请求共用)
        LogisticsNetwork network = buildNetwork();
        
        // 创建A*算法实例并配置参数
        AStarPathFinder pathFinder = new AStarPathFinder(network);
        pathFinder.setWeights(distanceWeight, timeWeight, costWeight);
        pathFinder.setEnforceRegionalTransfer(enforceTransfer);
        
        // 按优先级排序请求
        List<BatchRouteRequest.RouteItem> sortedRoutes = request.getRoutes().stream()
                .sorted(Comparator.comparing(BatchRouteRequest.RouteItem::getPriority).reversed())
                .collect(Collectors.toList());
        
        // 创建结果对象
        BatchRouteVO result = new BatchRouteVO();
        List<BatchRouteVO.BatchRouteResultItem> resultItems = new ArrayList<>();
        int successCount = 0;
        int failedCount = 0;
        
        // 创建线程池处理批量请求
        int availableProcessors = Runtime.getRuntime().availableProcessors();
        int threadPoolSize = Math.min(availableProcessors, sortedRoutes.size());
        ExecutorService executorService = Executors.newFixedThreadPool(threadPoolSize);
        
        try {
            // 提交所有任务
            List<Future<BatchRouteVO.BatchRouteResultItem>> futures = new ArrayList<>();
            
            for (BatchRouteRequest.RouteItem routeItem : sortedRoutes) {
                futures.add(executorService.submit(() -> {
                    BatchRouteVO.BatchRouteResultItem resultItem = new BatchRouteVO.BatchRouteResultItem();
                    resultItem.setFromStationId(routeItem.getFromStationId());
                    resultItem.setToStationId(routeItem.getToStationId());
                    resultItem.setPriority(routeItem.getPriority());
                    
                    try {
                        // 参数验证
                        if (routeItem.getFromStationId() == null || routeItem.getToStationId() == null) {
                            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点站点ID不能为空");
                        }
                        
                        if (routeItem.getFromStationId().equals(routeItem.getToStationId())) {
                            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点不能相同");
                        }
                        
                        // 路径寻找
                        OptimalRoute route = pathFinder.findPath(routeItem.getFromStationId(), routeItem.getToStationId());
                        
                        if (route == null) {
                            resultItem.setSuccess(false);
                            resultItem.setErrorMessage("无法找到从起点到终点的路径");
                        } else {
                            // 应用交通因子
                            if (trafficFactor != 1.0) {
                                route.setEstimatedTime((int) (route.getEstimatedTime() * trafficFactor));
                            }
                            
                            // 转换为VO
                            OptimalRouteVO routeVO = convertToVO(route, network);
                            routeVO.setTrafficFactor(trafficFactor);
                            
                            resultItem.setSuccess(true);
                            resultItem.setRoute(routeVO);
                        }
                    } catch (Exception e) {
                        resultItem.setSuccess(false);
                        resultItem.setErrorMessage(e.getMessage());
                        log.error("批量路径计算错误: 从{}到{}, 错误: {}", 
                                routeItem.getFromStationId(), routeItem.getToStationId(), e.getMessage());
                    }
                    
                    return resultItem;
                }));
            }
            
            // 收集所有结果
            for (Future<BatchRouteVO.BatchRouteResultItem> future : futures) {
                try {
                    BatchRouteVO.BatchRouteResultItem item = future.get();
                    if (item.getSuccess() != null && item.getSuccess()) {
                        successCount++;
                    } else {
                        failedCount++;
                    }
                    resultItems.add(item);
                } catch (Exception e) {
                    failedCount++;
                    log.error("获取批量路径计算结果失败: {}", e.getMessage());
                }
            }
        } finally {
            executorService.shutdown();
        }
        
        // 结果按原始优先级排序
        resultItems.sort(Comparator.comparing(BatchRouteVO.BatchRouteResultItem::getPriority).reversed());
        
        // 设置结果
        result.setResults(resultItems);
        result.setSuccessCount(successCount);
        result.setFailedCount(failedCount);
        result.setExecutionTime(System.currentTimeMillis() - startTime);
        
        log.info("批量路径计算完成: 成功={}, 失败={}, 耗时={}毫秒", 
                successCount, failedCount, result.getExecutionTime());
        
        return result;
    }
}
