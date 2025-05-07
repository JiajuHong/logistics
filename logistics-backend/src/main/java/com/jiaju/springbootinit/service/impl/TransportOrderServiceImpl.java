package com.jiaju.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.mapper.CustomerMapper;
import com.jiaju.springbootinit.mapper.StationMapper;
import com.jiaju.springbootinit.mapper.TransportOrderMapper;
import com.jiaju.springbootinit.model.entity.Customer;
import com.jiaju.springbootinit.model.entity.Station;
import com.jiaju.springbootinit.model.entity.TransportOrder;
import com.jiaju.springbootinit.model.vo.TransportOrderVO;
import com.jiaju.springbootinit.service.TransportOrderService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 运输订单服务实现
 */
@Service
public class TransportOrderServiceImpl extends ServiceImpl<TransportOrderMapper, TransportOrder> implements TransportOrderService {

    @Resource
    private CustomerMapper customerMapper;
    
    @Resource
    private StationMapper stationMapper;

    @Override
    public void validTransportOrder(TransportOrder transportOrder, boolean add) {
        if (transportOrder == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        // 创建时必须要有订单号、客户ID、始发站点、目标站点、重量和体积
        if (add) {
            if (StringUtils.isBlank(transportOrder.getOrderNo()) 
                    || transportOrder.getCustomerId() == null
                    || transportOrder.getSourceStationId() == null
                    || transportOrder.getTargetStationId() == null
                    || transportOrder.getWeight() == null
                    || transportOrder.getVolume() == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单号、客户、站点、重量和体积不能为空");
            }
            
            // 检查订单号是否已存在
            QueryWrapper<TransportOrder> queryWrapper = new QueryWrapper<>();
            queryWrapper.eq("order_no", transportOrder.getOrderNo());
            long count = this.count(queryWrapper);
            if (count > 0) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单号已存在");
            }
            
            // 设置默认状态为待分配
            if (transportOrder.getStatus() == null) {
                transportOrder.setStatus(0);
            }
        }
        
        // 验证关联对象是否存在
        if (transportOrder.getCustomerId() != null) {
            Customer customer = customerMapper.selectById(transportOrder.getCustomerId());
            if (customer == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "客户不存在");
            }
        }
        
