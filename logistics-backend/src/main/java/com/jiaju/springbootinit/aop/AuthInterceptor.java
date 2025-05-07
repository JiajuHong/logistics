package com.jiaju.springbootinit.aop;

import com.jiaju.springbootinit.annotation.AuthCheck;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.model.entity.User;
import com.jiaju.springbootinit.model.enums.UserRoleEnum;
import com.jiaju.springbootinit.service.UserService;
import org.apache.commons.lang3.StringUtils;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;

/**
 * 权限校验 AOP
 */
@Aspect
@Component
public class AuthInterceptor {

    @Resource
    private UserService userService;
    
    /**
     * 允许未登录访问的接口列表
     */
    private static final List<String> WHITE_LIST = Arrays.asList(
            "/user/login",
            "/user/register"
    );

    /**
     * 执行拦截
     *
     * @param joinPoint
     * @param authCheck
     * @return
     * @throws Throwable
     */
    @Around("@annotation(authCheck)")
    public Object doInterceptor(ProceedingJoinPoint joinPoint, AuthCheck authCheck) throws Throwable {
        String mustRole = authCheck.mustRole();
        RequestAttributes requestAttributes = RequestContextHolder.currentRequestAttributes();
        HttpServletRequest request = ((ServletRequestAttributes) requestAttributes).getRequest();
        
        // 获取当前请求路径
        String url = request.getRequestURI();
        
        // 如果是白名单接口，直接放行
        if (isWhiteListUrl(url)) {
            return joinPoint.proceed();
        }
        
        // 当前登录用户
        User loginUser = userService.getLoginUser(request);
        
        // 必须有该角色才能访问
        if (StringUtils.isNotBlank(mustRole)) {
            UserRoleEnum mustUserRoleEnum = UserRoleEnum.getEnumByValue(mustRole);
            if (mustUserRoleEnum == null) {
                throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
            }
            String userRole = loginUser.getUserRole();
            // 如果被注解的接口需要管理员权限，但当前用户不是管理员，抛出异常
            if (UserRoleEnum.ADMIN.equals(mustUserRoleEnum)) {
                if (!mustRole.equals(userRole)) {
                    throw new BusinessException(ErrorCode.NO_AUTH_ERROR);
                }
            }
        }
        // 通过权限校验，放行
        return joinPoint.proceed();
    }
    
    /**
     * 判断当前请求url是否在白名单内
     *
     * @param requestURI 请求URI
     * @return 是否在白名单内
     */
    private boolean isWhiteListUrl(String requestURI) {
        return WHITE_LIST.stream().anyMatch(requestURI::startsWith);
    }
} 