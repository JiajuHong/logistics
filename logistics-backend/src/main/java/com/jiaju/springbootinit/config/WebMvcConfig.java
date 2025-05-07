package com.jiaju.springbootinit.config;

import javax.annotation.Resource;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.jiaju.springbootinit.manager.LocalFileManager;
import java.io.File;
import lombok.extern.slf4j.Slf4j;

/**
 * Spring MVC 配置
 */
@Configuration
@Slf4j
public class WebMvcConfig implements WebMvcConfigurer {

    @Resource
    private LocalFileConfig localFileConfig;
    
    @Resource
    private LocalFileManager localFileManager;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // 登录校验和日志记录已通过LogInterceptor的AOP方式实现
        // 不需要在此注册拦截器
    }
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 配置上传文件的访问路径
        String accessPrefix = localFileConfig.getAccessUrlPrefix();
        String pathPattern = accessPrefix.replace("/api", "") + "/**";
        
        // 使用LocalFileManager中解析好的绝对路径
        String absolutePath = localFileManager.getResolvedUploadPath().toAbsolutePath().toString();
        
        // 确保路径末尾有分隔符
        if (!absolutePath.endsWith(File.separator)) {
            absolutePath += File.separator;
        }
        
        String resourceLocation = "file:" + absolutePath;
        log.info("配置静态资源映射: {} -> {}", pathPattern, resourceLocation);
        
        registry.addResourceHandler(pathPattern)
                .addResourceLocations(resourceLocation);
                
        // 添加更精确的路径映射 - 直接映射到具体目录
        String userAvatarPattern = "/file/access/user_avatar/**";
        String userAvatarLocation = "file:" + absolutePath + "user_avatar" + File.separator;
        log.info("配置头像资源映射: {} -> {}", userAvatarPattern, userAvatarLocation);
        
        registry.addResourceHandler(userAvatarPattern)
                .addResourceLocations(userAvatarLocation);
    }
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 允许跨域访问的路径
        registry.addMapping("/**")
                // 允许跨域访问的源
                .allowedOriginPatterns("*")
                // 允许请求方法
                .allowedMethods("GET", "POST", "PUT", "DELETE")
                // 允许头部设置
                .allowedHeaders("*")
                // 是否发送cookie
                .allowCredentials(true)
                // 预检请求的有效期，单位为秒
                .maxAge(3600);
    }
} 