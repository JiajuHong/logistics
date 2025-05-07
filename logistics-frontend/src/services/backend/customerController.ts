// @ts-ignore
/* eslint-disable */
import { request } from '@umijs/max';

/** addCustomer POST /api/customer/add */
export async function addCustomerUsingPost(
  body: API.CustomerAddRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseLong_>('/api/customer/add', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** deleteCustomer POST /api/customer/delete */
export async function deleteCustomerUsingPost(
  body: API.DeleteRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/customer/delete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}

/** getCustomerById GET /api/customer/get */
export async function getCustomerByIdUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.getCustomerByIdUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseCustomerVO_>('/api/customer/get', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listCustomer GET /api/customer/list */
export async function listCustomerUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listCustomerUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseListCustomerVO_>('/api/customer/list', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** listCustomerByPage GET /api/customer/list/page */
export async function listCustomerByPageUsingGet(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: API.listCustomerByPageUsingGETParams,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponsePageCustomerVO_>('/api/customer/list/page', {
    method: 'GET',
    params: {
      ...params,
    },
    ...(options || {}),
  });
}

/** updateCustomer POST /api/customer/update */
export async function updateCustomerUsingPost(
  body: API.CustomerUpdateRequest,
  options?: { [key: string]: any },
) {
  return request<API.BaseResponseBoolean_>('/api/customer/update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    data: body,
    ...(options || {}),
  });
}
