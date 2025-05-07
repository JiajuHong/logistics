import { request } from 'umi';

/**
 * 获取订单列表
 * @param {Object} params - 查询参数
 * @return {Promise<any>} 响应结果
 */
export async function getOrders(params) {
  return request('/api/order/list', {
    method: 'GET',
    params,
  });
}

/**
 * 获取订单详情
 * @param {number} id - 订单ID
 * @return {Promise<any>} 响应结果
 */
export async function getOrderDetail(id) {
  return request(`/api/order/get`, {
    method: 'GET',
    params: { id },
  });
}

/**
 * 批量计算多个订单的路径
 * @param {Object} params - 批量计算参数
 * @param {Array<number>} params.orderIds - 订单ID列表
 * @param {number} params.trafficFactor - 交通因子
 * @param {boolean} params.priorityOrder - 是否按优先级排序
 * @return {Promise<any>} 响应结果
 */
export async function batchCalculateRoutes(params) {
  // 导入routeService中的方法确保统一处理
  const routeService = require('./backend/routeService');
  return routeService.batchCalculateRoutes(params);
}

/**
 * 更新订单状态
 * @param {number} id - 订单ID
 * @param {string} status - 状态值
 * @return {Promise<any>} 响应结果
 */
export async function updateOrderStatus(id, status) {
  return request('/api/transport-order/status', {
    method: 'POST',
    data: { id, status },
  });
}

/**
 * 更新订单优先级
 * @param {number} id - 订单ID
 * @param {string} priority - 优先级
 * @return {Promise<any>} 响应结果
 */
export async function updateOrderPriority(id, priority) {
  return request('/api/transport-order/priority', {
    method: 'POST',
    data: { id, priority },
  });
}

/**
 * 创建运输任务
 * @param {Object} taskData - 任务数据
 * @return {Promise<any>} 响应结果
 */
export async function createTransportTask(taskData) {
  return request('/api/transport-task/create', {
    method: 'POST',
    data: taskData,
  });
} 