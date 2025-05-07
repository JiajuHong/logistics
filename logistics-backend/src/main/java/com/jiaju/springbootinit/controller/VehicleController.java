package com.jiaju.springbootinit.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jiaju.springbootinit.annotation.AuthCheck;
import com.jiaju.springbootinit.common.BaseResponse;
import com.jiaju.springbootinit.common.DeleteRequest;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.common.ResultUtils;
import com.jiaju.springbootinit.constant.CommonConstant;
import com.jiaju.springbootinit.constant.UserConstant;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.exception.ThrowUtils;
import com.jiaju.springbootinit.model.dto.vehicle.VehicleAddRequest;
import com.jiaju.springbootinit.model.dto.vehicle.VehicleQueryRequest;
import com.jiaju.springbootinit.model.dto.vehicle.VehicleUpdateRequest;
import com.jiaju.springbootinit.model.entity.Vehicle;
import com.jiaju.springbootinit.model.vo.VehicleVO;
import com.jiaju.springbootinit.model.vo.VehicleStatisticsVO;
import com.jiaju.springbootinit.service.VehicleService;
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
 * 车辆接口
 */
@RestController
@RequestMapping("/vehicle")
@Slf4j
public class VehicleController {

    @Resource
    private VehicleService vehicleService;

    @Resource
    private UserService userService;

    // region 增删改查

    /**
     * 创建车辆
     *
     * @param vehicleAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Long> addVehicle(@RequestBody VehicleAddRequest vehicleAddRequest, HttpServletRequest request) {
        if (vehicleAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Vehicle vehicle = new Vehicle();
        BeanUtils.copyProperties(vehicleAddRequest, vehicle);
        // 校验
        vehicleService.validVehicle(vehicle, true);
        boolean result = vehicleService.save(vehicle);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(vehicle.getId());
    }

    /**
     * 删除车辆
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteVehicle(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long id = deleteRequest.getId();
        // 判断是否存在
        Vehicle oldVehicle = vehicleService.getById(id);
        ThrowUtils.throwIf(oldVehicle == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = vehicleService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 更新车辆
     *
     * @param vehicleUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateVehicle(@RequestBody VehicleUpdateRequest vehicleUpdateRequest,
                                            HttpServletRequest request) {
        if (vehicleUpdateRequest == null || vehicleUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Vehicle vehicle = new Vehicle();
        BeanUtils.copyProperties(vehicleUpdateRequest, vehicle);
        // 参数校验
        vehicleService.validVehicle(vehicle, false);
        long id = vehicleUpdateRequest.getId();
        // 判断是否存在
        Vehicle oldVehicle = vehicleService.getById(id);
        ThrowUtils.throwIf(oldVehicle == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = vehicleService.updateById(vehicle);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取车辆
     *
     * @param id
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<VehicleVO> getVehicleById(long id) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Vehicle vehicle = vehicleService.getById(id);
        if (vehicle == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(vehicleService.getVehicleVO(vehicle));
    }

    /**
     * 获取车辆列表（仅管理员可使用）
     *
     * @param vehicleQueryRequest
     * @return
     */
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @GetMapping("/list")
    public BaseResponse<List<VehicleVO>> listVehicle(VehicleQueryRequest vehicleQueryRequest) {
        Vehicle vehicleQuery = new Vehicle();
        if (vehicleQueryRequest != null) {
            BeanUtils.copyProperties(vehicleQueryRequest, vehicleQuery);
        }
        QueryWrapper<Vehicle> queryWrapper = new QueryWrapper<>(vehicleQuery);
        List<Vehicle> vehicleList = vehicleService.list(queryWrapper);
        return ResultUtils.success(vehicleService.getVehicleVO(vehicleList));
    }

    /**
     * 分页获取车辆列表
     *
     * @param vehicleQueryRequest
     * @return
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<VehicleVO>> listVehicleByPage(VehicleQueryRequest vehicleQueryRequest) {
        if (vehicleQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Vehicle vehicleQuery = new Vehicle();
        BeanUtils.copyProperties(vehicleQueryRequest, vehicleQuery);
        long current = vehicleQueryRequest.getCurrent();
        long size = vehicleQueryRequest.getPageSize();
        String sortField = vehicleQueryRequest.getSortField();
        String sortOrder = vehicleQueryRequest.getSortOrder();
        // 限制爬虫
        ThrowUtils.throwIf(size > 50, ErrorCode.PARAMS_ERROR);
        QueryWrapper<Vehicle> queryWrapper = new QueryWrapper<>();
        queryWrapper.like(StringUtils.isNotBlank(vehicleQuery.getVehicleNo()), "vehicle_no", vehicleQuery.getVehicleNo());
        queryWrapper.like(StringUtils.isNotBlank(vehicleQuery.getVehicleType()), "vehicle_type", vehicleQuery.getVehicleType());
        queryWrapper.eq(vehicleQuery.getStationId() != null, "station_id", vehicleQuery.getStationId());
        queryWrapper.eq(vehicleQuery.getStatus() != null, "status", vehicleQuery.getStatus());
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), sortOrder.equals(CommonConstant.SORT_ORDER_ASC),
                sortField);
        Page<Vehicle> vehiclePage = vehicleService.page(new Page<>(current, size), queryWrapper);
        
        // 转换为VO列表
        Page<VehicleVO> vehicleVOPage = new Page<>(vehiclePage.getCurrent(), vehiclePage.getSize(), vehiclePage.getTotal());
        List<VehicleVO> vehicleVOList = vehicleService.getVehicleVO(vehiclePage.getRecords());
        vehicleVOPage.setRecords(vehicleVOList);
        
        return ResultUtils.success(vehicleVOPage);
    }

    /**
     * 获取所有车辆类型（唯一值列表）
     *
     * @return
     */
    @GetMapping("/types")
    public BaseResponse<List<String>> listVehicleTypes() {
        List<String> vehicleTypes = vehicleService.listUniqueVehicleTypes();
        return ResultUtils.success(vehicleTypes);
    }

    /**
     * 获取车辆统计数据
     * 
     * @return 车辆统计数据
     */
    @GetMapping("/statistics")
    public BaseResponse<VehicleStatisticsVO> getVehicleStatistics() {
        VehicleStatisticsVO statisticsVO = vehicleService.getVehicleStatistics();
        return ResultUtils.success(statisticsVO);
    }

    /**
     * 获取可用（空闲状态）车辆列表
     *
     * @return 可用车辆列表
     */
    @GetMapping("/available")
    public BaseResponse<List<VehicleVO>> listAvailableVehicles() {
        QueryWrapper<Vehicle> queryWrapper = new QueryWrapper<>();
        // 根据Vehicle实体的定义，状态1表示空闲
        queryWrapper.eq("status", 1); // 状态：0-维修中, 1-空闲, 2-任务中
        // 未删除
        queryWrapper.eq("is_delete", 0);
        
        List<Vehicle> vehicleList = vehicleService.list(queryWrapper);
        log.info("Found {} available vehicles", vehicleList.size());
        return ResultUtils.success(vehicleService.getVehicleVO(vehicleList));
    }

    // endregion
} 