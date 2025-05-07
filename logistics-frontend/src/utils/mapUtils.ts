interface AMapWindow extends Window {
  AMap: any;
}

declare global {
  interface Window {
    AMap: any;
    initAMap: () => void;
    _AMapSecurityConfig: {
      securityJsCode: string;
    };
    LZString?: {
      compress: (data: string) => string;
      decompress: (data: string) => string;
    };
  }
}

// 路径缓存接口
interface RouteCache {
  // 缓存键格式: 起点经度,起点纬度|终点经度,终点纬度|途经点1经度,途经点1纬度|...|policy
  [key: string]: {
    timestamp: number;  // 缓存时间戳
    result: any;        // 路径规划结果
    size: number;       // 结果大小（字节）
  };
}

// 全局路径缓存对象
let routeCache: RouteCache = {};

// 缓存有效期（毫秒），默认24小时
const CACHE_EXPIRY = 24 * 60 * 60 * 1000;

// 缓存大小限制（字节），默认10MB
const MAX_CACHE_SIZE = 10 * 1024 * 1024;

// 当前缓存总大小（字节）
let currentCacheSize = 0;

// 全局数组，用于跟踪地图上的所有元素
let allRouteElements: any[] = [];
let routeGuideElements: any[] = [];

// 尝试从localStorage加载缓存
function loadCacheFromStorage() {
  try {
    const storedCache = localStorage.getItem('amapRouteCache');
    if (storedCache) {
      const decompressedData = lzDecompress(storedCache);
      if (decompressedData) {
        routeCache = JSON.parse(decompressedData);
        console.log('从localStorage加载了路径缓存');
        
        // 计算当前缓存大小
        recalculateCacheSize();
        
        // 清理过期缓存
        cleanExpiredCache();
      }
    }
  } catch (error) {
    console.error('加载路径缓存失败:', error);
    routeCache = {};
    currentCacheSize = 0;
  }
}

// 保存缓存到localStorage
function saveCacheToStorage() {
  try {
    const cacheString = JSON.stringify(routeCache);
    const compressedData = lzCompress(cacheString);
    localStorage.setItem('amapRouteCache', compressedData);
    console.log(`路径缓存已保存，压缩前大小: ${formatBytes(cacheString.length)}，压缩后: ${formatBytes(compressedData.length)}`);
  } catch (error) {
    console.error('保存路径缓存失败:', error);
    // 如果存储失败(可能是存储空间已满)，清除一半的缓存条目
    try {
      reduceCache(0.5);
      // 重试保存
      const cacheString = JSON.stringify(routeCache);
      const compressedData = lzCompress(cacheString);
      localStorage.setItem('amapRouteCache', compressedData);
    } catch (e) {
      console.error('重试保存路径缓存失败，清除所有缓存:', e);
      localStorage.removeItem('amapRouteCache');
      routeCache = {};
      currentCacheSize = 0;
    }
  }
}

// 使用LZ-string进行压缩
function lzCompress(data: string): string {
  if (!data) return '';
  
  // 如果LZ-string可用则使用它压缩
  if (typeof window !== 'undefined' && window.LZString) {
    return window.LZString.compress(data);
  }
  
  // 否则返回原始数据
  return data;
}

// 使用LZ-string进行解压缩
function lzDecompress(compressedData: string): string {
  if (!compressedData) return '';
  
  // 如果LZ-string可用则使用它解压缩
  if (typeof window !== 'undefined' && window.LZString) {
    return window.LZString.decompress(compressedData);
  }
  
  // 否则返回原始数据
  return compressedData;
}

// 格式化字节数为可读形式
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 重新计算当前缓存大小
function recalculateCacheSize() {
  currentCacheSize = 0;
  
  Object.keys(routeCache).forEach(key => {
    currentCacheSize += routeCache[key].size;
  });
  
  console.log(`当前缓存总大小: ${formatBytes(currentCacheSize)}`);
}

// 清理过期的缓存条目
function cleanExpiredCache() {
  const now = Date.now();
  let hasExpired = false;
  
  Object.keys(routeCache).forEach(key => {
    if (now - routeCache[key].timestamp > CACHE_EXPIRY) {
      currentCacheSize -= routeCache[key].size;
      delete routeCache[key];
      hasExpired = true;
    }
  });
  
  if (hasExpired) {
    console.log('清理了过期的路径缓存');
    saveCacheToStorage();
  }
}

// 减少缓存大小
function reduceCache(ratio = 0.2) {
  // 按时间排序所有缓存项（最旧的在前）
  const sortedKeys = Object.keys(routeCache).sort((a, b) => 
    routeCache[a].timestamp - routeCache[b].timestamp
  );
  
  // 计算需要删除的数量
  const removeCount = Math.ceil(sortedKeys.length * ratio);
  
  console.log(`缓存空间不足，删除 ${removeCount} 条最旧的缓存记录`);
  
  // 删除最旧的缓存项
  for (let i = 0; i < removeCount && i < sortedKeys.length; i++) {
    currentCacheSize -= routeCache[sortedKeys[i]].size;
    delete routeCache[sortedKeys[i]];
  }
}

