import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { VehicleStatus, VehicleType } from '@/typings/vehicle';
import { addVehicle, listStation } from '@/services/api';

const { Option } = Select;

interface CreateVehicleModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

interface StationOption {
  id: number;
  name: string;
}

const CreateVehicleModal: React.FC<CreateVehicleModalProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [stations, setStations] = useState<StationOption[]>([]);

  // 获取站点列表
  const fetchStations = async () => {
    try {
      const response = await listStation({});
      if (response.code === 0 && response.data) {
        setStations(response.data.map(item => ({
          id: item.id || 0,
          name: item.name || '',
        })));
      }
    } catch (error) {
      console.error('获取站点列表失败', error);
    }
  };

  // 首次加载获取站点列表
  useEffect(() => {
    if (visible) {
      fetchStations();
    }
  }, [visible]);

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const response = await addVehicle(values);
      setLoading(false);
      
      if (response.code === 0) {
        message.success('新增车辆成功');
        form.resetFields();
        onSuccess();
      } else {
        message.error(response.message || '新增车辆失败');
      }
    } catch (error) {
      setLoading(false);
      console.error('提交表单出错:', error);
    }
  };

  // 取消操作
  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title="新增车辆"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      maskClosable={false}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: VehicleStatus.IDLE,
        }}
      >
        <Form.Item
          name="vehicleNo"
          label="车牌号"
          rules={[{ required: true, message: '请输入车牌号' }]}
        >
          <Input placeholder="请输入车牌号" maxLength={20} />
        </Form.Item>
        
        <Form.Item
          name="vehicleType"
          label="车辆类型"
          rules={[{ required: true, message: '请输入车辆类型' }]}
        >
          <Input placeholder="请输入车辆类型" maxLength={50} />
        </Form.Item>
        
        <Form.Item
          name="loadCapacity"
          label="载重量(吨)"
          rules={[{ required: true, message: '请输入载重量' }]}
        >
          <InputNumber 
            placeholder="请输入载重量" 
            min={0} 
            max={1000} 
            precision={2}
            style={{ width: '100%' }}
          />
        </Form.Item>
        
        <Form.Item
          name="volumeCapacity"
          label="容积(立方米)"
          rules={[{ required: true, message: '请输入容积' }]}
        >
          <InputNumber
            placeholder="请输入容积"
            min={0}
            max={1000}
            precision={2}
            style={{ width: '100%' }}
          />
        </Form.Item>
        
        <Form.Item
          name="stationId"
          label="所属站点"
        >
          <Select placeholder="请选择所属站点" allowClear>
            {stations.map(station => (
              <Option key={station.id} value={station.id}>{station.name}</Option>
            ))}
          </Select>
        </Form.Item>
        
        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="请选择状态">
            <Option value={VehicleStatus.IDLE}>空闲</Option>
            <Option value={VehicleStatus.IN_TASK}>任务中</Option>
            <Option value={VehicleStatus.MAINTENANCE}>维修中</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateVehicleModal; 