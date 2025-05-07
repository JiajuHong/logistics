package com.jiaju.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.mapper.DriverMapper;
import com.jiaju.springbootinit.model.entity.Driver;
import com.jiaju.springbootinit.model.vo.DriverVO;
import com.jiaju.springbootinit.service.DriverService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 司机服务实现
 */
@Service
public class DriverServiceImpl extends ServiceImpl<DriverMapper, Driver> implements DriverService {

    @Override
    public void validDriver(Driver driver, boolean add) {
        if (driver == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        String name = driver.getName();
        String code = driver.getCode();
        String phone = driver.getPhone();
        String licenseNo = driver.getLicenseNo();
        Integer status = driver.getStatus();
        
        // 创建时必须要有姓名、编号、联系电话和驾驶证号
        if (add) {
            if (StringUtils.isAnyBlank(name, code, phone, licenseNo)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "司机姓名、编号、联系电话和驾驶证号不能为空");
            }
        }
        
        // 更新时如果尝试修改处于任务中的司机状态
        if (!add && status != null) {
            // 获取数据库中的司机信息
            Driver oldDriver = this.getById(driver.getId());
            if (oldDriver != null && oldDriver.getStatus() == 2) {
                // 如果司机当前状态为任务中(2)，且尝试更改状态
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "司机处于任务中，不能更改状态");
            }
        }
        
        if (StringUtils.isNotBlank(name) && name.length() > 50) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "司机姓名过长");
        }
        
        if (StringUtils.isNotBlank(code)) {
            if (code.length() > 20) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "司机编号过长");
            }
            
            // 创建时校验司机编号是否已存在
            if (add) {
                QueryWrapper<Driver> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("code", code);
                long count = this.count(queryWrapper);
                if (count > 0) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "司机编号已存在");
                }
            }
        }
        
        if (StringUtils.isNotBlank(licenseNo)) {
            if (licenseNo.length() > 30) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "驾驶证号过长");
            }
            
            // 创建时校验驾驶证号是否已存在
            if (add) {
                QueryWrapper<Driver> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("license_no", licenseNo);
                long count = this.count(queryWrapper);
                if (count > 0) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "驾驶证号已存在");
                }
            }
        }
    }
    
    @Override
    public DriverVO getDriverVO(Driver driver) {
        if (driver == null) {
            return null;
        }
        
        DriverVO driverVO = new DriverVO();
        org.springframework.beans.BeanUtils.copyProperties(driver, driverVO);
        
        return driverVO;
    }
    
    @Override
    public List<DriverVO> getDriverVO(List<Driver> driverList) {
        if (driverList == null || driverList.isEmpty()) {
            return new ArrayList<>();
        }
        
        return driverList.stream().map(driver -> {
            DriverVO driverVO = new DriverVO();
            org.springframework.beans.BeanUtils.copyProperties(driver, driverVO);
            return driverVO;
        }).collect(Collectors.toList());
    }
} 