// 添加到缓存
function addToCache(key: string, result: any) {
  // 估算结果大小
  const resultString = JSON.stringify(result);
  const resultSize = resultString.length;
  
  // 如果单个结果太大（超过缓存上限的1/5），不缓存
  if (resultSize > MAX_CACHE_SIZE / 5) {
    console.warn(`路线结果过大 (${formatBytes(resultSize)})，超过单项缓存限制，不进行缓存`);
    return false;
  }
  
  // 检查添加后是否会超过总缓存大小限制
  if (currentCacheSize + resultSize > MAX_CACHE_SIZE) {
    // 尝试清理旧数据腾出空间
    reduceCache(0.2);
    
    // 如果仍然不够，清理更多
    if (currentCacheSize + resultSize > MAX_CACHE_SIZE) {
      reduceCache(0.4);
    }
  }
  
  // 添加到缓存
  routeCache[key] = {
    timestamp: Date.now(),
    result: result,
    size: resultSize
  };
  
  // 更新当前缓存大小
  currentCacheSize += resultSize;
  
  console.log(`新增缓存: ${key.substring(0, 20)}...，大小: ${formatBytes(resultSize)}`);
  saveCacheToStorage();
  
  return true;
}

// 在应用启动时加载缓存
loadCacheFromStorage();

/**
 * 初始化高德地图
 */
export function initMap(container: HTMLElement) {
  if (!window.AMap) {
    console.error('AMap is not loaded');
    return null;
  }

  try {
    // 创建地图实例
    const map = new window.AMap.Map(container, {
      zoom: 12,
      viewMode: '2D',
      mapStyle: 'amap://styles/normal',
      resizeEnable: true,
      rotateEnable: true,
      pitchEnable: true,
    });

    // 添加控件
    map.addControl(new window.AMap.Scale());
    map.addControl(new window.AMap.ToolBar({
      position: 'RB'
    }));

    return map;
  } catch (error) {
    console.error('Failed to initialize map:', error);
    return null;
  }
}

/**
 * 绘制路径 - 优化版
 */
export function drawRoute(map: any, pathPoints: any[]) {
  if (!map || !pathPoints || pathPoints.length < 2 || !window.AMap) {
    console.error('Invalid map, path points, or AMap not loaded');
    return;
  }
  
  console.log('绘制简单路线, 点数量:', pathPoints.length);
  
  // 清除地图上现有的路线元素
  clearAllRouteElements(map);
  
  try {
    // 添加路径点标记
    const markers = addPathPoints(map, pathPoints);
    
    // 将标记添加到全局跟踪数组
    markers.forEach(marker => addToRouteElements(marker));
    
    // 创建路径连线
    const path = pathPoints.map(point => [point.longitude, point.latitude]);
    
    // 使用虚线样式表示简化路径
    const polyline = new window.AMap.Polyline({
      path: path,
      isOutline: true,
      outlineColor: '#ffffff',
      borderWeight: 2,
      strokeColor: '#5fb878',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      strokeStyle: 'dashed',  // 使用虚线表示简化路径
      lineJoin: 'round',
      lineCap: 'round',
      zIndex: 50
    });
    
    // 添加到地图
    map.add(polyline);
    addToRouteElements(polyline); // 添加到全局跟踪数组
    
    // 添加提示说明这是简化路径
    const centerPosition = map.getCenter();
    const simplifiedText = new window.AMap.Text({
      text: '简化直连路径 (非真实道路)',
      position: centerPosition,
      style: {
        'background-color': 'rgba(95,184,120,0.8)',
        'color': '#fff',
        'border-radius': '4px',
        'font-size': '14px',
        'padding': '5px 10px',
        'border-width': '0'
      },
      zIndex: 200
    });
    
    map.add(simplifiedText);
    addToRouteElements(simplifiedText); // 添加到全局跟踪数组
    
    setTimeout(() => {
      try {
        map.remove(simplifiedText);
      } catch (e) {
        console.error('移除简化路径提示失败:', e);
      }
    }, 3000);
    
    // 调整地图视野以包含所有点
    map.setFitView();
    
    console.log('简单路线绘制完成');
    return polyline;
  } catch (error) {
    console.error('绘制简单路线失败:', error);
    return null;
  }
}

/**
 * 使用高德地图驾车导航API绘制真实路线
 * 该方法会根据给定的路径点，通过高德API获取实际道路路线
 * 参考文档: https://lbs.amap.com/api/javascript-api-v2/guide/services/navigation
 * 
 * 特性:
 * 1. 路径缓存: 相同的起点、终点和途经点组合会被缓存到localStorage中
 * 2. 压缩存储: 使用LZ-String进行压缩，减少存储空间占用
 * 3. 自动清理: 缓存有24小时过期时间，系统会自动清理过期和超量的缓存
 * 4. 降级处理: 如果高德API调用失败，会降级使用简单路线绘制
 */
