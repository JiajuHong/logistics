package com.jiaju.springbootinit.model.vo;

import lombok.Data;

import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;

/**
 * 运输任务视图（脱敏）
 */
@Data
public class TransportTaskVO implements Serializable {

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
     * 车辆车牌号
     */
    private String vehicleNo;

    /**
     * 分配司机ID
     */
    private Long driverId;
    
    /**
     * 司机姓名
     */
    private String driverName;

    /**
     * 起点站点ID
     */
    private Long sourceId;
    
    /**
     * 起点站点名称
     */
    private String sourceName;

    /**
     * 终点站点ID
     */
    private Long targetId;
    
    /**
     * 终点站点名称
     */
    private String targetName;

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
     * 任务分配时间
     */
    private Date assignTime;

    /**
     * 状态：0-待分配, 1-待执行, 2-执行中, 3-已完成, 4-已取消
     */
    private Integer status;
    
    /**
     * 状态名称
     */
    private String statusName;

    /**
     * 备注
     */
    private String remark;

    /**
     * 创建时间
     */
    private Date createTime;
    
    /**
     * 更新时间
     */
    private Date updateTime;

    private static final long serialVersionUID = 1L;
} 