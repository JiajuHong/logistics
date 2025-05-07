package com.jiaju.springbootinit.model.dto.vehicle;

import com.jiaju.springbootinit.common.PageRequest;
import java.io.Serializable;
import java.math.BigDecimal;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 车辆查询请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class VehicleQueryRequest extends PageRequest implements Serializable {

    /**
     * 车牌号
     */
    private String vehicleNo;

    /**
     * 车辆类型
     */
    private String vehicleType;

    /**
     * 载重量（吨）
     */
    private BigDecimal loadCapacity;

    /**
     * 容积（立方米）
     */
    private BigDecimal volumeCapacity;

    /**
     * 当前所属站点ID
     */
    private Long stationId;

    /**
     * 默认司机ID
     */
    private Long driverId;

    /**
     * 状态：0-维修中, 1-空闲, 2-任务中
     */
    private Integer status;

    private static final long serialVersionUID = 1L;
} 