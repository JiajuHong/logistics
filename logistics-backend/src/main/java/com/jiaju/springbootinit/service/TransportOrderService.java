package com.jiaju.springbootinit.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jiaju.springbootinit.model.entity.TransportOrder;
import com.jiaju.springbootinit.model.vo.TransportOrderVO;

import java.util.List;

/**
 * 运输订单服务
 */
public interface TransportOrderService extends IService<TransportOrder> {

    /**
     * 校验运输订单是否合法
     * 
     * @param transportOrder 运输订单信息
     * @param add 是否为创建校验
     */
    void validTransportOrder(TransportOrder transportOrder, boolean add);
    
    /**
     * 获取运输订单VO
     *
     * @param transportOrder 运输订单实体
     * @return 运输订单VO
     */
    TransportOrderVO getTransportOrderVO(TransportOrder transportOrder);
    
    /**
     * 获取运输订单VO列表
     *
     * @param transportOrderList 运输订单实体列表
     * @return 运输订单VO列表
     */
    List<TransportOrderVO> getTransportOrderVO(List<TransportOrder> transportOrderList);
    
    /**
     * 取消订单
     * 
     * @param id 订单ID
     * @return 是否取消成功
     */
    boolean cancelOrder(Long id);
    
    /**
     * 更新订单状态，并根据状态自动设置相应的时间字段
     * 
     * @param id 订单ID
     * @param status 新状态：0-待分配, 1-已分配, 2-运输中, 3-已完成, 4-已取消
     * @return 是否更新成功
     */
    boolean updateOrderStatus(Long id, Integer status);
} 