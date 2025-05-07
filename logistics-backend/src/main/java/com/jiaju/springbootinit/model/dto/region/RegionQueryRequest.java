package com.jiaju.springbootinit.model.dto.region;

import com.jiaju.springbootinit.common.PageRequest;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 区域查询请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class RegionQueryRequest extends PageRequest implements Serializable {

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

    private static final long serialVersionUID = 1L;
} 