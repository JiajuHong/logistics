package com.jiaju.springbootinit.aop;

import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StopWatch;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static com.jiaju.springbootinit.constant.UserConstant.USER_LOGIN_STATE;

/**
 * 请求响应日志和登录校验 AOP
 **/
@Aspect
@Component
@Slf4j
public class LogInterceptor {

    /**
     * 允许未登录访问的接口列表
     */
    private static final List<String> WHITE_LIST = Arrays.asList(
            "/user/login",
            "/user/register",
            "/api/user/login",
            "/api/user/register",
            "/**/user/login",
            "/**/user/register",
            "/",
            "/welcome"
    );
    
    /**
     * 路径匹配器
     */
    private final AntPathMatcher pathMatcher = new AntPathMatcher();

    /**
     * 执行拦截
     */
    @Around("execution(* com.jiaju.springbootinit.controller.*.*(..))")
    public Object doInterceptor(ProceedingJoinPoint point) throws Throwable {
        // 计时
        StopWatch stopWatch = new StopWatch();
        stopWatch.start();
        
        try {
            // 获取请求路径
            RequestAttributes requestAttributes = RequestContextHolder.currentRequestAttributes();
            HttpServletRequest httpServletRequest = ((ServletRequestAttributes) requestAttributes).getRequest();
            // 生成请求唯一 id
            String requestId = UUID.randomUUID().toString();
            
            // 获取请求的完整信息
            String url = httpServletRequest.getRequestURI();
            String contextPath = httpServletRequest.getContextPath();
            String servletPath = httpServletRequest.getServletPath();
            String method = httpServletRequest.getMethod();
            
            // 输出请求URI，帮助调试
            log.info("Received request: {} {} with URI: {}", requestId, method, url);
            log.info("Context Path: {}, Servlet Path: {}", contextPath, servletPath);
            
            // 尝试所有可能的路径格式
            String[] pathsToCheck = new String[] {
                url,
                servletPath,
                url.startsWith("/") ? url.substring(1) : url,
                servletPath.startsWith("/") ? servletPath.substring(1) : servletPath,
                contextPath + (servletPath.startsWith("/") ? servletPath : "/" + servletPath)
            };
            
            // 检查是否在白名单中
            boolean isInWhiteList = false;
            for (String path : pathsToCheck) {
                if (StringUtils.isNotBlank(path)) {
                    if (isWhiteListUrl(path)) {
                        isInWhiteList = true;
                        log.info("Path {} is in whitelist", path);
                        break;
                    }
                }
            }
            
            // 登录校验逻辑 - 如果不是白名单接口，检查是否已登录
            if (!isInWhiteList) {
                log.info("URI not in whitelist, checking login state");
                Object userObj = httpServletRequest.getSession().getAttribute(USER_LOGIN_STATE);
                log.info("Session user object exists: {}", userObj != null);
                if (userObj == null) {
                    log.error("User not logged in, throwing exception");
                    throw new BusinessException(ErrorCode.NOT_LOGIN_ERROR);
                }
            } else {
                log.info("URI in whitelist, skipping login check");
            }
    
            // 获取请求参数
            Object[] args = point.getArgs();
            String reqParam = "[" + StringUtils.join(args, ", ") + "]";
            // 输出请求日志
            log.info("Request proceeding, id: {}, path: {}, ip: {}, params: {}", requestId, url,
                    httpServletRequest.getRemoteHost(), reqParam);
            // 执行原方法
            Object result = point.proceed();
            // 输出响应日志
            stopWatch.stop();
            long totalTimeMillis = stopWatch.getTotalTimeMillis();
            log.info("Request completed, id: {}, cost: {}ms", requestId, totalTimeMillis);
            return result;
        } catch (BusinessException e) {
            stopWatch.stop();
            log.error("Business exception during request processing: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            stopWatch.stop();
            log.error("Exception during request processing", e);
            throw e;
        }
    }

    /**
     * 判断当前请求url是否在白名单内
     *
     * @param requestURI 请求URI
     * @return 是否在白名单内
     */
    private boolean isWhiteListUrl(String requestURI) {
        if (requestURI == null) {
            return false;
        }
        
        // 清理URI
        String cleanUri = requestURI;
        // 移除查询参数
        int queryIdx = cleanUri.indexOf('?');
        if (queryIdx > 0) {
            cleanUri = cleanUri.substring(0, queryIdx);
        }
        
        log.info("Checking if URI is in whitelist: {}", cleanUri);
        
        // 遍历白名单，检查每个白名单路径是否匹配
        for (String whiteUrl : WHITE_LIST) {
            // 使用Spring的路径匹配器进行匹配
            boolean matches = pathMatcher.match(whiteUrl, cleanUri);
            log.info("Checking pattern: {} against URI: {}, matches: {}", whiteUrl, cleanUri, matches);
            
            if (matches) {
                return true;
            }
            
            // 额外检查是否是结尾部分匹配
            if (cleanUri.endsWith(whiteUrl)) {
                log.info("URI ends with whitelist pattern: {}", whiteUrl);
                return true;
            }
        }
        
        log.info("URI did not match any whitelist pattern");
        return false;
    }
}

