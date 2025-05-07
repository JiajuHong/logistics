import React, { useState } from 'react';
import { Upload, message } from 'antd';
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { uploadFile, getLoginUser } from '@/services/api';
import { useModel } from '@umijs/max';
import { flushSync } from 'react-dom';

interface AvatarUploaderProps {
  value?: string;
  onChange?: (url: string) => void;
}

const AvatarUploader: React.FC<AvatarUploaderProps> = ({ value, onChange }) => {
  const [loading, setLoading] = useState<boolean>(false);
  const { initialState, setInitialState } = useModel('@@initialState');

  // 更新全局用户信息
  const updateUserInfo = async () => {
    try {
      // 获取最新的用户信息
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
  };

  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('只能上传图片文件!');
      return false;
    }
    
    const isLt1M = file.size / 1024 / 1024 < 1;
    if (!isLt1M) {
      message.error('图片必须小于1MB!');
      return false;
    }
    
    // 自定义上传
    customUpload(file);
    return false; // 阻止默认上传行为
  };

  const customUpload = async (file: File) => {
    setLoading(true);
    try {
      // 使用适配器中的uploadFile函数，注意参数顺序：params, body, file
      const res = await uploadFile(
        { biz: 'user_avatar' }, // params参数
        {}, // body参数，这里为空对象
        file, // 直接传递文件对象
        { } // 额外选项
      );
      
      if (res.code === 0 && res.data) {
        message.success('头像上传成功');
        // 返回头像URL给表单
        onChange?.(res.data);
        
        // 重要：更新全局用户信息状态，使头像立即生效
        await updateUserInfo();
      } else {
        message.error('头像上传失败: ' + (res.message || '未知错误'));
      }
    } catch (error: any) {
      message.error('上传失败: ' + (error.message || '未知错误'));
    } finally {
      setLoading(false);
    }
  };

  // 上传按钮
  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>上传</div>
    </div>
  );

  return (
    <Upload
      name="avatar"
      listType="picture-card"
      showUploadList={false}
      beforeUpload={beforeUpload}
    >
      {value ? (
        <img src={value} alt="头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        uploadButton
      )}
    </Upload>
  );
};

export default AvatarUploader; 