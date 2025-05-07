import type { RequestConfig } from '@umijs/max';
import { history } from '@umijs/max';
import { message, notification } from 'antd';
import { BACKEND_HOST_LOCAL, BACKEND_HOST_PROD } from '@/constants';

// 无需登录即可访问的路径列表
const publicPaths = ['/welcome', '/user/login', '/'];

// 错误显示类型枚举
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

// 添加消息防抖，避免重复提示
const messageDebounce = {
  authError: {
    lastTime: 0,
    interval: 3000, // 3秒内不重复显示
  },
  networkError: {
    lastTime: 0,
    interval: 5000, // 5秒内不重复显示
  }
};

// 防抖消息显示
const showMessageWithDebounce = (type: keyof typeof messageDebounce, msgFunc: Function, content: string) => {
  const now = Date.now();
  const debounceItem = messageDebounce[type];
  
  if (now - debounceItem.lastTime > debounceItem.interval) {
    debounceItem.lastTime = now;
    msgFunc(content);
    return true;
  }
  return false;
};

/**
 * 检查当前路径是否是公开路径(无需登录)
 */
const isPublicPath = (pathname: string): boolean => {
  return publicPaths.some(path => pathname === path || pathname.startsWith(path));
};

// 请求拦截器接口定义
interface RequestInterceptors {
  data?: any;
  success?: boolean;
  errorCode?: string | number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

// 后端响应结构
interface ResponseStructure {
  success: boolean;
  data: any;
  code: number;
  message: string;
}

// 请求选项类型
interface RequestOptions {
  url?: string;
  retry?: number;
  retryDelay?: number;
  skipErrorHandler?: boolean;
  [key: string]: any;
}

const isDev = process.env.NODE_ENV === 'development';

/**
 * @name 错误处理
 * pro 自带的错误处理， 可以在这里做自己的改动
 * @doc https://umijs.org/docs/max/request#配置
 */
export const requestConfig: RequestConfig = {
  baseURL: isDev ? BACKEND_HOST_LOCAL : BACKEND_HOST_PROD,
  withCredentials: true,

  // 请求拦截器
  requestInterceptors: [
    (config: RequestOptions) => {
      // 拦截请求配置，进行个性化处理。
      // 系统使用cookie管理会话，不需要手动设置token
      console.log('发起请求:', config.url);
      return { ...config, retry: 0, retryDelay: 1000 };
    },
  ],

  // 响应拦截器
  responseInterceptors: [
    (response) => {
      // 请求地址
      const requestPath: string = response.config.url ?? '';

      // 响应
      const { data } = response as unknown as ResponseStructure;
      if (!data) {
        throw new Error('服务异常');
      }

      // 错误码处理
      const code: number = data.code;
      
      // 当前路径
      const currentPath = window.location.pathname;
      
      // 如果当前在欢迎页，根路径或登录页，直接跳过认证错误处理
      if (isPublicPath(currentPath)) {
        if (code === 40100 || code === 40300) {
          console.log('公开页面忽略认证错误:', currentPath);
          // 对于40100未登录错误，在公开页面不显示任何提示
          if (code === 40100) {
            return response;
          }
          // 对于40300权限错误，在公开页面只显示提示，不做跳转
          if (code === 40300) {
            showMessageWithDebounce('authError', message.error, '没有访问权限');
            return response;
          }
        }
      }
      
      // 排除公开页面和获取登录信息的API请求
      if (
        (code === 40100 || code === 40300) &&
        !requestPath.includes('user/get/login') &&
        !location.pathname.includes('/user/login')
      ) {
        console.log('认证相关错误，当前路径:', currentPath);
        
        // 如果在公开页面，不显示任何消息或重定向
        if (isPublicPath(currentPath)) {
          console.log('在公开页面访问需要权限的API，忽略认证错误');
          // 返回修改后的响应允许继续处理
          return response;
        }
        
        // 从这里开始处理非公开页面的认证/授权错误
        if (code === 40300) {
          showMessageWithDebounce('authError', message.error, '没有访问权限');
          // 对于权限问题，重定向到首页
          history.push('/welcome');
        } else {
          // 对于认证问题，重定向到登录页
            const redirectTo = location.pathname;
            // 使用带超时的跳转，避免在重定向过程中立即重新请求
            let didShowMessage = showMessageWithDebounce('authError', message.error, '登录已过期，请重新登录');
            
            // 只有在成功显示消息后才进行重定向，避免多次重定向
            if (didShowMessage) {
              setTimeout(() => {
              // 使用history.push而不是window.location.href跳转
              history.push(`/user/login?redirect=${encodeURIComponent(redirectTo)}`);
              }, 100);
          }
        }
        
        throw new Error(code === 40100 ? '请先登录' : '没有访问权限');
      }

      if (code !== 0) {
        message.error(data.message || '请求失败');
        throw new Error(data.message || '请求失败');
      }
      return response;
    },
  ],
  
  // 错误处理
  errorConfig: {
    // 错误抛出
    errorThrower: (res: any) => {
      const { success, data, errorCode, errorMessage, showType } =
        res as unknown as RequestInterceptors;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showType, data };
        throw error;
      }
    },
    // 错误接收及处理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;
      
      // 处理请求超时
      if (error.message?.includes('timeout')) {
        showMessageWithDebounce('networkError', message.error, '请求超时，请重试');
      }
      
      // 处理网络错误
      if (error.message?.includes('Network Error')) {
        showMessageWithDebounce('networkError', message.error, '网络异常，请检查网络连接');
      }
      
      // 业务错误
      if (error.name === 'BizError') {
        const errorInfo: RequestInterceptors | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              // 不做处理
              break;
            case ErrorShowType.WARN_MESSAGE:
              showMessageWithDebounce('networkError', message.warning, errorMessage || '操作异常');
              break;
            case ErrorShowType.ERROR_MESSAGE:
              showMessageWithDebounce('networkError', message.error, errorMessage || '操作失败');
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                description: errorMessage,
                message: errorCode,
              });
              break;
            case ErrorShowType.REDIRECT:
              // 跳转到指定路由
              if (showMessageWithDebounce('authError', message.error, errorMessage || '请先登录')) {
                history.push('/user/login');
              }
              break;
            default:
              showMessageWithDebounce('networkError', message.error, errorMessage || '操作失败');
          }
        }
      }
      throw error;
    },
  },
};
