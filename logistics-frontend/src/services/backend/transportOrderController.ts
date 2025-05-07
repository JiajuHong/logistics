// @ts-ignore
/* eslint-disable */
import { request } from 'umi';

/** 添加运输订单 POST /api/order/add */
export async function addTransportOrderUsingPost(
  body: API.TransportOrderAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/order/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 取消订单 POST /api/order/cancel */
export async function cancelOrderUsingPost(
  params: {
    id: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/order/cancel', {
    method: 'POST',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 删除运输订单 POST /api/order/delete */
export async function deleteTransportOrderUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/order/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 根据 id 获取运输订单 GET /api/order/get */
export async function getTransportOrderByIdUsingGet(
  params: {
    id: number;
  },
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseTransportOrderVO_>('/api/order/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取运输订单列表（仅管理员可使用） GET /api/order/list */
export async function listTransportOrderUsingGet(
  params: API.TransportOrderQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListTransportOrderVO_>('/api/order/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 分页获取运输订单列表 GET /api/order/list/page */
export async function listTransportOrderByPageUsingGet(
  params: API.TransportOrderQueryRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageTransportOrderVO_>('/api/order/list/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** 获取订单状态统计 GET /api/order/statistics */
export async function getOrderStatisticsUsingGet(
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseOrderStatistics_>('/api/order/stat', {
    method: 'GET',
    ...(options || {}),
  });
}

/** 更新运输订单 POST /api/order/update */
export async function updateTransportOrderUsingPost(
  body: API.TransportOrderUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/order/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
