package com.jiaju.springbootinit.controller;

import cn.hutool.core.io.FileUtil;
import com.jiaju.springbootinit.common.BaseResponse;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.common.ResultUtils;
import com.jiaju.springbootinit.config.LocalFileConfig;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.manager.LocalFileManager;
import com.jiaju.springbootinit.model.dto.file.UploadFileRequest;
import com.jiaju.springbootinit.model.entity.User;
import com.jiaju.springbootinit.model.enums.FileUploadBizEnum;
import com.jiaju.springbootinit.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriUtils;

import javax.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.text.SimpleDateFormat;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * 文件接口
 *
 
 
 */
@RestController
@RequestMapping("/file")
@Slf4j
public class FileController {

    @javax.annotation.Resource
    private UserService userService;

    @javax.annotation.Resource
    private LocalFileManager localFileManager;

    @javax.annotation.Resource
    private LocalFileConfig localFileConfig;
    
    // 文件类型映射表
    private static final Map<String, String> CONTENT_TYPE_MAP = new HashMap<>();
    
    static {
        // 图片类型
        CONTENT_TYPE_MAP.put("jpg", "image/jpeg");
        CONTENT_TYPE_MAP.put("jpeg", "image/jpeg");
        CONTENT_TYPE_MAP.put("png", "image/png");
        CONTENT_TYPE_MAP.put("gif", "image/gif");
        CONTENT_TYPE_MAP.put("webp", "image/webp");
        CONTENT_TYPE_MAP.put("svg", "image/svg+xml");
        
        // 文档类型
        CONTENT_TYPE_MAP.put("pdf", "application/pdf");
        CONTENT_TYPE_MAP.put("doc", "application/msword");
        CONTENT_TYPE_MAP.put("docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
        
        // 默认类型
        CONTENT_TYPE_MAP.put("default", "application/octet-stream");
    }

    /**
     * 文件上传
     *
     * @param multipartFile
     * @param uploadFileRequest
     * @param request
     * @return
     */
    @PostMapping("/upload")
    public BaseResponse<String> uploadFile(@RequestPart("file") MultipartFile multipartFile,
                                           UploadFileRequest uploadFileRequest, HttpServletRequest request) {
        if (multipartFile.isEmpty()) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "上传文件为空");
        }
        
        String biz = uploadFileRequest.getBiz();
        FileUploadBizEnum fileUploadBizEnum = FileUploadBizEnum.getEnumByValue(biz);
        if (fileUploadBizEnum == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "业务类型不合法");
        }
        
        validFile(multipartFile, fileUploadBizEnum);
        User loginUser = userService.getLoginUser(request);
        
        // 获取原始文件名和扩展名
        String originalFilename = multipartFile.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null) {
            fileExtension = FileUtil.extName(originalFilename);
        }
        if (StringUtils.isBlank(fileExtension)) {
            // 确保有扩展名
            fileExtension = "jpg";
        }
        
        // 生成文件名：用户id_时间戳.扩展名
        String timestamp = new SimpleDateFormat("yyyyMMddHHmmss").format(new Date());
        String fileName = loginUser.getId() + "_" + timestamp + "." + fileExtension;
        
        // 构建相对路径，注意前导斜杠
        String filepath = String.format("/%s/%s/%s", fileUploadBizEnum.getValue(), loginUser.getId(), fileName);
        
        try {
            // 上传文件到本地
            String accessUrl = localFileManager.uploadFile(filepath, multipartFile);
            log.info("文件上传成功: {}", accessUrl);
            // 返回可访问地址
            return ResultUtils.success(accessUrl);
        } catch (Exception e) {
            log.error("文件上传失败: {}, 异常: {}", filepath, e.getMessage(), e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败: " + e.getMessage());
        }
    }

    /**
     * 访问上传的文件
     */
    @GetMapping("/access/**")
    public ResponseEntity<Resource> accessFile(HttpServletRequest request) {
        try {
            // 获取请求的完整路径
            String requestURI = request.getRequestURI();
            log.info("原始请求URI: {}", requestURI);
            
            // 提取访问路径部分
            String accessPart = "/file/access/";
            int startIndex = requestURI.indexOf(accessPart);
            if (startIndex == -1) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "无效的文件访问路径");
            }
            
            String filePath = requestURI.substring(startIndex + accessPart.length());
            log.info("提取的文件路径: {}", filePath);
            
            // 确保路径格式正确
            if (StringUtils.isBlank(filePath)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件路径为空");
            }
            
            // 解码URL编码的文件路径
            String decodedPath = UriUtils.decode(filePath, StandardCharsets.UTF_8.name());
            log.info("解码后的文件路径: {}", decodedPath);
            
            // 使用解析后的上传路径
            Path fullPath = localFileManager.getResolvedUploadPath().resolve(decodedPath);
            log.info("完整的物理文件路径: {}", fullPath.toAbsolutePath());
            
            // 验证文件存在
            if (!Files.exists(fullPath)) {
                log.error("文件不存在: {}", fullPath.toAbsolutePath());
                throw new BusinessException(ErrorCode.NOT_FOUND_ERROR, "文件不存在");
            }
            
            // 创建资源
            Resource resource = new UrlResource(fullPath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                // 获取正确的MIME类型
                String contentType = determineContentType(fullPath);
                
                // 图片文件直接显示，其他文件下载
                String disposition = contentType.startsWith("image/") 
                        ? "inline" 
                        : "attachment; filename=\"" + resource.getFilename() + "\"";
                
                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, disposition)
                        .body(resource);
            } else {
                log.error("文件不可读: {}", fullPath.toAbsolutePath());
                throw new BusinessException(ErrorCode.SYSTEM_ERROR, "文件不可读");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("访问文件失败: {}", e.getMessage(), e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "文件访问错误: " + e.getMessage());
        }
    }
    
    /**
     * 确定文件的内容类型
     */
    private String determineContentType(Path path) {
        try {
            String filename = path.getFileName().toString();
            String extension = FileUtil.extName(filename).toLowerCase();
            
            // 尝试从映射表中获取内容类型
            String contentType = CONTENT_TYPE_MAP.get(extension);
            if (contentType != null) {
                return contentType;
            }
            
            // 尝试使用NIO获取
            String mimeType = Files.probeContentType(path);
            if (mimeType != null && !mimeType.isEmpty()) {
                return mimeType;
            }
            
            // 默认类型
            return CONTENT_TYPE_MAP.get("default");
        } catch (Exception e) {
            log.warn("无法确定内容类型: {}, 使用默认类型", path, e);
            return CONTENT_TYPE_MAP.get("default");
        }
    }

    /**
     * 校验文件
     *
     * @param multipartFile
     * @param fileUploadBizEnum 业务类型
     */
    private void validFile(MultipartFile multipartFile, FileUploadBizEnum fileUploadBizEnum) {
        // 文件大小
        long fileSize = multipartFile.getSize();
        String originalFilename = multipartFile.getOriginalFilename();
        
        // 文件后缀
        String fileSuffix = originalFilename != null ? FileUtil.getSuffix(originalFilename).toLowerCase() : "";
        
        final long ONE_M = 1024 * 1024L;
        if (FileUploadBizEnum.USER_AVATAR.equals(fileUploadBizEnum)) {
            if (fileSize > ONE_M) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件大小不能超过 1M");
            }
            if (!Arrays.asList("jpeg", "jpg", "svg", "png", "webp").contains(fileSuffix)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "头像仅支持 jpg、jpeg、png、webp、svg 格式");
            }
        }
    }
}
