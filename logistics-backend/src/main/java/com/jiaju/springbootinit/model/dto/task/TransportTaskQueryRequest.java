package com.jiaju.springbootinit.model.dto.task;

import com.jiaju.springbootinit.common.PageRequest;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.io.Serializable;
import java.util.Date;

/**
 * 查询运输任务请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class TransportTaskQueryRequest extends PageRequest implements Serializable {
    
    /**
     * id
     */
    private Long id;
    
    /**
     * 任务编号
     */
    private String taskNo;

    /**
     * 关联订单ID
     */
    private Long orderId;
    
    /**
     * 关联订单号
     */
    private String orderNo;

    /**
     * 分配车辆ID
     */
    private Long vehicleId;

    /**
     * 分配司机ID
     */
    private Long driverId;

    /**
     * 起点站点ID
     */
    private Long sourceId;

    /**
     * 终点站点ID
     */
    private Long targetId;

    /**
     * 计划开始时间起始
     */
    private Date plannedStartBegin;

    /**
     * 计划开始时间结束
     */
    private Date plannedStartEnd;
    
    /**
     * 计划结束时间起始
     */
    private Date plannedEndBegin;
    
    /**
     * 计划结束时间结束
     */
    private Date plannedEndEnd;
    
    /**
     * 状态：0-待分配, 1-待执行, 2-执行中, 3-已完成, 4-已取消
     */
    private Integer status;
    
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