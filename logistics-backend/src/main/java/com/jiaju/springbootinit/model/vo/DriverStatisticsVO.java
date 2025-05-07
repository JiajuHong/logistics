package com.jiaju.springbootinit.model.vo;

import lombok.Data;

/**
 * 司机统计数据视图对象
 */
@Data
public class DriverStatisticsVO {

    /**
     * 司机总数
     */
    private long total;

    /**
     * 空闲状态司机数
     */
    private long idle;

    /**
     * 任务中司机数
     */
    private long inTask;

    /**
     * 停用司机数
     */
    private long disabled;
} 