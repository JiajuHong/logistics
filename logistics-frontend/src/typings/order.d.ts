// 订单类型定义
export interface TransportOrderType {
  id: number;
  orderNo: string;
  customerId: number;
  customerName?: string;
  customerCompany?: string;
  sourceStationId: number;
  sourceStationName?: string;
  targetStationId: number;
  targetStationName?: string;
  cargoDesc?: string;
  weight: number;
  volume: number;
  amount?: number;
  expectedPickup?: Date;
  expectedDelivery?: Date;
  actualPickup?: Date;
  actualDelivery?: Date;
  status: number;
  statusName?: string;
  remark?: string;
  createTime?: Date;
  assignTime?: Date;    // 订单分配时间
  startTransportTime?: Date; // 开始运输时间
  completeTime?: Date;  // 订单完成时间
  cancelTime?: Date;    // 订单取消时间
  rejectTime?: Date;    // 订单拒绝时间
}

// 订单查询参数
export interface TransportOrderQueryParams {
  id?: number;
  orderNo?: string;
  customerId?: number;
  sourceStationId?: number;
  targetStationId?: number;
  cargoDesc?: string;
  minWeight?: number;
  maxWeight?: number;
  minVolume?: number;
  maxVolume?: number;
  expectedDeliveryStart?: Date;
  expectedDeliveryEnd?: Date;
  status?: number;
  hasTask?: boolean;
  createTimeStart?: Date;
  createTimeEnd?: Date;
  current?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: string;
}

// 订单状态统计数据
export interface OrderStatistics {
  total: number;
  pending: number;
  assigned: number;
  inTransit: number;
  completed: number;
  cancelled: number;
  rejected: number;
}

// 订单状态枚举
export enum OrderStatus {
  PENDING = 0,      // 待分配
  ASSIGNED = 1,     // 已分配
  IN_TRANSIT = 2,   // 运输中
  COMPLETED = 3,    // 已完成
  CANCELLED = 4,    // 已取消
  REJECTED = 5      // 已拒绝
}

// 订单状态名称映射
export const OrderStatusMap = {
  [OrderStatus.PENDING]: '待分配',
  [OrderStatus.ASSIGNED]: '已分配',
  [OrderStatus.IN_TRANSIT]: '运输中',
  [OrderStatus.COMPLETED]: '已完成',
  [OrderStatus.CANCELLED]: '已取消',
  [OrderStatus.REJECTED]: '已拒绝'
};

// 订单状态颜色映射
export const OrderStatusColorMap: {
  [key: number]: string;
  [OrderStatus.PENDING]: string;
  [OrderStatus.ASSIGNED]: string;
  [OrderStatus.IN_TRANSIT]: string;
  [OrderStatus.COMPLETED]: string;
  [OrderStatus.CANCELLED]: string;
  [OrderStatus.REJECTED]: string;
} = {
  [OrderStatus.PENDING]: '#faad14',     // 黄色
  [OrderStatus.ASSIGNED]: '#1890ff',    // 蓝色
  [OrderStatus.IN_TRANSIT]: '#722ed1',  // 蓝紫色
  [OrderStatus.COMPLETED]: '#52c41a',   // 绿色
  [OrderStatus.CANCELLED]: '#f5222d',   // 红色
  [OrderStatus.REJECTED]: '#f5222d'     // 红色
};