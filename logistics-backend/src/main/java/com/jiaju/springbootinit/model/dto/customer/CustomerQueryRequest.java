package com.jiaju.springbootinit.model.dto.customer;

import com.jiaju.springbootinit.common.PageRequest;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 客户查询请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class CustomerQueryRequest extends PageRequest implements Serializable {

    /**
     * 客户名称
     */
    private String name;

    /**
     * 客户编码
     */
    private String code;

    /**
     * 联系人
     */
    private String contactName;

    /**
     * 联系电话
     */
    private String contactPhone;

    /**
     * 邮箱
     */
    private String email;

    /**
     * 地址
     */
    private String address;

    /**
     * 所属区域ID
     */
    private Long regionId;

    /**
     * 客户类型：1-个人, 2-企业
     */
    private Integer customerType;

    /**
     * 状态：0-禁用, 1-启用
     */
    private Integer status;

    private static final long serialVersionUID = 1L;
}