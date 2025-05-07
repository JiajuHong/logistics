package com.jiaju.springbootinit.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jiaju.springbootinit.annotation.AuthCheck;
import com.jiaju.springbootinit.common.*;
import com.jiaju.springbootinit.constant.CommonConstant;
import com.jiaju.springbootinit.constant.UserConstant;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.exception.ThrowUtils;
import com.jiaju.springbootinit.model.dto.order.TransportOrderAddRequest;
import com.jiaju.springbootinit.model.dto.order.TransportOrderQueryRequest;
import com.jiaju.springbootinit.model.dto.order.TransportOrderUpdateRequest;
import com.jiaju.springbootinit.model.entity.TransportOrder;
import com.jiaju.springbootinit.model.vo.TransportOrderVO;
import com.jiaju.springbootinit.service.TransportOrderService;
import com.jiaju.springbootinit.service.UserService;
import com.jiaju.springbootinit.utils.SqlUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 运输订单接口
 */
@RestController
@RequestMapping("/order")
@Slf4j
public class TransportOrderController {

    @Resource
    private TransportOrderService transportOrderService;

    @Resource
    private UserService userService;

    // region 增删改查

    /**
     * 创建运输订单
     *
     * @param transportOrderAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    public BaseResponse<Long> addTransportOrder(@RequestBody TransportOrderAddRequest transportOrderAddRequest, HttpServletRequest request) {
        if (transportOrderAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        TransportOrder transportOrder = new TransportOrder();
        BeanUtils.copyProperties(transportOrderAddRequest, transportOrder);
        // 校验
        transportOrderService.validTransportOrder(transportOrder, true);
        boolean result = transportOrderService.save(transportOrder);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(transportOrder.getId());
    }

    /**
     * 删除运输订单
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteTransportOrder(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long id = deleteRequest.getId();
        // 判断是否存在
        TransportOrder oldTransportOrder = transportOrderService.getById(id);
        ThrowUtils.throwIf(oldTransportOrder == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = transportOrderService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 更新运输订单
     *
     * @param transportOrderUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    public BaseResponse<Boolean> updateTransportOrder(@RequestBody TransportOrderUpdateRequest transportOrderUpdateRequest,
                                            HttpServletRequest request) {
        if (transportOrderUpdateRequest == null || transportOrderUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        TransportOrder transportOrder = new TransportOrder();
        BeanUtils.copyProperties(transportOrderUpdateRequest, transportOrder);
        // 参数校验
        transportOrderService.validTransportOrder(transportOrder, false);
        long id = transportOrderUpdateRequest.getId();
        // 判断是否存在
        TransportOrder oldTransportOrder = transportOrderService.getById(id);
        ThrowUtils.throwIf(oldTransportOrder == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = transportOrderService.updateById(transportOrder);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取运输订单
     *
     * @param id
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<TransportOrderVO> getTransportOrderById(long id) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        TransportOrder transportOrder = transportOrderService.getById(id);
        if (transportOrder == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(transportOrderService.getTransportOrderVO(transportOrder));
    }

    /**
     * 获取运输订单列表（仅管理员可使用）
     *
     * @param transportOrderQueryRequest
     * @return
     */
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @GetMapping("/list")
    public BaseResponse<List<TransportOrderVO>> listTransportOrder(TransportOrderQueryRequest transportOrderQueryRequest) {
        List<TransportOrder> transportOrderList = getTransportOrderList(transportOrderQueryRequest);
        return ResultUtils.success(transportOrderService.getTransportOrderVO(transportOrderList));
    }

    /**
     * 分页获取运输订单列表
     *
     * @param transportOrderQueryRequest
     * @return
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<TransportOrderVO>> listTransportOrderByPage(TransportOrderQueryRequest transportOrderQueryRequest) {
        if (transportOrderQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long size = transportOrderQueryRequest.getPageSize();
        // 限制爬虫
        ThrowUtils.throwIf(size > 50, ErrorCode.PARAMS_ERROR);
        
        Page<TransportOrder> transportOrderPage = getTransportOrderPage(transportOrderQueryRequest);
        
        // 转换为VO列表
        Page<TransportOrderVO> transportOrderVOPage = new Page<>(transportOrderPage.getCurrent(), transportOrderPage.getSize(), transportOrderPage.getTotal());
        List<TransportOrderVO> transportOrderVOList = transportOrderService.getTransportOrderVO(transportOrderPage.getRecords());
        transportOrderVOPage.setRecords(transportOrderVOList);
        
        return ResultUtils.success(transportOrderVOPage);
    }
    
    /**
     * 取消订单
     *
     * @param id 订单ID
     * @return 取消结果
     */
    @PostMapping("/cancel")
    public BaseResponse<Boolean> cancelOrder(@RequestParam Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        boolean result = transportOrderService.cancelOrder(id);
        return ResultUtils.success(result);
    }

