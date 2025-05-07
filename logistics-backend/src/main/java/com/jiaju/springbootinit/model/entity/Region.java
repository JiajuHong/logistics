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
 * 区域信息
 */
@TableName(value = "region")
@Data
public class Region implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 区域名称
     */
    private String name;

    /**
     * 区域编码
     */
    private String code;

    /**
     * 父区域ID
     */
    @TableField("parent_id")
    private Long parentId;

    /**
     * 区域级别：1-省, 2-市, 3-区县
     */
    private Integer level;

    /**
     * 状态：0-禁用, 1-启用
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
     * 中心点经度
     */
    @TableField("center_longitude")
    private BigDecimal centerLongitude;

    /**
     * 中心点纬度
     */
    @TableField("center_latitude")
    private BigDecimal centerLatitude;

    /**
     * 边界坐标点GeoJSON数据
     */
    @TableField("boundary_points")
    private String boundaryPoints;

    /**
     * 是否删除
     */
    @TableField("is_delete")
    @TableLogic
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
} 