package com.jiaju.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.mapper.*;
import com.jiaju.springbootinit.model.entity.*;
import com.jiaju.springbootinit.model.vo.TransportTaskVO;
import com.jiaju.springbootinit.service.TransportTaskService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.annotation.Resource;
import java.util.*;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * 运输任务服务实现
 */
@Service
public class TransportTaskServiceImpl extends ServiceImpl<TransportTaskMapper, TransportTask> implements TransportTaskService {

    private static final Logger log = LoggerFactory.getLogger(TransportTaskServiceImpl.class);

    @Resource
    private TransportOrderMapper transportOrderMapper;
    
    @Resource
    private VehicleMapper vehicleMapper;
    
    @Resource
    private DriverMapper driverMapper;
    
    @Resource
    private StationMapper stationMapper;

    @Override
    public void validTransportTask(TransportTask transportTask, boolean add) {
        if (transportTask == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        // 创建时必须要有任务号、订单ID、起点站点ID、终点站点ID和计划时间
        if (add) {
            if (StringUtils.isBlank(transportTask.getTaskNo()) 
                    || transportTask.getOrderId() == null
                    || transportTask.getSourceId() == null
                    || transportTask.getTargetId() == null
                    || transportTask.getPlannedStart() == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "任务号、订单、站点和计划时间不能为空");
            }
            
            // 检查任务号是否已存在
            QueryWrapper<TransportTask> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("task_no", transportTask.getTaskNo());
            long count = this.count(queryWrapper);
            if (count > 0) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "任务号已存在");
            }
            