export function drawRealisticRoute(map: any, pathPoints: any[]) {
  if (!map || !pathPoints || pathPoints.length < 2 || !window.AMap) {
    console.error('Invalid map, path points, or AMap not loaded');
    return;
  }
  
  console.log('开始绘制真实导航路线，点数量:', pathPoints.length);
  
  // 清除地图上现有的路线元素
  clearAllRouteElements(map);
  
  // 确保地图API和Driving插件已加载
  if (!window.AMap.Driving) {
    console.log('尝试加载Driving插件...');
    
    try {
      window.AMap.plugin(['AMap.Driving'], function() {
        console.log('Driving插件加载成功，重新尝试绘制路线');
        // 递归调用自身，此时插件应该已加载
        drawRealisticRoute(map, pathPoints);
      });
      return;
    } catch (error) {
      console.error('加载Driving插件失败:', error);
      // 退回到简单路线绘制
      drawRoute(map, pathPoints);
      return;
    }
  }

  // 添加加载提示
  let centerPosition;
  try {
    centerPosition = map.getCenter();
    if (!centerPosition || isNaN(centerPosition.lng) || isNaN(centerPosition.lat)) {
      if (pathPoints.length > 0) {
        centerPosition = new window.AMap.LngLat(pathPoints[0].longitude, pathPoints[0].latitude);
      } else {
        centerPosition = new window.AMap.LngLat(116.397428, 39.90923);
      }
    }
  } catch (e) {
    centerPosition = new window.AMap.LngLat(116.397428, 39.90923);
  }

  // 创建并添加加载提示
  const loadingText = new window.AMap.Text({
    text: '获取真实道路路线中...',
    position: centerPosition,
    style: {
      'background-color': 'rgba(0,0,0,0.7)',
      'border-radius': '4px',
      'color': '#fff',
      'font-size': '14px',
      'padding': '5px 10px',
      'border-width': '0'
    },
    zIndex: 200
  });
  
  try {
    // 添加确保map有效的检查
    if (map && typeof map.add === 'function') {
      map.add(loadingText);
      addToRouteElements(loadingText); // 添加到全局跟踪数组
    } else {
      console.warn('地图实例无效，无法添加加载提示');
    }
  } catch (err) {
    console.error('添加加载提示时出错：', err);
  }

  try {
    // 添加站点标记
    const markers: any[] = [];
    pathPoints.forEach((point, index) => {
      try {
        // 确定标记样式
        let markerColor, textBgColor, markerSize;
        
        if (index === 0) {
          // 起点
          markerColor = '#09BB07';
          textBgColor = '#09BB07';
          markerSize = 10;
        } else if (index === pathPoints.length - 1) {
          // 终点
          markerColor = '#E74C3C';
          textBgColor = '#E74C3C';
          markerSize = 10;
        } else {
          // 中间站点
          markerColor = '#3366FF';
          textBgColor = '#3366FF';
          markerSize = 8;
        }
        
        // 创建圆点标记 - 使用简单的圆点替代图片
        const circleMarker = new window.AMap.CircleMarker({
          center: [point.longitude, point.latitude],
          radius: markerSize,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
          strokeOpacity: 0.8,
          fillColor: markerColor,
          fillOpacity: 1,
          zIndex: index === 0 || index === pathPoints.length - 1 ? 110 : 100,
          bubble: true
        });
        
        // 添加文本标签
        const text = new window.AMap.Text({
          text: point.stationName,
          position: [point.longitude, point.latitude],
          offset: new window.AMap.Pixel(0, -20),
          style: {
            'background-color': textBgColor,
            'border-radius': '3px',
            'color': '#fff',
            'font-size': '12px',
            'padding': '2px 5px',
            'border-width': '0',
            'box-shadow': '0 2px 6px rgba(0,0,0,.3)'
          }
        });
        
        // 添加站点信息窗口
        const content = `
          <div class="station-info">
            <h4>${point.stationName}</h4>
            <p>站点编号: ${point.stationId || 'N/A'}</p>
            <p>经度: ${point.longitude.toFixed(6)}</p>
            <p>纬度: ${point.latitude.toFixed(6)}</p>
            ${index < pathPoints.length - 1 ? 
              `<p>到下一站: ${calcDistance(point, pathPoints[index + 1]).toFixed(2)} 公里</p>` : ''}
          </div>
        `;
        
        const infoWindow = new window.AMap.InfoWindow({
          content: content,
          offset: new window.AMap.Pixel(0, -30)
        });
        
        // 点击站点显示信息窗口
        circleMarker.on('click', () => {
          infoWindow.open(map, [point.longitude, point.latitude]);
        });
        
        markers.push(circleMarker);
        markers.push(text);
        
        // 添加标记点到全局跟踪数组
        addToRouteElements(circleMarker);
        addToRouteElements(text);
        addToRouteElements(infoWindow);
      } catch (err) {
        console.error('创建站点标记时出错:', err, point);
      }
    });
    
    // 添加所有标记到地图
    try {
      if (markers.length > 0) {
        map.add(markers);
      }
    } catch (err) {
      console.error('添加站点标记时出错:', err);
    }

    // 按照官方文档实现驾车导航API
    // 定义起点、终点坐标
    const origin = [pathPoints[0].longitude, pathPoints[0].latitude];
    const destination = [pathPoints[pathPoints.length - 1].longitude, pathPoints[pathPoints.length - 1].latitude];
    
    // 如果是多个点，添加途经点
    let waypoints: [number, number][] = [];
    if (pathPoints.length > 2) {
      waypoints = pathPoints.slice(1, pathPoints.length - 1).map(point => [point.longitude, point.latitude] as [number, number]);
    }
    
    // 构建缓存键
    const cacheKey = buildCacheKey(origin, destination, waypoints, MapConfig.drivingPolicy);
    
    // 检查缓存中是否有此路线
    if (routeCache[cacheKey] && Date.now() - routeCache[cacheKey].timestamp < CACHE_EXPIRY) {
      console.log(`从缓存中获取路线规划结果，缓存时间: ${new Date(routeCache[cacheKey].timestamp).toLocaleString()}`);
      // 从缓存中获取并显示
      const cachedResult = routeCache[cacheKey].result;
      
      // 更新加载提示
      try {
        if (map && typeof map.remove === 'function' && loadingText) {
          map.remove(loadingText);
        }
      } catch (e) {
        console.error('移除加载提示失败:', e);
      }
      
      // 显示缓存提示
      const cacheText = new window.AMap.Text({
        text: `使用缓存的路线数据 (${formatBytes(routeCache[cacheKey].size)})`,
        position: centerPosition,
        style: {
          'background-color': 'rgba(0,102,204,0.7)',
          'color': '#fff',
          'border-radius': '4px',
          'font-size': '14px',
          'padding': '5px 10px',
          'border-width': '0'
        },
        zIndex: 200
      });
      
      map.add(cacheText);
      addToRouteElements(cacheText); // 添加到全局跟踪数组
      
      setTimeout(() => {
        try {
          map.remove(cacheText);
          // 不需要从全局数组移除，因为clearAllRouteElements会处理
        } catch (e) {
          console.error('移除缓存提示失败:', e);
        }
      }, 3000);
      
      // 使用缓存的结果渲染路线
      handleDrivingResult('complete', cachedResult, map, loadingText, centerPosition, pathPoints);
      return;
    }
    
    console.log('创建驾车导航规划实例...');
    
    // 创建驾车导航实例并设置相关参数
    const driving = new window.AMap.Driving({
      map: map,                           
      policy: window.AMap[`DrivingPolicy`][MapConfig.drivingPolicy || 'LEAST_TIME'], 
      autoFitView: true,                  
      hideMarkers: true,                  // 隐藏起终点标记，因为我们已经自定义了标记
      showTraffic: false,                 
      panel: false,
      extensions: 'all',                  // 返回详细的路线数据，包括路径点信息
      // 完全禁用备选路线
      alternativeRoute: false,
      // 显式禁用多策略路线
      multipleRoutes: false
    });
    
    console.log('开始规划路线:', origin, destination, '途经点数量:', waypoints.length);
    
    // 回调函数，处理结果并缓存
    const handleAndCacheResult = function(status: string, result: any) {
      console.log('路线规划返回状态:', status, '结果数据结构:', result ? Object.keys(result) : 'null');
      
      // 如果结果正确，保存到缓存
      if (status === 'complete' && result && result.routes && result.routes.length > 0) {
        console.log('准备缓存路线规划结果');
        // 使用新的缓存函数
        addToCache(cacheKey, result);
      }
      
      // 处理结果并渲染
      handleDrivingResult(status, result, map, loadingText, centerPosition, pathPoints);
    };
    
    // 根据是否有途经点使用不同的搜索方法
    if (waypoints.length > 0) {
      // 有途经点，使用waypoints参数
      console.log('使用途经点搜索路线: 起点=', origin, '终点=', destination, '途经点=', waypoints);
      driving.search(
        origin, 
        destination, 
        { waypoints: waypoints },
        handleAndCacheResult
      );
    } else {
      // 无途经点，直接搜索起终点
      console.log('直接搜索起终点路线: 起点=', origin, '终点=', destination);
      driving.search(
        origin, 
        destination, 
        handleAndCacheResult
      );
    }
  } catch (error) {
    console.error('绘制路线失败:', error);
    
    // 清除加载提示
    try {
      if (map && typeof map.remove === 'function' && loadingText) {
        map.remove(loadingText);
      }
    } catch (e) {
      console.error('清除加载提示失败:', e);
    }
    
    // 显示错误提示
    const errorText = new window.AMap.Text({
      text: '路线规划失败，请重试',
      position: centerPosition,
      style: {
        'background-color': 'rgba(204,0,0,0.7)',
        'color': '#fff',
        'border-radius': '4px',
        'font-size': '14px',
        'padding': '5px 10px',
        'border-width': '0'
      },
      zIndex: 200
    });
    
    map.add(errorText);
    addToRouteElements(errorText); // 添加到全局跟踪数组
    
    setTimeout(() => {
      try {
        map.remove(errorText);
      } catch (e) {
        console.error('移除错误提示失败:', e);
      }
    }, 3000);
    
    // 退回使用简单路线绘制
    drawRoute(map, pathPoints);
  }
}

