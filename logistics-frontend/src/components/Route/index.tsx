import React, { useState } from 'react';
import { Card, Alert, Spin, Button } from 'antd';
import RouteSelector from './RouteSelector';
import RouteMap from './RouteMap';
import RouteDetails from './RouteDetails';
import { getOptimalRoute } from '@/services/backend/routeService';
import { OptimalRouteVO } from '@/typings/route';

const RoutePlanner: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [route, setRoute] = useState<OptimalRouteVO | null>(null);
  const [selectedFrom, setSelectedFrom] = useState<number | null>(null);
  const [selectedTo, setSelectedTo] = useState<number | null>(null);

  const handleSearch = async (forceRefresh: boolean = false) => {
    if (!selectedFrom || !selectedTo) {
      setError('请选择起点和终点站点');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const result = await getOptimalRoute(selectedFrom, selectedTo, forceRefresh);
      setRoute(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '获取路径失败，请稍后重试');
      console.error('获取路径失败:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="物流路径规划" className="route-planner-card">
      <RouteSelector 
        onFromChange={setSelectedFrom}
        onToChange={setSelectedTo}
        onSearch={() => handleSearch(false)}
      />
      
      {error && <Alert message={error} type="error" showIcon className="route-error" />}
      
      <div className="route-content">
        <Spin spinning={loading}>
          <RouteMap route={route} />
          {route && <RouteDetails route={route} />}
        </Spin>
      </div>
      
      {route && (
        <Button 
          type="primary" 
          onClick={() => handleSearch(true)}
          className="refresh-btn"
        >
          刷新路径
        </Button>
      )}
    </Card>
  );
};

export default RoutePlanner;
