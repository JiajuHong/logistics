import { updateUser, getLoginUser } from '@/services/api';
import { ProColumns, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { message, Modal } from 'antd';
import React from 'react';
import AvatarUploader from '@/components/AvatarUploader';
import { useModel } from '@umijs/max';
import { flushSync } from 'react-dom';

interface Props {
  oldData?: API.User;
  visible: boolean;
  columns: ProColumns<API.User>[];
  onSubmit: (values: API.UserAddRequest) => void;
  onCancel: () => void;
}

/**
 * 更新弹窗
 * @param props
 * @constructor
 */
const UpdateModal: React.FC<Props> = (props) => {
  const { oldData, visible, columns, onSubmit, onCancel } = props;
  const { initialState, setInitialState } = useModel('@@initialState');

  if (!oldData) {
    return <></>;
  }

  // 修改后的列配置，替换头像的输入组件
  const modifiedColumns = columns.map(column => {
    if (column.dataIndex === 'userAvatar') {
      return {
        ...column,
        renderFormItem: () => <AvatarUploader />
      };
    }
    return column;
  });

  // 更新用户信息
  const handleUpdate = async (fields: API.UserUpdateRequest) => {
    const hide = message.loading('正在更新');
    try {
      await updateUser(fields);
      hide();
      message.success('更新成功');
      
      // 如果更新的是当前登录用户，刷新全局用户状态
      const currentUser = initialState?.currentUser;
      if (currentUser && currentUser.id === oldData.id) {
        try {
          const res = await getLoginUser();
          if (res.data) {
            // 更新全局状态
            flushSync(() => {
              setInitialState((s) => ({
                ...s,
                currentUser: res.data,
              }));
            });
          }
        } catch (error) {
          console.error('获取用户信息失败', error);
        }
      }
      
      return true;
    } catch (error: any) {
      hide();
      message.error('更新失败，' + error.message);
      return false;
    }
  };

  return (
    <Modal
      destroyOnClose
      title={'更新'}
      open={visible}
      footer={null}
      onCancel={() => {
        onCancel?.();
      }}
    >
      <ProTable
        type="form"
        columns={modifiedColumns}
        form={{
          initialValues: oldData,
        }}
        onSubmit={async (values: API.UserAddRequest) => {
          const success = await handleUpdate({
            ...values,
            id: oldData.id as any,
          });
          if (success) {
            onSubmit?.(values);
          }
        }}
      />
    </Modal>
  );
};
export default UpdateModal;
