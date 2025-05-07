import React from 'react';
import { Modal, Descriptions, Tag, Divider, Typography, Timeline } from 'antd';
import { TransportOrderType } from '@/typings/order';
import { OrderStatusColorMap } from '@/typings/order';
import { ClockCircleOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface OrderDetailModalProps {
  visible: boolean;
  order: TransportOrderType | null;
  onCancel: () => void;
}

const OrderDetailModal: React.FC<OrderDetailModalProps> = ({ visible, order, onCancel }) => {
  if (!order) {
    return null;
  }

  // 格式化时间
  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  // 安全获取日期对象
  const getDateObject = (date?: Date) => {
    if (!date) return null;
    return date instanceof Date ? date : new Date(date);
  };

  // 获取状态标签的颜色
  const getStatusColor = (status: number) => {
    return OrderStatusColorMap[status] || '#999';
  };

  // 渲染订单状态时间线
  const renderTimeline = () => {
    const timeline = [];

    // 获取各状态时间（优先使用实际记录的时间，否则使用模拟时间）
    const createTimeObj = getDateObject(order.createTime);
    const assignTimeObj = getDateObject(order.assignTime);
    const transportTimeObj = getDateObject(order.startTransportTime);
    const completeTimeObj = getDateObject(order.completeTime);
    const cancelTimeObj = getDateObject(order.cancelTime);
    const rejectTimeObj = getDateObject(order.rejectTime);

    // 如果没有createTime，无法显示时间线
    if (!createTimeObj) {
      return <div>暂无订单时间线数据</div>;
    }

    // 订单创建
    timeline.push({
      color: 'blue',
      dot: <ClockCircleOutlined />,
      children: (
        <>
          <Text strong>订单创建</Text>
          <div>{formatDate(createTimeObj)}</div>
        </>
      ),
    });

    // 订单分配
    if (order.status >= 1) {
      const timeToShow = assignTimeObj || new Date(createTimeObj.getTime() + 3600000);
      timeline.push({
        color: 'blue',
        dot: <ClockCircleOutlined />,
        children: (
          <>
            <Text strong>订单分配</Text>
            <div>{formatDate(timeToShow)}</div>
          </>
        ),
      });
    }

    // 运输中
    if (order.status >= 2) {
      // 优先使用运输开始时间，其次是实际装货时间，最后使用模拟时间
      const timeToShow = transportTimeObj ||
                         getDateObject(order.actualPickup) ||
                         new Date(createTimeObj.getTime() + 7200000);

      timeline.push({
        color: 'green',
        dot: <ClockCircleOutlined />,
        children: (
          <>
            <Text strong>开始运输</Text>
            <div>{formatDate(timeToShow)}</div>
          </>
        ),
      });
    }

    // 已完成
    if (order.status === 3) {
      // 优先使用完成时间，其次是实际送达时间，最后使用模拟时间
      const timeToShow = completeTimeObj ||
                         getDateObject(order.actualDelivery) ||
                         new Date(createTimeObj.getTime() + 86400000);

      timeline.push({
        color: 'green',
        dot: <CheckCircleOutlined />,
        children: (
          <>
            <Text strong>订单完成</Text>
            <div>{formatDate(timeToShow)}</div>
          </>
        ),
      });
    }

    // 已取消
    if (order.status === 4) {
      const timeToShow = cancelTimeObj || new Date(createTimeObj.getTime() + 10800000);
      timeline.push({
        color: 'red',
        dot: <StopOutlined />,
        children: (
          <>
            <Text strong>订单取消</Text>
            <div>{formatDate(timeToShow)}</div>
          </>
        ),
      });
    }

    // 已拒绝
    if (order.status === 5) {
      const timeToShow = rejectTimeObj || new Date(createTimeObj.getTime() + 10800000);
      timeline.push({
        color: 'red',
        dot: <StopOutlined />,
        children: (
          <>
            <Text strong>订单拒绝</Text>
            <div>{formatDate(timeToShow)}</div>
          </>
        ),
      });
    }

    return <Timeline items={timeline} />;
  };

  return (
    <Modal
      title={`订单详情 - ${order.orderNo}`}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
    >
      <Descriptions
        bordered
        column={2}
        size="small"
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>基本信息</span>
            <Tag color={getStatusColor(order.status)}>{order.statusName}</Tag>
          </div>
        }
      >
        <Descriptions.Item label="订单编号">{order.orderNo}</Descriptions.Item>
        <Descriptions.Item label="联系人">{order.customerName}</Descriptions.Item>
        <Descriptions.Item label="客户单位">{order.customerCompany || '-'}</Descriptions.Item>
        <Descriptions.Item label="创建时间">{formatDate(order.createTime)}</Descriptions.Item>
        <Descriptions.Item label="重量">{`${order.weight} kg`}</Descriptions.Item>
        <Descriptions.Item label="体积">{`${order.volume} m³`}</Descriptions.Item>
        <Descriptions.Item label="金额" span={2}>{order.amount ? `¥${order.amount}` : '-'}</Descriptions.Item>
        <Descriptions.Item label="货物描述" span={2}>
          {order.cargoDesc || '-'}
        </Descriptions.Item>
        <Descriptions.Item label="备注" span={2}>
          <Text type="danger">{order.remark || '-'}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider />

      <Descriptions
        bordered
        column={2}
        size="small"
        title="路线信息"
      >
        <Descriptions.Item label="起始站点">{order.sourceStationName}</Descriptions.Item>
        <Descriptions.Item label="目的站点">{order.targetStationName}</Descriptions.Item>
        <Descriptions.Item label="预期装货时间">{formatDate(order.expectedPickup)}</Descriptions.Item>
        <Descriptions.Item label="预期送达时间">{formatDate(order.expectedDelivery)}</Descriptions.Item>
        <Descriptions.Item label="实际装货时间">{formatDate(order.actualPickup)}</Descriptions.Item>
        <Descriptions.Item label="实际送达时间">{formatDate(order.actualDelivery)}</Descriptions.Item>
      </Descriptions>

      <Divider />

      <Title level={5}>订单状态流转</Title>
      {renderTimeline()}
    </Modal>
  );
};

export default OrderDetailModal;
