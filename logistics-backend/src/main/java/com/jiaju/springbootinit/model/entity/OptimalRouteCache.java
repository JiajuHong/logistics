package com.jiaju.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 最优路径缓存实体
 */
@TableName(value = "optimal_route_cache")
@Data
public class OptimalRouteCache implements Serializable {

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;

    /**
     * id
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
     * 路径节点ID列表(JSON格式)
     */
    @TableField("path_nodes")
    private String pathNodes;

    /**
     * 总距离(公里)
     */
    @TableField("total_distance")
    private Double totalDistance;

    /**
     * 估计时间(分钟)
     */
    @TableField("estimated_time")
    private Integer estimatedTime;

    /**
     * 交通因子
     */
    @TableField("traffic_factor")
    private Double trafficFactor;

    /**
     * 计算时间
     */
    @TableField("calculation_time")
    private Date calculationTime;

    /**
     * 过期时间
     */
    @TableField("expire_time")
    private Date expireTime;

    /**
     * 命中次数
     */
    @TableField("hit_count")
    private Integer hitCount;

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
}