// 驾车路线策略选项
export const DrivingPolicyOptions = [
  { value: 'LEAST_TIME', label: '最快路线', color: '#3366FF', iconType: 'clock-circle' },
  { value: 'LEAST_DISTANCE', label: '最短路线', color: '#FF6600', iconType: 'environment' },
  { value: 'LEAST_FEE', label: '经济路线', color: '#009933', iconType: 'dollar' },
  { value: 'REAL_TRAFFIC', label: '考虑路况', color: '#9933CC', iconType: 'thunderbolt' }
];

// 处理驾车导航结果的辅助函数
function handleDrivingResult(status: string, result: any, map: any, loadingText: any, centerPosition: any, pathPoints: any[]) {
  // 移除加载提示
  try {
    if (map && typeof map.remove === 'function' && loadingText) {
      map.remove(loadingText);
    }
  } catch (e) {
    console.error('移除加载提示失败:', e);
  }
  
  // 在处理结果前，先清除地图上的所有内容
  console.log('清除所有地图内容，防止多策略路线叠加显示');
  map.clearMap();
  allRouteElements = [];
  routeGuideElements = [];
  
  if (status === 'complete' && result.routes && result.routes.length) {
    console.log('路线规划成功, 返回路线数量:', result.routes.length, result);
    console.log('当前路线指引设置:', MapConfig.rendering.showRouteGuide ? '开启' : '关闭');
    
    // 添加成功提示
    const successText = new window.AMap.Text({
      text: `路线规划成功，仅显示最优路线`,
      position: centerPosition,
      style: {
        'background-color': 'rgba(0,153,0,0.7)',
        'color': '#fff',
        'border-radius': '4px',
        'font-size': '14px',
        'padding': '5px 10px',
        'border-width': '0'
      },
      zIndex: 200
    });
    
    map.add(successText);
    allRouteElements.push(successText);
    
    setTimeout(() => {
      try {
        map.remove(successText);
      } catch (e) {
        console.error('移除成功提示失败:', e);
      }
    }, 3000);
    
    // 添加路径点标记
    const markers = addPathPoints(map, pathPoints);
    
    // 将添加的标记点加入全局跟踪
    markers.forEach(marker => allRouteElements.push(marker));
    
    // 只处理第一条路线（忽略所有备选路线）
    const route = result.routes[0];
    
    // 获取当前策略的颜色
    const currentPolicyColor = DrivingPolicyOptions.find(option => 
      option.value === MapConfig.drivingPolicy
    )?.color || '#3366FF';
    
    // 每条路线的折线组
    const routeLines: any[] = [];
    
    // 创建路线信息标签
    let routeInfo = '';
    if (route.distance && route.time) {
      const distance = (route.distance / 1000).toFixed(1); // 转换为公里
      const time = Math.ceil(route.time / 60); // 转换为分钟
      routeInfo = `全程: ${distance}公里`;
    }
    
    // 在起点附近添加路线信息
    const startPoint = route.steps[0].path[0];
    if (startPoint) {
      const routeLabel = new window.AMap.Text({
        text: routeInfo,
        position: startPoint,
        offset: new window.AMap.Pixel(0, -40),
        style: {
          'background-color': currentPolicyColor,
          'color': '#fff',
          'border-radius': '4px',
          'font-size': '13px',
          'padding': '3px 8px',
          'border-width': '0',
          'border-left': `4px solid ${currentPolicyColor}`
        },
        zIndex: 121
      });
      
      map.add(routeLabel);
      routeLines.push(routeLabel);
      allRouteElements.push(routeLabel); // 记录添加的元素
    }
    
    if (route.steps) {
      console.log('路线包含步骤数量:', route.steps.length);
      
      // 遍历路线中的每个路段并渲染
      route.steps.forEach((step: any, index: number) => {
        // 创建折线对象
        const polyline = new window.AMap.Polyline({
          path: step.path,
          strokeColor: currentPolicyColor,
          strokeOpacity: 0.9,
          strokeWeight: 6,
          strokeStyle: 'solid',
          lineJoin: 'round',
          lineCap: 'round',
          zIndex: 50
        });
        
        // 将折线添加到路线组和地图
        routeLines.push(polyline);
        map.add(polyline);
        allRouteElements.push(polyline); // 记录添加的元素
        
        // 选择路段的指引位置
        let guidePosition = null;
        if (step.path && step.path.length) {
          if (index === 0) {
            // 起点使用路段起点
            guidePosition = step.path[0];
          } else if (index === route.steps.length - 1) {
            // 终点使用路段终点
            guidePosition = step.path[step.path.length - 1];
          } else if (step.path.length > 2) {
            // 中间点使用路段中点
            guidePosition = step.path[Math.floor(step.path.length / 2)];
          } else {
            // 短路段用第一个点
            guidePosition = step.path[0];
          }
        }
        
        if (guidePosition && step.instruction) {
          // 构建全面的指引信息
          let fullInstructionText = '';
          
          // 根据不同类型的指引构建内容
          if (index === 0) {
            fullInstructionText = `起点: ${step.instruction.replace('沿', '从')}`;
          } else if (index === route.steps.length - 1) {
            fullInstructionText = `终点: ${step.instruction}`;
          } else {
            fullInstructionText = step.instruction;
          }
          
          // 确定不同类型指引的样式
          let bgColor = 'rgba(0,102,204,0.85)';
          let fontSize = '12px';
          let zIndex = 120;
          
          // 差异化指引类型的样式
          if (index === 0) {
            // 起点
            bgColor = 'rgba(9,187,7,0.85)';
            fontSize = '13px';
            zIndex = 123;
          } else if (index === route.steps.length - 1) {
            // 终点
            bgColor = 'rgba(231,76,60,0.85)';
            fontSize = '13px';
            zIndex = 122;
          } else if (step.instruction && (
            step.instruction.includes('入口') || 
            step.instruction.includes('出口') || 
            step.instruction.includes('右转') ||
            step.instruction.includes('左转') ||
            step.instruction.includes('环岛') ||
            step.instruction.includes('掉头')
          )) {
            // 重要拐点
            bgColor = 'rgba(255,102,0,0.85)';
            fontSize = '13px';
            zIndex = 121;
          }
          
          // 创建指引文本
          const guideText = new window.AMap.Text({
            text: fullInstructionText,
            position: guidePosition,
            offset: new window.AMap.Pixel(0, -10),
            style: {
              'background-color': bgColor,
              'color': '#fff',
              'border-radius': '3px',
              'font-size': fontSize,
              'padding': '2px 5px',
              'border-width': '0',
              'white-space': 'nowrap',
              'box-shadow': '0 2px 6px rgba(0,0,0,0.3)'
            },
            zIndex: zIndex
          });
          
          // 将指引文本添加到路线指引元素组
          addToRouteGuideElements(guideText);
          
          // 根据showRouteGuide配置决定是否显示
          if (MapConfig.rendering.showRouteGuide) {
            map.add(guideText);
          }
        }
      });
    }
    
    // 调整地图视野以包含所有路线
    map.setFitView();
    
    console.log('成功绘制导航路线，总长度:', (route.distance / 1000).toFixed(1), 'km，包含指引数:', routeGuideElements.length);
  } else {
    console.error('路线规划失败:', status, result);
    
    // 显示错误提示
    const errorText = new window.AMap.Text({
      text: `路线规划失败: ${status === 'no_data' ? '无路径数据' : status}`,
      position: centerPosition,
      style: {
        'background-color': 'rgba(204,0,0,0.7)',
        'color': '#fff',
        'border-radius': '4px',
        'font-size': '14px',
        'padding': '5px 10px',
        'border-width': '0'
      },
      zIndex: 200
    });
    
    map.add(errorText);
    allRouteElements.push(errorText); // 记录添加的元素
    
    setTimeout(() => {
      try {
        map.remove(errorText);
      } catch (e) {
        console.error('移除错误提示失败:', e);
      }
    }, 3000);
    
    // 使用简单路线绘制
    drawRoute(map, pathPoints);
  }
}

