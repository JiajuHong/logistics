import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  Form, 
  Select, 
  Empty, 
  Input, 
  Button, 
  message, 
  Radio, 
  Card, 
  Space, 
  Row, 
  Col, 
  Typography, 
  Divider,
  Spin,
  Tabs,
  Affix
} from 'antd';
import { 
  CarOutlined, 
  UserOutlined, 
  CheckCircleOutlined, 
  SendOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import { listAvailableVehicles, listAvailableDrivers, assignTask } from '@/services/api';
import '../index.less';

const { Text, Title } = Typography;
const { TabPane } = Tabs;

interface AssignTaskModalProps {
  visible: boolean;
  task: any;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * 分配任务模态框组件
 */
const AssignTaskModal: React.FC<AssignTaskModalProps> = ({ 
  visible, 
  task, 
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  // 车辆列表
  const [vehicles, setVehicles] = useState<any[]>([]);
  // 司机列表
  const [drivers, setDrivers] = useState<any[]>([]);
  // 选择模式：快速选择 或 分别选择
  const [selectionMode, setSelectionMode] = useState<'quick' | 'separate'>('separate');
  // 选中的车辆
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  // 选中的司机
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 当前活动选项卡
  const [activeTab, setActiveTab] = useState<string>('vehicle');

  // 当弹窗显示时，加载车辆和司机数据
  useEffect(() => {
    if (visible && task) {
      loadResources();
    }
  }, [visible, task]);

  // 加载资源数据
  const loadResources = async () => {
    setLoading(true);
    try {
      // 获取可用车辆
      const vehicleRes = await listAvailableVehicles();
      if (vehicleRes.code === 0 && vehicleRes.data) {
        setVehicles(vehicleRes.data);
      }
      
      // 获取可用司机
      const driverRes = await listAvailableDrivers();
      if (driverRes.code === 0 && driverRes.data) {
        setDrivers(driverRes.data);
      }
    } catch (error) {
      console.error('获取资源数据失败:', error);
      message.error('获取车辆或司机数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 重置表单和状态
  const resetForm = () => {
    form.resetFields();
    setSelectedVehicle(null);
    setSelectedDriver(null);
  };

  // 处理取消
  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  // 处理提交
  const handleSubmit = async () => {
    // 根据选择模式获取不同的表单值
    let values;
    
    if (selectionMode === 'quick') {
      if (!selectedVehicle || !selectedDriver) {
        message.error('请选择车辆和司机');
        return;
      }
      values = {
        vehicleId: selectedVehicle.id,
        driverId: selectedDriver.id
      };
    } else {
      try {
        values = await form.validateFields();
      } catch (error) {
        return;
      }
    }
    
    try {
      setLoading(true);
      const res = await assignTask({
        id: task.id,
        ...values
      });
      
      if (res.code === 0) {
        message.success('任务分配成功');
        resetForm();
        onSuccess();
      } else {
        message.error(res.message || '分配失败');
      }
    } catch (error) {
      console.error('分配任务出错:', error);
      message.error('分配任务失败');
    } finally {
      setLoading(false);
    }
  };

  // 选择车辆
  const handleSelectVehicle = (vehicle: any) => {
    setSelectedVehicle(vehicle);
  };

  // 选择司机
  const handleSelectDriver = (driver: any) => {
    setSelectedDriver(driver);
  };

  // 渲染车辆选择卡片
  const renderVehicleCards = () => {
    if (loading) {
      return <Spin tip="加载中..." />;
    }
    
    if (vehicles.length === 0) {
      return <Empty description="暂无可用车辆，请联系管理员添加车辆或设置车辆为空闲状态" />;
    }

    return (
      <Row gutter={[16, 16]}>
        {vehicles.map(vehicle => (
          <Col span={12} key={vehicle.id}>
            <Card 
              className={`resourceCard ${selectedVehicle?.id === vehicle.id ? 'selected' : ''}`}
              onClick={() => handleSelectVehicle(vehicle)}
              hoverable
            >
              <div className="resourceHeader">
                <Text strong>
                  <CarOutlined /> {vehicle.vehicleNo}
                </Text>
                {selectedVehicle?.id === vehicle.id && (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                )}
              </div>
              <div className="resourceMeta">
                <div className="metaItem">
                  <Text type="secondary">类型: {vehicle.vehicleType || '未知'}</Text>
                </div>
                <div className="metaItem">
                  <Text type="secondary">载重: {vehicle.loadCapacity || '-'}吨</Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // 渲染司机选择卡片
  const renderDriverCards = () => {
    if (loading) {
      return <Spin tip="加载中..." />;
    }
    
    if (drivers.length === 0) {
      return <Empty description="暂无可用司机，请联系管理员添加司机或设置司机为空闲状态" />;
    }

    return (
      <Row gutter={[16, 16]}>
        {drivers.map(driver => (
          <Col span={12} key={driver.id}>
            <Card 
              className={`resourceCard ${selectedDriver?.id === driver.id ? 'selected' : ''}`}
              onClick={() => handleSelectDriver(driver)}
              hoverable
            >
              <div className="resourceHeader">
                <Text strong>
                  <UserOutlined /> {driver.driverName || driver.name}
                </Text>
                {selectedDriver?.id === driver.id && (
                  <CheckCircleOutlined style={{ color: '#52c41a' }} />
                )}
              </div>
              <div className="resourceMeta">
                <div className="metaItem">
                  <Text type="secondary">电话: {driver.phone || '-'}</Text>
                </div>
                <div className="metaItem">
                  <Text type="secondary">许可证号: {driver.licenseNo || '-'}</Text>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  // 渲染快速选择模式 - 使用选项卡改进布局
  const renderQuickSelection = () => {
    return (
      <div>
        <div style={{ marginBottom: 16 }}>
          <Title level={5}>任务信息</Title>
          <Card size="small">
            <Row gutter={[16, 8]}>
              <Col span={24}>
                <Text strong>任务编号: </Text>
                <Text>{task?.taskNo}</Text>
              </Col>
              <Col span={24}>
                <Space>
                  <EnvironmentOutlined />
                  <Text>{task?.sourceName}</Text>
                  <SendOutlined />
                  <Text>{task?.targetName}</Text>
                </Space>
              </Col>
            </Row>
          </Card>
        </div>
        
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="选择车辆" key="vehicle">
            <div className="resourceSelection" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {renderVehicleCards()}
            </div>
          </TabPane>
          <TabPane tab="选择司机" key="driver">
            <div className="resourceSelection" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {renderDriverCards()}
            </div>
          </TabPane>
        </Tabs>
        
        <div style={{ marginTop: '16px' }}>
          <Space>
            {selectedVehicle && (
              <Card size="small" style={{ marginRight: '8px' }}>
                <Text strong>已选车辆：</Text>
                <Text>{selectedVehicle.vehicleNo}</Text>
              </Card>
            )}
            {selectedDriver && (
              <Card size="small">
                <Text strong>已选司机：</Text>
                <Text>{selectedDriver.driverName || selectedDriver.name}</Text>
              </Card>
            )}
          </Space>
        </div>
      </div>
    );
  };

  // 渲染分别选择模式 - 简化表单
  const renderSeparateSelection = () => {
    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          vehicleId: undefined,
          driverId: undefined,
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="vehicleId"
              label="车辆"
              rules={[{ required: true, message: '请选择车辆' }]}
            >
              <Select
                placeholder="请选择车辆"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
              >
                {vehicles.map(vehicle => (
                  <Select.Option 
                    key={vehicle.id} 
                    value={vehicle.id}
                    label={vehicle.vehicleNo}
                  >
                    <Space>
                      <CarOutlined />
                      {vehicle.vehicleNo} ({vehicle.vehicleType || '未知类型'})
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          
          <Col span={12}>
            <Form.Item
              name="driverId"
              label="司机"
              rules={[{ required: true, message: '请选择司机' }]}
            >
              <Select
                placeholder="请选择司机"
                allowClear
                showSearch
                optionFilterProp="label"
                style={{ width: '100%' }}
              >
                {drivers.map(driver => (
                  <Select.Option 
                    key={driver.id} 
                    value={driver.id}
                    label={driver.driverName || driver.name}
                  >
                    <Space>
                      <UserOutlined />
                      {driver.driverName || driver.name} ({driver.phone || '无电话'})
                    </Space>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>
        <Form.Item
          name="remark"
          label="备注"
        >
          <Input.TextArea rows={2} placeholder="任务分配备注（可选）" />
        </Form.Item>
      </Form>
    );
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>分配任务 - {task?.taskNo}</span>
          <Radio.Group
            value={selectionMode}
            onChange={e => {
              setSelectionMode(e.target.value);
              resetForm();
            }}
            size="small"
            buttonStyle="solid"
          >
            <Radio.Button value="separate">表单选择</Radio.Button>
            <Radio.Button value="quick">卡片选择</Radio.Button>
          </Radio.Group>
        </div>
      }
      open={visible}
      onCancel={handleCancel}
      width={720}
      bodyStyle={{ maxHeight: '500px', overflow: 'auto' }}
      footer={
        <div>
          <Button key="back" onClick={handleCancel}>
            取消
          </Button>
          <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
            确认分配
          </Button>
        </div>
      }
      className="assignTaskModal"
    >
      <Spin spinning={loading}>
        {selectionMode === 'quick' ? renderQuickSelection() : renderSeparateSelection()}
      </Spin>
    </Modal>
  );
};

export default AssignTaskModal; 