// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** 分页获取任务列表 GET /api/task/list/page */
export async function listTransportTaskByPageUsingGet(
  params: any, // API.TransportTaskQueryRequest
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/list/page', {
    method: 'GET',
    params: params,
    ...(options || {}),
  });
}

/** 根据任务ID获取任务信息 GET /api/task/get */
export async function getTransportTaskByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: any, // API.getTransportTaskByIdUsingGETParams
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 创建任务 POST /api/task/add */
export async function addTransportTaskUsingPost(
  body: any, // API.TransportTaskAddRequest
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 从订单创建任务 POST /api/task/createFromOrder */
export async function createTaskFromOrderUsingPost(
  body: any, // API.CreateTaskFromOrderRequest
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/createFromOrder', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 分配任务 POST /api/task/assign */
export async function assignTaskUsingPost(
  body: any, // API.TaskAssignRequest
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/assign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 取消任务 POST /api/task/cancel */
export async function cancelTaskUsingPost(
  body: any, // API.IdRequest
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/cancel', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 更新任务状态 POST /api/task/updateStatus */
export async function updateTaskStatusUsingPost(
  body: any, // API.TaskStatusUpdateRequest
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/updateStatus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 删除任务 POST /api/task/delete */
export async function deleteTransportTaskUsingPost(
  body: any, // API.IdRequest
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取任务统计信息 GET /api/task/statistics */
export async function getTaskStatisticsUsingGet(
  options?: { [key: string]: any },
) {
  return request<any>('/api/task/statistics', {
    method: 'GET',
    ...(options || {}),
  });
}
