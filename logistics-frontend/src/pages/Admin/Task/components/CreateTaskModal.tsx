import React, { useEffect, useState } from 'react';
import { 
  Modal, 
  Form, 
  Input, 
  Select, 
  Button, 
  message, 
  DatePicker, 
  Spin, 
  Space, 
  Card, 
  Typography,
  Descriptions,
  Divider,
  Row,
  Col,
  InputNumber,
  Table
} from 'antd';
import { 
  SearchOutlined, 
  EnvironmentOutlined, 
  RightOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { 
  listTransportOrder, 
  createTaskFromOrder, 
  listStation,
  listCustomer
} from '@/services/api';
import { OrderStatus } from '@/typings/order';
import moment from 'moment';
import '../index.less';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface CreateTaskModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * 从订单创建任务的模态框组件
 */
const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ 
  visible, 
  onCancel, 
  onSuccess 
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState<boolean>(false);
  const [searching, setSearching] = useState<boolean>(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // 站点和客户数据
  const [stations, setStations] = useState<{ label: string; value: number }[]>([]);
  const [customers, setCustomers] = useState<{ label: string; value: number }[]>([]);
  
  // 加载基础数据
  useEffect(() => {
    if (visible) {
      fetchBaseData();
    }
  }, [visible]);
  
  // 获取基础数据（站点、客户等）
  const fetchBaseData = async () => {
    try {
      // 获取站点数据
      const stationRes = await listStation({});
      if (stationRes?.code === 0 && stationRes?.data) {
        const stationOptions = stationRes.data.map((item: any) => ({
          label: item.stationName || item.name || `站点${item.id}`, 
          value: item.id
        }));
        setStations(stationOptions);
      }
      
      // 获取客户数据
      const customerRes = await listCustomer({});
      if (customerRes?.code === 0 && customerRes?.data) {
        const customerOptions = customerRes.data.map((item: any) => ({
          label: item.name, 
          value: item.id
        }));
        setCustomers(customerOptions);
      }
    } catch (error) {
      console.error('获取基础数据失败:', error);
    }
  };
  
  // 重置表单和状态
  const resetForm = () => {
    form.resetFields();
    setSelectedOrder(null);
    setOrders([]);
  };
  
  // 处理取消
  const handleCancel = () => {
    resetForm();
    onCancel();
  };
  
  // 搜索订单
  const handleSearchOrder = async () => {
    try {
      setSearching(true);
      const values = form.getFieldsValue();
      
      // 处理日期范围
      if (values.createTimeRange && values.createTimeRange.length === 2) {
        values.createTimeStart = values.createTimeRange[0].format('YYYY-MM-DD 00:00:00');
        values.createTimeEnd = values.createTimeRange[1].format('YYYY-MM-DD 23:59:59');
      }
      delete values.createTimeRange;
      
      // 过滤掉空值
      const queryParams = Object.fromEntries(
        Object.entries(values).filter(([_, v]) => v !== undefined && v !== null && v !== '')
      );
      
      // 添加约束条件，只查询未创建任务和待分配的订单
      const res = await listTransportOrder({
        ...queryParams,
        // 明确指定只查询状态为待分配(0)的订单
        status: OrderStatus.PENDING,
        // @ts-ignore 后端支持但类型定义未更新
        hasTask: false, // 过滤未创建任务的订单
      });
      
      if (res?.code === 0 && res?.data) {
        if (res.data.length === 0) {
          message.warning('未找到可创建任务的订单，请确保订单状态为待分配，且未关联任务');
        }
        
        setOrders(res.data);
      } else {
        message.error('查询订单失败');
      }
    } catch (error) {
      console.error('搜索订单出错:', error);
      message.error('查询订单失败');
    } finally {
      setSearching(false);
    }
  };
  
  // 重置筛选
  const handleResetFilter = () => {
    form.resetFields(['orderNo', 'status', 'sourceStationId', 'targetStationId', 'customerId', 'createTimeRange', 'minWeight', 'maxWeight']);
    setOrders([]);
  };
  
  // 选择订单
  const handleSelectOrder = (order: any) => {
    setSelectedOrder(order);
    
    // 预填表单
    form.setFieldsValue({
      orderId: order.id,
      sourceId: order.sourceStationId,
      targetId: order.targetStationId,
      plannedTimeRange: [moment(), moment().add(2, 'days')], // 默认计划时间范围
      remark: `由订单 ${order.orderNo} 创建的任务`
    });
  };
  
  // 创建任务
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields(['orderId', 'sourceId', 'targetId', 'plannedTimeRange', 'remark']);
      const { plannedTimeRange, ...rest } = values;
      
      if (!plannedTimeRange || plannedTimeRange.length !== 2) {
        message.error('请选择计划执行时间');
        return;
      }
      
      setLoading(true);
      
      const params = {
        ...rest,
        plannedStart: plannedTimeRange[0].format('YYYY-MM-DD HH:mm:ss'),
        plannedEnd: plannedTimeRange[1].format('YYYY-MM-DD HH:mm:ss')
      };
      
      const res = await createTaskFromOrder(params);
      
      if (res?.code === 0) {
        message.success('任务创建成功');
        resetForm();
        onSuccess();
      } else {
        message.error(res?.message || '创建任务失败');
      }
    } catch (error) {
      console.error('创建任务出错:', error);
      message.error('创建任务失败');
    } finally {
      setLoading(false);
    }
  };
  
  // 渲染高级筛选表单
  const renderFilterForm = () => {
    return (
      <Form
        form={form}
        layout="vertical"
      >
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="orderNo" label="订单编号">
              <Input placeholder="请输入订单编号" allowClear />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="customerId" label="客户">
              <Select
                placeholder="请选择客户"
                allowClear
                options={customers}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="status" label="订单状态">
              <Select 
                placeholder="请选择状态" 
                allowClear
                options={[
                  { label: '待分配', value: OrderStatus.PENDING }
                ]}
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="sourceStationId" label="起始站点">
              <Select
                placeholder="请选择起始站点"
                allowClear
                options={stations}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="targetStationId" label="目的站点">
              <Select
                placeholder="请选择目的站点"
                allowClear
                options={stations}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="createTimeRange" label="创建时间">
              <DatePicker.RangePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="重量范围(kg)">
              <Input.Group compact>
                <Form.Item name="minWeight" noStyle>
                  <InputNumber placeholder="最小" min={0} style={{ width: '45%' }} />
                </Form.Item>
                <Input style={{ width: '10%', borderLeft: 0, borderRight: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                <Form.Item name="maxWeight" noStyle>
                  <InputNumber placeholder="最大" min={0} style={{ width: '45%' }} />
                </Form.Item>
              </Input.Group>
            </Form.Item>
          </Col>
        </Row>
        <Row>
          <Col span={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleResetFilter}>重置</Button>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearchOrder}
              >
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    );
  };
  
  // 渲染订单列表(表格形式)
  const renderOrderTable = () => {
    if (orders.length === 0) {
      return null;
    }
    
    const columns = [
      {
        title: '订单编号',
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: 120,
      },
      {
        title: '客户',
        dataIndex: 'customerName',
        key: 'customerName',
        width: 120,
        render: (text: string) => text || '-',
      },
      {
        title: '路线',
        key: 'route',
        width: 200,
        render: (_: any, record: any) => (
          <Space>
            <Text>{record.sourceStationName || '-'}</Text>
            <RightOutlined />
            <Text>{record.targetStationName || '-'}</Text>
          </Space>
        ),
      },
      {
        title: '重量',
        dataIndex: 'weight',
        key: 'weight',
        width: 80,
        render: (text: number) => text ? `${text}kg` : '-',
      },
      {
        title: '体积',
        dataIndex: 'volume',
        key: 'volume',
        width: 80,
        render: (text: number) => text ? `${text}m³` : '-',
      },
      {
        title: '状态',
        dataIndex: 'statusName',
        key: 'statusName',
        width: 90,
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        width: 150,
        render: (date: string) => date ? moment(date).format('YYYY-MM-DD HH:mm') : '-',
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right' as const,
        width: 100,
        render: (_: any, record: any) => (
          <Button
            type="primary"
            size="small"
            onClick={() => handleSelectOrder(record)}
            disabled={selectedOrder?.id === record.id}
          >
            {selectedOrder?.id === record.id ? '已选择' : '选择'}
          </Button>
        ),
      },
    ];
    
    return (
      <div style={{ marginTop: 16 }}>
        <Divider orientation="left">订单列表 ({orders.length})</Divider>
        <Table 
          columns={columns} 
          dataSource={orders}
          rowKey="id"
          size="small"
          scroll={{ x: 900 }}
          pagination={{ pageSize: 5 }}
          rowClassName={(record) => record.id === selectedOrder?.id ? 'ant-table-row-selected' : ''}
        />
      </div>
    );
  };
  
  // 渲染已选订单详情
  const renderSelectedOrderDetails = () => {
    if (!selectedOrder) {
      return null;
    }
    
    return (
      <div style={{ marginTop: 24 }}>
        <Divider orientation="left">已选订单详情</Divider>
        <Card bordered={false} className="selected-order-card">
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="订单编号">{selectedOrder.orderNo}</Descriptions.Item>
            <Descriptions.Item label="订单状态">
              <Text strong>{selectedOrder.statusName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="客户">{selectedOrder.customerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {selectedOrder.createTime ? moment(selectedOrder.createTime).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="起点站点">{selectedOrder.sourceStationName}</Descriptions.Item>
            <Descriptions.Item label="终点站点">{selectedOrder.targetStationName}</Descriptions.Item>
            <Descriptions.Item label="货物描述" span={2}>{selectedOrder.cargoDesc || '-'}</Descriptions.Item>
            <Descriptions.Item label="货物重量">{selectedOrder.weight ? `${selectedOrder.weight} kg` : '-'}</Descriptions.Item>
            <Descriptions.Item label="货物体积">{selectedOrder.volume ? `${selectedOrder.volume} m³` : '-'}</Descriptions.Item>
            <Descriptions.Item label="预计配送时间" span={2}>
              {selectedOrder.expectedDelivery ? moment(selectedOrder.expectedDelivery).format('YYYY-MM-DD HH:mm:ss') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="备注" span={2}>{selectedOrder.remark || '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      </div>
    );
  };
  
  return (
    <Modal
      title="从订单创建任务"
      open={visible}
      onCancel={handleCancel}
      width={900}
      footer={[
        <Button key="back" onClick={handleCancel}>
          取消
        </Button>,
        <Button 
          key="refresh" 
          icon={<ReloadOutlined />} 
          onClick={handleSearchOrder}
        >
          刷新
        </Button>,
        <Button 
          key="submit" 
          type="primary" 
          disabled={!selectedOrder} 
          loading={loading} 
          icon={<CheckCircleOutlined />}
          onClick={handleSubmit}
        >
          创建任务
        </Button>,
      ]}
    >
      <Spin spinning={loading || searching}>
        <Divider orientation="left">订单筛选</Divider>
        {renderFilterForm()}
        {renderOrderTable()}
        {renderSelectedOrderDetails()}
        
        {selectedOrder && (
          <>
            <Divider orientation="left">任务信息</Divider>
            <Form
              form={form}
              layout="vertical"
            >
              <Form.Item
                name="orderId"
                label="关联订单ID"
                hidden
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                name="sourceId"
                label="起点站点"
                hidden
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                name="targetId"
                label="终点站点"
                hidden
              >
                <Input />
              </Form.Item>
              
              <Form.Item
                name="plannedTimeRange"
                label="计划执行时间"
                rules={[{ required: true, message: '请选择计划执行时间' }]}
              >
                <RangePicker 
                  showTime 
                  format="YYYY-MM-DD HH:mm:ss" 
                  style={{ width: '100%' }}
                />
              </Form.Item>
              
              <Form.Item
                name="remark"
                label="备注"
              >
                <Input.TextArea rows={3} placeholder="任务备注（可选）" />
              </Form.Item>
            </Form>
          </>
        )}
      </Spin>
    </Modal>
  );
};

export default CreateTaskModal; 