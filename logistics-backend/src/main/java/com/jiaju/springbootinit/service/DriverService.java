package com.jiaju.springbootinit.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jiaju.springbootinit.model.entity.Driver;
import com.jiaju.springbootinit.model.vo.DriverVO;

import java.util.List;

/**
 * 司机服务
 */
public interface DriverService extends IService<Driver> {

    /**
     * 校验司机是否合法
     * 
     * @param driver 司机信息
     * @param add 是否为创建校验
     */
    void validDriver(Driver driver, boolean add);
    
    /**
     * 获取司机VO
     *
     * @param driver 司机实体
     * @return 司机VO
     */
    DriverVO getDriverVO(Driver driver);
    
    /**
     * 获取司机VO列表
     *
     * @param driverList 司机实体列表
     * @return 司机VO列表
     */
    List<DriverVO> getDriverVO(List<Driver> driverList);
} 