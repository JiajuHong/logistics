package com.jiaju.springbootinit.model.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableLogic;
import com.baomidou.mybatisplus.annotation.TableName;
import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 司机信息
 */
@TableName(value = "driver")
@Data
public class Driver implements Serializable {

    /**
     * id
     */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

    /**
     * 司机姓名
     */
    private String name;

    /**
     * 司机编号
     */
    private String code;

    /**
     * 联系电话
     */
    private String phone;

    /**
     * 驾驶证号
     */
    @TableField("license_no")
    private String licenseNo;

    /**
     * 驾驶证类型
     */
    @TableField("license_type")
    private String licenseType;

    /**
     * 驾龄（年）
     */
    private Integer experience;

    /**
     * 司机头像URL
     */
    private String avatar;

    /**
     * 状态：0-停用, 1-空闲, 2-任务中
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