package com.jiaju.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.mapper.DriverMapper;
import com.jiaju.springbootinit.mapper.StationMapper;
import com.jiaju.springbootinit.mapper.VehicleMapper;
import com.jiaju.springbootinit.model.entity.Station;
import com.jiaju.springbootinit.model.entity.Vehicle;
import com.jiaju.springbootinit.model.vo.VehicleVO;
import com.jiaju.springbootinit.model.vo.VehicleStatisticsVO;
import com.jiaju.springbootinit.service.VehicleService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 车辆服务实现
 */
@Service
@Slf4j
public class VehicleServiceImpl extends ServiceImpl<VehicleMapper, Vehicle> implements VehicleService {

    @Resource
    private StationMapper stationMapper;

    @Resource
    private DriverMapper driverMapper;

    @Resource
    VehicleMapper vehicleMapper;

    @Override
    public void validVehicle(Vehicle vehicle, boolean add) {
        if (vehicle == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }

        String vehicleNo = vehicle.getVehicleNo();
        String vehicleType = vehicle.getVehicleType();
        Long stationId = vehicle.getStationId();
        Integer status = vehicle.getStatus();

        // 创建时必须要有车牌号、车辆类型和所属站点
        if (add) {
            if (StringUtils.isAnyBlank(vehicleNo, vehicleType) || stationId == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "车牌号、车辆类型和所属站点不能为空");
            }
        }
        
        // 更新时如果尝试修改处于任务中的车辆状态
        if (!add && status != null) {
            // 获取数据库中的车辆信息
            Vehicle oldVehicle = this.getById(vehicle.getId());
            if (oldVehicle != null && oldVehicle.getStatus() == 2) {
                // 如果车辆当前状态为任务中(2)，且尝试更改状态
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "车辆处于任务中，不能更改状态");
            }
        }

        if (StringUtils.isNotBlank(vehicleNo)) {
            if (vehicleNo.length() > 20) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "车牌号过长");
            }

            // 创建时校验车牌号是否已存在
            if (add) {
                QueryWrapper<Vehicle> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("vehicle_no", vehicleNo);
                long count = this.count(queryWrapper);
                if (count > 0) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "车牌号已存在");
                }
            }
        }
    }

    @Override
    public VehicleVO getVehicleVO(Vehicle vehicle) {
        if (vehicle == null) {
            return null;
        }

        VehicleVO vehicleVO = new VehicleVO();
        org.springframework.beans.BeanUtils.copyProperties(vehicle, vehicleVO);

        // 设置站点名称
        if (vehicle.getStationId() != null) {
            Station station = stationMapper.selectById(vehicle.getStationId());
            if (station != null) {
                vehicleVO.setStationName(station.getName());
            }
        }

        return vehicleVO;
    }

    @Override
    public List<VehicleVO> getVehicleVO(List<Vehicle> vehicleList) {
        if (vehicleList == null || vehicleList.isEmpty()) {
            return new ArrayList<>();
        }

        // 获取所有相关的站点ID
        List<Long> stationIds = vehicleList.stream()
                .map(Vehicle::getStationId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());

        // 如果有站点ID，批量查询站点信息
        Map<Long, String> stationIdNameMap = new java.util.HashMap<>();
        if (!stationIds.isEmpty()) {
            List<Station> stations = stationMapper.selectBatchIds(stationIds);
            stationIdNameMap = stations.stream()
                    .collect(Collectors.toMap(Station::getId, Station::getName));
        }

        // 转换为VO
        Map<Long, String> finalStationIdNameMap = stationIdNameMap;
        return vehicleList.stream().map(vehicle -> {
            VehicleVO vehicleVO = new VehicleVO();
            org.springframework.beans.BeanUtils.copyProperties(vehicle, vehicleVO);

            // 设置站点名称
            if (vehicle.getStationId() != null) {
                vehicleVO.setStationName(finalStationIdNameMap.get(vehicle.getStationId()));
            }

            return vehicleVO;
        }).collect(Collectors.toList());
    }

    @Override
    public List<String> listUniqueVehicleTypes() {
        return vehicleMapper.selectAllVehicleTypes();
    }

    @Override
    public VehicleStatisticsVO getVehicleStatistics() {
        VehicleStatisticsVO statisticsVO = new VehicleStatisticsVO();
        
        // 获取车辆总数
        long totalCount = this.count();
        statisticsVO.setTotal(totalCount);
        
        // 获取空闲车辆数量
        QueryWrapper<Vehicle> idleQuery = new QueryWrapper<>();
        idleQuery.eq("status", 1); // 空闲状态为1
        long idleCount = this.count(idleQuery);
        statisticsVO.setIdle(idleCount);
        
        // 获取任务中车辆数量
        QueryWrapper<Vehicle> inTaskQuery = new QueryWrapper<>();
        inTaskQuery.eq("status", 2); // 任务中状态为2
        long inTaskCount = this.count(inTaskQuery);
        statisticsVO.setInTask(inTaskCount);
        
        // 获取维修中车辆数量
        QueryWrapper<Vehicle> maintenanceQuery = new QueryWrapper<>();
        maintenanceQuery.eq("status", 0); // 维修中状态为0
        long maintenanceCount = this.count(maintenanceQuery);
        statisticsVO.setMaintenance(maintenanceCount);
        
        return statisticsVO;
    }
} 