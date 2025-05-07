import React from 'react';
import { Card, Tag, Tooltip, Button, Space, Row, Col, Typography, Divider } from 'antd';
import { TransportOrderType } from '@/typings/order';
import { OrderStatus, OrderStatusColorMap } from '@/typings/order';
import {
  EditOutlined,
  DeleteOutlined,
  StopOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  CheckOutlined
} from '@ant-design/icons';
import './OrderCard.less';

const { Text, Title } = Typography;

interface OrderCardProps {
  order: TransportOrderType;
  onView: (order: TransportOrderType) => void;
  onEdit: (order: TransportOrderType) => void;
  onDelete: (id: number) => void;
  onReject: (id: number) => void;
  onComplete?: (id: number) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
  order,
  onView,
  onEdit,
  onDelete,
  onReject,
  onComplete = () => {}
}) => {
  // 获取状态标签的颜色
  const getStatusColor = (status: number) => {
    return OrderStatusColorMap[status] || '#999';
  };

  // 格式化时间
  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  // 根据订单状态展示可进行的操作
  const renderActions = () => {
    const actions = [
      <Tooltip title="查看详情">
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onView(order)}
        />
      </Tooltip>
    ];

    // 只有待分配、已分配的订单可以编辑
    if (order.status === OrderStatus.PENDING || order.status === OrderStatus.ASSIGNED) {
      actions.push(
        <Tooltip title="编辑订单">
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEdit(order)}
          />
        </Tooltip>
      );
    }

    // 只有待分配、已分配和运输中的订单可以拒绝
    if (order.status === OrderStatus.PENDING ||
        order.status === OrderStatus.ASSIGNED ||
        order.status === OrderStatus.IN_TRANSIT) {
      actions.push(
        <Tooltip title="拒绝订单">
          <Button
            type="text"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => onReject(order.id)}
          />
        </Tooltip>
      );
    }

    // 运输中的订单可以标记为完成
    if (order.status === OrderStatus.IN_TRANSIT) {
      actions.push(
        <Tooltip title="完成订单">
          <Button
            type="text"
            size="small"
            style={{ color: '#52c41a' }}
            icon={<CheckOutlined />}
            onClick={() => onComplete(order.id)}
          />
        </Tooltip>
      );
    }

    // 只有管理员才能删除，这里简单处理，实际可通过权限控制
    actions.push(
      <Tooltip title="删除订单">
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(order.id)}
        />
      </Tooltip>
    );

    return actions;
  };

  return (
    <Card
      hoverable
      className={`order-card order-status-${order.status}`}
      actions={renderActions()}
    >
      <div className="order-card-header">
        <div className="order-card-title">
          <Title level={5} style={{
            margin: 0,
            display: 'inline-block',
            wordBreak: 'normal',
            whiteSpace: 'normal',
            wordWrap: 'break-word',
            width: '100%'
          }}>
            {order.orderNo}
          </Title>
          <Tag color={getStatusColor(order.status)}>{order.statusName}</Tag>
        </div>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div className="order-card-body">
        <Row gutter={[16, 8]}>
          <Col span={12}>
            <Text type="secondary">联系人:</Text>
            <Text> {order.customerName || '未知'}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">重量:</Text>
            <Text> {order.weight} kg</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">预计装货:</Text>
            <Text> {formatDate(order.expectedPickup)}</Text>
          </Col>
          <Col span={12}>
            <Text type="secondary">体积:</Text>
            <Text> {order.volume} m³</Text>
          </Col>
          <Col span={24}>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              创建于: {formatDate(order.createTime)}
            </Text>
          </Col>
        </Row>

        <div className="route-info">
          <div className="station-info">
            <Text>{order.sourceStationName || '未知'}</Text>
          </div>
          <div className="route-arrow">
            <ArrowRightOutlined />
          </div>
          <div className="station-info">
            <Text>{order.targetStationName || '未知'}</Text>
          </div>
        </div>

        {order.cargoDesc && (
          <div className="cargo-desc">
            <Text type="secondary">货物描述:</Text>
            <Text> {order.cargoDesc}</Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default OrderCard;