// 添加路径点标记
function addPathPoints(map: any, pathPoints: any[]) {
  if (!map || !pathPoints || pathPoints.length === 0) return [];
  
  const markers: any[] = [];
  
  pathPoints.forEach((point, index) => {
    try {
      // 确定标记样式
      let markerColor, textBgColor, markerSize;
      
      if (index === 0) {
        // 起点
        markerColor = '#09BB07';
        textBgColor = '#09BB07';
        markerSize = 10;
      } else if (index === pathPoints.length - 1) {
        // 终点
        markerColor = '#E74C3C';
        textBgColor = '#E74C3C';
        markerSize = 10;
      } else {
        // 中间站点
        markerColor = '#3366FF';
        textBgColor = '#3366FF';
        markerSize = 8;
      }
      
      // 创建圆点标记 - 使用简单的圆点替代图片
      const circleMarker = new window.AMap.CircleMarker({
        center: [point.longitude, point.latitude],
        radius: markerSize,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        fillColor: markerColor,
        fillOpacity: 1,
        zIndex: index === 0 || index === pathPoints.length - 1 ? 110 : 100,
        bubble: true
      });
      
      // 添加文本标签
      const text = new window.AMap.Text({
        text: point.stationName,
        position: [point.longitude, point.latitude],
        offset: new window.AMap.Pixel(0, -20),
        style: {
          'background-color': textBgColor,
          'border-radius': '3px',
          'color': '#fff',
          'font-size': '12px',
          'padding': '2px 5px',
          'border-width': '0',
          'box-shadow': '0 2px 6px rgba(0,0,0,.3)'
        }
      });
      
      // 添加标记到地图和数组
      map.add([circleMarker, text]);
      markers.push(circleMarker);
      markers.push(text);
      
      // 将标记添加到全局跟踪数组
      addToRouteElements(circleMarker);
      addToRouteElements(text);
    } catch (error) {
      console.error('添加路径点标记失败:', error);
    }
  });
  
  return markers;
}

