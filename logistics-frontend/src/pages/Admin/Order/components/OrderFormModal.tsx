import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, message } from 'antd';
import { TransportOrderType } from '@/typings/order';
import {
  listStation,
  addTransportOrder,
  updateTransportOrder,
  listCustomer
} from '@/services/api';
import moment from 'moment';

const { Option } = Select;
const { TextArea } = Input;

interface OrderFormModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues?: TransportOrderType;
  title: string;
}

interface CustomerType {
  id?: number;
  name?: string;
  contactName?: string;
  contactPhone?: string;
  code?: string;
  address?: string;
  email?: string;
  regionId?: number;
  regionName?: string;
  customerType?: number;
  status?: number;
  createTime?: string;
}

const OrderFormModal: React.FC<OrderFormModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
  title,
}) => {
  const [form] = Form.useForm();
  const [customers, setCustomers] = useState<CustomerType[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 获取客户列表从数据库
  const fetchCustomers = async () => {
    try {
      const res = await listCustomer({});
      if (res.code === 0 && res.data) {
        setCustomers(res.data || []);
      } else {
        message.error('获取客户列表失败');
      }
    } catch (error) {
      console.error('获取客户列表出错:', error);
      message.error('获取客户列表失败');
    }
  };

  // 获取站点列表
  const fetchStations = async () => {
    try {
      const res = await listStation({});
      if (res.code === 0 && res.data) {
        setStations(res.data || []);
      } else {
        message.error('获取站点列表失败');
      }
    } catch (error) {
      console.error('获取站点列表出错:', error);
      message.error('获取站点列表失败');
    }
  };

  // 初始化表单数据
  useEffect(() => {
    if (visible) {
      fetchCustomers();
      fetchStations();

      if (initialValues) {
        // 将日期字符串转换为moment对象
        const formValues = {
          ...initialValues,
          expectedPickup: initialValues.expectedPickup ? moment(initialValues.expectedPickup) : undefined,
          expectedDelivery: initialValues.expectedDelivery ? moment(initialValues.expectedDelivery) : undefined,
          actualPickup: initialValues.actualPickup ? moment(initialValues.actualPickup) : undefined,
          actualDelivery: initialValues.actualDelivery ? moment(initialValues.actualDelivery) : undefined,
        };
        form.setFieldsValue(formValues);
      } else {
        form.resetFields();
        // 设置默认状态为待分配
        form.setFieldsValue({ status: 0 });
        // 生成默认的订单编号 ORD + 日期时间戳
        const orderNo = `ORD${moment().format('YYYYMMDDHHmmss')}`;
        form.setFieldsValue({ orderNo });
      }
    }
  }, [visible, initialValues, form]);

  // 表单提交
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // 处理日期字段
      const submitData = {
        ...values,
        expectedPickup: values.expectedPickup ? values.expectedPickup.toDate() : undefined,
        expectedDelivery: values.expectedDelivery ? values.expectedDelivery.toDate() : undefined,
        actualPickup: values.actualPickup ? values.actualPickup.toDate() : undefined,
        actualDelivery: values.actualDelivery ? values.actualDelivery.toDate() : undefined,
      };

      let res;
      if (initialValues?.id) {
        // 更新订单
        res = await updateTransportOrder({ ...submitData, id: initialValues.id });
      } else {
        // 创建订单
        res = await addTransportOrder(submitData);
      }

      setLoading(false);

      if (res.code === 0) {
        message.success(`${initialValues ? '更新' : '创建'}订单成功`);
        onSuccess();
      } else {
        message.error(res.message || `${initialValues ? '更新' : '创建'}订单失败`);
      }
    } catch (error) {
      setLoading(false);
      console.error(`${initialValues ? '更新' : '创建'}订单出错:`, error);
      message.error(`${initialValues ? '更新' : '创建'}订单失败`);
    }
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
      >
        <Form.Item
          name="orderNo"
          label="订单编号"
          rules={[{ required: true, message: '请输入订单编号' }]}
        >
          <Input placeholder="请输入订单编号" disabled={!!initialValues} />
        </Form.Item>

        <Form.Item
          name="customerId"
          label="联系人"
          rules={[{ required: true, message: '请选择联系人' }]}
        >
          <Select 
            placeholder="请选择联系人"
            optionFilterProp="children"
            showSearch
            filterOption={(input, option) =>
              (option?.children as unknown as string)?.toLowerCase().includes(input.toLowerCase())
            }
          >
            {customers.map(customer => (
              <Option key={customer.id} value={customer.id}>
                {customer.contactName || '未知'} - {customer.name || '未知公司'}
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="cargoDesc"
          label="货物描述"
        >
          <TextArea rows={2} placeholder="请输入货物描述" />
        </Form.Item>

        <Form.Item label="重量与体积" style={{ marginBottom: 0 }}>
          <Form.Item
            name="weight"
            rules={[{ required: true, message: '请输入重量' }]}
            style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
          >
            <InputNumber
              placeholder="重量"
              min={0}
              addonAfter="kg"
              style={{ width: '100%' }}
            />
          </Form.Item>
          <span style={{ display: 'inline-block', width: '24px', textAlign: 'center' }}>-</span>
          <Form.Item
            name="volume"
            rules={[{ required: true, message: '请输入体积' }]}
            style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
          >
            <InputNumber
              placeholder="体积"
              min={0}
              addonAfter="m³"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form.Item>

        <Form.Item
          name="amount"
          label="订单金额"
        >
          <InputNumber
            placeholder="请输入订单金额"
            min={0}
            precision={2}
            addonBefore="¥"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item label="站点信息" style={{ marginBottom: 0 }}>
          <Form.Item
            name="sourceStationId"
            rules={[{ required: true, message: '请选择起始站点' }]}
            style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
          >
            <Select placeholder="起始站点">
              {stations.map(station => (
                <Option key={station.id} value={station.id}>{station.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <span style={{ display: 'inline-block', width: '24px', textAlign: 'center' }}>→</span>
          <Form.Item
            name="targetStationId"
            rules={[{ required: true, message: '请选择目标站点' }]}
            style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
          >
            <Select placeholder="目标站点">
              {stations.map(station => (
                <Option key={station.id} value={station.id}>{station.name}</Option>
              ))}
            </Select>
          </Form.Item>
        </Form.Item>

        <Form.Item label="预期时间" style={{ marginBottom: 0 }}>
          <Form.Item
            name="expectedPickup"
            style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
          >
            <DatePicker
              placeholder="预期装货时间"
              showTime
              style={{ width: '100%' }}
            />
          </Form.Item>
          <span style={{ display: 'inline-block', width: '24px', textAlign: 'center' }}>-</span>
          <Form.Item
            name="expectedDelivery"
            rules={[{ required: true, message: '请选择预期送达时间' }]}
            style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
          >
            <DatePicker
              placeholder="预期送达时间"
              showTime
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Form.Item>

        {initialValues && (
          <Form.Item label="实际时间" style={{ marginBottom: 0 }}>
            <Form.Item
              name="actualPickup"
              style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
            >
              <DatePicker
                placeholder="实际装货时间"
                showTime
                style={{ width: '100%' }}
              />
            </Form.Item>
            <span style={{ display: 'inline-block', width: '24px', textAlign: 'center' }}>-</span>
            <Form.Item
              name="actualDelivery"
              style={{ display: 'inline-block', width: 'calc(50% - 12px)' }}
            >
              <DatePicker
                placeholder="实际送达时间"
                showTime
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Form.Item>
        )}

        <Form.Item
          name="status"
          label="订单状态"
          rules={[{ required: true, message: '请选择订单状态' }]}
        >
          <Select placeholder="请选择订单状态">
            <Option value={0}>待分配</Option>
            <Option value={1}>已分配</Option>
            <Option value={2}>运输中</Option>
            <Option value={3}>已完成</Option>
            <Option value={4}>已拒绝</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="remark"
          label="备注"
        >
          <TextArea rows={3} placeholder="请输入备注信息" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default OrderFormModal;
