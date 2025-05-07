/**
 * 调试工具函数集合
 * 用于在控制台中分析和输出复杂数据结构
 */

import { OptimalRouteVO } from '@/typings/route';

// Explicitly declare the module
export {}; 

interface RouteAnalysisResult {
  valid: boolean;
  reason?: string;
  validPointsCount?: number;
  totalPoints?: number;
  namedPointsCount?: number;
  totalDistance?: number;
  estimatedTime?: number;
  firstPoint?: any;
  lastPoint?: any;
}

interface PathPointsSearchResult {
  found: boolean;
  pathPoints?: any[];
  path?: string;
}

/**
 * 深度分析路径规划数据
 * @param {Object} routeData 路径规划数据对象
 * @return {Object} 分析结果
 */
export function analyzeRouteData(routeData: any): RouteAnalysisResult {
  if (!routeData) {
    console.error('路径数据为空');
    return { valid: false, reason: '路径数据为空' };
  }
  
  // 记录数据类型和基本结构
  console.group('路径数据分析');
  console.log('数据类型:', typeof routeData);
  console.log('顶级属性:', Object.keys(routeData));
  
  // 检查pathPoints
  let pathPoints = null;
  let path: string[] = [];
  
  // 检查各种可能的嵌套结构
  if (routeData.pathPoints && Array.isArray(routeData.pathPoints)) {
    pathPoints = routeData.pathPoints;
    console.log('结构: data.pathPoints[]');
  } else if (routeData.route && routeData.route.pathPoints && Array.isArray(routeData.route.pathPoints)) {
    pathPoints = routeData.route.pathPoints;
    console.log('结构: data.route.pathPoints[]');
  } else if (routeData.data && routeData.data.pathPoints && Array.isArray(routeData.data.pathPoints)) {
    pathPoints = routeData.data.pathPoints;
    console.log('结构: data.data.pathPoints[]');
  } else if (routeData.result && routeData.result.pathPoints && Array.isArray(routeData.result.pathPoints)) {
    pathPoints = routeData.result.pathPoints;
    console.log('结构: data.result.pathPoints[]');
  } else {
    // 递归查找路径点数组
    const foundPath = findPathPoints(routeData);
    if (foundPath.found) {
      pathPoints = foundPath.pathPoints;
      console.log(`结构: ${foundPath.path}`);
    }
  }
  
  if (!pathPoints) {
    console.error('未找到路径点数组');
    console.groupEnd();
    return { valid: false, reason: '未找到路径点数组' };
  }
  
  console.log('路径点数量:', pathPoints.length);
  
  // 分析路径点
  if (pathPoints.length === 0) {
    console.warn('路径点数组为空');
    console.groupEnd();
    return { valid: false, reason: '路径点数组为空' };
  }
  
  // 检查第一个和最后一个路径点
  console.log('第一个路径点:', pathPoints[0]);
  console.log('最后一个路径点:', pathPoints[pathPoints.length - 1]);
  
  // 检查路径点字段
  const firstPoint = pathPoints[0];
  console.log('路径点字段:', Object.keys(firstPoint));
  
  // 检查路径点的必要属性
  const invalidPoints = pathPoints.filter((point: any) => 
    !point || 
    typeof point.longitude !== 'number' || 
    typeof point.latitude !== 'number' ||
    isNaN(point.longitude) || 
    isNaN(point.latitude)
  );
  
  if (invalidPoints.length > 0) {
    console.error(`${invalidPoints.length}个路径点缺少有效的经纬度信息`);
    console.groupEnd();
    return { 
      valid: invalidPoints.length < pathPoints.length, 
      reason: `${invalidPoints.length}个路径点缺少有效的经纬度信息` 
    };
  }
  
  // 统计有效/无效路径点
  const validPoints = pathPoints.filter((point: any) => 
    point && 
    typeof point.longitude === 'number' && 
    typeof point.latitude === 'number' &&
    !isNaN(point.longitude) && 
    !isNaN(point.latitude)
  );
  
  console.log('有效路径点数量:', validPoints.length);
  console.log('无效路径点数量:', pathPoints.length - validPoints.length);
  
  // 检查站点名称
  const pointsWithName = pathPoints.filter((point: any) => !!point.stationName);
  console.log('有站点名称的点数量:', pointsWithName.length);
  
  // 检查总距离和预计时间
  console.log('总距离:', extractValue(routeData, 'totalDistance'));
  console.log('预计时间:', extractValue(routeData, 'estimatedTime'));
  
  console.groupEnd();
  
  return {
    valid: validPoints.length >= 2,
    validPointsCount: validPoints.length,
    totalPoints: pathPoints.length,
    namedPointsCount: pointsWithName.length,
    totalDistance: extractValue(routeData, 'totalDistance'),
    estimatedTime: extractValue(routeData, 'estimatedTime'),
    firstPoint: pathPoints[0],
    lastPoint: pathPoints[pathPoints.length - 1]
  };
}

/**
 * 递归查找对象中的pathPoints数组
 * @param {Object} obj 要搜索的对象
 * @param {string} currentPath 当前路径
 * @return {Object} 查找结果
 */
function findPathPoints(obj: any, currentPath = 'data'): PathPointsSearchResult {
  if (!obj || typeof obj !== 'object') {
    return { found: false };
  }
  
  // 直接查找pathPoints属性
  if (Array.isArray(obj.pathPoints)) {
    return { 
      found: true, 
      pathPoints: obj.pathPoints,
      path: `${currentPath}.pathPoints[]`
    };
  }
  
  // 递归搜索子对象
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object') {
      const result = findPathPoints(obj[key], `${currentPath}.${key}`);
      if (result.found) {
        return result;
      }
    }
  }
  
  return { found: false };
}

/**
 * 从数据中提取特定值，兼容多种结构
 * @param {Object} data 数据对象
 * @param {string} key 要提取的键
 * @return {*} 提取的值
 */
function extractValue(data: any, key: string): any {
  if (data[key] !== undefined) {
    return data[key];
  }
  
  if (data.route && data.route[key] !== undefined) {
    return data.route[key];
  }
  
  if (data.data && data.data[key] !== undefined) {
    return data.data[key];
  }
  
  if (data.result && data.result[key] !== undefined) {
    return data.result[key];
  }
  
  return undefined;
} 