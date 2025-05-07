import React from 'react';
import { Card, Tag, Tooltip, Space, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined, CarOutlined } from '@ant-design/icons';
import { VehicleStatus, VehicleType, vehicleStatusMap } from '@/typings/vehicle';
import './VehicleCard.less';

interface VehicleCardProps {
  vehicle: VehicleType;
  onEdit: () => void;
  onDelete: () => void;
}

const VehicleCard: React.FC<VehicleCardProps> = ({
  vehicle,
  onEdit,
  onDelete,
}) => {
  // 获取状态标签
  const getStatusTag = (status: number | undefined) => {
    if (status === undefined) return <Tag color="default">未知</Tag>;
    const statusInfo = vehicleStatusMap[status] || { text: '未知', color: 'default' };
    return (
      <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
    );
  };

  return (
    <Card
      className="vehicle-card"
      hoverable
      style={{ 
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        height: '100%'
      }}
      bodyStyle={{ padding: '16px' }}
      title={
        <div className="vehicle-card-title">
          <CarOutlined style={{ marginRight: 8 }} />
          <Tooltip title={vehicle.vehicleNo}>
            <span className="vehicle-no">{vehicle.vehicleNo}</span>
          </Tooltip>
          <span className="vehicle-status">{getStatusTag(vehicle.status)}</span>
        </div>
      }
      actions={[
        <Tooltip key="edit" title="编辑">
          <Button type="text" icon={<EditOutlined />} onClick={onEdit} />
        </Tooltip>,
        <Tooltip key="delete" title="删除">
          <Popconfirm
            title="确定要删除该车辆吗？"
            onConfirm={onDelete}
            okText="确定"
            cancelText="取消"
          >
            <Button type="text" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Tooltip>,
      ]}
    >
      <div className="vehicle-card-content">
        <div className="info-item">
          <span className="label">车辆类型：</span>
          <span className="value">{vehicle.vehicleType || '未知'}</span>
        </div>
        <div className="info-item">
          <span className="label">载重量：</span>
          <span className="value">{vehicle.loadCapacity !== undefined ? `${vehicle.loadCapacity} 吨` : '未知'}</span>
        </div>
        <div className="info-item">
          <span className="label">容积：</span>
          <span className="value">{vehicle.volumeCapacity !== undefined ? `${vehicle.volumeCapacity} 立方米` : '未知'}</span>
        </div>
        {vehicle.stationName && (
          <div className="info-item">
            <span className="label">所属站点：</span>
            <span className="value">{vehicle.stationName}</span>
          </div>
        )}
        {vehicle.driverName && (
          <div className="info-item">
            <span className="label">默认司机：</span>
            <span className="value">{vehicle.driverName}</span>
          </div>
        )}
      </div>
    </Card>
  );
};

export default VehicleCard; 