package com.jiaju.springbootinit.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jiaju.springbootinit.annotation.AuthCheck;
import com.jiaju.springbootinit.common.*;
import com.jiaju.springbootinit.constant.CommonConstant;
import com.jiaju.springbootinit.constant.UserConstant;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.exception.ThrowUtils;
import com.jiaju.springbootinit.model.dto.task.TransportTaskAddRequest;
import com.jiaju.springbootinit.model.dto.task.TransportTaskQueryRequest;
import com.jiaju.springbootinit.model.dto.task.TransportTaskUpdateRequest;
import com.jiaju.springbootinit.model.entity.TransportTask;
import com.jiaju.springbootinit.model.vo.TransportTaskVO;
import com.jiaju.springbootinit.service.TransportTaskService;
import com.jiaju.springbootinit.service.UserService;
import com.jiaju.springbootinit.utils.SqlUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * 运输任务接口
 */
@RestController
@RequestMapping("/task")
@Slf4j
public class TransportTaskController {

    @Resource
    private TransportTaskService transportTaskService;

    @Resource
    private UserService userService;

    // region 增删改查

    /**
     * 创建运输任务
     *
     * @param transportTaskAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    public BaseResponse<Long> addTransportTask(@RequestBody TransportTaskAddRequest transportTaskAddRequest, HttpServletRequest request) {
        if (transportTaskAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        TransportTask transportTask = new TransportTask();
        BeanUtils.copyProperties(transportTaskAddRequest, transportTask);
        // 校验
        transportTaskService.validTransportTask(transportTask, true);
        boolean result = transportTaskService.save(transportTask);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(transportTask.getId());
    }

    /**
     * 删除运输任务
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @Transactional(rollbackFor = Exception.class)
    public BaseResponse<Boolean> deleteTransportTask(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long id = deleteRequest.getId();
        // 判断是否存在
        TransportTask oldTransportTask = transportTaskService.getById(id);
        ThrowUtils.throwIf(oldTransportTask == null, ErrorCode.NOT_FOUND_ERROR);
        
        // 使用重写的removeById方法，会处理关联订单的状态
        boolean result = transportTaskService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 更新运输任务
     *
     * @param transportTaskUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    public BaseResponse<Boolean> updateTransportTask(@RequestBody TransportTaskUpdateRequest transportTaskUpdateRequest,
                                            HttpServletRequest request) {
        if (transportTaskUpdateRequest == null || transportTaskUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        TransportTask transportTask = new TransportTask();
        BeanUtils.copyProperties(transportTaskUpdateRequest, transportTask);
        // 参数校验
        transportTaskService.validTransportTask(transportTask, false);
        long id = transportTaskUpdateRequest.getId();
        // 判断是否存在
        TransportTask oldTransportTask = transportTaskService.getById(id);
        ThrowUtils.throwIf(oldTransportTask == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = transportTaskService.updateById(transportTask);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取运输任务
     *
     * @param id
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<TransportTaskVO> getTransportTaskById(long id) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        TransportTask transportTask = transportTaskService.getById(id);
        if (transportTask == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(transportTaskService.getTransportTaskVO(transportTask));
    }

    /**
     * 获取运输任务列表（仅管理员可使用）
     *
     * @param transportTaskQueryRequest
     * @return
     */
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @GetMapping("/list")
    public BaseResponse<List<TransportTaskVO>> listTransportTask(TransportTaskQueryRequest transportTaskQueryRequest) {
        List<TransportTask> transportTaskList = getTransportTaskList(transportTaskQueryRequest);
        return ResultUtils.success(transportTaskService.getTransportTaskVO(transportTaskList));
    }

