// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** addStation POST /api/station/add */
export async function addStationUsingPost(
  body: API.StationAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/station/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteStation POST /api/station/delete */
export async function deleteStationUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/station/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getStationById GET /api/station/get */
export async function getStationByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getStationByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseStationVO_>('/api/station/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listStation GET /api/station/list */
export async function listStationUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listStationUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListStationVO_>('/api/station/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listStationByPage GET /api/station/list/page */
export async function listStationByPageUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listStationByPageUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageStationVO_>('/api/station/list/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** updateStation POST /api/station/update */
export async function updateStationUsingPost(
  body: API.StationUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/station/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
