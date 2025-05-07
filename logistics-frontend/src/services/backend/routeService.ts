import { request } from '@umijs/max';
import { OptimalRouteVO, PathPointVO } from '@/typings/route';
import { message } from 'antd';
import { analyzeRouteData } from '@/utils/debugUtils';

/**
 * 获取最优路径
 * @param fromStationId 起点站点ID
 * @param toStationId 终点站点ID
 * @param forceRefresh 是否强制刷新缓存
 */
export async function getOptimalRoute(
  fromStationId: number, 
  toStationId: number,
  forceRefresh: boolean = false
): Promise<OptimalRouteVO> {
  try {
    // 记录请求
    console.log('发起路径规划请求:', { fromStationId, toStationId });
    
    const response = await request<OptimalRouteVO>('/api/route/optimal', {
      method: 'GET',
      params: { fromStationId, toStationId, forceRefresh }
    });
    
    console.log('后端返回原始数据:', response);
    
    // 使用调试工具分析响应数据
    const analysis = analyzeRouteData(response);
    console.log('路径数据分析结果:', analysis);
    
    // 检查是否为空路径（无pathPoints或pathPoints为空数组）
    if (!analysis.valid) {
      console.warn(`路径数据无效，原因: ${analysis.reason || '未知'}`);
      
      // 创建一个默认的路径 - 不再尝试请求站点API
      console.log('使用默认直线路径');
      
      // 默认的路径点（使用北京为中心的偏移坐标模拟）
      const defaultPoints: PathPointVO[] = [
        {
          stationId: String(fromStationId),
          stationName: `站点${fromStationId}`,
          longitude: 116.397428, // 默认经度（可根据实际情况调整）
          latitude: 39.90923    // 默认纬度（可根据实际情况调整）
        },
        {
          stationId: String(toStationId),
          stationName: `站点${toStationId}`,
          longitude: 116.427428, // 稍微偏移一点以形成直线
          latitude: 39.91923
        }
      ];
      
      // 设置一个默认距离和时间
      const defaultDistance = 5.0;  // 默认5公里
      const defaultTime = 15;      // 默认15分钟
      
      return {
        fromStationId: String(fromStationId),
        toStationId: String(toStationId),
        pathPoints: defaultPoints,
        totalDistance: defaultDistance,
        estimatedTime: defaultTime,
        isDefault: true  // 标记这是默认生成的路径
      };
    }
    
    // 对响应数据进行标准化处理
    return normalizeRouteResponse(response);
  } catch (error) {
    console.error('获取最优路径失败:', error);
    message.error('获取最优路径失败，使用默认路径');
    
    // 发生错误时同样返回默认路径
    return {
      fromStationId: String(fromStationId),
      toStationId: String(toStationId),
      pathPoints: [
        {
          stationId: String(fromStationId),
          stationName: `站点${fromStationId}`,
          longitude: 116.397428,
          latitude: 39.90923
        },
        {
          stationId: String(toStationId),
          stationName: `站点${toStationId}`,
          longitude: 116.427428,
          latitude: 39.91923
        }
      ],
      totalDistance: 5.0,
      estimatedTime: 15,
      error: true,
      isDefault: true
    };
  }
}

/**
 * 计算两点之间的距离（公里）
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10; // 保留一位小数
}

/**
 * 获取最优路径（带高级参数）
 * @param params 路径规划参数
 */
export async function getOptimalRouteAdvanced(params: {
  fromStationId: number;
  toStationId: number;
  distanceWeight?: number;
  timeWeight?: number;
  costWeight?: number;
  trafficFactor?: number;
  enforceTransfer?: boolean;
}): Promise<OptimalRouteVO> {
  try {
    // 记录请求
    console.log('发起高级路径规划请求:', params);
    
    const response = await request<OptimalRouteVO>('/api/route/optimal-advanced', {
      method: 'POST',
      data: params
    });
    
    console.log('后端返回高级路径原始数据:', response);
    
    // 使用调试工具分析响应数据
    const analysis = analyzeRouteData(response);
    console.log('高级路径数据分析结果:', analysis);
    
    // 检查是否为空路径（无pathPoints或pathPoints为空数组）
    if (!analysis.valid) {
      console.warn(`高级路径数据无效，原因: ${analysis.reason || '未知'}`);
      
      // 创建一个默认的路径 - 使用默认坐标
      console.log('使用默认直线路径');
      
      // 考虑交通因子影响默认距离
      let defaultDistance = 5.0;
      if (params.trafficFactor && params.trafficFactor > 1.0) {
        defaultDistance = defaultDistance * params.trafficFactor;
      }
      
      // 估算时间受交通因子影响
      const defaultTime = Math.round(15 * (params.trafficFactor || 1.0));
      
      return {
        fromStationId: String(params.fromStationId),
        toStationId: String(params.toStationId),
        pathPoints: [
          {
            stationId: String(params.fromStationId),
            stationName: `站点${params.fromStationId}`,
            longitude: 116.397428,
            latitude: 39.90923
          },
          {
            stationId: String(params.toStationId),
            stationName: `站点${params.toStationId}`,
            longitude: 116.427428,
            latitude: 39.91923
          }
        ],
        totalDistance: defaultDistance,
        estimatedTime: defaultTime,
        isDefault: true
      };
    }
    
    // 对响应数据进行标准化处理
    return normalizeRouteResponse(response);
  } catch (error) {
    console.error('获取高级最优路径失败:', error);
    message.error('获取高级最优路径失败，使用默认路径');
    
    // 发生错误时同样返回默认路径
    return {
      fromStationId: String(params.fromStationId),
      toStationId: String(params.toStationId),
      pathPoints: [
        {
          stationId: String(params.fromStationId),
          stationName: `站点${params.fromStationId}`,
          longitude: 116.397428,
          latitude: 39.90923
        },
        {
          stationId: String(params.toStationId),
          stationName: `站点${params.toStationId}`,
          longitude: 116.427428,
          latitude: 39.91923
        }
      ],
      totalDistance: 5.0,
      estimatedTime: 15,
      error: true,
      isDefault: true
    };
  }
}