    /**
     * 分页获取运输任务列表
     *
     * @param transportTaskQueryRequest
     * @return
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<TransportTaskVO>> listTransportTaskByPage(TransportTaskQueryRequest transportTaskQueryRequest) {
        if (transportTaskQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long size = transportTaskQueryRequest.getPageSize();
        // 限制爬虫
        ThrowUtils.throwIf(size > 50, ErrorCode.PARAMS_ERROR);
        
        Page<TransportTask> transportTaskPage = getTransportTaskPage(transportTaskQueryRequest);
        
        // 转换为VO列表
        Page<TransportTaskVO> transportTaskVOPage = new Page<>(transportTaskPage.getCurrent(), transportTaskPage.getSize(), transportTaskPage.getTotal());
        List<TransportTaskVO> transportTaskVOList = transportTaskService.getTransportTaskVO(transportTaskPage.getRecords());
        transportTaskVOPage.setRecords(transportTaskVOList);
        
        return ResultUtils.success(transportTaskVOPage);
    }
    
    /**
     * 分配任务车辆和司机
     *
     * @param requestBody 包含任务ID、车辆ID和司机ID的请求体
     * @return 分配结果
     */
    @PostMapping("/assign")
    public BaseResponse<Boolean> assignTask(@RequestBody Map<String, Object> requestBody) {
        if (requestBody == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数不能为空");
        }
        
        Long id = Long.valueOf(requestBody.get("id").toString());
        Long vehicleId = Long.valueOf(requestBody.get("vehicleId").toString());
        Long driverId = Long.valueOf(requestBody.get("driverId").toString());
        
        if (id == null || id <= 0 || vehicleId == null || vehicleId <= 0 || driverId == null || driverId <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "参数不合法");
        }
        
