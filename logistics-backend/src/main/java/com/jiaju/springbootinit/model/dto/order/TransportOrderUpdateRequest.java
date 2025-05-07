package com.jiaju.springbootinit.model.dto.order;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 更新运输订单请求
 */
@Data
public class TransportOrderUpdateRequest implements Serializable {
    
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
     * 重量（kg）
     */
    private BigDecimal weight;

    /**
     * 体积（立方米）
     */
    private BigDecimal volume;

    /**
     * 订单金额
     */
    private BigDecimal amount;

    /**
     * 预期装货时间
     */
    private Date expectedPickup;

    /**
     * 预期送达时间
     */
    private Date expectedDelivery;

    /**
     * 实际装货时间
     */
    private Date actualPickup;

    /**
     * 实际送达时间
     */
    private Date actualDelivery;

    /**
     * 订单分配时间
     */
    private Date assignTime;

    /**
     * 开始运输时间
     */
    private Date startTransportTime;

    /**
     * 订单完成时间
     */
    private Date completeTime;

    /**
     * 状态：0-待分配, 1-已分配, 2-运输中, 3-已完成, 4-已取消, 5-已取消
     */
    private Integer status;

    /**
     * 备注
     */
    private String remark;

    private static final long serialVersionUID = 1L;
} 