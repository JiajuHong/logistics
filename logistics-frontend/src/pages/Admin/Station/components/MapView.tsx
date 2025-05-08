import React, { useEffect, useRef, useState } from 'react';
import { Card, Empty, Spin, Radio, Space, Tooltip, Button, Alert, Select } from 'antd';
import { 
  EnvironmentOutlined, 
  FullscreenOutlined, 
  ReloadOutlined, 
  AppstoreOutlined,
  InfoCircleOutlined,
  WarningOutlined
} from '@ant-design/icons';
import './MapView.less';
import { 
  initMap, 
  loadMapScript, 
  getMapApiUrl, 
  MapConfig 
} from '@/utils/mapUtils';

interface MapViewProps {
  dataSource: API.StationVO[];
  loading: boolean;
  onMarkerClick?: (record: API.StationVO) => void;
}

/**
 * 站点地图视图组件
 * 展示所有站点在地图上的位置
 */
const MapView: React.FC<MapViewProps> = ({ dataSource, loading, onMarkerClick }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const [mapView, setMapView] = useState<string>('normal');
  const [selectedStation, setSelectedStation] = useState<API.StationVO | null>(null);
  const [dataStats, setDataStats] = useState<{total: number, valid: number, invalid: number}>({
    total: 0,
    valid: 0,
    invalid: 0
  });
  const [regionFilter, setRegionFilter] = useState<number | null>(null);
  
  // 筛选数据源
  const filteredDataSource = regionFilter 
    ? dataSource.filter(station => station.regionId === regionFilter)
    : dataSource;
    
  // 获取所有区域选项
  const getRegionOptions = () => {
    const regions = new Map<number, string>();
    
    dataSource.forEach(station => {
      if (station.regionId && station.regionName) {
        regions.set(station.regionId, station.regionName);
      }
    });
    
    const options = Array.from(regions.entries()).map(([id, name]) => ({
      label: name,
      value: id
    }));
    
    // 按名称排序
    options.sort((a, b) => a.label.localeCompare(b.label));
    
    return options;
  };

  // 初始化地图
  useEffect(() => {
    if (loading) return;

    // 加载地图脚本
    loadMapScript(() => {
      if (mapRef.current && !mapInstance.current) {
        initializeMap();
      }
    });
    
    return () => {
      // 组件卸载时销毁地图
      if (mapInstance.current) {
        destroyMap();
      }
    };
  }, [loading]);

  // 数据源或区域筛选变化时更新地图标记
  useEffect(() => {
    if (!loading && mapInstance.current && filteredDataSource && filteredDataSource.length > 0) {
      updateMapMarkers();
    }
    
    // 组件卸载或数据源变化时清除标记
    return () => {
      if (mapInstance.current) {
        clearMapMarkers();
      }
    };
  }, [filteredDataSource, loading, mapInstance.current]);

  // 初始化地图
  const initializeMap = () => {
    if (!mapRef.current || !window.AMap) return;
    
    const map = new window.AMap.Map(mapRef.current, {
      zoom: 12,
      viewMode: '2D',
      mapStyle: 'amap://styles/normal',
      resizeEnable: true,
    });
    
    // 添加控件
    map.addControl(new window.AMap.Scale());
    map.addControl(new window.AMap.ToolBar({
      position: 'RB'
    }));
    
    mapInstance.current = map;
    
    // 如果有数据，则更新地图标记
    if (dataSource && dataSource.length > 0) {
      updateMapMarkers();
    }
  };

  // 销毁地图
  const destroyMap = () => {
    clearMapMarkers();
    if (mapInstance.current) {
      mapInstance.current.destroy();
      mapInstance.current = null;
    }
  };

  // 清除地图标记
  const clearMapMarkers = () => {
    if (markers.current.length > 0 && mapInstance.current) {
      mapInstance.current.remove(markers.current);
      markers.current = [];
    }
  };

  // 更新地图标记
  const updateMapMarkers = () => {
    if (!mapInstance.current || !filteredDataSource || filteredDataSource.length === 0) return;
    
    // 清除现有标记
    clearMapMarkers();
    
    // 创建新标记
    const newMarkers: any[] = [];
    const bounds = new window.AMap.Bounds();
    
    // 记录有效和无效的站点数量
    let validStations = 0;
    let invalidStations = 0;
    
    filteredDataSource.forEach((station) => {
      // 验证经纬度数据
      if (!station.longitude || !station.latitude || 
          isNaN(Number(station.longitude)) || isNaN(Number(station.latitude))) {
        console.warn(`站点数据经纬度无效: ID=${station.id}, 名称=${station.name}, 经度=${station.longitude}, 纬度=${station.latitude}`);
        invalidStations++;
        return; // 跳过此站点
      }
      
      validStations++;
      
      // 使用自定义样式的圆点标记，而不是外部图片URL
      const markerColor = station.status === 1 ? '#52c41a' : '#f5222d'; // 启用为绿色，停用为红色
      
      // 创建自定义标记
      const marker = new window.AMap.Marker({
        position: [Number(station.longitude), Number(station.latitude)],
        title: station.name,
        offset: new window.AMap.Pixel(-7, -7), // 调整偏移以适应更小的标记
        zIndex: 101,
        extData: station,
        content: `<div style="
          background-color: ${markerColor};
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 1px solid white;
          box-shadow: 0 0 3px rgba(0,0,0,0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          color: white;
          font-size: 10px;
          font-weight: bold;
        "></div>`
      });
      
      // 添加点击事件
      marker.on('click', () => {
        setSelectedStation(station);
        if (onMarkerClick) {
          onMarkerClick(station);
        }
      });
      
      // 创建信息窗体内容，添加状态样式
      const statusText = station.status === 1 ? '启用' : '停用';
      const statusClassName = station.status === 1 ? 'status-active' : 'status-inactive';
      
      const infoContent = `
        <div class="map-info-window">
          <h3>${station.name || '未命名站点'}</h3>
          <p><strong>编码:</strong> ${station.code || '无'}</p>
          <p><strong>地址:</strong> ${station.address || '无'}</p>
          <p><strong>区域:</strong> ${station.regionName || '无'}</p>
          <p><strong>容量:</strong> ${station.capacity || '0'}</p>
          <p><strong>状态:</strong> <span class="${statusClassName}">${statusText}</span></p>
        </div>
      `;
      
      const infoWindow = new window.AMap.InfoWindow({
        content: infoContent,
        offset: new window.AMap.Pixel(0, -10), // 调整偏移以适应新标记
        closeWhenClickMap: true
      });
      
      // 添加鼠标悬停事件
      marker.on('mouseover', () => {
        infoWindow.open(mapInstance.current, marker.getPosition());
      });
      
      marker.on('mouseout', () => {
        infoWindow.close();
      });
      
      newMarkers.push(marker);
      
      // 扩展地图边界以包含所有标记
      bounds.extend(marker.getPosition());
    });
    
    // 更新数据统计
    setDataStats({
      total: filteredDataSource.length,
      valid: validStations,
      invalid: invalidStations
    });
    
    // 如果有标记，添加到地图并设置合适的视图
    if (newMarkers.length > 0) {
      mapInstance.current.add(newMarkers);
      markers.current = newMarkers;
      
      // 设置地图的视图以包含所有标记
      mapInstance.current.setFitView(null, false, [60, 60, 60, 60]);
    } else {
      console.warn('没有有效的站点数据可显示在地图上');
    }
  };

  // 切换地图视图
  const handleMapViewChange = (e: any) => {
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
      } else if ((mapRef.current as any).webkitRequestFullscreen) {
        (mapRef.current as any).webkitRequestFullscreen();
      } else if ((mapRef.current as any).msRequestFullscreen) {
        (mapRef.current as any).msRequestFullscreen();
      }
    }
  };

  // 重置地图视图
  const handleResetView = () => {
    if (mapInstance.current && markers.current.length > 0) {
      mapInstance.current.setFitView(markers.current);
    }
  };

  // 处理区域筛选变化
  const handleRegionFilterChange = (value: number | null) => {
    setRegionFilter(value);
  };

  // 加载中状态
  if (loading) {
    return (
      <Card className="mapCard">
        <div className="mapContainer">
          <div className="placeholderContainer">
            <Spin tip="加载中..." size="large" />
          </div>
        </div>
      </Card>
    );
  }

  // 没有数据时显示空状态
  if (!dataSource || dataSource.length === 0) {
    return (
      <Card className="mapCard">
        <div className="mapContainer">
          <Empty description="暂无站点数据" />
        </div>
      </Card>
    );
  }

  // 渲染地图控制组件
  const renderMapControls = () => (
    <div className="mapControls">
      <Space direction="vertical" size="small">
        <Space>
          <Radio.Group value={mapView} onChange={handleMapViewChange} buttonStyle="solid" size="small">
            <Radio.Button value="normal">标准</Radio.Button>
            <Radio.Button value="night">夜间</Radio.Button>
          </Radio.Group>
          
          <Tooltip title="全屏显示">
            <Button 
              icon={<FullscreenOutlined />} 
              onClick={handleFullscreen}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="重置视图">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleResetView}
              size="small"
            />
          </Tooltip>
          
          <Tooltip title="站点总数">
            <Button 
              icon={<AppstoreOutlined />}
              size="small"
            >
              {dataStats.valid}
            </Button>
          </Tooltip>
        </Space>
        
        {/* 区域筛选 */}
        <div className="regionFilter">
          <div className="filterTitle">按区域筛选:</div>
          <Select
            placeholder="选择区域"
            style={{ width: '100%' }}
            allowClear
            onChange={handleRegionFilterChange}
            options={getRegionOptions()}
            size="small"
          />
        </div>
        
        {/* 添加图例 */}
        <div className="mapLegend">
          <div className="legendTitle">图例:</div>
          <div className="legendItem">
            <div className="legendColor active"></div>
            <span>启用状态</span>
          </div>
          <div className="legendItem">
            <div className="legendColor inactive"></div>
            <span>停用状态</span>
          </div>
        </div>
      </Space>
    </div>
  );

  // 正常显示地图
  return (
    <Card className="mapCard">
      {dataStats.invalid > 0 && (
        <Alert
          type="warning"
          message={
            <span>
              <WarningOutlined /> 数据警告
            </span>
          }
          description={`共${dataStats.total}个站点数据中，有${dataStats.invalid}个站点因缺少有效的经纬度信息而未能显示在地图上。请检查这些站点的经纬度数据。`}
          showIcon={false}
          closable
          style={{ marginBottom: 16 }}
        />
      )}
      <div className="mapContainer" ref={mapRef}>
        {/* 地图渲染区域 */}
      </div>
      {renderMapControls()}
    </Card>
  );
};

export default MapView;
