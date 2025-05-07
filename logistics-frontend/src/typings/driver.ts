// 司机相关类型定义

export type DriverType = API.DriverVO;

// 司机状态定义
export const DRIVER_STATUS = {
  DISABLED: 0, // 停用
  IDLE: 1,     // 空闲
  IN_TASK: 2,  // 任务中
};

// 司机状态映射
export const driverStatusMap = {
  [DRIVER_STATUS.DISABLED]: { text: '停用', color: 'default' },
  [DRIVER_STATUS.IDLE]: { text: '空闲', color: 'success' },
  [DRIVER_STATUS.IN_TASK]: { text: '任务中', color: 'processing' },
};

// 驾照类型选项
export const LICENSE_TYPE_OPTIONS = [
  { label: 'A1', value: 'A1' },
  { label: 'A2', value: 'A2' },
  { label: 'B1', value: 'B1' },
  { label: 'B2', value: 'B2' },
  { label: 'C1', value: 'C1' },
  { label: 'C2', value: 'C2' },
];

// 司机统计信息
export interface DriverStatistics {
  total: number;
  idle: number;
  inTask: number;
  disabled: number;
} 