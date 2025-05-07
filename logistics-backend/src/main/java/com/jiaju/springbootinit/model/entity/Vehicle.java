package com.jiaju.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.math.BigDecimal;
import java.util.Date;
import lombok.Data;

/**
 * 车辆信息
 */
@TableName(value = "vehicle")
@Data
public class Vehicle implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 车牌号
     */
    @TableField("vehicle_no")
    private String vehicleNo;

    /**
     * 车辆类型
     */
    @TableField("vehicle_type")
    private String vehicleType;

    /**
     * 载重量（吨）
     */
    @TableField("load_capacity")
    private BigDecimal loadCapacity;

    /**
     * 容积（立方米）
     */
    @TableField("volume_capacity")
    private BigDecimal volumeCapacity;

    /**
     * 当前所属站点ID
     */
    @TableField("station_id")
    private Long stationId;

    /**
     * 状态：0-维修中, 1-空闲, 2-任务中
     */
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

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
} 