        boolean result = transportTaskService.assignTask(id, vehicleId, driverId);
        return ResultUtils.success(result);
    }
    
    /**
     * 取消任务
     *
     * @param requestBody 包含任务ID的请求体
     * @return 取消结果
     */
    @PostMapping("/cancel")
    public BaseResponse<Boolean> cancelTask(@RequestBody Map<String, Object> requestBody) {
        if (requestBody == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数不能为空");
        }
        
        Long id = Long.valueOf(requestBody.get("id").toString());
        
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        boolean result = transportTaskService.cancelTask(id);
        return ResultUtils.success(result);
    }

    /**
     * 更新任务状态
     *
     * @param requestBody 包含任务ID和新状态的请求体
     * @return 更新结果
     */
    @PostMapping("/updateStatus")
    public BaseResponse<Boolean> updateTaskStatus(@RequestBody Map<String, Object> requestBody) {
        if (requestBody == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数不能为空");
        }
        
        Long id = Long.valueOf(requestBody.get("id").toString());
        Integer status = Integer.valueOf(requestBody.get("status").toString());
        
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "任务ID不能为空");
        }
        
        if (status == null || status < 0 || status > 4) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "任务状态值不合法");
        }
        
        boolean result = transportTaskService.updateTaskStatus(id, status);
        return ResultUtils.success(result);
    }
    
    /**
     * 从订单创建任务
     *
     * @param requestBody 包含订单ID的请求体
     * @return 新任务ID
     */
    @PostMapping("/createFromOrder")
    public BaseResponse<Long> createTaskFromOrder(@RequestBody Map<String, Object> requestBody) {
        if (requestBody == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "请求参数不能为空");
        }
        
        Long orderId = Long.valueOf(requestBody.get("orderId").toString());
        
        if (orderId == null || orderId <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单ID不能为空");
        }
        
        Long taskId = transportTaskService.createTaskFromOrder(orderId);
        return ResultUtils.success(taskId);
    }

    // endregion
    
    // region 公共方法
    
    /**
     * 获取查询包装类
     *
     * @param transportTaskQueryRequest
     * @return
     */
    private QueryWrapper<TransportTask> getQueryWrapper(TransportTaskQueryRequest transportTaskQueryRequest) {
        if (transportTaskQueryRequest == null) {
            return new QueryWrapper<>();
        }
        
        Long id = transportTaskQueryRequest.getId();
        String taskNo = transportTaskQueryRequest.getTaskNo();
        Long orderId = transportTaskQueryRequest.getOrderId();
        Long vehicleId = transportTaskQueryRequest.getVehicleId();
        Long driverId = transportTaskQueryRequest.getDriverId();
        Long sourceId = transportTaskQueryRequest.getSourceId();
        Long targetId = transportTaskQueryRequest.getTargetId();
        Date plannedStartBegin = transportTaskQueryRequest.getPlannedStartBegin();
        Date plannedStartEnd = transportTaskQueryRequest.getPlannedStartEnd();
        Date plannedEndBegin = transportTaskQueryRequest.getPlannedEndBegin();
        Date plannedEndEnd = transportTaskQueryRequest.getPlannedEndEnd();
        Integer status = transportTaskQueryRequest.getStatus();
        Date createTimeStart = transportTaskQueryRequest.getCreateTimeStart();
        Date createTimeEnd = transportTaskQueryRequest.getCreateTimeEnd();
        String sortField = transportTaskQueryRequest.getSortField();
        String sortOrder = transportTaskQueryRequest.getSortOrder();
        
        QueryWrapper<TransportTask> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq(id != null, "id", id);
        queryWrapper.eq(StringUtils.isNotBlank(taskNo), "task_no", taskNo);
        queryWrapper.eq(orderId != null, "order_id", orderId);
        // orderNo关联查询略复杂，这里暂不实现
        queryWrapper.eq(vehicleId != null, "vehicle_id", vehicleId);
        queryWrapper.eq(driverId != null, "driver_id", driverId);
        queryWrapper.eq(sourceId != null, "source_id", sourceId);
        queryWrapper.eq(targetId != null, "target_id", targetId);
        
        // 时间范围查询
        if (plannedStartBegin != null) {
            queryWrapper.ge("planned_start", plannedStartBegin);
        }
        if (plannedStartEnd != null) {
            queryWrapper.le("planned_start", plannedStartEnd);
        }
        if (plannedEndBegin != null) {
            queryWrapper.ge("planned_end", plannedEndBegin);
        }
        if (plannedEndEnd != null) {
            queryWrapper.le("planned_end", plannedEndEnd);
        }
        
        queryWrapper.eq(status != null, "status", status);
        
        // 创建时间范围
        if (createTimeStart != null) {
            queryWrapper.ge("create_time", createTimeStart);
        }
        if (createTimeEnd != null) {
            queryWrapper.le("create_time", createTimeEnd);
        }
        
        // 未被删除
        queryWrapper.eq("is_delete", 0);
        
        // 排序
        boolean validSortField = SqlUtils.validSortField(sortField);
        if (validSortField) {
            queryWrapper.orderBy(true, sortOrder.equals(CommonConstant.SORT_ORDER_ASC), sortField);
        } else {
            queryWrapper.orderBy(true, true, "task_no");  // 默认按任务号升序排序
        }
        
        return queryWrapper;
    }
    
    /**
     * 获取任务列表
     * 
     * @param transportTaskQueryRequest
     * @return
     */
    private List<TransportTask> getTransportTaskList(TransportTaskQueryRequest transportTaskQueryRequest) {
        QueryWrapper<TransportTask> queryWrapper = getQueryWrapper(transportTaskQueryRequest);
        return transportTaskService.list(queryWrapper);
    }
    
    /**
     * 获取任务分页列表
     * 
     * @param transportTaskQueryRequest
     * @return
     */
    private Page<TransportTask> getTransportTaskPage(TransportTaskQueryRequest transportTaskQueryRequest) {
        if (transportTaskQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        QueryWrapper<TransportTask> queryWrapper = getQueryWrapper(transportTaskQueryRequest);
        
        long current = transportTaskQueryRequest.getCurrent();
        long size = transportTaskQueryRequest.getPageSize();
        
        return transportTaskService.page(new Page<>(current, size), queryWrapper);
    }
    
    /**
     * 获取任务统计信息
     *
     * @return 各状态任务的统计数据
     */
    @GetMapping("/statistics")
    public BaseResponse<Map<String, Object>> getTaskStatistics() {
        Map<String, Object> statistics = new HashMap<>();
        
        // 查询各状态的任务数量
        long total = transportTaskService.count(new QueryWrapper<TransportTask>().eq("is_delete", 0));
        long pending = transportTaskService.count(new QueryWrapper<TransportTask>().eq("status", 0).eq("is_delete", 0));
        long assigned = transportTaskService.count(new QueryWrapper<TransportTask>().eq("status", 1).eq("is_delete", 0));
        long inProgress = transportTaskService.count(new QueryWrapper<TransportTask>().eq("status", 2).eq("is_delete", 0));
        long completed = transportTaskService.count(new QueryWrapper<TransportTask>().eq("status", 3).eq("is_delete", 0));
        long cancelled = transportTaskService.count(new QueryWrapper<TransportTask>().eq("status", 4).eq("is_delete", 0));
        
        // 添加到统计结果中
        statistics.put("total", total);
        statistics.put("pending", pending);
        statistics.put("assigned", assigned);
        statistics.put("inProgress", inProgress);
        statistics.put("completed", completed);
        statistics.put("cancelled", cancelled);
        
        return ResultUtils.success(statistics);
    }
    
    // endregion
} 