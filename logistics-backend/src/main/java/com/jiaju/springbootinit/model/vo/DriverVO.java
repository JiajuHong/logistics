package com.jiaju.springbootinit.model.vo;

import java.io.Serializable;
import java.util.Date;
import lombok.Data;

/**
 * 司机视图
 */
@Data
public class DriverVO implements Serializable {

    /**
     * id
     */
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
    private String licenseNo;

    /**
     * 驾驶证类型
     */
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
    private Date createTime;

    private static final long serialVersionUID = 1L;
} 