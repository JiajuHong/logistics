package com.jiaju.springbootinit.model.dto.region;

import java.io.Serializable;
import java.math.BigDecimal;

import lombok.Data;

/**
 * 更新区域请求
 */
@Data
public class RegionUpdateRequest implements Serializable {
    
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

    private static final long serialVersionUID = 1L;
} 