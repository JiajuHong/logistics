import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Row,
  Space,
  message,
  Modal,
  Empty,
  Spin,
  Pagination,
  Segmented,
  Statistic,
  Tooltip,
  Form,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Progress
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  TableOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  SolutionOutlined,
  CarOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { useRequest } from 'umi';
import {
  listTransportOrderByPage,
  listTransportOrder,
  deleteTransportOrder,
  cancelOrder,
  updateTransportOrder
} from '@/services/api';
import OrderCard from './components/OrderCard';
import OrderDetailModal from './components/OrderDetailModal';
import OrderFormModal from './components/OrderFormModal';
import { TransportOrderType, TransportOrderQueryParams, OrderStatus } from '@/typings/order';
import styles from './index.less';
import { OrderStatusColorMap } from '@/typings/order';

// 将cancelOrder函数重命名为rejectOrder
const rejectOrder = async (params: { id: number }) => {
  console.log('调用拒绝订单API:', params);
  try {
    // 使用updateTransportOrder API来更新订单状态
    const res = await updateTransportOrder({
      id: params.id,
      status: OrderStatus.REJECTED
    });
    console.log('拒绝订单API返回:', res);
    return res;
  } catch (error) {
    console.error('拒绝订单API错误:', error);
    throw error;
  }
};

// 添加一个完成订单的API封装
const completeOrder = async (params: { id: number }) => {
  console.log('调用完成订单API:', params);
  try {
    // 使用updateTransportOrder API来更新订单状态为已完成
    const res = await updateTransportOrder({
      id: params.id,
      status: OrderStatus.COMPLETED
    });
    console.log('完成订单API返回:', res);
    return res;
  } catch (error) {
    console.error('完成订单API错误:', error);
    throw error;
  }
};

/**
 * 订单管理页面
 */
