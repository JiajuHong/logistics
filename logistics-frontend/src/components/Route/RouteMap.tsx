import React, { useEffect, useRef } from 'react';
import { Empty } from 'antd';
import { OptimalRouteVO } from '@/typings/route';
import { initMap, drawRealisticRoute, clearRoute, loadMapScript, normalizeRouteData } from '@/utils/mapUtils';

interface RouteMapProps {
  route: OptimalRouteVO | null;
}

const RouteMap: React.FC<RouteMapProps> = ({ route }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // 初始化地图
  useEffect(() => {
    if (mapRef.current) {
      // 使用统一的地图加载函数
      loadMapScript(() => {
        // 确保mapRef.current非空才初始化地图
        if (mapRef.current) {
          // 初始化地图
          const mapInstance = initMap(mapRef.current);
          if (mapInstance) {
            mapInstanceRef.current = mapInstance;
          }
        }
      });
      
      // 组件卸载时清理地图实例
      return () => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.destroy();
          mapInstanceRef.current = null;
        }
      };
    }
  }, []);

  // 绘制路径
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    // 清除现有路径
    clearRoute(mapInstanceRef.current);
    
    // 绘制新路径
    if (route) {
      // 规范化路径数据
      const normalizedData = normalizeRouteData(route);
      const { pathPoints } = normalizedData;
      
      if (pathPoints.length >= 2) {
        drawRealisticRoute(mapInstanceRef.current, pathPoints);
      }
    }
  }, [route]);

  if (!route) {
    return (
      <div className="route-map-container">
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="请选择起点和终点站点查询路径"
        />
      </div>
    );
  }

  return <div ref={mapRef} className="route-map" style={{ height: '500px' }} />;
};

export default RouteMap;
