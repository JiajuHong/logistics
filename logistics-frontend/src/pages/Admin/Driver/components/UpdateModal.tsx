import { updateDriver } from '@/services/api';
import { driverStatusMap, DRIVER_STATUS } from '@/typings/driver';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { message, Modal, Select, Alert } from 'antd';
import React from 'react';
import AvatarUploader from '@/components/AvatarUploader';

interface Props {
  oldData?: API.DriverVO;
  visible: boolean;
  columns: ProColumns<API.DriverVO>[];
  onSubmit: () => void;
  onCancel: () => void;
}

// 处理更新司机信息
const handleUpdate = async (fields: API.DriverUpdateRequest) => {
  const hide = message.loading('正在更新');
  try {
    const { code, data, message: msg } = await updateDriver({ ...fields });
    hide();
    if (code === 0) {
      message.success('更新成功');
      return true;
    } else {
      // 处理特定错误消息
      if (msg?.includes('司机处于任务中，不能更改状态')) {
        message.error('司机处于任务中，不能更改状态');
      } else {
        message.error(msg || '更新失败');
      }
      return false;
    }
  } catch (error: any) {
    hide();
    message.error('更新失败: ' + error.message);
    return false;
  }
};

/**
 * 更新司机弹窗
 */
const UpdateModal: React.FC<Props> = (props) => {
  const { oldData, visible, columns, onSubmit, onCancel } = props;

  if (!oldData) {
    return <></>;
  }

  // 修改后的列配置
  const modifiedColumns = columns.map(column => {
    if (column.dataIndex === 'avatar') {
      return {
        ...column,
        renderFormItem: () => <AvatarUploader />
      };
    }
    if (column.dataIndex === 'status') {
      return {
        ...column,
        renderFormItem: () => (
          <Select 
            disabled={oldData.status === DRIVER_STATUS.IN_TASK}
            placeholder={oldData.status === DRIVER_STATUS.IN_TASK ? "司机处于任务中，不能更改状态" : "请选择状态"}
          >
            <Select.Option value={DRIVER_STATUS.DISABLED}>{driverStatusMap[DRIVER_STATUS.DISABLED].text}</Select.Option>
            <Select.Option value={DRIVER_STATUS.IDLE}>{driverStatusMap[DRIVER_STATUS.IDLE].text}</Select.Option>
            <Select.Option value={DRIVER_STATUS.IN_TASK}>{driverStatusMap[DRIVER_STATUS.IN_TASK].text}</Select.Option>
          </Select>
        ),
      };
    }
    return column;
  });

  return (
    <Modal
      destroyOnClose
      title={'编辑司机'}
      open={visible}
      footer={null}
      onCancel={onCancel}
      width={600}
    >
      {oldData.status === DRIVER_STATUS.IN_TASK && (
        <Alert
          type="warning"
          message="司机当前处于任务中，状态不可修改"
          style={{ marginBottom: 16 }}
        />
      )}
      <ProTable
        type="form"
        columns={modifiedColumns}
        form={{
          initialValues: oldData,
        }}
        search={false}
        options={false}
        onSubmit={async (values) => {
          const submitData: API.DriverUpdateRequest = {
            ...values,
            id: oldData.id
          };
          
          const success = await handleUpdate(submitData);
          if (success) {
            onSubmit?.();
          }
        }}
      />
    </Modal>
  );
};

export default UpdateModal;