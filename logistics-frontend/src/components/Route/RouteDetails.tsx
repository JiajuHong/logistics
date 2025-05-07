import React from 'react';
import { Card, Descriptions, Steps, Tag } from 'antd';
import { OptimalRouteVO } from '../../typings/route';

const { Step } = Steps;

// Define a type for geographic points
interface GeoPoint {
  latitude: number;
  longitude: number;
}

interface RouteDetailsProps {
  route: OptimalRouteVO;
}

const RouteDetails: React.FC<RouteDetailsProps> = ({ route }) => {
  const { pathPoints, totalDistance, estimatedTime } = route;
  
  if (!pathPoints || pathPoints.length < 2) {
    return null;
  }
  
  // 格式化预计时间
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}小时${mins}分钟`;
  };

  return (
    <Card title="路径详情" className="route-details-card">
      <Descriptions bordered size="small" column={2}>
        <Descriptions.Item label="总距离">
          {totalDistance.toFixed(2)} 公里
        </Descriptions.Item>
        <Descriptions.Item label="预计时间">
          {formatTime(estimatedTime)}
        </Descriptions.Item>
        <Descriptions.Item label="中转站数量">
          {pathPoints.length - 2} 个
        </Descriptions.Item>
        <Descriptions.Item label="路径站点数">
          {pathPoints.length} 个
        </Descriptions.Item>
      </Descriptions>

      <div className="route-steps-container">
        <Steps 
          direction="vertical" 
          current={pathPoints.length - 1} 
          className="route-steps"
        >
          {pathPoints.map((point, index) => (
            <Step 
              key={point.stationId} 
              title={point.stationName}
              description={
                <>
                  <Tag color="blue">ID: {point.stationId}</Tag>
                  <div>经度: {point.longitude.toFixed(6)}</div>
                  <div>纬度: {point.latitude.toFixed(6)}</div>
                  {index < pathPoints.length - 1 && (
                    <div className="segment-distance">
                      到下一站: {calculateDistance(
                        point, 
                        pathPoints[index + 1]
                      ).toFixed(2)} 公里
                    </div>
                  )}
                </>
              }
            />
          ))}
        </Steps>
      </div>
    </Card>
  );
};

// 计算两点间距离的辅助函数
const calculateDistance = (point1: GeoPoint, point2: GeoPoint) => {
  // 使用haversine公式计算两点间距离
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371; // 地球半径，单位：千米
  
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(point1.latitude)) * Math.cos(toRad(point2.latitude)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default RouteDetails;
