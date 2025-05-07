package com.jiaju.springbootinit.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jiaju.springbootinit.model.entity.Vehicle;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 车辆数据库操作
 */
public interface VehicleMapper extends BaseMapper<Vehicle> {

    /**
     * 查询所有不同的车辆类型
     * 
     * @return 车辆类型列表
     */
    @Select("SELECT DISTINCT vehicle_type FROM vehicle WHERE is_delete = 0 AND vehicle_type IS NOT NULL")
    List<String> selectAllVehicleTypes();
} 