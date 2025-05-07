import React from 'react';
import { Card, Empty } from 'antd';

// 定义组件属性接口
interface RegionMapProps {
  regions: API.RegionVO[];
  loading?: boolean;
  onSelectRegion?: (region: API.RegionVO) => void;
}

/**
 * 区域地图视图组件
 * 需要重新实现
 */
const RegionMap: React.FC<RegionMapProps> = ({ regions, loading = false, onSelectRegion }) => {
  return (
    <Card title="区域地图视图">
      <Empty 
        description="地图视图需要重新实现" 
        style={{ marginTop: 100 }}
      />
    </Card>
  );
};

export default RegionMap; 