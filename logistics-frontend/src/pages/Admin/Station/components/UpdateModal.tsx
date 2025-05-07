import React from 'react';
import { Modal } from 'antd';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import '@umijs/max';

export type UpdateModalProps = {
  oldData: API.StationVO;
  columns: ProColumns<API.StationVO>[];
  onCancel: () => void;
  onSubmit: (values: API.StationUpdateRequest) => Promise<void | boolean>;
  visible: boolean;
};

/**
 * 更新站点的弹窗
 * @param props
 * @constructor
 */
const UpdateModal: React.FC<UpdateModalProps> = (props) => {
  const { visible, columns, oldData, onCancel, onSubmit } = props;

  // 状态选项
  const statusOptions = [
    { label: '禁用', value: 0 },
    { label: '启用', value: 1 },
  ];

  if (!oldData) {
    return <></>;
  }

  // 执行表单提交
  const handleSubmit = async (values: any) => {
    console.log('提交更新站点表单:', values);
    return onSubmit(values);
  };

  return (
    <Modal
      destroyOnClose
      title="编辑站点"
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
        form={{
          initialValues: oldData,
        }}
        onSubmit={handleSubmit}
      />
    </Modal>
  );
};

export default UpdateModal; 