    /**
     * 更新订单状态
     *
     * @param id 订单ID
     * @param status 新状态：0-待分配, 1-已分配, 2-运输中, 3-已完成, 4-已取消
     * @return 更新结果
     */
    @PostMapping("/updateStatus")
    public BaseResponse<Boolean> updateOrderStatus(@RequestParam Long id, @RequestParam Integer status) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单ID不能为空");
        }
        
        if (status == null || status < 0 || status > 4) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单状态值不合法");
        }
        
        boolean result = transportOrderService.updateOrderStatus(id, status);
        return ResultUtils.success(result);
    }

    // endregion
    
    // region 公共方法
    
    /**
     * 获取查询包装类
     *
     * @param transportOrderQueryRequest
     * @return
     */
    private QueryWrapper<TransportOrder> getQueryWrapper(TransportOrderQueryRequest transportOrderQueryRequest) {
        if (transportOrderQueryRequest == null) {
            return new QueryWrapper<>();
        }
        
        Long id = transportOrderQueryRequest.getId();
        String orderNo = transportOrderQueryRequest.getOrderNo();
        Long customerId = transportOrderQueryRequest.getCustomerId();
        Long sourceStationId = transportOrderQueryRequest.getSourceStationId();
        Long targetStationId = transportOrderQueryRequest.getTargetStationId();
        String cargoDesc = transportOrderQueryRequest.getCargoDesc();
        Integer status = transportOrderQueryRequest.getStatus();
        Boolean hasTask = transportOrderQueryRequest.getHasTask();
        String sortField = transportOrderQueryRequest.getSortField();
        String sortOrder = transportOrderQueryRequest.getSortOrder();
        
        QueryWrapper<TransportOrder> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq(id != null, "id", id);
        queryWrapper.eq(StringUtils.isNotBlank(orderNo), "order_no", orderNo);
        queryWrapper.eq(customerId != null, "customer_id", customerId);
        queryWrapper.eq(sourceStationId != null, "source_station_id", sourceStationId);
        queryWrapper.eq(targetStationId != null, "target_station_id", targetStationId);
        queryWrapper.like(StringUtils.isNotBlank(cargoDesc), "cargo_desc", cargoDesc);
        queryWrapper.eq(status != null, "status", status);
        queryWrapper.eq(hasTask != null, "has_task", hasTask);
        
        // 重量范围查询
        if (transportOrderQueryRequest.getMinWeight() != null) {
            queryWrapper.ge("weight", transportOrderQueryRequest.getMinWeight());
        }
        if (transportOrderQueryRequest.getMaxWeight() != null) {
            queryWrapper.le("weight", transportOrderQueryRequest.getMaxWeight());
        }
        
        // 体积范围查询
        if (transportOrderQueryRequest.getMinVolume() != null) {
            queryWrapper.ge("volume", transportOrderQueryRequest.getMinVolume());
        }
        if (transportOrderQueryRequest.getMaxVolume() != null) {
            queryWrapper.le("volume", transportOrderQueryRequest.getMaxVolume());
        }
        
        // 预期交付时间范围查询
        if (transportOrderQueryRequest.getExpectedDeliveryStart() != null) {
            queryWrapper.ge("expected_delivery", transportOrderQueryRequest.getExpectedDeliveryStart());
        }
        if (transportOrderQueryRequest.getExpectedDeliveryEnd() != null) {
            queryWrapper.le("expected_delivery", transportOrderQueryRequest.getExpectedDeliveryEnd());
        }
        
        // 创建时间范围查询
        if (transportOrderQueryRequest.getCreateTimeStart() != null) {
            queryWrapper.ge("create_time", transportOrderQueryRequest.getCreateTimeStart());
        }
        if (transportOrderQueryRequest.getCreateTimeEnd() != null) {
            queryWrapper.le("create_time", transportOrderQueryRequest.getCreateTimeEnd());
        }
        
        queryWrapper.eq("is_delete", 0);
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), sortOrder.equals(CommonConstant.SORT_ORDER_ASC),
                sortField);
        return queryWrapper;
    }
    
    /**
     * 获取运输订单列表
     *
     * @param transportOrderQueryRequest
     * @return
     */
    private List<TransportOrder> getTransportOrderList(TransportOrderQueryRequest transportOrderQueryRequest) {
        QueryWrapper<TransportOrder> queryWrapper = getQueryWrapper(transportOrderQueryRequest);
        return transportOrderService.list(queryWrapper);
    }
    
    /**
     * 获取运输订单分页
     *
     * @param transportOrderQueryRequest
     * @return
     */
    private Page<TransportOrder> getTransportOrderPage(TransportOrderQueryRequest transportOrderQueryRequest) {
        QueryWrapper<TransportOrder> queryWrapper = getQueryWrapper(transportOrderQueryRequest);
        return transportOrderService.page(new Page<>(transportOrderQueryRequest.getCurrent(), transportOrderQueryRequest.getPageSize()), queryWrapper);
    }
    
    // endregion
} 