/**
 * 规范化路径数据，确保数据格式一致
 * 解决不同组件处理路径数据不一致的问题
 */
export function normalizeRouteData(routeData: any) {
  if (!routeData) {
    return {
      pathPoints: [],
      totalDistance: 0,
      estimatedTime: 0
    };
  }
  
  // 提取路径点数据
  let pathPoints = [];
  let totalDistance = 0;
  let estimatedTime = 0;
  
  // 处理不同的数据结构
  if (routeData.route && Array.isArray(routeData.route.pathPoints)) {
    // 结构 1: { route: { pathPoints: [...] } }
    pathPoints = routeData.route.pathPoints;
    totalDistance = routeData.route.totalDistance || 0;
    estimatedTime = routeData.route.estimatedTime || 0;
  } else if (Array.isArray(routeData.pathPoints)) {
    // 结构 2: { pathPoints: [...] }
    pathPoints = routeData.pathPoints;
    totalDistance = routeData.totalDistance || 0;
    estimatedTime = routeData.estimatedTime || 0;
  } else if (typeof routeData === 'object') {
    // 尝试在嵌套对象中查找
    for (const key in routeData) {
      if (routeData[key] && Array.isArray(routeData[key].pathPoints)) {
        pathPoints = routeData[key].pathPoints;
        totalDistance = routeData[key].totalDistance || 0;
        estimatedTime = routeData[key].estimatedTime || 0;
        break;
      }
    }
  }
  
  // 验证路径点有效性
  const validPathPoints = pathPoints.filter((point: { 
    longitude: number; 
    latitude: number; 
    stationName?: string;
    stationId?: string | number;
  }) => 
    point && 
    typeof point.longitude === 'number' && 
    typeof point.latitude === 'number' &&
    !isNaN(point.longitude) && 
    !isNaN(point.latitude)
  );
  
  return {
    pathPoints: validPathPoints,
    totalDistance,
    estimatedTime
  };
}

/**
 * 根据路线段落位置生成颜色
 */
