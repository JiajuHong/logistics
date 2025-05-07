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
import com.jiaju.springbootinit.model.dto.driver.DriverAddRequest;
import com.jiaju.springbootinit.model.dto.driver.DriverQueryRequest;
import com.jiaju.springbootinit.model.dto.driver.DriverUpdateRequest;
import com.jiaju.springbootinit.model.entity.Driver;
import com.jiaju.springbootinit.model.vo.DriverStatisticsVO;
import com.jiaju.springbootinit.model.vo.DriverVO;
import com.jiaju.springbootinit.service.DriverService;
import com.jiaju.springbootinit.service.UserService;
import com.jiaju.springbootinit.service.VehicleService;
import com.jiaju.springbootinit.utils.SqlUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 司机接口
 */
@RestController
@RequestMapping("/driver")
@Slf4j
public class DriverController {

    @Resource
    private DriverService driverService;

    @Resource
    private UserService userService;
    
    @Resource
    private VehicleService vehicleService;

    // region 增删改查

    /**
     * 创建司机
     *
     * @param driverAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Long> addDriver(@RequestBody DriverAddRequest driverAddRequest, HttpServletRequest request) {
        if (driverAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Driver driver = new Driver();
        BeanUtils.copyProperties(driverAddRequest, driver);
        // 校验
        driverService.validDriver(driver, true);
        boolean result = driverService.save(driver);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(driver.getId());
    }

    /**
     * 删除司机
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteDriver(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long id = deleteRequest.getId();
        // 判断是否存在
        Driver oldDriver = driverService.getById(id);
        ThrowUtils.throwIf(oldDriver == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = driverService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 更新司机
     *
     * @param driverUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateDriver(@RequestBody DriverUpdateRequest driverUpdateRequest,
                                            HttpServletRequest request) {
        if (driverUpdateRequest == null || driverUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Driver driver = new Driver();
        BeanUtils.copyProperties(driverUpdateRequest, driver);
        // 参数校验
        driverService.validDriver(driver, false);
        long id = driverUpdateRequest.getId();
        // 判断是否存在
        Driver oldDriver = driverService.getById(id);
        ThrowUtils.throwIf(oldDriver == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = driverService.updateById(driver);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取司机
     *
     * @param id
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<DriverVO> getDriverById(long id) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Driver driver = driverService.getById(id);
        if (driver == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(driverService.getDriverVO(driver));
    }

    /**
     * 获取司机列表（仅管理员可使用）
     *
     * @param driverQueryRequest
     * @return
     */
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @GetMapping("/list")
    public BaseResponse<List<DriverVO>> listDriver(DriverQueryRequest driverQueryRequest) {
        Driver driverQuery = new Driver();
        if (driverQueryRequest != null) {
            BeanUtils.copyProperties(driverQueryRequest, driverQuery);
        }
        QueryWrapper<Driver> queryWrapper = new QueryWrapper<>(driverQuery);
        List<Driver> driverList = driverService.list(queryWrapper);
        return ResultUtils.success(driverService.getDriverVO(driverList));
    }

    /**
     * 分页获取司机列表
     *
     * @param driverQueryRequest
     * @return
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<DriverVO>> listDriverByPage(DriverQueryRequest driverQueryRequest) {
        if (driverQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Driver driverQuery = new Driver();
        BeanUtils.copyProperties(driverQueryRequest, driverQuery);
        long current = driverQueryRequest.getCurrent();
        long size = driverQueryRequest.getPageSize();
        String sortField = driverQueryRequest.getSortField();
        String sortOrder = driverQueryRequest.getSortOrder();
        // 限制爬虫
        ThrowUtils.throwIf(size > 50, ErrorCode.PARAMS_ERROR);
        QueryWrapper<Driver> queryWrapper = new QueryWrapper<>();
        queryWrapper.like(StringUtils.isNotBlank(driverQuery.getName()), "name", driverQuery.getName());
        queryWrapper.like(StringUtils.isNotBlank(driverQuery.getCode()), "code", driverQuery.getCode());
        queryWrapper.like(StringUtils.isNotBlank(driverQuery.getPhone()), "phone", driverQuery.getPhone());
        queryWrapper.like(StringUtils.isNotBlank(driverQuery.getLicenseNo()), "license_no", driverQuery.getLicenseNo());
        queryWrapper.like(StringUtils.isNotBlank(driverQuery.getLicenseType()), "license_type", driverQuery.getLicenseType());
        queryWrapper.eq(driverQuery.getExperience() != null, "experience", driverQuery.getExperience());
        queryWrapper.eq(driverQuery.getStatus() != null, "status", driverQuery.getStatus());
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), sortOrder.equals(CommonConstant.SORT_ORDER_ASC),
                sortField);
        Page<Driver> driverPage = driverService.page(new Page<>(current, size), queryWrapper);
        
        // 转换为VO列表
        Page<DriverVO> driverVOPage = new Page<>(driverPage.getCurrent(), driverPage.getSize(), driverPage.getTotal());
        List<DriverVO> driverVOList = driverService.getDriverVO(driverPage.getRecords());
        driverVOPage.setRecords(driverVOList);
        
        return ResultUtils.success(driverVOPage);
    }

    /**
     * 获取可用司机列表(空闲状态)
     *
     * @return 可用司机列表
     */
    @GetMapping("/list/available")
    public BaseResponse<List<DriverVO>> listAvailableDrivers() {
        // 查询状态为空闲的司机
        QueryWrapper<Driver> driverQueryWrapper = new QueryWrapper<>();
        
        // 只返回状态为空闲的司机(状态为1-空闲)
        driverQueryWrapper.eq("status", 1);
        
        List<Driver> driverList = driverService.list(driverQueryWrapper);
        return ResultUtils.success(driverService.getDriverVO(driverList));
    }

    /**
     * 获取司机统计数据
     *
     * @return 统计数据
     */
    @GetMapping("/statistics")
    public BaseResponse<DriverStatisticsVO> getDriverStatistics() {
        // 统计各状态司机数量
        long total = driverService.count();
        
        // 获取空闲状态的司机数量
        QueryWrapper<Driver> idleQuery = new QueryWrapper<>();
        idleQuery.eq("status", 1);
        long idle = driverService.count(idleQuery);
        
        // 获取任务中状态的司机数量
        QueryWrapper<Driver> inTaskQuery = new QueryWrapper<>();
        inTaskQuery.eq("status", 2);
        long inTask = driverService.count(inTaskQuery);
        
        // 获取停用状态的司机数量
        QueryWrapper<Driver> disabledQuery = new QueryWrapper<>();
        disabledQuery.eq("status", 0);
        long disabled = driverService.count(disabledQuery);
        
        // 封装结果
        DriverStatisticsVO statisticsVO = new DriverStatisticsVO();
        statisticsVO.setTotal(total);
        statisticsVO.setIdle(idle);
        statisticsVO.setInTask(inTask);
        statisticsVO.setDisabled(disabled);
        
        return ResultUtils.success(statisticsVO);
    }

    // endregion
} 