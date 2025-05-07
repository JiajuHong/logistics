package com.jiaju.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.io.Serializable;
import java.util.Date;

/**
 * 站点间直线距离实体
 */
@TableName(value = "direct_distance")
@Data
public class DirectDistance implements Serializable {

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;

    /**
     * id
     */
    @TableId(type = IdType.AUTO)
    private Long id;

    /**
     * 站点1ID
     */
    @TableField("station_id1")
    private Long stationId1;

    /**
     * 站点2ID
     */
    @TableField("station_id2")
    private Long stationId2;

    /**
     * 直线距离（km）
     */
    @TableField("distance")
    private Double distance;

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