        if (transportOrder.getSourceStationId() != null) {
            Station sourceStation = stationMapper.selectById(transportOrder.getSourceStationId());
            if (sourceStation == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "始发站点不存在");
            }
        }
        
        if (transportOrder.getTargetStationId() != null) {
            Station targetStation = stationMapper.selectById(transportOrder.getTargetStationId());
            if (targetStation == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "目标站点不存在");
            }
        }
        
        // 验证状态值是否合法
        if (transportOrder.getStatus() != null) {
            Integer status = transportOrder.getStatus();
            if (status < 0 || status > 5) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "状态值不合法");
            }
        }
    }
    
    @Override
    public TransportOrderVO getTransportOrderVO(TransportOrder transportOrder) {
        if (transportOrder == null) {
            return null;
        }
        
        TransportOrderVO transportOrderVO = new TransportOrderVO();
        org.springframework.beans.BeanUtils.copyProperties(transportOrder, transportOrderVO);
        
        // 设置客户名称
        if (transportOrder.getCustomerId() != null) {
            Customer customer = customerMapper.selectById(transportOrder.getCustomerId());
            if (customer != null) {
                transportOrderVO.setCustomerName(customer.getContactName());
                transportOrderVO.setCustomerCompany(customer.getName());
            }
        }
        
        // 设置站点名称
        if (transportOrder.getSourceStationId() != null) {
            Station sourceStation = stationMapper.selectById(transportOrder.getSourceStationId());
            if (sourceStation != null) {
                transportOrderVO.setSourceStationName(sourceStation.getName());
            }
        }
        
        if (transportOrder.getTargetStationId() != null) {
            Station targetStation = stationMapper.selectById(transportOrder.getTargetStationId());
            if (targetStation != null) {
                transportOrderVO.setTargetStationName(targetStation.getName());
            }
        }
        
        // 设置状态名称
        if (transportOrder.getStatus() != null) {
            String statusName;
            switch (transportOrder.getStatus()) {
                case 0:
                    statusName = "待分配";
                    break;
                case 1:
                    statusName = "已分配";
                    break;
                case 2:
                    statusName = "运输中";
                    break;
                case 3:
                    statusName = "已完成";
                    break;
                case 4:
                    statusName = "已拒绝";
                    break;
                default:
                    statusName = "未知状态";
            }
            transportOrderVO.setStatusName(statusName);
        }
        
        return transportOrderVO;
    }
    
    @Override
    public List<TransportOrderVO> getTransportOrderVO(List<TransportOrder> transportOrderList) {
        if (transportOrderList == null || transportOrderList.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 获取所有相关的客户ID
        List<Long> customerIds = transportOrderList.stream()
                .map(TransportOrder::getCustomerId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        
        // 获取所有相关的站点ID
        List<Long> stationIds = new ArrayList<>();
        transportOrderList.forEach(order -> {
            if (order.getSourceStationId() != null) {
                stationIds.add(order.getSourceStationId());
            }
            if (order.getTargetStationId() != null) {
                stationIds.add(order.getTargetStationId());
            }
        });
        
        // 批量查询客户信息
        Map<Long, String> customerIdNameMap = new HashMap<>();
        Map<Long, String> customerIdCompanyMap = new HashMap<>();
        if (!customerIds.isEmpty()) {
            List<Customer> customers = customerMapper.selectBatchIds(customerIds);
            customerIdNameMap = customers.stream()
                    .collect(Collectors.toMap(Customer::getId, Customer::getContactName));
            customerIdCompanyMap = customers.stream()
                    .collect(Collectors.toMap(Customer::getId, Customer::getName));
        }
        
        // 批量查询站点信息
        Map<Long, String> stationIdNameMap = new HashMap<>();
        if (!stationIds.isEmpty()) {
            List<Station> stations = stationMapper.selectBatchIds(stationIds);
            stationIdNameMap = stations.stream()
                    .collect(Collectors.toMap(Station::getId, Station::getName));
        }
        
        // 转换为VO
        Map<Long, String> finalCustomerIdNameMap = customerIdNameMap;
        Map<Long, String> finalCustomerIdCompanyMap = customerIdCompanyMap;
        Map<Long, String> finalStationIdNameMap = stationIdNameMap;
        return transportOrderList.stream().map(order -> {
            TransportOrderVO orderVO = new TransportOrderVO();
            org.springframework.beans.BeanUtils.copyProperties(order, orderVO);
            
            // 设置客户名称
            if (order.getCustomerId() != null) {
                orderVO.setCustomerName(finalCustomerIdNameMap.get(order.getCustomerId()));
                orderVO.setCustomerCompany(finalCustomerIdCompanyMap.get(order.getCustomerId()));
            }
            
            // 设置站点名称
            if (order.getSourceStationId() != null) {
                orderVO.setSourceStationName(finalStationIdNameMap.get(order.getSourceStationId()));
            }
            
            if (order.getTargetStationId() != null) {
                orderVO.setTargetStationName(finalStationIdNameMap.get(order.getTargetStationId()));
            }
            
            // 设置状态名称
            if (order.getStatus() != null) {
                String statusName;
                switch (order.getStatus()) {
                    case 0:
                        statusName = "待分配";
                        break;
                    case 1:
                        statusName = "已分配";
                        break;
                    case 2:
                        statusName = "运输中";
                        break;
                    case 3:
                        statusName = "已完成";
                        break;
                    case 4:
                        statusName = "已拒绝";
                        break;
                    default:
                        statusName = "未知状态";
                }
                orderVO.setStatusName(statusName);
            }
            
            return orderVO;
        }).collect(Collectors.toList());
    }
    
    @Override
    public boolean cancelOrder(Long id) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        // 获取订单
        TransportOrder order = this.getById(id);
        if (order == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "订单不存在");
        }
        
        // 检查订单状态，只有待分配和已分配的订单可以取消
        if (order.getStatus() != 0 && order.getStatus() != 1) {
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "当前订单状态不可取消");
        }
        
        // 更新状态为已取消
        order.setStatus(4);
        return this.updateById(order);
    }
    
    @Override
    public boolean updateOrderStatus(Long id, Integer status) {
        if (id == null || id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单ID不能为空");
        }
        
        if (status == null || status < 0 || status > 4) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "订单状态值不合法");
        }
        
        // 获取订单
        TransportOrder order = this.getById(id);
        if (order == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "订单不存在");
        }
        
        // 验证状态转换的合法性
        Integer oldStatus = order.getStatus();
        if (oldStatus.equals(status)) {
            return true; // 状态未变，直接返回成功
        }
        
        // 设置订单新状态
        order.setStatus(status);
        
        // 根据状态设置对应的时间字段
        Date now = new Date();
        switch (status) {
            case 1: // 已分配
                order.setAssignTime(now);
                break;
            case 2: // 运输中
                order.setStartTransportTime(now);
                break;
            case 3: // 已完成
                order.setCompleteTime(now);
                break;
            default:
                // 其他状态不设置特定时间
                break;
        }
        
        // 更新订单
        return this.updateById(order);
    }
} 