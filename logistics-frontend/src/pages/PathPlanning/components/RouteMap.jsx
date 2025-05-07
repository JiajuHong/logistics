import React, { useEffect, useRef, useState } from 'react';
import { Card, Slider, Radio, Button, Tooltip, Space, List, Badge, message, Modal, Statistic, Row, Col, Select } from 'antd';
import { 
  EnvironmentOutlined, 
  CarOutlined, 
  FullscreenOutlined, 
  ReloadOutlined, 
  ClearOutlined, 
  InfoCircleOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  EnvironmentFilled,
  DollarOutlined
} from '@ant-design/icons';
import styles from './RouteMap.less';
import { 
  initMap, 
  drawRealisticRoute,
  clearRoute, 
  loadMapScript, 
  getMapApiUrl, 
  normalizeRouteData,
  clearRouteCache,
  DrivingPolicyOptions,
  replanRouteWithPolicy,
  toggleRouteGuide
} from '@/utils/mapUtils';
import { MapConfig } from '@/utils/mapUtils';

/**
 * 增强版路线地图组件
 * 支持实时路况展示、多种地图视图、路线动画等功能
 */
const RouteMap = ({ routeData, showTraffic = false, drivingPolicy = 'LEAST_TIME', showRouteGuide = true }) => {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const [mapView, setMapView] = useState('normal');
  const [localShowTraffic, setLocalShowTraffic] = useState(showTraffic);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [loading, setLoading] = useState(true);
  const markers = useRef([]);
  const trafficLayer = useRef(null);
  const [cacheModalVisible, setCacheModalVisible] = useState(false);
  const [cacheStats, setCacheStats] = useState({ cacheEntries: 0, cacheSize: '0 Bytes' });
  const [currentPolicy, setCurrentPolicy] = useState(drivingPolicy);

  // 将地图实例暴露给全局，以便可以在其他地方访问
  // 这是一个副作用，但为了解决当前问题这是必要的
  React.useEffect(() => {
    window.currentMapInstance = mapInstance.current;
  }, [mapInstance.current]);

  // 当外部drivingPolicy属性变化时，更新本地状态
  useEffect(() => {
    setCurrentPolicy(drivingPolicy);
  }, [drivingPolicy]);

  // 当外部showTraffic属性变化时，更新本地状态
  useEffect(() => {
    setLocalShowTraffic(showTraffic);
  }, [showTraffic]);

  // 当外部showRouteGuide属性变化时，更新MapConfig
  useEffect(() => {
    if (mapInstance.current) {
      // 直接使用toggleRouteGuide函数控制路线指引的显示/隐藏
      toggleRouteGuide(mapInstance.current, showRouteGuide);
    } else {
      // 如果地图还未初始化，仅更新配置
      MapConfig.rendering.showRouteGuide = showRouteGuide;
    }
  }, [showRouteGuide]);

  // 初始化地图
  useEffect(() => {
    // 使用统一的地图加载函数
    loadMapScript(() => {
      initializeMap();
    });
    
    return () => {
      destroyMap();
    };
  }, []);

  // 初始化地图实例
  const initializeMap = (policy = currentPolicy) => {
    if (!mapRef.current || !window.AMap) return;
    
    setLoading(true);
    
    const map = new window.AMap.Map(mapRef.current, {
      zoom: 10,
      viewMode: '3D',
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
    
    mapInstance.current = map;
    
    // 路线数据变化时绘制路线
    if (routeData) {
      console.log('初始化地图时使用策略:', policy);
      
      // 确保使用传入的策略
      const normalizedData = normalizeRouteData(routeData);
      
      // 先设置当前策略
      MapConfig.drivingPolicy = policy;
      
      // 直接绘制路线，不使用replanRouteWithPolicy，避免额外的操作
      drawRealisticRoute(map, normalizedData.pathPoints);
      
      // 如果开启了交通状况，添加交通层
      if (localShowTraffic) {
        toggleTrafficLayer(true);
      }
    }
    
    setLoading(false);
  };

  // 路线数据变化时更新地图
  useEffect(() => {
    if (mapInstance.current && routeData) {
      drawRoute();
    }
  }, [routeData, currentPolicy]);

  // 显示交通状况变化时更新地图
  useEffect(() => {
    if (mapInstance.current) {
      toggleTrafficLayer(localShowTraffic);
    }
  }, [localShowTraffic]);

  // 销毁地图实例
  const destroyMap = () => {
    clearMapElements();
    if (mapInstance.current) {
      mapInstance.current.destroy();
      mapInstance.current = null;
    }
  };

  // 清除地图上的所有元素
  const clearMapElements = () => {
    // 清除标记点
    if (markers.current.length) {
      markers.current.forEach(marker => {
        if (marker && marker.remove) {
          marker.remove();
        }
      });
      markers.current = [];
    }
    
    // 清除交通层
    if (trafficLayer.current && mapInstance.current) {
      mapInstance.current.remove(trafficLayer.current);
      trafficLayer.current = null;
    }
  };

  // 绘制路线
  const drawRoute = () => {
    const map = mapInstance.current;
    if (!map || !routeData) {
      console.error('地图实例或路径数据不存在，无法绘制路径');
      return;
    }
    
    // 先彻底清除地图上的路线元素和标记
    clearRoute(map);
    clearMapElements();
    
    // 使用normalizeRouteData函数规范化路径数据
    const normalizedData = normalizeRouteData(routeData);
    const { pathPoints } = normalizedData;
    
    if (pathPoints.length < 2) {
      console.warn('路径点数量不足，无法绘制路径');
      return;
    }
    
    // 使用真实导航路线，采用当前选择的路线策略
    MapConfig.drivingPolicy = currentPolicy;
    drawRealisticRoute(map, pathPoints);
    
    // 如果开启了交通状况，添加交通层
    if (localShowTraffic) {
      toggleTrafficLayer(true);
    }
  };

  // 切换交通状况层
  const toggleTrafficLayer = (visible) => {
    const map = mapInstance.current;
    if (!map) return;
    
    if (visible) {
      if (!trafficLayer.current) {
        trafficLayer.current = new window.AMap.TrafficLayer();
      }
      map.add(trafficLayer.current);
    } else if (trafficLayer.current) {
      map.remove(trafficLayer.current);
    }
  };

  // 切换地图视图
  const handleMapViewChange = (e) => {
    const view = e.target.value;
    setMapView(view);
    
    if (!mapInstance.current) return;
    
    // 根据选择设置地图样式
    switch (view) {
      case 'satellite':
        mapInstance.current.setMapStyle('amap://styles/satellite');
        break;
      case 'night':
        mapInstance.current.setMapStyle('amap://styles/dark');
        break;
      case 'normal':
      default:
        mapInstance.current.setMapStyle('amap://styles/normal');
        break;
    }
  };

  // 全屏显示地图
  const handleFullscreen = () => {
    if (mapRef.current) {
      if (mapRef.current.requestFullscreen) {
        mapRef.current.requestFullscreen();
      } else if (mapRef.current.webkitRequestFullscreen) {
        mapRef.current.webkitRequestFullscreen();
      } else if (mapRef.current.msRequestFullscreen) {
        mapRef.current.msRequestFullscreen();
      }
    }
  };

  // 重置地图视图
  const handleResetView = () => {
    if (mapInstance.current) {
      mapInstance.current.setFitView();
    }
  };

  // 清除路线缓存
  const handleClearCache = () => {
    const stats = clearRouteCache(true);
    setCacheStats(stats);
    message.success('路线缓存已清除');
    // 重新绘制当前路线
    if (mapInstance.current && routeData) {
      drawRoute();
    }
  };

  // 获取缓存统计信息
  const getCacheStats = () => {
    const stats = clearRouteCache(false); // 只清理过期缓存，并返回统计信息
    setCacheStats(stats);
    setCacheModalVisible(true);
  };

  // 处理路线策略变更
  const handlePolicyChange = (value) => {
    console.log(`路线策略从 ${currentPolicy} 切换到 ${value}`);
    
    // 更新当前策略
    setCurrentPolicy(value);
    
    if (mapInstance.current && routeData) {
      // 清除地图上的所有元素
      clearMapElements();
      
      try {
        // 添加防御性检查，确保mapInstance.current是有效的实例
        if (mapInstance.current && typeof mapInstance.current.destroy === 'function') {
          // 保存当前地图中心点和缩放级别
          const center = mapInstance.current.getCenter();
          const zoom = mapInstance.current.getZoom();
          
          console.log('销毁地图实例前, 保存状态:', { center, zoom });
          
          // 完全销毁当前地图实例
          mapInstance.current.destroy();
          mapInstance.current = null;
        }
      } catch (e) {
        console.error('销毁地图实例失败:', e);
      }
      
      // 延长等待时间，确保DOM已经更新
      setTimeout(() => {
        try {
          if (!mapInstance.current) {
            console.log('重新初始化地图, 使用策略:', value);
            initializeMap(value);
          }
        } catch (e) {
          console.error('重新初始化地图失败:', e);
          // 尝试再次初始化
          setTimeout(() => {
            try {
              initializeMap(value);
            } catch (err) {
              console.error('二次尝试初始化地图失败:', err);
            }
          }, 500);
        }
      }, 200);
    }
  };

  // 渲染路线策略选择器组件
  const renderPolicySelector = () => {
    // 获取当前策略的图标和颜色
    const currentPolicyOption = DrivingPolicyOptions.find(option => option.value === currentPolicy);
    const currentPolicyColor = currentPolicyOption?.color || '#3366FF';
    
    // 策略图标映射
    const policyIcons = {
      'LEAST_TIME': <ClockCircleOutlined style={{ color: '#3366FF', fontSize: '16px' }} />,
      'LEAST_DISTANCE': <EnvironmentFilled style={{ color: '#FF6600', fontSize: '16px' }} />,
      'LEAST_FEE': <DollarOutlined style={{ color: '#009933', fontSize: '16px' }} />,
      'REAL_TRAFFIC': <ThunderboltOutlined style={{ color: '#9933CC', fontSize: '16px' }} />
    };
    
    return (
      <div className={styles.policySelector}>
        <span style={{ marginRight: '8px', fontSize: '14px' }}>路线策略:</span>
        <Select
          value={currentPolicy}
          onChange={handlePolicyChange}
          style={{ 
            width: 120,
            borderRadius: '24px'
          }}
          className={styles.policySelect}
          dropdownStyle={{ 
            padding: '4px 0',
            borderRadius: '6px',
            overflow: 'hidden'
          }}
          popupMatchSelectWidth={false}
          suffixIcon={null}
        >
          {DrivingPolicyOptions.map(option => (
            <Select.Option key={option.value} value={option.value} className={styles.policyOption}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className={styles.policyIcon} style={{ color: option.color }}>
                  {policyIcons[option.value]}
                </span>
                <span style={{ color: currentPolicy === option.value ? option.color : 'inherit' }}>
                  {option.label}
                </span>
              </div>
            </Select.Option>
          ))}
        </Select>
      </div>
    );
  };

  // 渲染站点详情信息
  const renderPointDetails = () => {
    if (!selectedPoint) return null;
    
    return (
      <Card
        title={`站点信息：${selectedPoint.stationName}`}
        size="small"
        extra={<Button type="link" onClick={() => setSelectedPoint(null)}>关闭</Button>}
        className={styles.pointDetailCard}
      >
        <List size="small">
          <List.Item>
            <span>站点ID：</span>
            <span>{selectedPoint.stationId}</span>
          </List.Item>
          <List.Item>
            <span>站点类型：</span>
            <span>
              <Badge status={selectedPoint.isHub ? "success" : "default"} />
              {selectedPoint.isHub ? "枢纽站点" : "普通站点"}
            </span>
          </List.Item>
          <List.Item>
            <span>坐标：</span>
            <span>{selectedPoint.latitude.toFixed(6)}, {selectedPoint.longitude.toFixed(6)}</span>
          </List.Item>
        </List>
      </Card>
    );
  };

  // 渲染缓存统计信息弹窗
  const renderCacheStatsModal = () => {
    return (
      <Modal
        title="路线缓存统计"
        open={cacheModalVisible}
        onCancel={() => setCacheModalVisible(false)}
        footer={[
          <Button key="clear" type="primary" danger onClick={handleClearCache}>
            清除所有缓存
          </Button>,
          <Button key="close" onClick={() => setCacheModalVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Statistic 
              title="缓存条目数" 
              value={cacheStats.cacheEntries} 
              suffix="条"
              style={{ marginBottom: 16 }} 
            />
          </Col>
          <Col span={12}>
            <Statistic 
              title="缓存总大小" 
              value={cacheStats.cacheSize} 
              style={{ marginBottom: 16 }} 
            />
          </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
          <p><InfoCircleOutlined /> 缓存说明：</p>
          <ul>
            <li>系统会自动缓存已规划过的路线，有效期为24小时</li>
            <li>相同起点终点和途经点的路线会从缓存中直接获取</li>
            <li>当缓存空间不足时，系统会自动清理最旧的缓存条目</li>
            <li>清除缓存后，系统将重新从高德API获取路线数据</li>
          </ul>
        </div>
      </Modal>
    );
  };

  return (
    <Card
      title="路线地图"
      className={styles.mapCard}
      extra={
        <Space>
          {renderPolicySelector()}
          <Tooltip title="全屏显示">
            <Button icon={<FullscreenOutlined />} onClick={handleFullscreen} />
          </Tooltip>
          <Tooltip title="重置视图">
            <Button icon={<ReloadOutlined />} onClick={handleResetView} />
          </Tooltip>
          <Tooltip title="缓存统计">
            <Button icon={<InfoCircleOutlined />} onClick={getCacheStats} />
          </Tooltip>
          <Tooltip title="清除路线缓存">
            <Button 
              icon={<ClearOutlined />} 
              onClick={handleClearCache}
              danger
            />
          </Tooltip>
        </Space>
      }
      bodyStyle={{ padding: 0, height: '600px' }}
    >
      <div 
        ref={mapRef} 
        className={styles.mapContainer} 
        style={{ height: '100%', width: '100%', position: 'relative' }}
      />
      

      
      {selectedPoint && renderPointDetails()}
      
      {renderCacheStatsModal()}
    </Card>
  );
};

export default RouteMap; 