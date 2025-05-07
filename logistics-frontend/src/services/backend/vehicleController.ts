// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** addVehicle POST /api/vehicle/add */
export async function addVehicleUsingPost(
  body: API.VehicleAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/vehicle/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteVehicle POST /api/vehicle/delete */
export async function deleteVehicleUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/vehicle/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getVehicleById GET /api/vehicle/get */
export async function getVehicleByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getVehicleByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseVehicleVO_>('/api/vehicle/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listVehicle GET /api/vehicle/list */
export async function listVehicleUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listVehicleUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListVehicleVO_>('/api/vehicle/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listVehicleByPage GET /api/vehicle/list/page */
export async function listVehicleByPageUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listVehicleByPageUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageVehicleVO_>('/api/vehicle/list/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** getVehicleStatistics GET /api/vehicle/statistics */
export async function getVehicleStatisticsUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseVehicleStatisticsVO_>('/api/vehicle/statistics', {
    method: 'GET',
    ...(options || {}),
  });
}

/** listVehicleTypes GET /api/vehicle/types */
export async function listVehicleTypesUsingGet(options?: { [key: string]: any }) {
  return request<API.BaseResponseListString_>('/api/vehicle/types', {
    method: 'GET',
    ...(options || {}),
  });
}

/** updateVehicle POST /api/vehicle/update */
export async function updateVehicleUsingPost(
  body: API.VehicleUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/vehicle/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** 获取可用（空闲状态）车辆列表 GET /api/vehicle/available */
export async function listAvailableVehiclesUsingGet(
  options?: { [key: string]: any },
) {
  return request<any>('/api/vehicle/available', {
    method: 'GET',
    ...(options || {}),
  });
}
