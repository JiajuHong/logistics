package com.jiaju.springbootinit.manager;

import com.jiaju.springbootinit.config.LocalFileConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * 本地文件存储操作
 */
@Component
@Slf4j
public class LocalFileManager {

    @Resource
    private LocalFileConfig localFileConfig;
    
    // 应用启动时解析的绝对路径
    private Path resolvedUploadPath;

    /**
     * 上传文件到本地
     *
     * @param filepath 文件路径
     * @param file     文件
     * @return 可访问的URL
     */
    public String uploadFile(String filepath, MultipartFile file) throws IOException {
        log.info("上传文件: {}, 上传目录: {}", filepath, resolvedUploadPath);
        
        // 创建目录结构
        String directoryPath = filepath.substring(0, filepath.lastIndexOf("/"));
        Path directory = resolvedUploadPath.resolve(directoryPath.substring(1));
        
        log.info("创建目录: {}", directory);
        
        try {
            Files.createDirectories(directory);
        } catch (IOException e) {
            log.error("创建目录失败: {}, 错误: {}", directory, e.getMessage());
            throw new IOException("创建目录失败: " + directory, e);
        }
        
        // 创建完整的文件路径
        // 删除开头的斜杠，避免路径解析问题
        String cleanFilePath = filepath.startsWith("/") ? filepath.substring(1) : filepath;
        Path destPath = resolvedUploadPath.resolve(cleanFilePath);
        log.info("完整文件路径: {}", destPath);
        
        try {
            // 保存文件
            Files.createDirectories(destPath.getParent());
            file.transferTo(destPath.toFile());
            log.info("文件保存成功: {}", destPath);
        } catch (IOException e) {
            log.error("保存文件失败: {}, 错误: {}", destPath, e.getMessage());
            throw new IOException("保存文件失败: " + destPath, e);
        }
        
        // 返回可访问的URL
        String accessUrl = localFileConfig.getAccessUrlPrefix() + filepath;
        log.info("文件访问URL: {}", accessUrl);
        return accessUrl;
    }
    
    /**
     * 获取解析后的上传路径
     */
    public Path getResolvedUploadPath() {
        return resolvedUploadPath;
    }
    
    /**
     * 初始化上传目录
     */
    @PostConstruct
    public void init() {
        try {
            // 将相对路径解析为绝对路径
            String configuredPath = localFileConfig.getUploadPath();
            Path uploadPath = Paths.get(configuredPath);
            
            // 如果是相对路径，则从当前用户目录解析
            if (!uploadPath.isAbsolute()) {
                uploadPath = Paths.get(System.getProperty("user.dir"), configuredPath);
            }
            
            resolvedUploadPath = uploadPath.normalize();
            
            // 创建目录
            Files.createDirectories(resolvedUploadPath);
            
            log.info("上传目录初始化成功: {} (配置值: {})", 
                    resolvedUploadPath.toAbsolutePath(), 
                    localFileConfig.getUploadPath());
        } catch (IOException e) {
            log.error("上传目录初始化失败: {}, 错误: {}", 
                    localFileConfig.getUploadPath(), e.getMessage());
        }
    }
} 