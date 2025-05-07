package com.jiaju.springbootinit.model.vo;

import java.io.Serializable;
import lombok.Data;

/**
 * 车辆统计数据视图
 */
@Data
public class VehicleStatisticsVO implements Serializable {

    /**
     * 车辆总数
     */
    private Long total;

    /**
     * 空闲车辆数量
     */
    private Long idle;

    /**
     * 任务中车辆数量
     */
    private Long inTask;

    /**
     * 维修中车辆数量
     */
    private Long maintenance;

    private static final long serialVersionUID = 1L;
} 