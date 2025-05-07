package com.jiaju.springbootinit.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jiaju.springbootinit.model.entity.Customer;
import com.jiaju.springbootinit.model.vo.CustomerVO;

import java.util.List;

/**
 * 客户服务
 */
public interface CustomerService extends IService<Customer> {

    /**
     * 校验客户是否合法
     * 
     * @param customer 客户信息
     * @param add 是否为创建校验
     */
    void validCustomer(Customer customer, boolean add);
    
    /**
     * 获取客户VO
     *
     * @param customer 客户实体
     * @return 客户VO
     */
    CustomerVO getCustomerVO(Customer customer);
    
    /**
     * 获取客户VO列表
     *
     * @param customerList 客户实体列表
     * @return 客户VO列表
     */
    List<CustomerVO> getCustomerVO(List<Customer> customerList);
} 