/**
 * 批量计算多个订单的路径
 * @param data 批量计算参数
 */
export async function batchCalculateRoutes(data: {
  orderIds: number[];
  trafficFactor?: number;
  priorityOrder?: boolean;
}) {
  // 从订单服务获取订单详情，构建符合接口要求的请求
  const orderPromises = data.orderIds.map(orderId => 
    request('/api/order/get', {
      method: 'GET',
      params: { id: orderId }
    })
  );

  try {
    // 等待所有订单详情加载完成
    const orderDetails = await Promise.all(orderPromises);
    
    // 构建BatchRouteRequest格式的请求体
    const batchRequest = {
      routes: orderDetails.map((orderDetail, index) => {
        const order = orderDetail.data;
        // 提取必要字段，确保fromStationId和toStationId存在
        return {
          fromStationId: order.sourceStationId,
          toStationId: order.targetStationId,
          // 如果订单有优先级，使用订单优先级；否则使用索引作为优先级（倒序）
          priority: order.priority || (data.priorityOrder ? (data.orderIds.length - index) : 5)
        };
      }),
      // 添加其他可选参数
      trafficFactor: data.trafficFactor
    };
    
    // 发送批量路径规划请求
    return request('/api/route/batch-optimal', {
      method: 'POST',
      data: batchRequest
    });
  } catch (error) {
    console.error('构建批量路径请求失败:', error);
    throw error;
  }
}

/**
 * 获取两站点间直接路线
 * @param fromStationId 起点站点ID
 * @param toStationId 终点站点ID
 */
export async function getDirectRoutes(fromStationId: number, toStationId: number) {
  return request('/api/route/list', {
    method: 'GET',
    params: { fromStationId, toStationId }
  });
}

/**
 * 分析路径网络完整性(管理员功能)
 */
export async function analyzeNetwork() {
  return request('/api/route/analyze-network', {
    method: 'GET'
  });
}

/**
 * 标准化路径响应数据
 * 确保所有必要的字段都存在，并处理可能的空值或无效值
 */
function normalizeRouteResponse(response: any): OptimalRouteVO {
  console.log('正在标准化路径响应数据:', JSON.stringify(response));
  
  if (!response) {
    console.error('响应为空，返回空路径数据');
    return {
      fromStationId: '',
      toStationId: '',
      pathPoints: [],
      totalDistance: 0,
      estimatedTime: 0
    };
  }
  
  // 确保pathPoints是一个数组
  let pathPoints = response.pathPoints || [];
  console.log('原始路径点:', pathPoints);
  
  // 检查各种可能的嵌套结构
  if (pathPoints.length === 0) {
    // 检查route嵌套结构
    if (response.route && response.route.pathPoints) {
      console.log('在route属性中找到pathPoints');
      pathPoints = response.route.pathPoints;
    }
    // 检查data嵌套结构
    else if (response.data && response.data.pathPoints) {
      console.log('在data属性中找到pathPoints');
      pathPoints = response.data.pathPoints;
    }
    // 检查result嵌套结构
    else if (response.result && response.result.pathPoints) {
      console.log('在result属性中找到pathPoints');
      pathPoints = response.result.pathPoints;
    }
  }
  
  console.log('处理后的路径点数组:', pathPoints);
  
  // 确保所有点都有经纬度
  const validPathPoints = pathPoints.filter((point: any) => 
    point && 
    typeof point.longitude === 'number' && 
    typeof point.latitude === 'number' &&
    !isNaN(point.longitude) && 
    !isNaN(point.latitude)
  );
  
  console.log('有效路径点数量:', validPathPoints.length);
  if (validPathPoints.length !== pathPoints.length) {
    console.warn('部分路径点无效，被过滤掉了', pathPoints.length - validPathPoints.length, '个点');
  }
  
  // 提取或设置默认距离和时间
  let totalDistance = 0;
  if (response.totalDistance !== undefined && !isNaN(response.totalDistance)) {
    totalDistance = response.totalDistance;
  } else if (response.route && response.route.totalDistance !== undefined && !isNaN(response.route.totalDistance)) {
    totalDistance = response.route.totalDistance;
  } else if (validPathPoints.length >= 2) {
    // 计算简单直线距离
    for (let i = 0; i < validPathPoints.length - 1; i++) {
      const p1 = validPathPoints[i];
      const p2 = validPathPoints[i + 1];
      totalDistance += calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
    }
    console.log('计算的总距离:', totalDistance);
  }
  
  let estimatedTime = 0;
  if (response.estimatedTime !== undefined && !isNaN(response.estimatedTime)) {
    estimatedTime = response.estimatedTime;
  } else if (response.route && response.route.estimatedTime !== undefined && !isNaN(response.route.estimatedTime)) {
    estimatedTime = response.route.estimatedTime;
  } else if (totalDistance > 0) {
    // 假设平均速度50km/h，计算时间（分钟）
    estimatedTime = Math.round(totalDistance / 50 * 60);
    console.log('计算的预计时间:', estimatedTime);
  }
  
  const normalizedResponse = {
    fromStationId: String(response.fromStationId || ''),
    toStationId: String(response.toStationId || ''),
    pathPoints: validPathPoints,
    totalDistance,
    estimatedTime
  };
  
  console.log('标准化后的路径数据:', normalizedResponse);
  return normalizedResponse;
}
