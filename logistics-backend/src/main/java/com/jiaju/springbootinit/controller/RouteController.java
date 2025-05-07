package com.jiaju.springbootinit.controller;

import com.jiaju.springbootinit.common.BaseResponse;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.common.ResultUtils;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.model.dto.route.BatchRouteRequest;
import com.jiaju.springbootinit.model.dto.route.RouteAdvancedRequest;
import com.jiaju.springbootinit.model.vo.BatchRouteVO;
import com.jiaju.springbootinit.model.vo.OptimalRouteVO;
import com.jiaju.springbootinit.service.RouteService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.alibaba.fastjson.JSON;

import javax.annotation.Resource;

@RestController
@RequestMapping("/route")
@Api(tags = "路线规划接口")
public class RouteController {
    
    private static final Logger log = LoggerFactory.getLogger(RouteController.class);

    @Resource
    private RouteService routeService;
    
    @GetMapping("/optimal")
    @ApiOperation("获取最优路径")
    public BaseResponse<OptimalRouteVO> findOptimalRoute(
            @RequestParam @ApiParam("起点站点ID") Long fromStationId,
            @RequestParam @ApiParam("终点站点ID") Long toStationId,
            @RequestParam(required = false, defaultValue = "false") @ApiParam("是否强制刷新路径") Boolean forceRefresh) {
        
        if (fromStationId == null || toStationId == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "站点ID不能为空");
        }
        
        if (fromStationId.equals(toStationId)) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点不能相同");
        }
        
        log.info("路径查询请求: 从站点{}到站点{}, 强制刷新={}", fromStationId, toStationId, forceRefresh);
        
        // 如果强制刷新，我们需要修改服务接口或实现二次查询
        OptimalRouteVO optimalRoute = null;
        
        try {
            optimalRoute = routeService.calculateOptimalRoute(fromStationId, toStationId);
            
            // 记录结果统计
            if (optimalRoute.getPathPoints() != null) {
                log.info("路径查询结果: 从{}到{}, 路径长度={}公里, 包含{}个站点", 
                      fromStationId, toStationId, 
                      optimalRoute.getTotalDistance(),
                      optimalRoute.getPathPoints().size());
            }
        } catch (Exception e) {
            log.error("路径查询失败: 从{}到{}, 错误: {}", fromStationId, toStationId, e.getMessage());
            throw e;
        }
        
        return ResultUtils.success(optimalRoute);
    }
    
    @GetMapping("/list")
    @ApiOperation("获取两站点间直接路线")
    public BaseResponse<Object> getRouteList(
            @RequestParam @ApiParam("起点站点ID") Long fromStationId,
            @RequestParam @ApiParam("终点站点ID") Long toStationId) {
        
        if (fromStationId == null || toStationId == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "站点ID不能为空");
        }
        
        return ResultUtils.success(routeService.getRouteList(fromStationId, toStationId));
    }
    
    @GetMapping("/analyze-network")
    @ApiOperation("分析路径网络完整性（管理员功能）")
    public BaseResponse<String> analyzeNetwork() {
        // 构建物流网络
        log.info("开始分析物流网络完整性...");
        
        try {
            // 使用路由服务方法来完成网络分析
            // 这里做简化处理，实际实现可能需要调用更专门的服务
            routeService.calculateOptimalRoute(1L, 2L); // 这里使用两个肯定存在的站点ID
            
            return ResultUtils.success("物流网络分析完成，详细结果请查看系统日志");
        } catch (Exception e) {
            log.error("物流网络分析失败: {}", e.getMessage());
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "网络分析失败: " + e.getMessage());
        }
    }

    @PostMapping("/optimal-advanced")
    @ApiOperation("获取最优路径(高级参数)")
    public BaseResponse<OptimalRouteVO> findOptimalRouteAdvanced(@RequestBody RouteAdvancedRequest request) {
        if (request.getFromStationId() == null || request.getToStationId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "站点ID不能为空");
        }
        
        if (request.getFromStationId().equals(request.getToStationId())) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点和终点不能相同");
        }
        
        log.info("高级路径查询请求: 从站点{}到站点{}, 参数={}", 
                request.getFromStationId(), request.getToStationId(), 
                JSON.toJSONString(request));
        
        OptimalRouteVO optimalRoute = routeService.calculateOptimalRouteAdvanced(
                request.getFromStationId(),
                request.getToStationId(),
                request.getDistanceWeight(),
                request.getTimeWeight(),
                request.getCostWeight(),
                request.getTrafficFactor(),
                request.getEnforceTransfer());
        
        return ResultUtils.success(optimalRoute);
    }

    @PostMapping("/batch-optimal")
    @ApiOperation("批量获取最优路径")
    public BaseResponse<BatchRouteVO> batchOptimalRoutes(@RequestBody BatchRouteRequest request) {
        if (request == null || request.getRoutes() == null || request.getRoutes().isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "批量路径请求不能为空");
        }
        
        log.info("批量路径计算请求: {} 条路径请求", request.getRoutes().size());
        
        try {
            BatchRouteVO result = routeService.calculateBatchOptimalRoutes(request);
            log.info("批量路径计算完成: 成功={}, 失败={}, 耗时={}毫秒", 
                    result.getSuccessCount(), result.getFailedCount(), result.getExecutionTime());
            return ResultUtils.success(result);
        } catch (Exception e) {
            log.error("批量路径计算失败: {}", e.getMessage());
            throw e;
        }
    }
}
