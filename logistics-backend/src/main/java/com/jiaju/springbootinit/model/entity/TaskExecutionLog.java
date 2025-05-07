package com.jiaju.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 任务执行记录
 */
@TableName(value = "task_execution_log")
@Data
public class TaskExecutionLog implements Serializable {

    /**
     * 日志ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 关联的任务ID
     */
    @TableField("task_id")
    private Long taskId;

    /**
     * 任务状态：0-创建 1-分配 2-执行中 3-完成 4-异常 5-取消
     */
    @TableField("status")
    private Integer status;

    /**
     * 前一个状态
     */
    @TableField("previous_status")
    private Integer previousStatus;

    /**
     * 执行/状态变更时间
     */
    @TableField("execution_time")
    private Date executionTime;

    /**
     * 操作人ID
     */
    @TableField("operator_id")
    private Long operatorId;

    /**
     * 位置信息(经纬度)
     */
    @TableField("location")
    private String location;

    /**
     * 备注信息
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

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
} 