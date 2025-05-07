package com.jiaju.springbootinit.model.dto.order;

import com.jiaju.springbootinit.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 查询运输订单请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class TransportOrderQueryRequest extends PageRequest implements Serializable {
    
    /**
     * id
     */
    private Long id;
    
    /**
     * 订单号
     */
    private String orderNo;

    /**
     * 客户ID
     */
    private Long customerId;

    /**
     * 起始站点ID
     */
    private Long sourceStationId;

    /**
     * 目标站点ID
     */
    private Long targetStationId;

    /**
     * 货物描述
     */
    private String cargoDesc;

    /**
     * 重量下限（kg）
     */
    private BigDecimal minWeight;

    /**
     * 重量上限（kg）
     */
    private BigDecimal maxWeight;

    /**
     * 体积下限（立方米）
     */
    private BigDecimal minVolume;

    /**
     * 体积上限（立方米）
     */
    private BigDecimal maxVolume;

    /**
     * 预期交付时间起始
     */
    private Date expectedDeliveryStart;

    /**
     * 预期交付时间结束
     */
    private Date expectedDeliveryEnd;

    /**
     * 状态：0-待分配, 1-已分配, 2-运输中, 3-已完成, 4-已取消, 5-已取消
     */
    private Integer status;
    
    /**
     * 是否已创建任务
     */
    private Boolean hasTask;

    /**
     * 创建时间起始
     */
    private Date createTimeStart;

    /**
     * 创建时间结束
     */
    private Date createTimeEnd;

    private static final long serialVersionUID = 1L;
} 