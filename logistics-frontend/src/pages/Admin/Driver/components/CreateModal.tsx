import { addDriver } from '@/services/api';
import { driverStatusMap, LICENSE_TYPE_OPTIONS, DRIVER_STATUS } from '@/typings/driver';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { message, Modal, Form, Space, Button, Select } from 'antd';
import React, { useState, useEffect } from 'react';
import AvatarUploader from '@/components/AvatarUploader';

interface Props {
  visible: boolean;
  columns: ProColumns<API.DriverVO>[];
  onSubmit: () => void;
  onCancel: () => void;
}

// 处理新增司机
const handleAdd = async (fields: API.DriverAddRequest) => {
  const hide = message.loading('正在添加');
  try {
    const { code, data, message: msg } = await addDriver({ ...fields });
    hide();
    if (code === 0) {
      message.success('添加成功');
      return true;
    } else {
      message.error(msg || '添加失败');
      return false;
    }
  } catch (error: any) {
    hide();
    message.error('添加失败: ' + error.message);
    return false;
  }
};

/**
 * 创建司机弹窗
 */
const CreateModal: React.FC<Props> = (props) => {
  const { visible, columns, onSubmit, onCancel } = props;
  const [form] = Form.useForm();
  const [currentAvatar, setCurrentAvatar] = useState<string>();
  
  // 修改列配置，确保状态字段使用下拉框显示文字
  const modifiedColumns = columns.map(column => {
    if (column.dataIndex === 'status') {
      return {
        ...column,
        renderFormItem: () => (
          <Select>
            <Select.Option value={DRIVER_STATUS.DISABLED}>{driverStatusMap[DRIVER_STATUS.DISABLED].text}</Select.Option>
            <Select.Option value={DRIVER_STATUS.IDLE}>{driverStatusMap[DRIVER_STATUS.IDLE].text}</Select.Option>
            <Select.Option value={DRIVER_STATUS.IN_TASK}>{driverStatusMap[DRIVER_STATUS.IN_TASK].text}</Select.Option>
          </Select>
        ),
      };
    }
    return column;
  });
  
  // 过滤掉头像列，我们将单独处理它
  const filteredColumns = modifiedColumns.filter(column => column.dataIndex !== 'avatar');
  
  // 关闭时重置表单
  useEffect(() => {
    if (!visible) {
      form.resetFields();
      setCurrentAvatar(undefined);
    }
  }, [visible, form]);

  const handleSubmit = async (values: any) => {
    // 添加头像URL到表单值
    const submitData: API.DriverAddRequest = {
      ...values,
      avatar: currentAvatar
    };
    
    // 设置默认状态
    if (submitData.status === undefined) {
      submitData.status = 1; // 默认为空闲状态
    }
    
    const success = await handleAdd(submitData);
    if (success) {
      onSubmit?.();
    }
  };

  return (
    <Modal
      destroyOnClose
      title={'添加司机'}
      open={visible}
      footer={null}
      onCancel={onCancel}
      width={600}
    >
      <Form
        form={form}
        initialValues={{ status: 1 }}
        layout="vertical"
      >
        <Form.Item 
          label="头像" 
          name="avatarField"
          style={{ textAlign: 'center' }}
        >
          <AvatarUploader
            value={currentAvatar}
            onChange={setCurrentAvatar}
          />
        </Form.Item>
        
        <ProTable
          type="form"
          columns={filteredColumns}
          search={false}
          options={false}
          onSubmit={async (values) => {
            // 添加头像URL到表单值
            const submitData: API.DriverAddRequest = {
              ...values,
              avatar: currentAvatar
            };
            
            // 设置默认状态
            if (submitData.status === undefined) {
              submitData.status = 1; // 默认为空闲状态
            }
            
            const success = await handleAdd(submitData);
            if (success) {
              onSubmit?.();
            }
          }}
        />
      </Form>
    </Modal>
  );
};

export default CreateModal;