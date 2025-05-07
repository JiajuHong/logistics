/**
 * 地图配置 - 使用AntV L7实现
 */

// 颜色配置：不同级别区域使用不同颜色
export const REGION_COLORS = {
  // 省级区域
  PROVINCE: '#5B8FF9',
  // 市级区域  
  CITY: '#5AD8A6',
  // 区/县级区域
  DISTRICT: '#F6BD16',
  // 街道/乡镇级
  STREET: '#E8684A'
};

// 地图样式配置
export const MAP_STYLE = {
  // 光明风格
  LIGHT: 'light',
  // 暗黑风格
  DARK: 'dark',
  // 标准风格
  NORMAL: 'normal'
};

// 行政区划级别
export const DISTRICT_LEVEL = {
  // 国家
  COUNTRY: 'country', 
  // 省级
  PROVINCE: 'province',
  // 市级  
  CITY: 'city',
  // 区县级
  DISTRICT: 'district'
};

// 地图默认配置
export const DEFAULT_MAP_CONFIG = {
  // 默认缩放级别
  zoom: 4,
  // 中国中心点
  center: [107.9, 34.5],
  // 默认地图样式
  style: MAP_STYLE.LIGHT,
  // 地图容器高度
  height: 'calc(100vh - 260px)',
  // 地图容器ID
  container: 'map-container',
  // 启用缩放控制
  enableZoom: true,
  // 启用平移
  enablePan: true,
  // 启用旋转
  enableRotate: false,
  // 启用倾斜
  enablePitch: false,
  // 显示比例尺
  showScale: true
}; 