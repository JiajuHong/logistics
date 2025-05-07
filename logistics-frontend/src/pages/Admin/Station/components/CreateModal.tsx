import React from 'react';
import { Modal, Form } from 'antd';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import '@umijs/max';

export type FormValueType = {
  name?: string;
  code?: string;
  regionId?: number;
  address?: string;
  contactName?: string;
  contactPhone?: string;
  status?: number;
};

export type CreateModalProps = {
  columns: ProColumns<API.StationVO>[];
  onCancel: () => void;
  onSubmit: (values: FormValueType) => Promise<void | boolean>;
  visible: boolean;
};

/**
 * 创建站点的弹窗
 * @param props
 * @constructor
 */
const CreateModal: React.FC<CreateModalProps> = (props) => {
  const { visible, columns, onCancel, onSubmit } = props;
  const [form] = Form.useForm();

  // 状态选项
  const statusOptions = [
    { label: '禁用', value: 0 },
    { label: '启用', value: 1 },
  ];

  // 表单提交
  const handleSubmit = async (values: any) => {
    console.log('提交创建站点表单:', values);
    return onSubmit?.(values);
  };

  return (
    <Modal
      destroyOnClose
      title="新建站点"
      open={visible}
      footer={null}
      onCancel={() => {
        onCancel?.();
      }}
    >
      <ProTable
        type="form"
        columns={columns.map((column) => {
          if (column.dataIndex === 'id' || column.dataIndex === 'createTime' || column.dataIndex === 'updateTime') {
            return {
              ...column,
              hideInForm: true,
            };
          } else if (column.dataIndex === 'status') {
            return {
              ...column,
              valueType: 'select',
              valueEnum: undefined, // 清除valueEnum
              fieldProps: {
                options: statusOptions,
              },
            };
          }
          return column;
        })}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};

export default CreateModal; 