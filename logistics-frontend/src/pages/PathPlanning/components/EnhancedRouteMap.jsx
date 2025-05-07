import React, { useState, useEffect, useRef } from 'react';
import { Card, Tabs, Radio, Switch, Empty, Tooltip, Badge, Space, Statistic, Tag, Button, Select, Row, Col } from 'antd';
import { EnvironmentOutlined, CarOutlined, LineChartOutlined, RocketOutlined, DollarOutlined } from '@ant-design/icons';
import styles from './EnhancedRouteMap.less';
import { 
  loadMapScript, 
  drawRealisticRoute,
  clearRoute,
  MapConfig,
  DrivingPolicyOptions,
  toggleRouteGuide
} from '@/utils/mapUtils';

const { TabPane } = Tabs;
const { Option } = Select;

/**
 * 增强版地图组件，支持多条路线同时显示
 * 每条路线在独立的标签页中展示
 * 增强版支持左右布局，地图在左侧，表格在右侧
 */
const EnhancedRouteMap = ({ 
  routes = [], 
  singleRoute = null, 
  showTraffic = false, 
  drivingPolicy = 'LEAST_TIME', 
  showRouteGuide = true,
  resultsTable = null,  // 批量规划结果表格内容
  detailsTable = null,  // 路径详情表格内容
  useHorizontalLayout = true  // 是否使用水平布局
}) => {
  const mapContainerRefs = useRef({});
  const mapInstances = useRef({});
  const markers = useRef({});
  const polylines = useRef({});
  const trafficLayers = useRef({});
  
  const [activeMapId, setActiveMapId] = useState('1');
  const [visualMode, setVisualMode] = useState('map');
  const [localShowTraffic, setShowTraffic] = useState(showTraffic);
  const [routeStats, setRouteStats] = useState({});
  const [selectedOrderIndex, setSelectedOrderIndex] = useState(null);
  const [mapContainersReady, setMapContainersReady] = useState(false);
  const [mapError, setMapError] = useState(null);

  // 当组件挂载时，先加载地图脚本
  useEffect(() => {
    console.log('EnhancedRouteMap组件挂载，开始加载地图脚本');
    loadMapScript((success) => {
      if (!success) {
        console.error('地图脚本加载失败');
        setMapError('地图脚本加载失败，请刷新页面重试');
      } else {
        console.log('地图脚本加载成功');
      }
    });
    
    return () => {
      // 清理所有地图资源
      Object.keys(mapInstances.current).forEach(mapId => {
        try {
          destroyMap(mapId);
        } catch (e) {
          console.error(`销毁地图 ${mapId} 失败:`, e);
        }
      });
    };
  }, []);

  // 当传入的路线数据变化时，重新渲染地图
  useEffect(() => {
    console.log('EnhancedRouteMap收到新的路线数据:', { 
      singleRoute: singleRoute ? '有单路线数据' : '无单路线数据', 
      routes: routes.length ? `有${routes.length}条路线数据` : '无多路线数据'
    });
    
    // 清除之前的错误状态
    setMapError(null);
    
    // 先清除所有现有的地图实例和资源
    Object.keys(mapInstances.current).forEach(mapId => {
      try {
        destroyMap(mapId);
      } catch (e) {
        console.error(`销毁地图 ${mapId} 失败:`, e);
      }
    });
    
    // 重置存储地图实例和元素的引用
    mapInstances.current = {};
    markers.current = {};
    polylines.current = {};
    trafficLayers.current = {};
    
    // 设置标志以便DOM更新后再初始化地图
    setMapContainersReady(false);
    
    // 使用setTimeout确保DOM更新后再标记容器准备好
    setTimeout(() => {
      setMapContainersReady(true);
    }, 300);
    
  }, [routes, singleRoute, drivingPolicy]);
  
  // 当地图容器准备好后初始化地图
  useEffect(() => {
    if (!mapContainersReady) return;
    
    console.log('地图容器已准备好，开始初始化地图');
    
    // 检查是否有路径数据
    if (!singleRoute && (!routes || routes.length === 0)) {
      console.log('没有可用的路径数据，不初始化地图');
      return;
    }
    
    try {
      if (singleRoute) {
        console.log('准备初始化单路线地图');
        if (!singleRoute.route || !singleRoute.route.pathPoints || singleRoute.route.pathPoints.length < 2) {
          console.warn('单路线数据无效:', singleRoute);
          setMapError('单路线数据无效，无法显示地图');
          return;
        }
        
        initSingleRouteMap();
      } else if (routes && routes.length > 0) {
        console.log('准备初始化多路线地图，路线数量:', routes.length);
        let validRoutes = 0;
        
        routes.forEach(route => {
          if (route.route && route.route.pathPoints && route.route.pathPoints.length >= 2) {
            validRoutes++;
          }
        });
        
        if (validRoutes === 0) {
          console.warn('没有有效的路线数据');
          setMapError('多路线数据无效，无法显示地图');
          return;
        }
        
        initMultipleRouteMaps();
      }
    } catch (error) {
      console.error('初始化地图失败:', error);
      setMapError(`初始化地图失败: ${error.message}`);
    }
  }, [mapContainersReady]);
  
  // 当地图视图模式或交通显示设置变化时，更新所有地图
  useEffect(() => {
    console.log('地图视图模式或设置变化，更新地图');
    
    Object.keys(mapInstances.current).forEach(mapId => {
      const map = mapInstances.current[mapId];
      if (!map) return;
      
      // 更新地图样式
      map.setMapStyle(getMapStyle(visualMode));
      
      // 更新交通显示
      toggleTrafficLayer(mapId, localShowTraffic);
    });
  }, [visualMode, showTraffic]);
  
  // 当路线指引显示设置变化时，更新配置并重绘路线
  useEffect(() => {
    // 为每个初始化的地图更新路线指引设置
    Object.keys(mapInstances.current).forEach(mapId => {
      const map = mapInstances.current[mapId];
      if (!map) return;
      
      // 使用toggleRouteGuide函数控制路线指引的显示/隐藏
      toggleRouteGuide(map, showRouteGuide);
    });
  }, [showRouteGuide]);
  
  // 根据视图模式获取地图样式
  const getMapStyle = (mode) => {
    switch (mode) {
      case 'satellite':
        return 'amap://styles/satellite';
      case 'terrain':
        return 'amap://styles/normal';
      case 'night':
        return 'amap://styles/dark';
      case 'map':
      default:
        return 'amap://styles/normal';
    }
  };
  
  // 初始化单路线地图
  const initSingleRouteMap = () => {
    console.log('开始初始化单路线地图');
    const mapId = '1';
    
    if (!singleRoute || !singleRoute.route || !singleRoute.route.pathPoints || singleRoute.route.pathPoints.length < 2) {
      console.warn('未提供有效的路线数据');
      return;
    }
    
    if (!mapContainerRefs.current[mapId]) {
      console.warn(`地图容器引用不存在: ${mapId}`);
      return;
    }
    
    initMap(mapId, singleRoute.route.pathPoints, singleRoute.fromStationName, singleRoute.toStationName);
  };
  
  // 初始化多路线地图
  const initMultipleRouteMaps = () => {
    console.log('开始初始化多路线地图，路线数量:', routes.length);
    
    if (!routes || routes.length === 0) {
      console.warn('未提供有效的多路线数据');
      return;
    }
    
    // 为每条路线初始化一个地图
    routes.forEach((route, index) => {
      const mapId = String(index + 1);
      
      if (!route || !route.route || !route.route.pathPoints || route.route.pathPoints.length < 2) {
        console.warn(`路线 ${mapId} 数据无效`);
        return;
      }
      
      if (!mapContainerRefs.current[mapId]) {
        console.warn(`地图容器引用不存在: ${mapId}`);
        return;
      }
      
      initMap(mapId, route.route.pathPoints, route.fromStationName, route.toStationName);
    });
    
    // 默认显示第一个标签页
    setActiveMapId('1');
  };
  
  // 初始化地图
  const initMap = (mapId, pathPoints, fromStationName, toStationName) => {
    console.log(`初始化地图 ${mapId}，使用策略: ${drivingPolicy}`);
    
    // 先确保清除之前的地图实例及相关元素
    try {
      destroyMap(mapId);
    } catch (err) {
      console.error(`销毁旧地图实例(${mapId})失败:`, err);
    }
    
    const mapContainer = mapContainerRefs.current[mapId];
    if (!mapContainer || !window.AMap) {
      console.error(`无法创建地图 ${mapId}: 容器或AMap不存在`);
      return { map: null, totalDistance: 0, estimatedTime: 0 };
    }
    
    // 计算地图中心点
    const mapCenter = [116.397428, 39.90923]; // 默认北京中心
    let totalDistance = 0;
    let estimatedTime = 0;
    
    if (pathPoints && pathPoints.length > 0) {
      // 如果有路径点，计算中心点为所有点的平均值
      const sumLng = pathPoints.reduce((sum, point) => sum + point.longitude, 0);
      const sumLat = pathPoints.reduce((sum, point) => sum + point.latitude, 0);
      
      if (pathPoints.length > 0) {
        mapCenter[0] = sumLng / pathPoints.length;
        mapCenter[1] = sumLat / pathPoints.length;
      }
      
      // 估算总距离
      for (let i = 1; i < pathPoints.length; i++) {
        const p1 = new window.AMap.LngLat(pathPoints[i-1].longitude, pathPoints[i-1].latitude);
        const p2 = new window.AMap.LngLat(pathPoints[i].longitude, pathPoints[i].latitude);
        totalDistance += p1.distance(p2);
      }
      
      // 估算行驶时间 (假设平均速度60km/h)
      estimatedTime = totalDistance / 1000 / 60 * 60;
    }
    
    // 设置合适的缩放级别
    let zoomLevel = 12;
    if (totalDistance > 100000) zoomLevel = 8;  // 100km以上
    else if (totalDistance > 50000) zoomLevel = 9;  // 50km以上
    else if (totalDistance > 20000) zoomLevel = 10; // 20km以上
    else if (totalDistance > 10000) zoomLevel = 11; // 10km以上
    
    // 保存路线统计信息
    setRouteStats(prev => ({
      ...prev,
      [mapId]: {
        totalDistance: (totalDistance / 1000).toFixed(1),
        estimatedTime: Math.ceil(estimatedTime / 60)
      }
    }));
    
    // 确保地图对象为空
    if (mapInstances.current[mapId]) {
      console.warn(`地图实例 ${mapId} 已存在，将被重新创建`);
      try {
        // 在销毁前确保清除所有路线元素
        clearRoute(mapInstances.current[mapId]);
        mapInstances.current[mapId].destroy();
        mapInstances.current[mapId] = null;
      } catch (e) {
        console.error(`销毁已存在的地图 ${mapId} 失败:`, e);
      }
    }
    
    // 创建地图实例
    try {
      // 创建地图实例
      const map = new window.AMap.Map(mapContainer, {
        center: mapCenter,
        zoom: zoomLevel,
        viewMode: '2D',
        mapStyle: getMapStyle(visualMode),
        resizeEnable: true,
      });
      
      // 添加控件
      map.addControl(new window.AMap.Scale());
      
      // 保存地图实例引用
      mapInstances.current[mapId] = map;
      
      // 初始化标记和路线存储
      markers.current[mapId] = [];
      polylines.current[mapId] = null;
      
      // 根据选择使用真实导航路线或简单直线
      if (pathPoints.length >= 2) {
        console.log(`[地图${mapId}] 有足够的路径点，开始绘制路径, 策略: ${drivingPolicy}`);
        
        // 先设置路线策略，确保使用正确的策略
        MapConfig.drivingPolicy = drivingPolicy;
        
        // 等待100ms确保地图加载完成
        setTimeout(() => {
          // 确保地图实例仍然有效
          if (map && typeof map.clearMap === 'function') {
            // 确保地图为空
            map.clearMap();
            
            // 使用真实导航路线
            console.log('正在调用 drawRealisticRoute 函数...');
            // 设置路线策略
            drawRealisticRoute(map, pathPoints);
            
            // 如果需要显示交通状况
            if (localShowTraffic) {
              toggleTrafficLayer(mapId, true);
            }
          } else {
            console.error(`地图实例 ${mapId} 在绘制路线前已失效`);
          }
        }, 100);
      } else {
        console.warn(`[地图${mapId}] 未检测到有效路径点，不绘制路径`);
        
        // 在地图上显示无数据提示
        const infoWindow = new window.AMap.InfoWindow({
          content: `<div style="padding: 10px; color: #ff4d4f; font-weight: bold;">
                    未检测到有效路径点，不绘制路径<br>
                    起点: ${fromStationName}<br>
                    终点: ${toStationName}
                  </div>`,
          offset: new window.AMap.Pixel(0, -30)
        });
        infoWindow.open(map, map.getCenter());
      }
      
      return { map, totalDistance, estimatedTime };
    } catch (err) {
      console.error(`创建地图实例 ${mapId} 失败:`, err);
      return { map: null, totalDistance: 0, estimatedTime: 0 };
    }
  };
  
  // 清除特定地图的资源
  const destroyMap = (mapId) => {
    // 确保地图实例存在
    if (!mapInstances.current[mapId]) return;
    
    console.log(`正在销毁地图实例 ${mapId}`);
    
    try {
      // 清除标记点
      if (markers.current[mapId] && markers.current[mapId].length) {
        markers.current[mapId].forEach(marker => {
          try {
            if (marker && marker.remove) {
              marker.remove();
            }
          } catch (e) {
            console.error('移除标记失败:', e);
          }
        });
        markers.current[mapId] = [];
      }
      
      // 清除路线
      if (polylines.current[mapId]) {
        try {
          if (polylines.current[mapId].remove) {
            polylines.current[mapId].remove();
          }
        } catch (e) {
          console.error('移除路线失败:', e);
        }
        polylines.current[mapId] = null;
      }
      
      // 清除交通图层
      if (trafficLayers.current[mapId]) {
        try {
          if (mapInstances.current[mapId]) {
            mapInstances.current[mapId].remove(trafficLayers.current[mapId]);
          }
        } catch (e) {
          console.error('移除交通图层失败:', e);
        }
        trafficLayers.current[mapId] = null;
      }
      
      // 调用地图API清除所有覆盖物
      try {
        mapInstances.current[mapId].clearMap();
      } catch (e) {
        console.error('清除地图覆盖物失败:', e);
      }
      
      // 销毁地图实例
      try {
        mapInstances.current[mapId].destroy();
      } catch (e) {
        console.error('销毁地图实例失败:', e);
      }
      
      // 移除引用
      delete mapInstances.current[mapId];
    } catch (error) {
      console.error(`销毁地图 ${mapId} 时发生错误:`, error);
    }
  };
  
  // 切换交通状况层显示
  const toggleTrafficLayer = (mapId, show) => {
    const map = mapInstances.current[mapId];
    if (!map) return;
    
    if (show) {
      if (!trafficLayers.current[mapId]) {
        trafficLayers.current[mapId] = new window.AMap.TrafficLayer();
      }
      map.add(trafficLayers.current[mapId]);
    } else if (trafficLayers.current[mapId]) {
      map.remove(trafficLayers.current[mapId]);
    }
  };
  
  // 处理地图标签页切换
  const handleTabChange = (activeKey) => {
    setActiveMapId(activeKey);
    
    // 切换标签页后调整地图视野
    setTimeout(() => {
      const map = mapInstances.current[activeKey];
      if (map && map.setFitView) {
        map.setFitView();
      }
    }, 100);
  };
  
  // 渲染地图工具栏
  const renderMapToolbar = () => {
    return (
      <div className={styles.mapToolbar}>
        <Space>
          <Radio.Group value={visualMode} onChange={e => setVisualMode(e.target.value)}>
            <Tooltip title="普通地图">
              <Radio.Button value="map"><EnvironmentOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip title="卫星视图">
              <Radio.Button value="satellite"><LineChartOutlined /></Radio.Button>
            </Tooltip>
            <Tooltip title="地形视图">
              <Radio.Button value="terrain"><LineChartOutlined /></Radio.Button>
            </Tooltip>
          </Radio.Group>
          
          <Tooltip title="显示实时路况">
            <Switch 
              checkedChildren={<CarOutlined />} 
              unCheckedChildren={<CarOutlined />} 
              checked={localShowTraffic}
              onChange={setShowTraffic}
            />
          </Tooltip>
        </Space>
      </div>
    );
  };
  
  // 渲染单一地图视图
  const renderSingleMapView = () => {
    const mapId = '1';
    const hasValidRoute = singleRoute && singleRoute.route && singleRoute.route.pathPoints && singleRoute.route.pathPoints.length > 1;
    
    if (!hasValidRoute) {
      return <Empty description="暂无有效路线数据" />;
    }
    
    return (
      <div className={styles.singleMapContainer}>
        <div 
          ref={el => {
            if (el) {
              console.log('设置单地图容器引用:', el.clientHeight, 'x', el.clientWidth);
              mapContainerRefs.current[mapId] = el;
            }
          }}
          className={styles.mapContainer}
          id={`map-container-${mapId}`}
        />
        {renderMapToolbar()}
        
        {/* 显示路线信息卡片 */}
        <div className={styles.routeInfoCard}>
          <Badge.Ribbon 
            text="真实道路路线" 
            color="#1890ff"
          >
            <Card size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className={styles.routeStations}>
                  <div>
                    <Badge status="processing" text={singleRoute.fromStationName} />
                  </div>
                  <div className={styles.routeArrow}>➜</div>
                  <div>
                    <Badge status="success" text={singleRoute.toStationName} />
                  </div>
                </div>
                
                <div className={styles.routeStats}>
                  <Statistic 
                    title="距离" 
                    value={routeStats[mapId]?.totalDistance || 0} 
                    suffix="公里"
                    precision={1}
                    valueStyle={{ fontSize: '16px' }}
                  />
                  <Statistic 
                    title="预计用时" 
                    value={routeStats[mapId]?.estimatedTime || 0} 
                    suffix="分钟"
                    valueStyle={{ fontSize: '16px' }}
                  />
                </div>
                
                <div className={styles.drivingPolicy}>
                  <Tag color="blue">
                    {DrivingPolicyOptions.find(option => option.value === drivingPolicy)?.label || '默认路线'}
                  </Tag>
                </div>
              </Space>
            </Card>
          </Badge.Ribbon>
        </div>
      </div>
    );
  };
  
  // 渲染多地图标签页视图
  const renderTabMapsView = () => {
    if (!routes || routes.length === 0) {
      return <Empty description="暂无路线数据" />;
    }
    
    // 添加订单选择下拉框 - 使用Ant Design的Select组件
    const renderOrderSelector = () => {
      return (
        <div className={styles.orderSelector}>
          <div className={styles.orderSelectorLabel}>选择订单:</div>
          <Select
            placeholder="显示所有订单"
            value={selectedOrderIndex !== null ? selectedOrderIndex : undefined}
            onChange={(value) => {
              const index = value !== undefined ? parseInt(value) : null;
              setSelectedOrderIndex(index);
              if (index !== null) {
                setActiveMapId(String(index + 1));
              }
            }}
            style={{ width: '100%' }}
            allowClear
          >
            {routes.map((route, index) => (
              <Option key={index} value={index}>
                订单 {index + 1}: {route.fromStationName || '未知'} → {route.toStationName || '未知'}
                {routeStats[String(index + 1)] ? ` (${routeStats[String(index + 1)].totalDistance}公里)` : ''}
              </Option>
            ))}
          </Select>
        </div>
      );
    };
    
    // 如果选择了特定的订单，则只显示该订单的地图
    if (selectedOrderIndex !== null) {
      const route = routes[selectedOrderIndex];
      const mapId = String(selectedOrderIndex + 1);
      
      return (
        <div className={styles.singleOrderMapContainer}>
          {renderOrderSelector()}
          <div 
            ref={el => {
              if (el) {
                console.log('设置选中订单地图容器引用:', mapId, el.clientHeight, 'x', el.clientWidth);
                mapContainerRefs.current[mapId] = el;
              }
            }}
            className={styles.mapContainer}
            id={`map-container-${mapId}`}
          />
          {renderMapToolbar()}
          
          {/* 显示路线信息卡片 */}
          <div className={styles.routeInfoCard}>
            <Badge.Ribbon text={`订单 ${selectedOrderIndex + 1} 路线`} color="#1890ff">
              <Card size="small">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div className={styles.routeStations}>
                    <div>
                      <Badge status="processing" text={route.fromStationName || '未知起点'} />
                    </div>
                    <div className={styles.routeArrow}>➜</div>
                    <div>
                      <Badge status="success" text={route.toStationName || '未知终点'} />
                    </div>
                  </div>
                  
                  <div className={styles.routeStats}>
                    <Statistic 
                      title="距离" 
                      value={routeStats[mapId]?.totalDistance || 0} 
                      suffix="公里"
                      precision={1}
                      valueStyle={{ fontSize: '16px' }}
                    />
                    <Statistic 
                      title="预计用时" 
                      value={routeStats[mapId]?.estimatedTime || 0} 
                      suffix="分钟"
                      valueStyle={{ fontSize: '16px' }}
                    />
                  </div>
                  
                  <div className={styles.routeTags}>
                    <Tag color="blue">
                      {DrivingPolicyOptions.find(option => option.value === drivingPolicy)?.label || '默认路线'}
                    </Tag>
                    {route.orderNo && <Tag color="green">订单号: {route.orderNo}</Tag>}
                  </div>
                </Space>
              </Card>
            </Badge.Ribbon>
          </div>
        </div>
      );
    }
    
    // 否则显示所有订单的标签页视图
    return (
      <div className={styles.tabMapsContainer}>
        {renderOrderSelector()}
        <Tabs activeKey={activeMapId} onChange={handleTabChange} type="card">
          {routes.map((route, index) => {
            const mapId = String(index + 1);
            return (
              <TabPane 
                tab={
                  <span>
                    订单 {index + 1}
                    {routeStats[mapId] && (
                      <span className={styles.tabDistance}>
                        ({routeStats[mapId].totalDistance}公里)
                      </span>
                    )}
                  </span>
                } 
                key={mapId}
              >
                <div 
                  ref={el => {
                    if (el) {
                      console.log('设置标签页地图容器引用:', mapId, el.clientHeight, 'x', el.clientWidth);
                      mapContainerRefs.current[mapId] = el;
                    }
                  }}
                  className={styles.mapContainer}
                  id={`map-container-${mapId}`}
                />
                
                {/* 显示路线信息卡片 */}
                <div className={styles.routeInfoCard}>
                  <Badge.Ribbon text="真实道路路线" color="#1890ff">
                    <Card size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <div className={styles.routeStations}>
                          <div>
                            <Badge status="processing" text={route.fromStationName || '未知起点'} />
                          </div>
                          <div className={styles.routeArrow}>➜</div>
                          <div>
                            <Badge status="success" text={route.toStationName || '未知终点'} />
                          </div>
                        </div>
                        
                        <div className={styles.routeStats}>
                          <Statistic 
                            title="距离" 
                            value={routeStats[mapId]?.totalDistance || 0} 
                            suffix="公里"
                            precision={1}
                            valueStyle={{ fontSize: '16px' }}
                          />
                          <Statistic 
                            title="预计用时" 
                            value={routeStats[mapId]?.estimatedTime || 0} 
                            suffix="分钟"
                            valueStyle={{ fontSize: '16px' }}
                          />
                        </div>
                        
                        <div className={styles.routeTags}>
                          <Tag color="blue">
                            {DrivingPolicyOptions.find(option => option.value === drivingPolicy)?.label || '默认路线'}
                          </Tag>
                          {route.orderNo && <Tag color="green">订单号: {route.orderNo}</Tag>}
                        </div>
                      </Space>
                    </Card>
                  </Badge.Ribbon>
                </div>
              </TabPane>
            );
          })}
        </Tabs>
        {renderMapToolbar()}
      </div>
    );
  };
  
  // 渲染完整的组件，支持水平布局
  const renderFullComponent = () => {
    const mapContent = (
      <Card 
        title="路线地图" 
        bodyStyle={{ padding: 0, position: 'relative', minHeight: '600px' }}
      >
        {mapError ? (
          <div className={styles.errorContainer}>
            <Empty 
              description={
                <div>
                  <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>{mapError}</div>
                  <Button type="primary" onClick={() => window.location.reload()}>刷新页面</Button>
                </div>
              }
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : singleRoute ? renderSingleMapView() : renderTabMapsView()}
      </Card>
    );

    // 如果不使用水平布局，或者没有提供表格，则直接返回地图内容
    if (!useHorizontalLayout || (!resultsTable && !detailsTable)) {
      return mapContent;
    }

    // 水平布局，地图在左，表格在右
    return (
      <div className={styles.horizontalLayoutContainer}>
        <div className={styles.mapSection}>
          {mapContent}
        </div>

        <div className={styles.tablesSection}>
          {resultsTable && (
            <Card 
              title="批量路径规划结果" 
              className={styles.resultsTable}
              bodyStyle={{ padding: 0 }}
            >
              {resultsTable}
            </Card>
          )}

          {detailsTable && (
            <Card 
              title="路径详情" 
              className={styles.detailsTable}
              bodyStyle={{ padding: 0 }}
            >
              {detailsTable}
            </Card>
          )}
        </div>
      </div>
    );
  };

  return renderFullComponent();
};

export default EnhancedRouteMap; 