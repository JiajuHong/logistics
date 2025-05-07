package com.jiaju.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 运输订单实体
 */
@TableName(value = "transport_order")
@Data
public class TransportOrder implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 订单号
     */
    @TableField("order_no")
    private String orderNo;

    /**
     * 客户ID
     */
    @TableField("customer_id")
    private Long customerId;

    /**
     * 起始站点ID
     */
    @TableField("source_station_id")
    private Long sourceStationId;

    /**
     * 目标站点ID
     */
    @TableField("target_station_id")
    private Long targetStationId;

    /**
     * 货物描述
     */
    @TableField("cargo_desc")
    private String cargoDesc;

    /**
     * 重量（kg）
     */
    @TableField("weight")
    private BigDecimal weight;

    /**
     * 体积（立方米）
     */
    @TableField("volume")
    private BigDecimal volume;

    /**
     * 订单金额
     */
    @TableField("amount")
    private BigDecimal amount;

    /**
     * 预期装货时间
     */
    @TableField("expected_pickup")
    private Date expectedPickup;

    /**
     * 预期送达时间
     */
    @TableField("expected_delivery")
    private Date expectedDelivery;

    /**
     * 实际装货时间
     */
    @TableField("actual_pickup")
    private Date actualPickup;

    /**
     * 实际送达时间
     */
    @TableField("actual_delivery")
    private Date actualDelivery;

    /**
     * 订单分配时间
     */
    @TableField("assign_time")
    private Date assignTime;

    /**
     * 开始运输时间
     */
    @TableField("start_transport_time")
    private Date startTransportTime;

    /**
     * 订单完成时间
     */
    @TableField("complete_time")
    private Date completeTime;

    /**
     * 订单取消时间
     */
    @TableField("cancel_time")
    private Date cancelTime;

    /**
     * 订单拒绝时间
     */
    @TableField("reject_time")
    private Date rejectTime;

    /**
     * 状态：0-待分配, 1-已分配, 2-运输中, 3-已完成, 4-已取消
     */
    @TableField("status")
    private Integer status;

    /**
     * 是否已创建任务：true-已创建，false-未创建
     */
    @TableField("has_task")
    private int hasTask;

    /**
     * 备注
     */
    @TableField("remark")
    private String remark;

    /**
     * 创建时间
     */
    @TableField("create_time")
    private Date createTime;

    /**
     * 更新时间
     */
    @TableField("update_time")
    private Date updateTime;

    /**
     * 是否删除
     */
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
} 