            // 设置默认状态为待分配
            if (transportTask.getStatus() == null) {
                transportTask.setStatus(0);
            }
        }
        
        // 验证关联对象是否存在
        if (transportTask.getOrderId() != null) {
            TransportOrder order = transportOrderMapper.selectById(transportTask.getOrderId());
            if (order == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单不存在");
            }
        }
        
        if (transportTask.getVehicleId() != null) {
            Vehicle vehicle = vehicleMapper.selectById(transportTask.getVehicleId());
            if (vehicle == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "车辆不存在");
            }
        }
        
        if (transportTask.getDriverId() != null) {
            Driver driver = driverMapper.selectById(transportTask.getDriverId());
            if (driver == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "司机不存在");
            }
        }
        
        if (transportTask.getSourceId() != null) {
            Station sourceStation = stationMapper.selectById(transportTask.getSourceId());
            if (sourceStation == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "起点站点不存在");
            }
        }
        
        if (transportTask.getTargetId() != null) {
            Station targetStation = stationMapper.selectById(transportTask.getTargetId());
            if (targetStation == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "终点站点不存在");
            }
        }
        
        // 验证状态值是否合法
        if (transportTask.getStatus() != null) {
            Integer status = transportTask.getStatus();
            if (status < 0 || status > 4) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "状态值不合法");
            }
        }
    }
    
    @Override
    public TransportTaskVO getTransportTaskVO(TransportTask transportTask) {
        if (transportTask == null) {
            return null;
        }
        
        TransportTaskVO transportTaskVO = new TransportTaskVO();
        org.springframework.beans.BeanUtils.copyProperties(transportTask, transportTaskVO);
        
        // 设置订单信息
        if (transportTask.getOrderId() != null) {
            TransportOrder order = transportOrderMapper.selectById(transportTask.getOrderId());
            if (order != null) {
                transportTaskVO.setOrderNo(order.getOrderNo());
            }
        }
        
        // 设置车辆信息
        if (transportTask.getVehicleId() != null) {
            Vehicle vehicle = vehicleMapper.selectById(transportTask.getVehicleId());
            if (vehicle != null) {
                transportTaskVO.setVehicleNo(vehicle.getVehicleNo());
            }
        }
        
        // 设置司机信息
        if (transportTask.getDriverId() != null) {
            Driver driver = driverMapper.selectById(transportTask.getDriverId());
            if (driver != null) {
                transportTaskVO.setDriverName(driver.getName());
            }
        }
        
        // 设置站点信息
        if (transportTask.getSourceId() != null) {
            Station sourceStation = stationMapper.selectById(transportTask.getSourceId());
            if (sourceStation != null) {
                transportTaskVO.setSourceName(sourceStation.getName());
            }
        }
        
        if (transportTask.getTargetId() != null) {
            Station targetStation = stationMapper.selectById(transportTask.getTargetId());
            if (targetStation != null) {
                transportTaskVO.setTargetName(targetStation.getName());
            }
        }
        
        // 设置状态名称
        if (transportTask.getStatus() != null) {
            String statusName;
            switch (transportTask.getStatus()) {
                case 0:
                    statusName = "待分配";
                    break;
                case 1:
                    statusName = "待执行";
                    break;
                case 2:
                    statusName = "执行中";
                    break;
                case 3:
                    statusName = "已完成";
                    break;
                case 4:
                    statusName = "已取消";
                    break;
                default:
                    statusName = "未知状态";
            }
            transportTaskVO.setStatusName(statusName);
        }
        
        return transportTaskVO;
    }
    
    @Override
    public List<TransportTaskVO> getTransportTaskVO(List<TransportTask> transportTaskList) {
        if (transportTaskList == null || transportTaskList.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 获取所有相关的ID
        List<Long> orderIds = transportTaskList.stream()
                .map(TransportTask::getOrderId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
                
        List<Long> vehicleIds = transportTaskList.stream()
                .map(TransportTask::getVehicleId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
                
        List<Long> driverIds = transportTaskList.stream()
                .map(TransportTask::getDriverId)
                .filter(Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        
        // 获取所有相关的站点ID
        List<Long> stationIds = new ArrayList<>();
        transportTaskList.forEach(task -> {
            if (task.getSourceId() != null) {
                stationIds.add(task.getSourceId());
            }
            if (task.getTargetId() != null) {
                stationIds.add(task.getTargetId());
            }
        });
        
        // 批量查询订单信息
        Map<Long, String> orderIdNoMap = new HashMap<>();
        if (!orderIds.isEmpty()) {
            List<TransportOrder> orders = transportOrderMapper.selectBatchIds(orderIds);
            orderIdNoMap = orders.stream()
                    .collect(Collectors.toMap(TransportOrder::getId, TransportOrder::getOrderNo));
        }
        
        // 批量查询车辆信息
        Map<Long, String> vehicleIdNoMap = new HashMap<>();
        if (!vehicleIds.isEmpty()) {
            List<Vehicle> vehicles = vehicleMapper.selectBatchIds(vehicleIds);
            vehicleIdNoMap = vehicles.stream()
                    .collect(Collectors.toMap(Vehicle::getId, Vehicle::getVehicleNo));
        }
        
        // 批量查询司机信息
        Map<Long, String> driverIdNameMap = new HashMap<>();
        if (!driverIds.isEmpty()) {
            List<Driver> drivers = driverMapper.selectBatchIds(driverIds);
            driverIdNameMap = drivers.stream()
                    .collect(Collectors.toMap(Driver::getId, Driver::getName));
        }
        
        // 批量查询站点信息
        Map<Long, String> stationIdNameMap = new HashMap<>();
        if (!stationIds.isEmpty()) {
            List<Station> stations = stationMapper.selectBatchIds(stationIds);
            stationIdNameMap = stations.stream()
                    .collect(Collectors.toMap(Station::getId, Station::getName));
        }
        
        // 转换为VO
        Map<Long, String> finalOrderIdNoMap = orderIdNoMap;
        Map<Long, String> finalVehicleIdNoMap = vehicleIdNoMap;
        Map<Long, String> finalDriverIdNameMap = driverIdNameMap;
        Map<Long, String> finalStationIdNameMap = stationIdNameMap;
        
        return transportTaskList.stream().map(task -> {
            TransportTaskVO taskVO = new TransportTaskVO();
            org.springframework.beans.BeanUtils.copyProperties(task, taskVO);
            
            // 设置订单号
            if (task.getOrderId() != null) {
                taskVO.setOrderNo(finalOrderIdNoMap.get(task.getOrderId()));
            }
            
            // 设置车辆信息
            if (task.getVehicleId() != null) {
                taskVO.setVehicleNo(finalVehicleIdNoMap.get(task.getVehicleId()));
            }
            
            // 设置司机信息
            if (task.getDriverId() != null) {
                taskVO.setDriverName(finalDriverIdNameMap.get(task.getDriverId()));
            }
            
            // 设置站点名称
            if (task.getSourceId() != null) {
                taskVO.setSourceName(finalStationIdNameMap.get(task.getSourceId()));
            }
            
            if (task.getTargetId() != null) {
                taskVO.setTargetName(finalStationIdNameMap.get(task.getTargetId()));
            }
            
            // 设置状态名称
            if (task.getStatus() != null) {
                String statusName;
                switch (task.getStatus()) {
                    case 0:
                        statusName = "待分配";
                        break;
                    case 1:
                        statusName = "待执行";
                        break;
                    case 2:
                        statusName = "执行中";
                        break;
                    case 3:
                        statusName = "已完成";
                        break;
                    case 4:
                        statusName = "已取消";
                        break;
                    default:
                        statusName = "未知状态";
                }
                taskVO.setStatusName(statusName);
            }
            
            return taskVO;
        }).collect(Collectors.toList());
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean assignTask(Long id, Long vehicleId, Long driverId) {
        if (id == null || id <= 0 || vehicleId == null || driverId == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "参数不能为空");
        }
        
        // 获取任务
        TransportTask task = this.getById(id);
        if (task == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "任务不存在");
        }
        
        // 检查任务状态，只有待分配的任务可以分配
        if (task.getStatus() != 0) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "当前任务状态不可分配");
        }
        
        // 检查车辆是否存在
        Vehicle vehicle = vehicleMapper.selectById(vehicleId);
        if (vehicle == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "车辆不存在");
        }
        
        // 检查车辆状态
        if (vehicle.getStatus() != 1) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "车辆不处于空闲状态");
        }
        
        // 检查司机是否存在
        Driver driver = driverMapper.selectById(driverId);
        if (driver == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "司机不存在");
        }
        
        // 检查司机状态
        if (driver.getStatus() != 1) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "司机不处于空闲状态");
        }
        
        // 更新任务信息
        task.setVehicleId(vehicleId);
        task.setDriverId(driverId);
        task.setStatus(1); // 更新为待执行状态
        task.setAssignTime(new Date()); // 记录分配时间
        boolean taskResult = this.updateById(task);
        
        if (!taskResult) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "任务分配失败");
        }
        
        // 更新车辆状态
        vehicle.setStatus(2); // 更新为任务中状态
        boolean vehicleResult = vehicleMapper.updateById(vehicle) > 0;
        if (!vehicleResult) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新车辆状态失败");
        }
        
        // 更新司机状态
        driver.setStatus(2); // 更新为任务中状态
        boolean driverResult = driverMapper.updateById(driver) > 0;
        if (!driverResult) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新司机状态失败");
        }
        
        // 更新关联订单状态
        if (task.getOrderId() != null) {
            TransportOrder order = transportOrderMapper.selectById(task.getOrderId());
            if (order != null && order.getStatus() == 0) {
                order.setStatus(1); // 更新为已分配状态
                order.setAssignTime(new Date());
                boolean orderResult = transportOrderMapper.updateById(order) > 0;
                if (!orderResult) {
                    throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新订单状态失败");
                }
            }
        }
        
        return true;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean cancelTask(Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "任务ID不能为空");
        }
        
        // 获取任务
        TransportTask task = this.getById(id);
        if (task == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "任务不存在");
        }
        
        // 检查任务状态，已完成的任务不能取消
        if (task.getStatus() == 3) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "已完成的任务不能取消");
        }
        
        // 如果任务已分配资源（车辆和司机）且状态为待执行或执行中，需要释放资源
        if (task.getStatus() == 1 || task.getStatus() == 2) {
            // 释放车辆资源
            if (task.getVehicleId() != null) {
                Vehicle vehicle = vehicleMapper.selectById(task.getVehicleId());
                if (vehicle != null && vehicle.getStatus() == 2) {
                    vehicle.setStatus(1); // 更新为空闲状态
                    boolean vehicleResult = vehicleMapper.updateById(vehicle) > 0;
                    if (!vehicleResult) {
                        throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新车辆状态失败");
                    }
                }
            }
            
            // 释放司机资源
            if (task.getDriverId() != null) {
                Driver driver = driverMapper.selectById(task.getDriverId());
                if (driver != null && driver.getStatus() == 2) {
                    driver.setStatus(1); // 更新为空闲状态
                    boolean driverResult = driverMapper.updateById(driver) > 0;
                    if (!driverResult) {
                        throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新司机状态失败");
                    }
                }
            }
        }
        
        // 更新订单状态
        if (task.getOrderId() != null) {
            TransportOrder order = transportOrderMapper.selectById(task.getOrderId());
            if (order != null && order.getStatus() < 3) {
                order.setStatus(4); // 更新为已取消状态
                order.setCancelTime(new Date());
                boolean orderResult = transportOrderMapper.updateById(order) > 0;
                if (!orderResult) {
                    throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新订单状态失败");
                }
            }
        }
        
        // 更新状态为已取消
        task.setStatus(4);
        boolean result = this.updateById(task);
        if (!result) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "取消任务失败");
        }
        
        return true;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean updateTaskStatus(Long id, Integer status) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "任务ID不能为空");
        }
        
        if (status == null || status < 0 || status > 4) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "任务状态值不合法");
        }
        
        // 获取任务
        TransportTask task = this.getById(id);
        if (task == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "任务不存在");
        }
        
        // 验证状态转换的合法性
        Integer oldStatus = task.getStatus();
        if (oldStatus.equals(status)) {
            return true; // 状态未变，直接返回成功
        }
        
        // 设置任务新状态
        task.setStatus(status);
        
        // 根据状态设置对应的时间字段和更新相关资源
        Date now = new Date();
        switch (status) {
            case 1: // 待执行
                // 已经在assignTask中处理
                break;
            case 2: // 执行中
                task.setActualStart(now);
                
                // 更新订单状态为运输中
                if (task.getOrderId() != null) {
                    TransportOrder order = transportOrderMapper.selectById(task.getOrderId());
                    if (order != null && (order.getStatus() == 0 || order.getStatus() == 1)) {
                        order.setStatus(2); // 更新为运输中状态
                        order.setStartTransportTime(now);
                        boolean orderResult = transportOrderMapper.updateById(order) > 0;
                        if (!orderResult) {
                            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新订单状态失败");
                        }
                    }
                }
                break;
            case 3: // 已完成
                task.setActualEnd(now);
                
                // 释放资源 - 将车辆状态重置为空闲
                if (task.getVehicleId() != null) {
                    Vehicle vehicle = vehicleMapper.selectById(task.getVehicleId());
                    if (vehicle != null && vehicle.getStatus() == 2) {
                        vehicle.setStatus(1); // 更新为空闲状态
                        boolean vehicleResult = vehicleMapper.updateById(vehicle) > 0;
                        if (!vehicleResult) {
                            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新车辆状态失败");
                        }
                    }
                }
                
                // 释放资源 - 将司机状态重置为空闲
                if (task.getDriverId() != null) {
                    Driver driver = driverMapper.selectById(task.getDriverId());
                    if (driver != null && driver.getStatus() == 2) {
                        driver.setStatus(1); // 更新为空闲状态
                        boolean driverResult = driverMapper.updateById(driver) > 0;
                        if (!driverResult) {
                            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新司机状态失败");
                        }
                    }
                }
                
                // 更新订单状态为已完成
                if (task.getOrderId() != null) {
                    TransportOrder order = transportOrderMapper.selectById(task.getOrderId());
                    if (order != null && order.getStatus() == 2) {
                        order.setStatus(3); // 更新为已完成状态
                        order.setCompleteTime(now);
                        order.setActualDelivery(now);
                        boolean orderResult = transportOrderMapper.updateById(order) > 0;
                        if (!orderResult) {
                            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新订单状态失败");
                        }
                    }
                }
                break;
            case 4: // 已取消
                // 释放资源 - 将车辆状态重置为空闲
                if (task.getVehicleId() != null) {
                    Vehicle vehicle = vehicleMapper.selectById(task.getVehicleId());
                    if (vehicle != null && vehicle.getStatus() == 2) {
                        vehicle.setStatus(1); // 更新为空闲状态
                        boolean vehicleResult = vehicleMapper.updateById(vehicle) > 0;
                        if (!vehicleResult) {
                            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新车辆状态失败");
                        }
                    }
                }
                
                // 释放资源 - 将司机状态重置为空闲
                if (task.getDriverId() != null) {
                    Driver driver = driverMapper.selectById(task.getDriverId());
                    if (driver != null && driver.getStatus() == 2) {
                        driver.setStatus(1); // 更新为空闲状态
                        boolean driverResult = driverMapper.updateById(driver) > 0;
                        if (!driverResult) {
                            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新司机状态失败");
                        }
                    }
                }
                
                break;
            default:
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "不支持的任务状态值");
        }
        
        // 更新任务状态
        boolean result = this.updateById(task);
        if (!result) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新任务状态失败");
        }
        
        return true;
    }
    
    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long createTaskFromOrder(Long orderId) {
        if (orderId == null || orderId <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单ID不能为空");
        }
        
        // 获取订单信息
        TransportOrder order = transportOrderMapper.selectById(orderId);
        if (order == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "订单不存在");
        }
        
        // 检查订单状态，只有待分配的订单可以创建任务，已拒绝的订单不能创建任务
        if (order.getStatus() != 0) {
            if (order.getStatus() == 4 || order.getStatus() == 5) { // 已拒绝或已取消的订单
                throw new BusinessException(ErrorCode.OPERATION_ERROR, "已拒绝或已取消的订单不能创建任务");
            }
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "只有待分配的订单可以创建任务");
        }
        
        // 检查是否已经有关联任务
        QueryWrapper<TransportTask> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("order_id", orderId);
        queryWrapper.eq("is_delete", 0);
        long count = this.count(queryWrapper);
        if (count > 0) {
            log.warn("订单[{}]已经创建过任务, 存在{}个未删除的关联任务", orderId, count);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "该订单已经创建过任务");
        }
        
        // 创建新任务
        TransportTask task = new TransportTask();
        task.setTaskNo("TASK" + System.currentTimeMillis());
        task.setOrderId(orderId);
        task.setSourceId(order.getSourceStationId());
        task.setTargetId(order.getTargetStationId());
        task.setStatus(0); // 待分配
        
        // 设置计划时间
        if (order.getExpectedPickup() != null) {
            task.setPlannedStart(order.getExpectedPickup());
        } else {
            // 默认计划时间为当前时间加1小时
            Calendar calendar = Calendar.getInstance();
            calendar.add(Calendar.HOUR, 1);
            task.setPlannedStart(calendar.getTime());
        }
        
        if (order.getExpectedDelivery() != null) {
            task.setPlannedEnd(order.getExpectedDelivery());
        } else if (task.getPlannedStart() != null) {
            // 默认计划结束时间为开始时间加24小时
            Calendar calendar = Calendar.getInstance();
            calendar.setTime(task.getPlannedStart());
            calendar.add(Calendar.HOUR, 24);
            task.setPlannedEnd(calendar.getTime());
        }
        
        // 保存任务
        boolean saved = this.save(task);
        if (!saved) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "创建任务失败");
        }
        
        // 更新订单状态为已分配(1)，这样该订单就不会再出现在待创建任务的订单列表中
        order.setStatus(1); // 已分配状态
        order.setUpdateTime(new Date());
        // 明确设置hasTask属性为true，确保该订单不会出现在未创建任务的订单列表中
        order.setHasTask(1);
        transportOrderMapper.updateById(order);
        
        return task.getId();
    }

    /**
     * 任务删除前的处理逻辑
     * 重写removeById方法，在删除任务前进行处理
     * 
     * @param id 任务ID
     * @return 是否删除成功
     */
    @Override
    public boolean removeById(Long id) {
        // 获取任务信息
        TransportTask task = this.getById(id);
        if (task == null) {
            return false;
        }
        
        log.info("开始处理任务删除, 任务ID: {}, 任务状态: {}, 关联订单ID: {}", id, task.getStatus(), task.getOrderId());
        
        // 只有待分配状态的任务删除时，需要恢复订单状态
        if (task.getStatus() == 0 && task.getOrderId() != null) {
            Long orderId = task.getOrderId();
            TransportOrder order = transportOrderMapper.selectById(orderId);
            
            if (order != null) {
                log.info("恢复订单状态, 订单ID: {}, 当前订单状态: {}, hasTask: {}", 
                        orderId, order.getStatus(), order.getHasTask());
                
                // 将订单状态恢复为待分配，并标记为未创建任务
                order.setStatus(0); // 待分配状态
                order.setHasTask(0);
                order.setUpdateTime(new Date());
                
                boolean result = transportOrderMapper.updateById(order) > 0;
                if (!result) {
                    log.error("更新订单状态失败, 订单ID: {}", orderId);
                    throw new BusinessException(ErrorCode.OPERATION_ERROR, "更新订单状态失败");
                }
                
                log.info("成功恢复订单状态为待分配, 订单ID: {}", orderId);
            } else {
                log.warn("未找到关联订单, 订单ID: {}", orderId);
            }
        } else {
            log.info("任务不是待分配状态或没有关联订单, 跳过订单状态恢复");
        }
        
        // 调用父类的逻辑删除方法 (MyBatis Plus的逻辑删除)
        boolean removeResult = super.removeById(id);
        log.info("任务逻辑删除结果: {}, 任务ID: {}", removeResult, id);
        return removeResult;
    }
} 