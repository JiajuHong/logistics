// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** addRegion POST /api/region/add */
export async function addRegionUsingPost(
  body: API.RegionAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/region/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteRegion POST /api/region/delete */
export async function deleteRegionUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/region/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getRegionById GET /api/region/get */
export async function getRegionByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getRegionByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseRegionVO_>('/api/region/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listRegion GET /api/region/list */
export async function listRegionUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listRegionUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListRegionVO_>('/api/region/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listRegionByPage GET /api/region/list/page */
export async function listRegionByPageUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listRegionByPageUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageRegionVO_>('/api/region/list/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** updateRegion POST /api/region/update */
export async function updateRegionUsingPost(
  body: API.RegionUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/region/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
