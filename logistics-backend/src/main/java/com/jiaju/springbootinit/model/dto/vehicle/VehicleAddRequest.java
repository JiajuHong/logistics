package com.jiaju.springbootinit.model.dto.vehicle;

import java.io.Serializable;
import java.math.BigDecimal;
import lombok.Data;

/**
 * 创建车辆请求
 */
@Data
public class VehicleAddRequest implements Serializable {

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
     * 状态：0-维修中, 1-空闲, 2-任务中
     */
    private Integer status;

    private static final long serialVersionUID = 1L;
} 