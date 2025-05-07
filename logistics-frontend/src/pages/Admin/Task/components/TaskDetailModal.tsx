import React from 'react';
import { Modal, Descriptions, Badge, Divider, Timeline, Space, Tag, Typography } from 'antd';
import { ClockCircleOutlined, CarOutlined, UserOutlined, EnvironmentOutlined } from '@ant-design/icons';
import '../index.less';
import { TransportTaskType, TaskStatus, TaskStatusColorMap } from '@/typings/task';

const { Text } = Typography;

interface TaskDetailModalProps {
  visible: boolean;
  task: TransportTaskType | null; // 使用TransportTaskType类型
  onCancel: () => void;
}

/**
 * 任务详情弹窗组件
 */
const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ visible, task, onCancel }) => {
  // 如果没有任务数据，不渲染内容
  if (!task) {
    return null;
  }

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

  return (
    <Modal
      title="任务详情"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={700}
      className="taskDetailModal"
    >
      <Descriptions bordered column={2}>
        <Descriptions.Item label="任务编号" span={2}>
          {task.taskNo}
        </Descriptions.Item>
        <Descriptions.Item label="任务状态">
          <Badge 
            status={task.status === TaskStatus.CANCELLED ? 'error' : 'processing'} 
            color={TaskStatusColorMap[task.status]} 
            text={task.statusName} 
          />
        </Descriptions.Item>
        <Descriptions.Item label="创建时间">
          {formatDate(task.createTime)}
        </Descriptions.Item>
        <Descriptions.Item label="关联订单" span={2}>
          {task.orderNo}
        </Descriptions.Item>
        <Descriptions.Item label="起点站点">
          <Space>
            <EnvironmentOutlined />
            {task.sourceName || '-'}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="终点站点">
          <Space>
            <EnvironmentOutlined />
            {task.targetName || '-'}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="指派车辆">
          <Space>
            <CarOutlined />
            {task.vehicleNo || '-'}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="指派司机">
          <Space>
            <UserOutlined />
            {task.driverName || '-'}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="计划开始时间">
          <Space>
            <ClockCircleOutlined />
            {formatDate(task.plannedStart)}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="计划结束时间">
          <Space>
            <ClockCircleOutlined />
            {formatDate(task.plannedEnd)}
          </Space>
        </Descriptions.Item>
        {task.status >= TaskStatus.IN_PROGRESS && (
          <Descriptions.Item label="实际开始时间">
            <Space>
              <ClockCircleOutlined />
              {formatDate(task.actualStart)}
            </Space>
          </Descriptions.Item>
        )}
        {task.status === TaskStatus.COMPLETED && (
          <Descriptions.Item label="实际结束时间">
            <Space>
              <ClockCircleOutlined />
              {formatDate(task.actualEnd)}
            </Space>
          </Descriptions.Item>
        )}
        {task.estimatedDistance && (
          <Descriptions.Item label="预计运输距离">
            {task.estimatedDistance} 公里
          </Descriptions.Item>
        )}
        {task.actualDistance && (
          <Descriptions.Item label="实际运输距离">
            {task.actualDistance} 公里
          </Descriptions.Item>
        )}
        <Descriptions.Item label="备注" span={2}>
          <Text type="danger">{task.remark || '-'}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider orientation="left">任务进度</Divider>
      
      <Timeline className="statusTimeline">
        <Timeline.Item color={TaskStatusColorMap[TaskStatus.PENDING]}>
          创建任务 ({formatDate(task.createTime)})
        </Timeline.Item>
        
        {task.status >= TaskStatus.ASSIGNED && (
          <Timeline.Item color={TaskStatusColorMap[TaskStatus.ASSIGNED]}>
            分配车辆与司机 ({formatDate(task.assignTime || task.updateTime)})
          </Timeline.Item>
        )}
        
        {task.status >= TaskStatus.IN_PROGRESS && (
          <Timeline.Item color={TaskStatusColorMap[TaskStatus.IN_PROGRESS]}>
            开始执行 ({formatDate(task.actualStart)})
          </Timeline.Item>
        )}
        
        {task.status === TaskStatus.COMPLETED && (
          <Timeline.Item color={TaskStatusColorMap[TaskStatus.COMPLETED]}>
            完成任务 ({formatDate(task.actualEnd)})
          </Timeline.Item>
        )}
        
        {task.status === TaskStatus.CANCELLED && (
          <Timeline.Item color={TaskStatusColorMap[TaskStatus.CANCELLED]}>
            取消任务 ({formatDate(task.updateTime)})
          </Timeline.Item>
        )}
      </Timeline>
    </Modal>
  );
};

export default TaskDetailModal; 