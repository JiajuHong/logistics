import React from 'react';
import { Modal } from 'antd';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import '@umijs/max';

export type FormValueType = {
  name?: string;
  code?: string;
  parentId?: number;
  level?: number;
  status?: number;
};

export type CreateModalProps = {
  columns: ProColumns<API.RegionVO>[];
  onCancel: () => void;
  onSubmit: (values: FormValueType) => Promise<void | boolean>;
  visible: boolean;
};

/**
 * 创建区域的弹窗
 * @param props
 * @constructor
 */
const CreateModal: React.FC<CreateModalProps> = (props) => {
  const { visible, columns, onCancel, onSubmit } = props;

  // 层级选项
  const levelOptions = [
    { label: '国家', value: 0 },
    { label: '省/直辖市', value: 1 },
    { label: '市', value: 2 },
    { label: '区/县', value: 3 },
  ];

  // 状态选项
  const statusOptions = [
    { label: '禁用', value: 0 },
    { label: '启用', value: 1 },
  ];

  return (
    <Modal
      destroyOnClose
      title="新建区域"
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
          } else if (column.dataIndex === 'parentId') {
            return {
              ...column,
              valueType: 'select',
              request: async () => {
                return [
                  { label: '无 (顶级区域)', value: 0 },
                  { label: '中国', value: 1 },
                  // 实际项目中需要从服务器获取可用的父级区域列表
                ];
              },
            };
          } else if (column.dataIndex === 'level') {
            return {
              ...column,
              valueType: 'select',
              valueEnum: undefined, // 清除valueEnum
              fieldProps: {
                options: levelOptions,
              },
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
        onSubmit={async (values) => {
          onSubmit?.(values);
        }}
      />
    </Modal>
  );
};

export default CreateModal; 