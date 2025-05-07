import React from 'react';
import { Card, Tag, Tooltip, Button, Row, Col, Typography, Divider } from 'antd';
import {
  DeleteOutlined,
  StopOutlined,
  EyeOutlined,
  ArrowRightOutlined,
  CheckOutlined,
  CarOutlined,
  UserOutlined,
  ClockCircleOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import '../index.less';

const { Text, Title } = Typography;

// 任务状态枚举
const TaskStatus = {
  PENDING: 0,      // 待分配
  ASSIGNED: 1,     // 待执行
  IN_PROGRESS: 2,  // 执行中
  COMPLETED: 3,    // 已完成
  CANCELLED: 4,    // 已取消
};

// 状态颜色映射
const TaskStatusColorMap = {
  [TaskStatus.PENDING]: '#1890ff',      // 蓝色
  [TaskStatus.ASSIGNED]: '#fa8c16',     // 橙色
  [TaskStatus.IN_PROGRESS]: '#52c41a',  // 绿色
  [TaskStatus.COMPLETED]: '#d9d9d9',    // 灰色
  [TaskStatus.CANCELLED]: '#f5222d',    // 红色
};

// TaskCard组件属性类型定义
interface TaskCardProps {
  task: {
    id: number;
    taskNo: string;
    orderId: number;
    orderNo: string;
    vehicleId?: number;
    vehicleNo?: string;
    driverId?: number;
    driverName?: string;
    sourceId: number;
    sourceName: string;
    targetId: number;
    targetName: string;
    estimatedDistance?: number;
    actualDistance?: number;
    plannedStart: Date;
    plannedEnd: Date;
    actualStart?: Date;
    actualEnd?: Date;
    status: number;
    statusName: string;
    remark?: string;
    createTime: Date;
  };
  onView: (task: any) => void;
  onViewOrder?: (orderId: number) => void;
  onAssign?: (task: any) => void;
  onDelete?: (id: number) => void;
  onCancel?: (id: number) => void;
  onStart?: (id: number) => void;
  onComplete?: (id: number) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onView,
  onViewOrder = () => {},
  onAssign = () => {},
  onDelete = () => {},
  onCancel = () => {},
  onStart = () => {},
  onComplete = () => {},
}) => {
  // 获取状态标签的颜色
  const getStatusColor = (status: number) => {
    return TaskStatusColorMap[status] || '#999';
  };

  // 格式化时间
  const formatDate = (date?: Date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 根据任务状态展示可进行的操作
  const renderActions = () => {
    const actions = [
      <Tooltip title="查看详情">
        <Button
          type="text"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onView(task)}
        />
      </Tooltip>
    ];

    // 只有待分配的任务可以分配
    if (task.status === TaskStatus.PENDING) {
      actions.push(
        <Tooltip title="分配车辆和司机">
          <Button
            type="text"
            size="small"
            icon={<CarOutlined />}
            onClick={() => onAssign(task)}
          />
        </Tooltip>
      );
    }

    // 待执行的任务可以开始执行
    if (task.status === TaskStatus.ASSIGNED) {
      actions.push(
        <Tooltip title="开始执行">
          <Button
            type="text"
            size="small"
            style={{ color: '#1890ff' }}
            icon={<PlayCircleOutlined />}
            onClick={() => onStart(task.id)}
          />
        </Tooltip>
      );
    }

    // 执行中的任务可以标记为完成
    if (task.status === TaskStatus.IN_PROGRESS) {
      actions.push(
        <Tooltip title="完成任务">
          <Button
            type="text"
            size="small"
            style={{ color: '#52c41a' }}
            icon={<CheckOutlined />}
            onClick={() => onComplete(task.id)}
          />
        </Tooltip>
      );
    }

    // 待分配和待执行的任务可以取消
    if (task.status === TaskStatus.PENDING || task.status === TaskStatus.ASSIGNED) {
      actions.push(
        <Tooltip title="取消任务">
          <Button
            type="text"
            size="small"
            danger
            icon={<StopOutlined />}
            onClick={() => onCancel(task.id)}
          />
        </Tooltip>
      );
    }

    // 管理员可以删除任务
    actions.push(
      <Tooltip title="删除任务">
        <Button
          type="text"
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(task.id)}
        />
      </Tooltip>
    );

    return actions;
  };

  return (
    <Card
      hoverable
      className={`taskCard task-status-${task.status}`}
      actions={renderActions()}
    >
      <div className="taskCardHeader">
        <div className="taskCardTitle">
          <Title level={5} style={{ margin: 0 }}>
            {task.taskNo}
          </Title>
        </div>
        <Tag color={getStatusColor(task.status)}>{task.statusName}</Tag>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div className="taskCardBody">
        <Row gutter={[8, 8]}>
          <Col span={24}>
            <Text type="secondary">关联订单:</Text>
            <Text strong style={{ cursor: 'pointer', color: '#1890ff' }} onClick={() => onViewOrder(task.orderId)}> {task.orderNo}</Text>
          </Col>
        </Row>

        <div className="routeInfo">
          <div className="stationInfo">
            <Text>{task.sourceName || '未知'}</Text>
          </div>
          <div className="routeArrow">
            <ArrowRightOutlined />
          </div>
          <div className="stationInfo">
            <Text>{task.targetName || '未知'}</Text>
          </div>
        </div>

        <div className="vehicleDriverInfo">
          <div className="vehicleInfo">
            <CarOutlined />
            <Text>{task.vehicleNo || '未分配'}</Text>
          </div>
          <div className="driverInfo">
            <UserOutlined />
            <Text>{task.driverName || '未分配'}</Text>
          </div>
        </div>

        <div className="timeInfo">
          <div>
            <ClockCircleOutlined style={{ marginRight: 4 }} />
            <Text type="secondary">计划: {formatDate(task.plannedStart)} 至 {formatDate(task.plannedEnd)}</Text>
          </div>
          {task.status === TaskStatus.IN_PROGRESS && (
            <div style={{ marginTop: 4 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              <Text type="secondary">开始执行: {formatDate(task.actualStart)}</Text>
            </div>
          )}
          {task.status === TaskStatus.COMPLETED && (
            <div style={{ marginTop: 4 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              <Text type="secondary">实际完成: {formatDate(task.actualEnd)}</Text>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TaskCard;
