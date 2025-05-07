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
 * 运输任务实体
 */
@TableName(value = "transport_task")
@Data
public class TransportTask implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 任务编号
     */
    @TableField("task_no")
    private String taskNo;

    /**
     * 关联订单ID
     */
    @TableField("order_id")
    private Long orderId;

    /**
     * 分配车辆ID
     */
    @TableField("vehicle_id")
    private Long vehicleId;

    /**
     * 分配司机ID
     */
    @TableField("driver_id")
    private Long driverId;

    /**
     * 起点站点ID
     */
    @TableField("source_id")
    private Long sourceId;

    /**
     * 终点站点ID
     */
    @TableField("target_id")
    private Long targetId;

    /**
     * 预计里程（km）
     */
    @TableField("estimated_distance")
    private BigDecimal estimatedDistance;

    /**
     * 实际里程（km）
     */
    @TableField("actual_distance")
    private BigDecimal actualDistance;

    /**
     * 计划开始时间
     */
    @TableField("planned_start")
    private Date plannedStart;

    /**
     * 计划结束时间
     */
    @TableField("planned_end")
    private Date plannedEnd;

    /**
     * 实际开始时间
     */
    @TableField("actual_start")
    private Date actualStart;

    /**
     * 实际结束时间
     */
    @TableField("actual_end")
    private Date actualEnd;

    /**
     * 任务分配时间
     */
    @TableField("assign_time")
    private Date assignTime;

    /**
     * 状态：0-待分配, 1-待执行, 2-执行中, 3-已完成, 4-已取消
     */
    @TableField("status")
    private Integer status;

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