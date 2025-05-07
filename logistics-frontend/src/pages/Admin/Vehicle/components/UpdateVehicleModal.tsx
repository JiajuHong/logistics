import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, InputNumber, Select, message, Alert } from 'antd';
import { VehicleStatus, VehicleType } from '@/typings/vehicle';
import { updateVehicle, listStation } from '@/services/api';

const { Option } = Select;

interface UpdateVehicleModalProps {
  visible: boolean;
  vehicle?: VehicleType;
  onCancel: () => void;
  onSuccess: () => void;
}

interface StationOption {
  id: number;
  name: string;
}

const UpdateVehicleModal: React.FC<UpdateVehicleModalProps> = ({
  visible,
  vehicle,
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

  // 首次加载或车辆数据变更时重置表单
  useEffect(() => {
    if (visible && vehicle) {
      form.setFieldsValue({
        ...vehicle,
      });
      fetchStations();
    }
  }, [visible, vehicle, form]);

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      
      const response = await updateVehicle({
        id: vehicle?.id,
        ...values,
      });
      
      setLoading(false);
      
      if (response.code === 0) {
        message.success('更新车辆成功');
        onSuccess();
      } else {
        // 处理特定错误消息
        if (response.message?.includes('车辆处于任务中，不能更改状态')) {
          message.error('车辆处于任务中，不能更改状态');
        } else {
          message.error(response.message || '更新车辆失败');
        }
      }
    } catch (error) {
      setLoading(false);
      console.error('提交表单出错:', error);
    }
  };

  // 判断车辆是否处于任务中状态
  const isVehicleInTask = vehicle?.status === VehicleStatus.IN_TASK;

  return (
    <Modal
      title="编辑车辆"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      maskClosable={false}
      destroyOnClose
    >
      {isVehicleInTask && (
        <Alert
          type="warning"
          message="车辆当前处于任务中，状态不可修改"
          style={{ marginBottom: 16 }}
        />
      )}
      <Form
        form={form}
        layout="vertical"
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
          <Select 
            placeholder={isVehicleInTask ? "车辆处于任务中，不能更改状态" : "请选择状态"}
            disabled={isVehicleInTask}
          >
            <Option value={VehicleStatus.IDLE}>空闲</Option>
            <Option value={VehicleStatus.IN_TASK}>任务中</Option>
            <Option value={VehicleStatus.MAINTENANCE}>维修中</Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default UpdateVehicleModal; 