/**
 * 动态获取后端API地址，支持本机和局域网访问
 * 如果是localhost访问，则API地址使用localhost
 * 如果是IP访问，则API地址使用访问的IP
 */
const getBackendHost = () => {
  const { hostname, protocol } = window.location;
  // 如果是localhost或127.0.0.1，则使用localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8101';
  }
  // 否则使用当前访问的主机名/IP
  return `${protocol}//${hostname}:8101`;
};

/**
 * 本地后端地址
 */
export const BACKEND_HOST_LOCAL = getBackendHost();

/**
 * 线上后端地址
 */
export const BACKEND_HOST_PROD = "http://47.115.219.99";
