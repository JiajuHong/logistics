package com.jiaju.springbootinit.model.dto.driver;

import com.jiaju.springbootinit.common.PageRequest;
import java.io.Serializable;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 司机查询请求
 */
@EqualsAndHashCode(callSuper = true)
@Data
public class DriverQueryRequest extends PageRequest implements Serializable {

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
     * 状态：0-停用, 1-空闲, 2-任务中
     */
    private Integer status;

    private static final long serialVersionUID = 1L;
} 