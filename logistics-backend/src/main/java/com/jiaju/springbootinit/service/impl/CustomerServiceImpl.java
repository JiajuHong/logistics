package com.jiaju.springbootinit.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.mapper.CustomerMapper;
import com.jiaju.springbootinit.mapper.RegionMapper;
import com.jiaju.springbootinit.model.entity.Customer;
import com.jiaju.springbootinit.model.entity.Region;
import com.jiaju.springbootinit.model.vo.CustomerVO;
import com.jiaju.springbootinit.service.CustomerService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 客户服务实现
 */
@Service
public class CustomerServiceImpl extends ServiceImpl<CustomerMapper, Customer> implements CustomerService {

    @Resource
    private RegionMapper regionMapper;

    @Override
    public void validCustomer(Customer customer, boolean add) {
        if (customer == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        String name = customer.getName();
        String code = customer.getCode();
        String contactName = customer.getContactName();
        String contactPhone = customer.getContactPhone();
        
        // 创建时必须要有客户名称、编码、联系人和联系电话
        if (add) {
            if (StringUtils.isAnyBlank(name, code, contactName, contactPhone)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "客户名称、编码、联系人和联系电话不能为空");
            }
        }
        
        if (StringUtils.isNotBlank(name) && name.length() > 100) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "客户名称过长");
        }
        
        if (StringUtils.isNotBlank(code)) {
            if (code.length() > 20) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "客户编码过长");
            }
            
            // 创建时校验客户编码是否已存在
            if (add) {
                QueryWrapper<Customer> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("code", code);
                long count = this.count(queryWrapper);
                if (count > 0) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "客户编码已存在");
                }
            }
        }
        
        if (StringUtils.isNotBlank(contactName) && contactName.length() > 50) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "联系人姓名过长");
        }
    }
    
    @Override
    public CustomerVO getCustomerVO(Customer customer) {
        if (customer == null) {
            return null;
        }
        
        CustomerVO customerVO = new CustomerVO();
        org.springframework.beans.BeanUtils.copyProperties(customer, customerVO);
        
        // 设置区域名称
        if (customer.getRegionId() != null) {
            Region region = regionMapper.selectById(customer.getRegionId());
            if (region != null) {
                customerVO.setRegionName(region.getName());
            }
        }
        
        return customerVO;
    }
    
    @Override
    public List<CustomerVO> getCustomerVO(List<Customer> customerList) {
        if (customerList == null || customerList.isEmpty()) {
            return new ArrayList<>();
        }
        
        // 获取所有相关的区域ID
        List<Long> regionIds = customerList.stream()
                .map(Customer::getRegionId)
                .filter(id -> id != null)
                .distinct()
                .collect(Collectors.toList());
        
        // 如果有区域ID，批量查询区域信息
        Map<Long, String> regionIdNameMap = new java.util.HashMap<>();
        if (!regionIds.isEmpty()) {
            List<Region> regions = regionMapper.selectBatchIds(regionIds);
            regionIdNameMap = regions.stream()
                    .collect(Collectors.toMap(Region::getId, Region::getName));
        }
        
        // 转换为VO
        Map<Long, String> finalRegionIdNameMap = regionIdNameMap;
        return customerList.stream().map(customer -> {
            CustomerVO customerVO = new CustomerVO();
            org.springframework.beans.BeanUtils.copyProperties(customer, customerVO);
            
            // 设置区域名称
            if (customer.getRegionId() != null) {
                customerVO.setRegionName(finalRegionIdNameMap.get(customer.getRegionId()));
            }
            
            return customerVO;
        }).collect(Collectors.toList());
    }
} 