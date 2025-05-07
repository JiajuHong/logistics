package com.jiaju.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableField;
import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

/**
 * 运输路线实体类
 */
@Data
@TableName("route")
public class Route {
    /**
     * ID
     */
    @TableId(type = IdType.AUTO)
    private Long id;
    
    /**
     * 起点站点ID
     */
    @TableField("from_station_id")
    private Long fromStationId;
    
    /**
     * 终点站点ID
     */
    @TableField("to_station_id")
    private Long toStationId;
    
    /**
     * 距离(公里)
     */
    @TableField("distance")
    private BigDecimal distance;
    
    /**
     * 预计耗时(分钟)
     */
    @TableField("travel_time")
    private Integer travelTime;
    
    /**
     * 运输成本(元/公里)
     */
    @TableField("transport_cost")
    private BigDecimal transportCost;
    
    /**
     * 状态：0-禁用, 1-启用
     */
    @TableField("status")
    private Integer status;
    
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
    @TableLogic
    private Integer isDelete;
} 