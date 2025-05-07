// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** addDriver POST /api/driver/add */
export async function addDriverUsingPost(
  body: API.DriverAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/driver/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteDriver POST /api/driver/delete */
export async function deleteDriverUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/driver/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getDriverById GET /api/driver/get */
export async function getDriverByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getDriverByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseDriverVO_>('/api/driver/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listDriver GET /api/driver/list */
export async function listDriverUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listDriverUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListDriverVO_>('/api/driver/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listAvailableDrivers GET /api/driver/list/available */
export async function listAvailableDriversUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListDriverVO_>('/api/driver/list/available', {
    method: 'GET',
    ...(options || {}),
  });
}

/** listDriverByPage GET /api/driver/list/page */
export async function listDriverByPageUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listDriverByPageUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageDriverVO_>('/api/driver/list/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getDriverStatistics GET /api/driver/statistics */
export async function getDriverStatisticsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseDriverStatisticsVO_>('/api/driver/statistics', {
    method: 'GET',
    ...(options || {}),
  });
}

/** updateDriver POST /api/driver/update */
export async function updateDriverUsingPost(
  body: API.DriverUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/driver/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
