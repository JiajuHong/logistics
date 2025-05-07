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
 * 调度规则
 */
@TableName(value = "scheduling_rule")
@Data
public class SchedulingRule implements Serializable {

    /**
     * 规则ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 规则名称
     */
    @TableField("rule_name")
    private String ruleName;

    /**
     * 规则代码
     */
    @TableField("rule_code")
    private String ruleCode;

    /**
     * 规则描述
     */
    @TableField("description")
    private String description;

    /**
     * 任务类型
     */
    @TableField("task_type")
    private String taskType;

    /**
     * 优先级别(0-9)，数字越大优先级越高
     */
    @TableField("priority_level")
    private Integer priorityLevel;

    /**
     * 载重因子
     */
    @TableField("weight_factor")
    private BigDecimal weightFactor;

    /**
     * 距离因子
     */
    @TableField("distance_factor")
    private BigDecimal distanceFactor;

    /**
     * 时间因子
     */
    @TableField("time_factor")
    private BigDecimal timeFactor;

    /**
     * 车辆类型约束(JSON格式)
     */
    @TableField("vehicle_type_constraint")
    private String vehicleTypeConstraint;

    /**
     * 司机要求(JSON格式)
     */
    @TableField("driver_requirement")
    private String driverRequirement;

    /**
     * 是否启用: 0-禁用 1-启用
     */
    @TableField("is_enabled")
    private Integer isEnabled;

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

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
} 