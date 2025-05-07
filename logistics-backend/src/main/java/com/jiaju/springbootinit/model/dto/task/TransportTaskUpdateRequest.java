package com.jiaju.springbootinit.model.dto.task;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 更新运输任务请求
 */
@Data
public class TransportTaskUpdateRequest implements Serializable {
    
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
     * 预计里程（km）
     */
    private BigDecimal estimatedDistance;
    
    /**
     * 实际里程（km）
     */
    private BigDecimal actualDistance;

    /**
     * 计划开始时间
     */
    private Date plannedStart;

    /**
     * 计划结束时间
     */
    private Date plannedEnd;
    
    /**
     * 实际开始时间
     */
    private Date actualStart;

    /**
     * 实际结束时间
     */
    private Date actualEnd;

    /**
     * 状态：0-待分配, 1-待执行, 2-执行中, 3-已完成, 4-已取消
     */
    private Integer status;

    /**
     * 备注
     */
    private String remark;

    private static final long serialVersionUID = 1L;
} 