const OrderAdmin: React.FC = () => {
  // 视图类型
  const [viewType, setViewType] = useState<'table' | 'card'>('card');
  // 当前查询参数
  const [queryParams, setQueryParams] = useState<TransportOrderQueryParams>({});
  // 列表数据
  const [orderList, setOrderList] = useState<TransportOrderType[]>([]);
  // 分页信息
  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(12);
  const [total, setTotal] = useState<number>(0);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 统计数据
  const [statistics, setStatistics] = useState<{
    total: number;
    pending: number;
    assigned: number;
    inTransit: number;
    completed: number;
    rejected: number;
  }>({
    total: 0,
    pending: 0,
    assigned: 0,
    inTransit: 0,
    completed: 0,
    rejected: 0
  });
  // 模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  // 当前选中的订单
  const [currentOrder, setCurrentOrder] = useState<TransportOrderType | null>(null);
  // 查询表单
  const [form] = Form.useForm();

  // 站点数据
  const [stations, setStations] = useState<{ label: string; value: number }[]>([]);

  // 获取站点数据 (模拟数据，实际项目中应该从API获取)
  useEffect(() => {
    setStations([
      { label: '华北物流枢纽中心', value: 1 },
      { label: '华东物流枢纽中心', value: 2 },
      { label: '天河体育中心配送站', value: 3 },
      { label: '北京朝阳分拣中心', value: 4 },
      { label: '北京莲花池转运站', value: 5 },
      { label: '静安嘉里中心配送站', value: 6 },
      { label: '中关村科技园配送中心', value: 7 },
      { label: '浦东外高桥保税区仓储基地', value: 8 }
    ]);
  }, []);

  // 获取订单统计数据
  const fetchStatistics = async () => {
    try {
      // 获取所有订单数据（不分页）
      const res = await listTransportOrder({});

      if (res?.code === 0 && res?.data) {
        const orderList = res.data || [];

        // 计算各状态订单数量
        const total = orderList.length;
        const pending = orderList.filter((item: TransportOrderType) => item.status === OrderStatus.PENDING).length;
        const assigned = orderList.filter((item: TransportOrderType) => item.status === OrderStatus.ASSIGNED).length;
        const inTransit = orderList.filter((item: TransportOrderType) => item.status === OrderStatus.IN_TRANSIT).length;
        const completed = orderList.filter((item: TransportOrderType) => item.status === OrderStatus.COMPLETED).length;
        const rejected = orderList.filter((item: TransportOrderType) => item.status === OrderStatus.REJECTED).length;

        setStatistics({
          total,
          pending,
          assigned,
          inTransit,
          completed,
          rejected
        });
      } else {
        message.error('获取订单统计数据失败');
      }
    } catch (error) {
      console.error('获取订单统计出错:', error);
      message.error('获取订单统计数据失败');
    }
  };

  // 获取订单列表数据
  const loadOrderData = async (params: TransportOrderQueryParams = {}) => {
    setLoading(true);
    try {
      // 合并查询参数和分页参数
      const requestParams = {
        ...queryParams,  // 先使用已保存的查询参数
        ...params,       // 再使用传入的新参数覆盖
        current: params.current || current,
        pageSize: params.pageSize || pageSize,
      };
      
      console.log('请求参数:', requestParams);
      
      const res = await listTransportOrderByPage(requestParams);
      console.log('返回结果:', res);
      
      if (res?.code === 0 && res?.data) {
        // 添加调试信息
        console.log('订单列表:', res.data.records);
        
        setOrderList(res.data.records || []);
        setTotal(res.data.total || 0);
        
        // 更新分页信息
        if (res.data.current && !params.current) {
          setCurrent(res.data.current);
        }
      } else {
        message.error('获取订单列表失败');
      }
    } catch (error) {
      console.error('加载订单数据出错:', error);
      message.error('加载订单数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 首次加载和分页参数变化时重新加载数据
  useEffect(() => {
    loadOrderData();
    fetchStatistics();
  }, [current, pageSize]);

  // 查看订单详情
  const handleViewOrder = (order: TransportOrderType) => {
    setCurrentOrder(order);
    setDetailModalVisible(true);
  };

  // 编辑订单
  const handleEditOrder = (order: TransportOrderType) => {
    setCurrentOrder(order);
    setUpdateModalVisible(true);
  };

  // 删除订单
  const handleDeleteOrder = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除该订单吗？此操作不可恢复。',
      onOk: async () => {
        try {
          const res = await deleteTransportOrder({ id });
          if (res?.code === 0) {
            message.success('删除订单成功');
            loadOrderData();
            fetchStatistics();
          } else {
            message.error(res?.message || '删除订单失败');
          }
        } catch (error) {
          console.error('删除订单出错:', error);
          message.error('删除订单失败');
        }
      }
    });
  };

  // 拒绝订单(原取消订单)
  const handleRejectOrder = (id: number) => {
    Modal.confirm({
      title: '确认拒绝',
      icon: <ExclamationCircleOutlined />,
      content: '确定要拒绝该订单吗？',
      onOk: async () => {
        try {
          const res = await rejectOrder({ id });
          if (res?.code === 0) {
            message.success('订单已拒绝');
            loadOrderData();
            fetchStatistics();
          } else {
            message.error(res?.message || '拒绝订单失败');
          }
        } catch (error) {
          console.error('拒绝订单出错:', error);
          message.error('拒绝订单失败');
        }
      }
    });
  };

  // 完成订单
  const handleCompleteOrder = (id: number) => {
    Modal.confirm({
      title: '确认完成',
      icon: <ExclamationCircleOutlined />,
      content: '确定将该订单标记为已完成吗？',
      onOk: async () => {
        try {
          const res = await completeOrder({ id });
          if (res?.code === 0) {
            message.success('订单已完成');
            loadOrderData();
            fetchStatistics();
          } else {
            message.error(res?.message || '操作失败');
          }
        } catch (error) {
          console.error('完成订单出错:', error);
          message.error('操作失败');
        }
      }
    });
  };

  // 处理分页变化
  const handlePageChange = (page: number, size?: number) => {
    setCurrent(page);
    if (size) {
      setPageSize(size);
    }
  };

  // 处理刷新
  const handleRefresh = () => {
    loadOrderData(queryParams);
    fetchStatistics();
  };

  // 处理创建订单成功
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    message.success('创建订单成功');
    loadOrderData();
    fetchStatistics();
  };

  // 处理更新订单成功
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    message.success('更新订单成功');
    loadOrderData();
    fetchStatistics();
  };

  // 提交查询
  const handleSearch = () => {
    const values = form.getFieldsValue();

    // 处理日期范围
    if (values.dateRange && values.dateRange.length === 2) {
      const [start, end] = values.dateRange;
      if (start) values.createTimeStart = start.startOf('day').toDate();
      if (end) values.createTimeEnd = end.endOf('day').toDate();
    }

    delete values.dateRange;

    // 过滤掉空值
    const filteredValues = Object.fromEntries(
      Object.entries(values).filter(([_, v]) => v !== undefined && v !== null && v !== '')
    );

    // 更新查询参数
    setQueryParams(filteredValues);
    // 重置到第一页并加载数据
    setCurrent(1);
    loadOrderData({...filteredValues, current: 1});
  };

  // 重置查询
  const handleReset = () => {
    form.resetFields();
    setQueryParams({});
    setCurrent(1);
    loadOrderData({current: 1});
  };

  // 渲染统计卡片
  const renderStatistics = () => {
    // 计算各状态订单占比
    const getPercent = (value: number) => {
      return statistics.total > 0 ? Math.round((value / statistics.total) * 100) : 0;
    };

    return (
      <Card className={styles.statisticCard} bordered={false}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={8} xl={4}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="订单总数" 
                value={statistics.total} 
                valueStyle={{ fontSize: '22px', fontWeight: 'bold' }}
                prefix={<TeamOutlined style={{ marginRight: 8 }} />}
              />
              <div className={styles.orderTotal}>
                <Progress type="dashboard" percent={100} strokeColor="#1890ff" format={() => '全部'} width={60} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} xl={4}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="待分配" 
                value={statistics.pending} 
                valueStyle={{ color: '#faad14', fontSize: '22px', fontWeight: 'bold' }}
                prefix={<ClockCircleOutlined style={{ color: '#faad14', marginRight: 8 }} />}
                suffix={<small style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{`/${statistics.total}`}</small>}
              />
              <div className={styles.progressWrapper}>
                <Progress type="circle" percent={getPercent(statistics.pending)} strokeColor="#faad14" width={60} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} xl={4}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="已分配" 
                value={statistics.assigned} 
                valueStyle={{ color: '#1890ff', fontSize: '22px', fontWeight: 'bold' }}
                prefix={<SolutionOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                suffix={<small style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{`/${statistics.total}`}</small>}
              />
              <div className={styles.progressWrapper}>
                <Progress type="circle" percent={getPercent(statistics.assigned)} strokeColor="#1890ff" width={60} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} xl={4}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="运输中" 
                value={statistics.inTransit} 
                valueStyle={{ color: '#722ed1', fontSize: '22px', fontWeight: 'bold' }}
                prefix={<CarOutlined style={{ color: '#722ed1', marginRight: 8 }} />}
                suffix={<small style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{`/${statistics.total}`}</small>}
              />
              <div className={styles.progressWrapper}>
                <Progress type="circle" percent={getPercent(statistics.inTransit)} strokeColor="#722ed1" width={60} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} xl={4}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="已完成" 
                value={statistics.completed} 
                valueStyle={{ color: '#52c41a', fontSize: '22px', fontWeight: 'bold' }}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                suffix={<small style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{`/${statistics.total}`}</small>}
              />
              <div className={styles.progressWrapper}>
                <Progress type="circle" percent={getPercent(statistics.completed)} strokeColor="#52c41a" width={60} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8} xl={4}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="已拒绝" 
                value={statistics.rejected} 
                valueStyle={{ color: '#f5222d', fontSize: '22px', fontWeight: 'bold' }}
                prefix={<CloseCircleOutlined style={{ color: '#f5222d', marginRight: 8 }} />}
                suffix={<small style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{`/${statistics.total}`}</small>}
              />
              <div className={styles.progressWrapper}>
                <Progress type="circle" percent={getPercent(statistics.rejected)} strokeColor="#f5222d" width={60} />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>
    );
  };

  // 渲染筛选表单
  const renderFilterForm = () => {
    return (
      <Card className={styles.filterCard}>
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleSearch}
        >
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="orderNo" label="订单号">
                <Input placeholder="请输入订单号" allowClear />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="status" label="订单状态">
                <Select 
                  placeholder="请选择订单状态" 
                  allowClear
                  options={[
                    { label: '待分配', value: OrderStatus.PENDING },
                    { label: '已分配', value: OrderStatus.ASSIGNED },
                    { label: '运输中', value: OrderStatus.IN_TRANSIT },
                    { label: '已完成', value: OrderStatus.COMPLETED },
                    { label: '已拒绝', value: OrderStatus.REJECTED }
                  ]}
                />
              </Form.Item>
            </Col>
            <Col span={6}>
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
            <Col span={6}>
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
            <Col span={8}>
              <Form.Item name="dateRange" label="创建时间">
                <DatePicker.RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="重量范围">
                <Input.Group compact>
                  <Form.Item name="minWeight" noStyle>
                    <Input placeholder="最小重量" style={{ width: '45%' }} type="number" suffix="kg" />
                  </Form.Item>
                  <Input style={{ width: '10%', borderLeft: 0, borderRight: 0, pointerEvents: 'none', backgroundColor: '#fff' }} placeholder="~" disabled />
                  <Form.Item name="maxWeight" noStyle>
                    <Input placeholder="最大重量" style={{ width: '45%' }} type="number" suffix="kg" />
                  </Form.Item>
                </Input.Group>
              </Form.Item>
            </Col>
            <Col span={8} style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={handleReset}>重置</Button>
                <Button type="primary" htmlType="submit" icon={<SearchOutlined />} onClick={handleSearch}>
                  查询
                </Button>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => setCreateModalVisible(true)}
                >
                  新建订单
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>
    );
  };

  // 渲染头部操作栏
  const renderToolbar = () => {
    return (
      <Row justify="space-between" align="middle" className={styles.toolbar}>
        <Col>
          <Tooltip title="刷新">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            />
          </Tooltip>
        </Col>
        <Col>
          <Space>
            <Segmented
              value={viewType}
              onChange={(value) => setViewType(value as 'table' | 'card')}
              options={[
                {
                  value: 'table',
                  icon: <TableOutlined />,
                  label: '表格视图'
                },
                {
                  value: 'card',
                  icon: <AppstoreOutlined />,
                  label: '卡片视图'
                }
              ]}
            />
          </Space>
        </Col>
      </Row>
    );
  };

  // 渲染卡片视图
  const renderCardView = () => {
    return (
      <div className={styles.cardView}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <Spin tip="加载中..." />
          </div>
        ) : orderList.length > 0 ? (
          <Row gutter={[16, 16]}>
            {orderList.map(order => (
              <Col xs={24} sm={12} md={8} lg={8} xl={6} key={order.id}>
                <OrderCard
                  order={order}
                  onView={handleViewOrder}
                  onEdit={handleEditOrder}
                  onDelete={handleDeleteOrder}
                  onReject={handleRejectOrder}
                  onComplete={handleCompleteOrder}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="暂无订单数据" />
        )}

        {total > 0 && (
          <div className={styles.pagination}>
            <Pagination
              current={current}
              pageSize={pageSize}
              total={total}
              showSizeChanger
              showQuickJumper
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        )}
      </div>
    );
  };

  // 渲染表格视图
  const renderTableView = () => {
    const columns = [
      {
        title: '订单号',
        dataIndex: 'orderNo',
        key: 'orderNo',
        render: (text: string) => <a onClick={() => handleViewOrder(orderList.find(order => order.orderNo === text)!)}>{text}</a>,
      },
      {
        title: '联系人',
        dataIndex: 'customerName',
        key: 'customerName',
        render: (text: string) => text || '未知',
      },
      {
        title: '起始站点',
        dataIndex: 'sourceStationName',
        key: 'sourceStationName',
        render: (text: string) => text || '未知',
      },
      {
        title: '目的站点',
        dataIndex: 'targetStationName',
        key: 'targetStationName',
        render: (text: string) => text || '未知',
      },
      {
        title: '重量(kg)',
        dataIndex: 'weight',
        key: 'weight',
        sorter: (a: TransportOrderType, b: TransportOrderType) => a.weight - b.weight,
      },
      {
        title: '体积(m³)',
        dataIndex: 'volume',
        key: 'volume',
        sorter: (a: TransportOrderType, b: TransportOrderType) => a.volume - b.volume,
      },
      {
        title: '状态',
        dataIndex: 'status',
        key: 'status',
        render: (status: number, record: TransportOrderType) => {
          // 获取状态标签的颜色
          const getStatusColor = (s: number) => {
            return OrderStatusColorMap[s] || '#999';
          };
          
          return (
            <Tag color={getStatusColor(status)}>
              {record.statusName || '未知'}
            </Tag>
          );
        },
        filters: [
          { text: '待分配', value: OrderStatus.PENDING },
          { text: '已分配', value: OrderStatus.ASSIGNED },
          { text: '运输中', value: OrderStatus.IN_TRANSIT },
          { text: '已完成', value: OrderStatus.COMPLETED },
          { text: '已拒绝', value: OrderStatus.REJECTED },
        ],
        onFilter: (value: any, record: TransportOrderType) => {
          console.log('筛选值:', value, '记录状态:', record.status);
          return record.status === value;
        },
      },
      {
        title: '创建时间',
        dataIndex: 'createTime',
        key: 'createTime',
        render: (date?: Date) => date ? new Date(date).toLocaleString() : '-',
        sorter: (a: TransportOrderType, b: TransportOrderType) => {
          if (!a.createTime || !b.createTime) return 0;
          return new Date(a.createTime).getTime() - new Date(b.createTime).getTime();
        },
      },
      {
        title: '操作',
        key: 'action',
        render: (_: any, record: TransportOrderType) => (
          <Space size="small">
            <Button type="link" size="small" onClick={() => handleViewOrder(record)}>
              查看
            </Button>
            {(record.status === OrderStatus.PENDING || record.status === OrderStatus.ASSIGNED) && (
              <>
                <Button type="link" size="small" onClick={() => handleEditOrder(record)}>
                  编辑
                </Button>
                <Button type="link" size="small" danger onClick={() => handleRejectOrder(record.id)}>
                  拒绝
                </Button>
              </>
            )}
            {record.status === OrderStatus.IN_TRANSIT && (
              <>
                <Button type="link" size="small" danger onClick={() => handleRejectOrder(record.id)}>
                  拒绝
                </Button>
                <Button type="link" size="small" style={{ color: '#52c41a' }} onClick={() => handleCompleteOrder(record.id)}>
                  完成
                </Button>
              </>
            )}
            <Button type="link" size="small" danger onClick={() => handleDeleteOrder(record.id)}>
              删除
            </Button>
          </Space>
        ),
      },
    ];

    return (
      <div className={styles.tableView}>
        <Table
          columns={columns}
          dataSource={orderList}
          rowKey="id"
          loading={loading}
          pagination={{
            current: current,
            pageSize: pageSize,
            total: total,
            showSizeChanger: true,
            showQuickJumper: true,
            onChange: handlePageChange,
            onShowSizeChange: handlePageChange,
          }}
        />
      </div>
    );
  };

  return (
    <div className={styles.container}>
      {/* 统计信息 */}
      {renderStatistics()}

      {/* 筛选表单 */}
      {renderFilterForm()}

      {/* 操作栏 */}
      {renderToolbar()}

      {/* 内容区域 */}
      {viewType === 'card' ? renderCardView() : renderTableView()}

      {/* 订单详情弹窗 */}
      <OrderDetailModal
        visible={detailModalVisible}
        order={currentOrder}
        onCancel={() => setDetailModalVisible(false)}
      />

      {/* 新建订单弹窗 */}
      <OrderFormModal
        visible={createModalVisible}
        title="创建订单"
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 编辑订单弹窗 */}
      <OrderFormModal
        visible={updateModalVisible}
        title="编辑订单"
        initialValues={currentOrder || undefined}
        onCancel={() => setUpdateModalVisible(false)}
        onSuccess={handleUpdateSuccess}
      />
    </div>
  );
};

export default OrderAdmin;
