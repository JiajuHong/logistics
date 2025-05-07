package com.jiaju.springbootinit.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * 本地文件存储配置
 */
@Configuration
@ConfigurationProperties(prefix = "file.local")
@Data
public class LocalFileConfig {

    /**
     * 上传文件存储目录
     */
    private String uploadPath = "upload";

    /**
     * 静态资源访问URL前缀
     */
    private String accessUrlPrefix = "/api/file/access";
} 