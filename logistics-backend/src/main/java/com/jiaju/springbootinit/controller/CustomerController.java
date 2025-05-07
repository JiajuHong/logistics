package com.jiaju.springbootinit.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jiaju.springbootinit.annotation.AuthCheck;
import com.jiaju.springbootinit.common.BaseResponse;
import com.jiaju.springbootinit.common.DeleteRequest;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.common.ResultUtils;
import com.jiaju.springbootinit.constant.CommonConstant;
import com.jiaju.springbootinit.constant.UserConstant;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.exception.ThrowUtils;
import com.jiaju.springbootinit.model.dto.customer.CustomerAddRequest;
import com.jiaju.springbootinit.model.dto.customer.CustomerQueryRequest;
import com.jiaju.springbootinit.model.dto.customer.CustomerUpdateRequest;
import com.jiaju.springbootinit.model.entity.Customer;
import com.jiaju.springbootinit.model.vo.CustomerVO;
import com.jiaju.springbootinit.service.CustomerService;
import com.jiaju.springbootinit.service.UserService;
import com.jiaju.springbootinit.utils.SqlUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 客户接口
 */
@RestController
@RequestMapping("/customer")
@Slf4j
public class CustomerController {

    @Resource
    private CustomerService customerService;

    @Resource
    private UserService userService;

    // region 增删改查

    /**
     * 创建客户
     *
     * @param customerAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Long> addCustomer(@RequestBody CustomerAddRequest customerAddRequest, HttpServletRequest request) {
        if (customerAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Customer customer = new Customer();
        BeanUtils.copyProperties(customerAddRequest, customer);
        // 校验
        customerService.validCustomer(customer, true);
        boolean result = customerService.save(customer);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(customer.getId());
    }

    /**
     * 删除客户
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteCustomer(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long id = deleteRequest.getId();
        // 判断是否存在
        Customer oldCustomer = customerService.getById(id);
        ThrowUtils.throwIf(oldCustomer == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = customerService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 更新客户
     *
     * @param customerUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateCustomer(@RequestBody CustomerUpdateRequest customerUpdateRequest,
                                            HttpServletRequest request) {
        if (customerUpdateRequest == null || customerUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Customer customer = new Customer();
        BeanUtils.copyProperties(customerUpdateRequest, customer);
        // 参数校验
        customerService.validCustomer(customer, false);
        long id = customerUpdateRequest.getId();
        // 判断是否存在
        Customer oldCustomer = customerService.getById(id);
        ThrowUtils.throwIf(oldCustomer == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = customerService.updateById(customer);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取客户
     *
     * @param id
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<CustomerVO> getCustomerById(long id) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Customer customer = customerService.getById(id);
        if (customer == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(customerService.getCustomerVO(customer));
    }

    /**
     * 获取客户列表（仅管理员可使用）
     *
     * @param customerQueryRequest
     * @return
     */
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @GetMapping("/list")
    public BaseResponse<List<CustomerVO>> listCustomer(CustomerQueryRequest customerQueryRequest) {
        Customer customerQuery = new Customer();
        if (customerQueryRequest != null) {
            BeanUtils.copyProperties(customerQueryRequest, customerQuery);
        }
        QueryWrapper<Customer> queryWrapper = new QueryWrapper<>(customerQuery);
        List<Customer> customerList = customerService.list(queryWrapper);
        return ResultUtils.success(customerService.getCustomerVO(customerList));
    }

    /**
     * 分页获取客户列表
     *
     * @param customerQueryRequest
     * @return
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<CustomerVO>> listCustomerByPage(CustomerQueryRequest customerQueryRequest) {
        if (customerQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Customer customerQuery = new Customer();
        BeanUtils.copyProperties(customerQueryRequest, customerQuery);
        long current = customerQueryRequest.getCurrent();
        long size = customerQueryRequest.getPageSize();
        String sortField = customerQueryRequest.getSortField();
        String sortOrder = customerQueryRequest.getSortOrder();
        // 限制爬虫
        ThrowUtils.throwIf(size > 50, ErrorCode.PARAMS_ERROR);
        QueryWrapper<Customer> queryWrapper = new QueryWrapper<>();
        queryWrapper.like(StringUtils.isNotBlank(customerQuery.getName()), "name", customerQuery.getName());
        queryWrapper.like(StringUtils.isNotBlank(customerQuery.getCode()), "code", customerQuery.getCode());
        queryWrapper.like(StringUtils.isNotBlank(customerQuery.getContactName()), "contact_name", customerQuery.getContactName());
        queryWrapper.like(StringUtils.isNotBlank(customerQuery.getContactPhone()), "contact_phone", customerQuery.getContactPhone());
        queryWrapper.like(StringUtils.isNotBlank(customerQuery.getEmail()), "email", customerQuery.getEmail());
        queryWrapper.like(StringUtils.isNotBlank(customerQuery.getAddress()), "address", customerQuery.getAddress());
        queryWrapper.eq(customerQuery.getRegionId() != null, "region_id", customerQuery.getRegionId());
        queryWrapper.eq(customerQuery.getCustomerType() != null, "customer_type", customerQuery.getCustomerType());
        queryWrapper.eq(customerQuery.getStatus() != null, "status", customerQuery.getStatus());
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), sortOrder.equals(CommonConstant.SORT_ORDER_ASC),
                sortField);
        Page<Customer> customerPage = customerService.page(new Page<>(current, size), queryWrapper);
        
        // 转换为VO列表
        Page<CustomerVO> customerVOPage = new Page<>(customerPage.getCurrent(), customerPage.getSize(), customerPage.getTotal());
        List<CustomerVO> customerVOList = customerService.getCustomerVO(customerPage.getRecords());
        customerVOPage.setRecords(customerVOList);
        
        return ResultUtils.success(customerVOPage);
    }

    // endregion
} 