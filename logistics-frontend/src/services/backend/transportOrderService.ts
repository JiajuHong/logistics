import { request } from '@umijs/max';

/**
 * 获取订单列表
 * @param params 查询参数
 */
export async function getOrders(params: {
  status?: string;
  customerId?: number;
  startDate?: string;
  endDate?: string;
}) {
  return request('/api/order/list', {
    method: 'GET',
    params,
  });
}

/**
 * 获取订单详情
 * @param id 订单ID
 */
export async function getOrderDetail(id: number) {
  return request('/api/order/get', {
    method: 'GET',
    params: { id },
  });
}

/**
 * 批量计算多个订单的路径
 * @param data 批量计算参数
 */
export async function batchCalculateRoutes(data: {
  orderIds: number[];
  trafficFactor?: number;
  priorityOrder?: boolean;
}) {
  // 这里使用routeService中的batchCalculateRoutes，确保逻辑统一
  // 导入routeService的方法进行调用
  const { batchCalculateRoutes } = require('./routeService');
  return batchCalculateRoutes(data);
}

/**
 * 更新订单状态
 * @param id 订单ID
 * @param status 状态值
 */
export async function updateOrderStatus(id: number, status: string) {
  return request('/api/order/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: { id, status },
  });
}

/**
 * 更新订单优先级
 * @param id 订单ID
 * @param priority 优先级
 */
export async function updateOrderPriority(id: number, priority: string) {
  return request('/api/order/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: { id, priority },
  });
}

/**
 * 获取订单状态统计
 */
export async function getOrderStatistics() {
  return request('/api/order/stat', {
    method: 'GET',
  });
}

/**
 * 取消订单
 * @param id 订单ID
 */
export async function cancelOrder(id: number) {
  return request('/api/order/cancel', {
    method: 'POST',
    params: { id },
  });
} 