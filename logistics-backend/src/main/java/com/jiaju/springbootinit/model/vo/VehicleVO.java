package com.jiaju.springbootinit.model.vo;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import lombok.Data;

/**
 * 车辆视图
 */
@Data
public class VehicleVO implements Serializable {

    /**
     * id
     */
    private Long id;

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
     * 当前所属站点名称
     */
    private String stationName;

    /**
     * 状态：0-维修中, 1-空闲, 2-任务中
     */
    private Integer status;

    /**
     * 创建时间
     */
    private Date createTime;

    private static final long serialVersionUID = 1L;
} 