function getRouteColor(index: number, total: number): string {
  if (total <= 1) return '#3366FF';
  
  // 根据路线在总路程中的位置生成渐变色
  // 从蓝色(#3366FF)渐变到红色(#FF6633)
  const ratio = index / total;
  
  // 计算RGB值
  const r = Math.floor(51 + ratio * (255 - 51));
  const g = Math.floor(102 + ratio * (102 - 102));
  const b = Math.floor(255 + ratio * (51 - 255));
  
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * 计算两点间距离
 */
function calcDistance(point1: { latitude: number; longitude: number }, point2: { latitude: number; longitude: number }): number {
  if (!window.AMap || !window.AMap.GeometryUtil) {
    // 使用简单的球面距离计算
    const toRad = (value: number): number => (value * Math.PI) / 180;
    const R = 6371; // 地球半径，单位：千米
    
    const dLat = toRad(point2.latitude - point1.latitude);
    const dLon = toRad(point2.longitude - point1.longitude);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
  
  // 使用高德地图内置的距离计算工具
  return window.AMap.GeometryUtil.distance(
    [point1.longitude, point1.latitude],
    [point2.longitude, point2.latitude]
  ) / 1000; // 转换为公里
}

/**
 * 清除路径
 */
export function clearRoute(map: any) {
  if (!map || !window.AMap) return;
  
  console.log('清除路径，调用clearAllRouteElements');
  // 使用clearAllRouteElements代替简单的clearMap，确保清除所有路线元素和相关数组
  clearAllRouteElements(map);
}

/**
 * 地图设置
 */
export const MapConfig = {
  // 地图API密钥 - 正确的API密钥
  apiKey: '5369b0a718e1e3b3b28ea628aa080087',
  
  // 地图插件列表 - 更新为所需的完整插件列表，确保包含Driving相关插件
  plugins: 'AMap.Scale,AMap.ToolBar,AMap.Driving,AMap.DrivingPolicy,AMap.Transfer,AMap.Walking,AMap.Riding,AMap.CircleMarker,AMap.Marker,AMap.Polyline,AMap.InfoWindow,AMap.Text,AMap.GeometryUtil',
  
  // 默认使用真实导航路线
  useRealisticRoute: true,
  
  // 路线优化策略
  // 可选值: LEAST_TIME-最短时间, LEAST_DISTANCE-最短距离, LEAST_FEE-最经济, REAL_TRAFFIC-考虑实时路况
  drivingPolicy: 'LEAST_TIME',
  
  // 是否允许返回多条路线供用户选择 - 设置为false，只显示一条路线
  allowMultipleRoutes: false,
  
  // 渲染设置
  rendering: {
    // 路线颜色
    strokeColor: '#3366FF',
    // 路线宽度
    strokeWeight: 6,
    // 路线透明度
    strokeOpacity: 0.8,
    // 是否显示路线指引信息
    showRouteGuide: true
  },
  
  // 地图API版本
  version: '2.0'
};

/**
 * 初始化高德地图安全密钥
 * 必须在加载高德地图脚本前调用
 */
function initMapSecurity() {
  // 设置安全密钥
  window._AMapSecurityConfig = {
    securityJsCode: '81a91f014f4faf3b52d031a350a9d3ee'
  };
}

/**
 * 获取地图API脚本URL
 */
export function getMapApiUrl() {
  // 使用MapConfig中的版本号和插件列表，并添加安全参数
  return `https://webapi.amap.com/maps?v=${MapConfig.version}&key=${MapConfig.apiKey}&plugin=${MapConfig.plugins}&callback=initAMap&security=true`;
}

/**
 * 加载高德地图脚本
 * @param callback 脚本加载完成后的回调函数
 */
export function loadMapScript(callback: () => void) {
  // 初始化地图安全配置
  initMapSecurity();
  
  // 如果已经加载了高德地图，直接调用回调
  if (window.AMap) {
    console.log('AMap已经加载，直接执行回调');
    
    // 确保所需插件都已加载
    const requiredPlugins = [
      'AMap.Driving',
      'AMap.DrivingPolicy',
      'AMap.Transfer',
      'AMap.Walking',
      'AMap.Riding',
      'AMap.GeometryUtil'
    ];
    
    // 检查插件是否都已加载
    const allPluginsLoaded = requiredPlugins.every(plugin => {
      const pluginName = plugin.split('.')[1];
      return window.AMap && window.AMap[pluginName];
    });
    
    if (allPluginsLoaded) {
      callback();
    } else {
      console.log('部分插件未加载，尝试加载中...');
      window.AMap.plugin(requiredPlugins, function() {
        console.log('插件加载成功');
        callback();
      });
    }
    return;
  }
  
  // 定义回调函数
  window.initAMap = function() {
    console.log('AMap script loaded via callback');
    
    // 加载所有必需的插件
    if (window.AMap) {
      console.log('尝试加载所需插件...');
      try {
        window.AMap.plugin([
          'AMap.Driving', 
          'AMap.DrivingPolicy',
          'AMap.Transfer',
          'AMap.Walking',
          'AMap.Riding',
          'AMap.GeometryUtil'
        ], function() {
          console.log('插件加载成功');
          callback();
        });
      } catch (err) {
        console.error('加载插件失败:', err);
        callback(); // 即使插件加载失败也继续执行
      }
    } else {
      callback();
    }
  };
  
  // 检查是否已经有正在加载的脚本
  const existingScript = document.querySelector('script[src*="webapi.amap.com/maps"]');
  if (existingScript) {
    console.log('检测到现有地图脚本，等待其加载完成');
    // 如果脚本正在加载中，等待其加载完成
    existingScript.addEventListener('load', () => {
      console.log('现有脚本加载完成');
      setTimeout(() => {
        if (window.AMap) {
          window.initAMap();
        } else {
          console.error('脚本加载完成但AMap不可用');
          callback();
        }
      }, 100);
    });
    
    existingScript.addEventListener('error', (e) => {
      console.error('现有脚本加载失败:', e);
      callback();
    });
    
    return;
  }
  
  // 创建脚本元素
  const script = document.createElement('script');
  script.src = getMapApiUrl();
  script.async = true;
  document.head.appendChild(script);
  
  // 脚本加载失败时
  script.onerror = (e) => {
    console.error('Failed to load AMap script:', e);
    callback();
  };
}

/**
 * 清除路径缓存
 * @param force 如果为true，强制清除所有缓存；否则只清除过期缓存
 */
export function clearRouteCache(force = false) {
  if (force) {
    // 清除所有缓存
    routeCache = {};
    currentCacheSize = 0;
    localStorage.removeItem('amapRouteCache');
    console.log('已清除所有路径缓存');
  } else {
    // 只清除过期缓存
    cleanExpiredCache();
  }
  
  // 返回当前缓存状态
  return {
    cacheEntries: Object.keys(routeCache).length,
    cacheSize: formatBytes(currentCacheSize)
  };
}

/**
 * 构建缓存键
 * 格式: 起点经度,起点纬度|终点经度,终点纬度|途经点1经度,途经点1纬度|...|policy
 */
function buildCacheKey(
  origin: number[], 
  destination: number[], 
  waypoints: number[][] = [],
  policy: string
): string {
  // 构建基本键: 起点|终点
  let key = `${origin[0]},${origin[1]}|${destination[0]},${destination[1]}`;
  
  // 添加所有途经点
  if (waypoints.length > 0) {
    waypoints.forEach(point => {
      key += `|${point[0]},${point[1]}`;
    });
  }
  
  // 添加路线策略
  key += `|${policy}`;
  
  return key;
}

/**
 * 根据指定的路线策略重新规划路线
 * @param map 地图实例
 * @param pathPoints 路径点数组
 * @param policy 路线策略："LEAST_TIME"最快,"LEAST_DISTANCE"最短,"LEAST_FEE"经济,"REAL_TRAFFIC"考虑路况
 */
export function replanRouteWithPolicy(map: any, pathPoints: any[], policy: string) {
  if (!map || !pathPoints || pathPoints.length < 2 || !window.AMap) {
    console.error('Invalid map, path points, or AMap not loaded');
    return;
  }

  // 输出日志，便于调试
  console.log(`切换路线策略: ${MapConfig.drivingPolicy} -> ${policy}`);

  // 更新配置中的路线策略
  MapConfig.drivingPolicy = policy;
  
  // 清除地图上现有的所有路线元素
  clearAllRouteElements(map);
  
  // 显示策略切换提示
  const centerPosition = map.getCenter();
  const policyOption = DrivingPolicyOptions.find(option => option.value === policy);
  
  if (policyOption) {
    const policyText = new window.AMap.Text({
      text: `已切换为${policyOption.label}`,
      position: centerPosition,
      style: {
        'background-color': `${policyOption.color}dd`,
        'color': '#fff',
        'border-radius': '4px',
        'font-size': '14px',
        'padding': '5px 10px',
        'border-width': '0'
      },
      zIndex: 200
    });
    
    map.add(policyText);
    allRouteElements.push(policyText); // 记录添加的元素
    
    setTimeout(() => {
      try {
        map.remove(policyText);
        // 从全局数组中移除
        const index = allRouteElements.indexOf(policyText);
        if (index > -1) {
          allRouteElements.splice(index, 1);
        }
      } catch (e) {
        console.error('移除策略提示失败:', e);
      }
    }, 2000);
  }
  
  // 重新规划路线
  drawRealisticRoute(map, pathPoints);
}

// 加载LZ-String压缩库
function loadLZString() {
  if (typeof window !== 'undefined' && !window.LZString) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/lz-string@1.4.4/libs/lz-string.min.js';
    script.async = true;
    document.head.appendChild(script);
    
    script.onload = () => {
      console.log('LZ-String 压缩库加载成功');
    };
    
    script.onerror = () => {
      console.error('LZ-String 压缩库加载失败');
    };
  }
}

// 尝试加载LZ-String库
loadLZString();

/**
 * 切换路线指引显示状态
 * @param map 地图实例
 * @param show 是否显示路线指引
 */
export function toggleRouteGuide(map: any, show: boolean) {
  if (!map) return;
  
  // 更新配置
  MapConfig.rendering.showRouteGuide = show;
  
  // 控制现有路线指引元素的显示/隐藏
  routeGuideElements.forEach(element => {
    try {
      if (show) {
        map.add(element);
      } else {
        map.remove(element);
      }
    } catch (e) {
      console.error('切换路线指引显示状态失败:', e);
    }
  });
}

// 添加函数用于清除所有路线元素
export function clearAllRouteElements(map: any) {
  if (!map) return;
  
  console.log(`清除所有路线元素: ${allRouteElements.length}个元素`);
  
  // 清除所有已跟踪的路线元素
  if (allRouteElements.length > 0) {
    allRouteElements.forEach(element => {
      try {
        if (element) {
          if (map.contains && map.contains(element)) {
            map.remove(element);
          } else if (element.setMap) {
            // 兼容处理 - 某些元素可能使用setMap方法
            element.setMap(null);
          }
        }
      } catch (e) {
        console.error('移除路线元素失败:', e);
      }
    });
    allRouteElements = [];
  }
  
  // 清除所有路线指引元素
  if (routeGuideElements.length > 0) {
    routeGuideElements.forEach(element => {
      try {
        if (element) {
          if (map.contains && map.contains(element)) {
            map.remove(element);
          } else if (element.setMap) {
            // 兼容处理
            element.setMap(null);
          }
        }
      } catch (e) {
        console.error('移除路线指引元素失败:', e);
      }
    });
    routeGuideElements = [];
  }
  
  // 额外使用地图的clearMap方法彻底清除所有元素
  try {
    // 使用clearMap清除所有覆盖物
    map.clearMap();
    
    // 强制重绘地图
    if (map.render) {
      map.render();
    }
  } catch (e) {
    console.error('地图清除方法调用失败:', e);
  }
}

// 添加一个绘制路线时，将路线元素添加到全局追踪数组的辅助函数
export function addToRouteElements(element: any) {
  if (element) {
    allRouteElements.push(element);
  }
}

// 添加路线指引元素到全局追踪数组
export function addToRouteGuideElements(element: any) {
  if (element) {
    routeGuideElements.push(element);
  }
}
