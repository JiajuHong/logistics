import React, { useEffect, useState } from 'react';
import { Form, Select, Button, Row, Col } from 'antd';
import { listStation } from '@/services/api';

const { Option } = Select;

interface StationType {
  id?: number;
  name?: string;
  code?: string;
}

interface RouteSelectorProps {
  onFromChange: (stationId: number) => void;
  onToChange: (stationId: number) => void;
  onSearch: () => void;
}

const RouteSelector: React.FC<RouteSelectorProps> = ({ 
  onFromChange, onToChange, onSearch 
}) => {
  const [stations, setStations] = useState<StationType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchStations = async () => {
      setLoading(true);
      try {
        const result = await listStation({});
        if (result.data) {
          setStations(result.data);
        }
      } catch (error) {
        console.error('获取站点列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStations();
  }, []);

  return (
    <Form layout="vertical">
      <Row gutter={16}>
        <Col span={9}>
          <Form.Item label="起点站点" required>
            <Select
              placeholder="选择起点站点"
              onChange={onFromChange}
              loading={loading}
              showSearch
              optionFilterProp="children"
            >
              {stations.map(station => (
                <Option key={station.id} value={station.id}>
                  {station.name} ({station.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={9}>
          <Form.Item label="终点站点" required>
            <Select
              placeholder="选择终点站点"
              onChange={onToChange}
              loading={loading}
              showSearch
              optionFilterProp="children"
            >
              {stations.map(station => (
                <Option key={station.id} value={station.id}>
                  {station.name} ({station.code})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>

        <Col span={6}>
          <Form.Item label=" " colon={false}>
            <Button 
              type="primary" 
              onClick={onSearch} 
              style={{ marginTop: '5px' }}
              block
            >
              查询路径
            </Button>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default RouteSelector;
