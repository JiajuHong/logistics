package com.jiaju.springbootinit.model.vo;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

import lombok.Data;

/**
 * 区域视图
 */
@Data
public class RegionVO implements Serializable {

    /**
     * id
     */
    private Long id;

    /**
     * 区域名称
     */
    private String name;

    /**
     * 区域编码
     */
    private String code;

    /**
     * 父区域ID
     */
    private Long parentId;

    /**
     * 父区域名称
     */
    private String parentName;

    /**
     * 区域级别：1-省, 2-市, 3-区县
     */
    private Integer level;

    /**
     * 状态：0-禁用, 1-启用
     */
    private Integer status;

    private BigDecimal centerLongitude;
    private BigDecimal centerLatitude;
    private String boundaryPoints;

    /**
     * 创建时间
     */
    private Date createTime;
    private Date updateTime;

    private static final long serialVersionUID = 1L;
} 