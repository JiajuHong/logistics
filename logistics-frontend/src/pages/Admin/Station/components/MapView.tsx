import React from 'react';
import { Card, Empty, Spin } from 'antd';
import './MapView.less';

interface MapViewProps {
  dataSource: API.StationVO[];
  loading: boolean;
  onMarkerClick?: (record: API.StationVO) => void;
}

/**
 * 地图视图组件（占位版本）
 * 目前没有实现地图功能，后续会添加
 */
const MapView: React.FC<MapViewProps> = ({ dataSource, loading }) => {
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

  // 正常显示占位信息
  return (
    <Card className="mapCard">
      <div className="mapContainer">
        <div className="placeholderContainer">
          <div className="placeholderText">
            地图功能暂未实现，后续将添加
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MapView;
