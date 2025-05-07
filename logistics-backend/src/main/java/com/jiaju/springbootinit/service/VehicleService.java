package com.jiaju.springbootinit.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jiaju.springbootinit.model.entity.Vehicle;
import com.jiaju.springbootinit.model.vo.VehicleStatisticsVO;
import com.jiaju.springbootinit.model.vo.VehicleVO;

import java.util.List;

/**
 * 车辆服务
 */
public interface VehicleService extends IService<Vehicle> {

    /**
     * 校验车辆是否合法
     * 
     * @param vehicle 车辆信息
     * @param add 是否为创建校验
     */
    void validVehicle(Vehicle vehicle, boolean add);
    
    /**
     * 获取车辆VO
     *
     * @param vehicle 车辆实体
     * @return 车辆VO
     */
    VehicleVO getVehicleVO(Vehicle vehicle);
    
    /**
     * 获取车辆VO列表
     *
     * @param vehicleList 车辆实体列表
     * @return 车辆VO列表
     */
    List<VehicleVO> getVehicleVO(List<Vehicle> vehicleList);

    /**
     * 获取所有唯一的车辆类型列表
     * @return 车辆类型列表
     */
    List<String> listUniqueVehicleTypes();
    
    /**
     * 获取车辆统计数据
     * 
     * @return 车辆统计数据
     */
    VehicleStatisticsVO getVehicleStatistics();
} 