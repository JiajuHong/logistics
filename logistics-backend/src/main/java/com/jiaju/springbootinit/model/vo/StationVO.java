package com.jiaju.springbootinit.model.vo;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import lombok.Data;

/**
 * 站点视图
 */
@Data
public class StationVO implements Serializable {

    /**
     * id
     */
    private Long id;

    /**
     * 站点名称
     */
    private String name;

    /**
     * 站点编码
     */
    private String code;

    /**
     * 所属区域ID
     */
    private Long regionId;
    
    /**
     * 所属区域名称
     */
    private String regionName;

    /**
     * 详细地址
     */
    private String address;

    /**
     * 联系人
     */
    private String contactName;

    /**
     * 联系电话
     */
    private String contactPhone;

    /**
     * 站点容量（可存储量）
     */
    private BigDecimal capacity;

    /**
     * 状态：0-停用, 1-启用
     */
    private Integer status;

    private BigDecimal longitude;
    private BigDecimal latitude;

    /**
     * 创建时间
     */
    private Date createTime;

    private Date updateTime;

    private static final long serialVersionUID = 1L;
} 