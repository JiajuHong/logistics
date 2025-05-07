package com.jiaju.springbootinit.model.dto.station;

import com.jiaju.springbootinit.common.PageRequest;
import java.io.Serializable;
import java.math.BigDecimal;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 站点查询请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class StationQueryRequest extends PageRequest implements Serializable {

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

    private static final long serialVersionUID = 1L;
} 