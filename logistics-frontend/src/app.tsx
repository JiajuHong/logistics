import Footer from '@/components/Footer';
import type { RunTimeLayoutConfig } from '@umijs/max';
import { history } from '@umijs/max';
import defaultSettings from '../config/defaultSettings';
import { AvatarDropdown } from './components/RightContent/AvatarDropdown';
import { requestConfig } from './requestConfig';
import { getLoginUser } from '@/services/api';
import { App, message } from "antd";
import NoPermissionPage from './pages/403';

const loginPath = '/user/login';
const welcomePath = '/welcome';

// 无需登录即可访问的路径列表
const publicPaths = [welcomePath, loginPath, '/', '/user', '/403', '/404'];

// 添加消息提示防抖，避免短时间内重复提示登录
let lastLoginPromptTime = 0;
const LOGIN_PROMPT_DEBOUNCE = 3000; // 3秒内不重复提示

/**
 * 显示登录提示（带防抖）
 */
const showLoginPrompt = () => {
  // 首先检查当前路径是否是公开页面，如果是则不显示提示
  const { pathname } = window.location;
  if (pathname === welcomePath || pathname === '/' || pathname === loginPath) {
    return false;
  }
  
  const now = Date.now();
  if (now - lastLoginPromptTime > LOGIN_PROMPT_DEBOUNCE) {
    lastLoginPromptTime = now;
    message.error('请先登录');
    return true;
  }
  return false;
};

/**
 * 检查路径是否需要登录
 */
const isAuthRequired = (pathname: string): boolean => {
  // 检查路径是否在公开路径列表中
  if (publicPaths.includes(pathname)) {
    return false;
  }
  // 检查是否以某个公开路径开头
  return !publicPaths.some(path => 
    path !== '/' && pathname.startsWith(path)
  );
};

/**
 * @see  https://umijs.org/zh-CN/plugins/plugin-initial-state
 * */
export async function getInitialState(): Promise<InitialState> {
  const initialState: InitialState = {
    currentUser: undefined,
  };
  
  const { location } = history;
  
  // 如果是登录页或欢迎页或根路径，不需要强制获取用户信息
  if (location.pathname === loginPath || location.pathname === welcomePath || location.pathname === '/') {
    // 尝试获取用户信息但不做强制处理
    try {
      const res = await getLoginUser();
      initialState.currentUser = res.data;
    } catch (error) {
      console.log('未登录状态访问公开页面，无需处理');
    }
    return initialState;
  }
  
  // 对于其他页面，需要尝试获取用户信息
  try {
    // 增加重试逻辑，确保在会话有效但网络延迟情况下能成功获取用户信息
    let retries = 0;
    let success = false;
    
    while (!success && retries < 3) {
      try {
        console.log(`正在获取用户信息，尝试次数：${retries + 1}`);
        const res = await getLoginUser();
        initialState.currentUser = res.data;
        success = true;
        console.log('获取用户信息成功:', res.data);
      } catch (error) {
        retries++;
        console.error(`获取用户信息失败，尝试次数：${retries}`, error);
        if (retries >= 3) {
          throw error;
        }
        // 等待时间随重试次数增加
        await new Promise(resolve => setTimeout(resolve, 500 * retries));
      }
    }
  } catch (error: any) {
    console.error('获取用户信息最终失败:', error);
    
    // 如果用户信息获取失败且当前路径需要权限，则重定向
    if (isAuthRequired(location.pathname)) {
      // 仅在需要授权的页面才重定向到登录页
      if (location.pathname.startsWith('/admin')) {
        // 管理员页面需要登录，重定向到登录页
        setTimeout(() => {
          history.replace(`${loginPath}?redirect=${encodeURIComponent(location.pathname)}`);
        }, 100);
      } else {
        // 其他需要登录的页面直接跳转到欢迎页，不提示登录
        setTimeout(() => {
          // 使用history.replace而不是window.location.href，保留React状态
          history.replace(welcomePath);
        }, 100);
      }
    }
    
    // 允许非授权页面在未登录状态下访问
    return initialState;
  }
  
  // 权限判断 - 如果访问管理页面但不是管理员，则显示403页面
    if (location.pathname.startsWith('/admin') && 
        initialState.currentUser && 
        initialState.currentUser.userRole !== 'admin') {
    console.log('用户无管理员权限，跳转到403页面');
    // 访问管理员页面但没有权限时，不进行跳转，而是直接在onPageChange中让系统处理
      message.error('您没有管理员权限');
    return initialState; // 返回初始状态，让后续的权限检查处理
  }
  
  return initialState;
}

// 统一消息提示配置
message.config({
  top: 60, // 距离顶部的距离
  duration: 2, // 持续时间
  maxCount: 3, // 最大显示数量
});

// 运行时配置App组件
export function rootContainer(container: React.ReactNode) {
  return <App>{container}</App>;
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
// @ts-ignore
export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    avatarProps: {
      render: () => {
        return <AvatarDropdown />;
      },
    },
    waterMarkProps: {
      content: initialState?.currentUser?.userName,
    },
    footerRender: () => <Footer />,
    menuHeaderRender: undefined,
    // 使用自定义的403页面
    unAccessible: <NoPermissionPage />, // 使用我们自定义的403页面组件
    ...defaultSettings,
    // 添加菜单数据渲染函数，控制未登录状态下的菜单显示
    menuDataRender: (menuData) => {
      // 如果用户未登录，只显示欢迎页菜单
      if (!initialState?.currentUser) {
        return menuData.filter(item => item.path === '/welcome');
      }
      
      // 如果用户已登录但非管理员，隐藏管理页菜单
      if (initialState.currentUser && initialState.currentUser.userRole !== 'admin') {
        return menuData.filter(item => item.path !== '/admin');
      }
      
      // 已登录用户显示全部菜单
      return menuData;
    },
    // 增加访问前的权限验证
    onPageChange: () => {
      const { location } = history;
      
      // 已经在登录页面或欢迎页面或根路径，不需要进一步处理
      if (location.pathname === loginPath || location.pathname === welcomePath || location.pathname === '/' || !isAuthRequired(location.pathname)) {
        return;
      }
      
      // 如果没有登录，且访问受限页面，重定向
      if (!initialState?.currentUser) {
        // 管理员页面需要提示登录
        if (location.pathname.startsWith('/admin')) {
          showLoginPrompt();
          
          // 延迟跳转，避免与消息提示冲突
          setTimeout(() => {
            history.push(`${loginPath}?redirect=${encodeURIComponent(location.pathname)}`);
          }, 100);
        } else {
          // 其他需要登录的页面直接跳转到欢迎页，不提示登录
          setTimeout(() => {
            // 使用history.push而不是window.location.href，保留React状态
          history.push(welcomePath);
          }, 100);
        }
        return;
      }
      
      // 如果是管理员页面，但没有管理员权限，则显示403页面
      if (location.pathname.startsWith('/admin') && 
          initialState?.currentUser && 
          initialState?.currentUser.userRole !== 'admin') {
        console.log('尝试访问管理员页面但没有权限:', initialState?.currentUser?.userRole);
        // 这里不做跳转，让系统自动显示403页面
      }
    },
  };
};

/**
 * @name request 配置，可以配置错误处理
 * 它基于 axios 和 ahooks 的 useRequest 提供了一套统一的网络请求和错误处理方案。
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request = requestConfig;
