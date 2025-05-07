// 任务类型定义
export interface TransportTaskType {
  id: number;
  taskNo: string;
  orderId: number;
  orderNo: string;
  vehicleId?: number;
  vehicleNo?: string;
  driverId?: number;
  driverName?: string;
  sourceId: number;
  sourceName: string;
  targetId: number;
  targetName: string;
  estimatedDistance?: number;
  actualDistance?: number;
  plannedStart: Date;
  plannedEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  assignTime?: Date;
  status: number;
  statusName: string;
  remark?: string;
  createTime: Date;
  updateTime?: Date;
}

// 任务状态枚举
export const TaskStatus = {
  PENDING: 0,      // 待分配
  ASSIGNED: 1,     // 待执行
  IN_PROGRESS: 2,  // 执行中
  COMPLETED: 3,    // 已完成
  CANCELLED: 4,    // 已取消
};

// 状态颜色映射
export const TaskStatusColorMap = {
  [TaskStatus.PENDING]: '#1890ff',      // 蓝色
  [TaskStatus.ASSIGNED]: '#fa8c16',     // 橙色
  [TaskStatus.IN_PROGRESS]: '#52c41a',  // 绿色
  [TaskStatus.COMPLETED]: '#d9d9d9',    // 灰色
  [TaskStatus.CANCELLED]: '#f5222d',    // 红色
}; 