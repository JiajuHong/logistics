import { request } from 'umi';

/**
 * 获取最优路径
 * @param {Object} params - 路径规划参数
 * @param {number} params.fromStationId - 起点站点ID
 * @param {number} params.toStationId - 终点站点ID
 * @param {Object} [params.params] - 高级规划参数
 * @param {number} [params.params.distanceWeight] - 距离权重
 * @param {number} [params.params.timeWeight] - 时间权重
 * @param {number} [params.params.costWeight] - 成本权重
 * @param {number} [params.params.trafficFactor] - 交通因子
 * @param {boolean} [params.params.enforceTransfer] - 强制区域中转
 * @return {Promise<any>} 响应结果
 */
export async function getOptimalRoute(params) {
  const { fromStationId, toStationId, params: planningParams } = params;
  
  // 如果有高级参数，使用POST请求
  if (planningParams) {
    return request('/api/route/optimal-advanced', {
      method: 'POST',
      data: {
        fromStationId,
        toStationId,
        ...planningParams
      },
    });
  }
  
  // 否则使用GET请求保持向后兼容
  return request('/api/route/optimal', {
    method: 'GET',
    params: { fromStationId, toStationId },
  });
}

/**
 * 获取两站点间的路线列表
 * @param {number} fromStationId - 起点站点ID
 * @param {number} toStationId - 终点站点ID
 * @return {Promise<any>} 响应结果
 */
export async function getRouteList(fromStationId, toStationId) {
  return request('/api/route/list', {
    method: 'GET',
    params: { fromStationId, toStationId },
  });
}

/**
 * 创建路线
 * @param {Object} routeData - 路线数据
 * @return {Promise<any>} 响应结果
 */
export async function createRoute(routeData) {
  return request('/api/route/add', {
    method: 'POST',
    data: routeData,
  });
}

/**
 * 更新路线
 * @param {Object} routeData - 路线数据
 * @return {Promise<any>} 响应结果
 */
export async function updateRoute(routeData) {
  return request('/api/route/update', {
    method: 'POST',
    data: routeData,
  });
}

/**
 * 删除路线
 * @param {number} id - 路线ID
 * @return {Promise<any>} 响应结果
 */
export async function deleteRoute(id) {
  return request(`/api/route/delete/${id}`, {
    method: 'POST',
  });
}

/**
 * 启用/禁用路线
 * @param {number} id - 路线ID
 * @param {number} status - 状态：0-禁用,1-启用
 * @return {Promise<any>} 响应结果
 */
export async function changeRouteStatus(id, status) {
  return request('/api/route/status', {
    method: 'POST',
    data: { id, status },
  });
} 