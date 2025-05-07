/**
 * 车辆相关类型定义
 */

export interface VehicleType {
  id?: number;
  vehicleNo: string | undefined; // 车牌号
  vehicleType: string | undefined; // 车辆类型
  loadCapacity: number | undefined; // 载重量（吨）
  volumeCapacity: number | undefined; // 容积（立方米）
  stationId?: number; // 当前所属站点ID
  stationName?: string; // 站点名称（关联查询）
  driverId?: number; // 默认司机ID
  driverName?: string; // 司机姓名（关联查询）
  status: number | undefined; // 状态：0-维修中, 1-空闲, 2-任务中
  createTime?: string;
  updateTime?: string;
}

// 车辆状态枚举
export enum VehicleStatus {
  MAINTENANCE = 0, // 维修中
  IDLE = 1, // 空闲
  IN_TASK = 2, // 任务中
}

// 车辆状态映射
export const vehicleStatusMap: Record<number, { text: string; color: string }> = {
  [VehicleStatus.MAINTENANCE]: { text: '维修中', color: 'orange' },
  [VehicleStatus.IDLE]: { text: '空闲', color: 'green' },
  [VehicleStatus.IN_TASK]: { text: '任务中', color: 'blue' },
};

// 车辆查询参数
export interface VehicleQueryParams {
  current?: number;
  pageSize?: number;
  vehicleNo?: string;
  vehicleType?: string;
  status?: number;
  stationId?: number;
  driverId?: number;
}

// 车辆统计信息
export interface VehicleStatistics {
  total: number;
  idle: number;
  inTask: number;
  maintenance: number;
} 