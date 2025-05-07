package com.jiaju.springbootinit.model.vo;

import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 客户视图
 */
@Data
public class CustomerVO implements Serializable {

    /**
     * id
     */
    private Long id;

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
     * 所属区域名称
     */
    private String regionName;

    /**
     * 客户类型：1-个人, 2-企业
     */
    private Integer customerType;

    /**
     * 状态：0-禁用, 1-启用
     */
    private Integer status;

    /**
     * 创建时间
     */
    private Date createTime;

    private static final long serialVersionUID = 1L;
} 