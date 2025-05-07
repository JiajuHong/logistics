import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Avatar, Button, Card, Form, Input, message, Upload, Spin } from 'antd';
import { useModel } from '@umijs/max';
import { LoadingOutlined, PlusOutlined, UserOutlined } from '@ant-design/icons';
import { updateMyUser, getLoginUser, uploadFile } from '@/services/api';
import { formatDateTime } from '@/utils/dateUtils';
import styles from './index.less';

type UserInfo = {
  id?: number;
  userName?: string;
  userAvatar?: string;
  userProfile?: string;
  userRole?: string;
  createTime?: string;
  updateTime?: string;
};

const UserCenter: React.FC = () => {
  const [form] = Form.useForm();
  const { initialState, setInitialState } = useModel('@@initialState');
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<UserInfo | undefined>(initialState?.currentUser);

  // 初始化表单数据
  useEffect(() => {
    if (initialState?.currentUser) {
      form.setFieldsValue({
        userName: initialState.currentUser.userName,
        userProfile: initialState.currentUser.userProfile,
      });
      setUserInfo(initialState.currentUser);
    }
  }, [initialState?.currentUser, form]);

  // 刷新用户信息
  const refreshUserInfo = async () => {
    try {
      const res = await getLoginUser();
      if (res.code === 0 && res.data) {
        setUserInfo(res.data);
        // 更新全局状态
        setInitialState((s) => ({
          ...s,
          currentUser: res.data,
        }));
        return res.data;
      }
    } catch (error) {
      message.error('获取用户信息失败');
    }
    return undefined;
  };

  // 处理头像上传
  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    try {
      // 直接传递文件和参数，而不是构建FormData
      const res = await uploadFile(
        { biz: 'user_avatar' }, // 参数对象 - 使用下划线格式
        {}, // body对象，不需要额外参数时传空对象
        file // 文件对象
      );
      
      if (res.code === 0 && res.data) {
        console.log('上传成功，URL:', res.data);
        return res.data;
      } else {
        console.error('上传失败:', res.message);
        message.error(res.message || '上传失败');
      }
    } catch (error) {
      console.error('上传异常:', error);
      message.error('上传失败');
    } finally {
      setUploading(false);
    }
    return '';
  };

  // 自定义上传组件
  const customUpload = async (options: any) => {
    const { file, onSuccess, onError } = options;
    try {
      console.log('开始上传文件:', file.name, file.size);
      const url = await handleAvatarUpload(file);
      if (url) {
        // 更新头像URL到表单和预览
        form.setFieldValue('userAvatar', url);
        setUserInfo((prev) => ({ ...prev, userAvatar: url }));
        onSuccess(url);
      } else {
        onError('上传失败');
      }
    } catch (error) {
      console.error('上传组件错误:', error);
      onError('上传失败');
    }
  };

  // 提交表单
  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const res = await updateMyUser({
        userName: values.userName,
        userProfile: values.userProfile,
        userAvatar: userInfo?.userAvatar, // 使用最新的头像URL
      });

      if (res.code === 0) {
        message.success('更新成功');
        // 刷新用户信息
        await refreshUserInfo();
      } else {
        message.error(res.message || '更新失败');
      }
    } catch (error) {
      message.error('更新失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer header={{ title: '个人中心' }}>
      <Card>
        <div className={styles.userCenterContainer}>
          <div className={styles.avatarContainer}>
            <Avatar
              size={100}
              src={userInfo?.userAvatar}
              icon={<UserOutlined />}
              className={styles.avatar}
            />
            <Upload
              name="avatar"
              showUploadList={false}
              customRequest={customUpload}
              beforeUpload={(file) => {
                const isImage = file.type.startsWith('image/');
                if (!isImage) {
                  message.error('只能上传图片文件');
                }
                const isLt2M = file.size / 1024 / 1024 < 2;
                if (!isLt2M) {
                  message.error('图片必须小于2MB');
                }
                return isImage && isLt2M;
              }}
            >
              <Button 
                type="primary" 
                disabled={uploading}
                icon={uploading ? <LoadingOutlined /> : <PlusOutlined />}
              >
                {uploading ? '上传中' : '更换头像'}
              </Button>
            </Upload>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            className={styles.userForm}
          >
            <Form.Item
              name="userName"
              label="用户名"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input placeholder="请输入用户名" maxLength={20} />
            </Form.Item>

            <Form.Item name="userProfile" label="个人简介">
              <Input.TextArea
                placeholder="请输入个人简介"
                rows={4}
                maxLength={300}
                showCount
              />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                保存修改
              </Button>
            </Form.Item>
          </Form>

          <div className={styles.userInfo}>
            <p><strong>角色:</strong> {userInfo?.userRole === 'admin' ? '管理员' : '普通用户'}</p>
            <p><strong>创建时间:</strong> {formatDateTime(userInfo?.createTime)}</p>
          </div>
        </div>
      </Card>
    </PageContainer>
  );
};

export default UserCenter; 