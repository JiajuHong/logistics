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
 * 站点间直线距离缓存
 */
@TableName(value = "station_distance_cache")
@Data
public class StationDistanceCache implements Serializable {

    /**
     * 缓存ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 起始站点ID
     */
    @TableField("from_station_id")
    private Long fromStationId;

    /**
     * 目标站点ID
     */
    @TableField("to_station_id")
    private Long toStationId;

    /**
     * 直线距离(公里)
     */
    @TableField("distance")
    private BigDecimal distance;

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