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
  Form,
  Input,
  Select,
  DatePicker,
  Table,
  Tag,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  TableOutlined,
  AppstoreOutlined,
  ExclamationCircleOutlined,
  SearchOutlined,
  RightOutlined,
} from '@ant-design/icons';
import {
  listTransportTaskByPage,
  cancelTask,
  updateTaskStatus,
  deleteTransportTask,
  getTaskStatistics,
  listStation,
  listVehicle,
  listDriver,
  updateTransportOrder,
  getTransportTaskById,
  getTransportOrderById
} from '@/services/api';
import TaskCard from './components/TaskCard';
import TaskDetailModal from './components/TaskDetailModal';
import AssignTaskModal from './components/AssignTaskModal';
import CreateTaskModal from './components/CreateTaskModal';
import OrderDetailModal from '../Order/components/OrderDetailModal';
import styles from './index.less';
import { OrderStatus, TransportOrderType } from '@/typings/order';
import { TransportTaskType, TaskStatus, TaskStatusColorMap } from '@/typings/task';

// 查询参数类型定义
interface TaskQueryParams {
  taskNo?: string;
  orderId?: number;
  orderNo?: string;
  vehicleId?: number;
  driverId?: number;
  sourceId?: number;
  targetId?: number;
  status?: number;
  plannedStartBegin?: Date;
  plannedStartEnd?: Date;
  plannedEndBegin?: Date;
  plannedEndEnd?: Date;
  current?: number;
  pageSize?: number;
}

/**
 * 任务管理页面
 */
const TaskAdmin: React.FC = () => {
  // 视图类型
  const [viewType, setViewType] = useState<'table' | 'card'>('card');
  // 当前查询参数
  const [queryParams, setQueryParams] = useState<TaskQueryParams>({});
  // 列表数据
  const [taskList, setTaskList] = useState<TransportTaskType[]>([]);
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
    inProgress: number;
    completed: number;
    cancelled: number;
  }>({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    completed: 0,
    cancelled: 0
  });
  // 模态框状态
  const [detailModalVisible, setDetailModalVisible] = useState<boolean>(false);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [assignModalVisible, setAssignModalVisible] = useState<boolean>(false);
  const [orderDetailModalVisible, setOrderDetailModalVisible] = useState<boolean>(false);
  // 当前选中的任务
  const [currentTask, setCurrentTask] = useState<TransportTaskType | null>(null);
  // 当前选中的订单
  const [currentOrder, setCurrentOrder] = useState<TransportOrderType | null>(null);
  // 查询表单
  const [form] = Form.useForm();

  // 站点数据
  const [stations, setStations] = useState<{ label: string; value: number }[]>([]);
  // 车辆数据
  const [vehicles, setVehicles] = useState<{ label: string; value: number }[]>([]);
  // 司机数据
  const [drivers, setDrivers] = useState<{ label: string; value: number }[]>([]);

  // 获取基础数据（站点、车辆、司机）
  useEffect(() => {
    // 获取站点数据
    const fetchStations = async () => {
      try {
        // 不设置过滤条件，获取所有站点数据
        const res = await listStation({});
        if (res?.code === 0 && res?.data) {
          const stationOptions = res.data.map((item: any) => ({
            label: item.stationName || item.name || `站点${item.id}`, // 兼容不同的字段名
            value: item.id
          }));
          console.log("站点数据：", stationOptions);
          setStations(stationOptions);
        }
      } catch (error) {
        console.error('获取站点数据失败:', error);
      }
    };

    // 获取车辆数据
    const fetchVehicles = async () => {
      try {
        // 获取所有车辆数据，不设置过滤条件
        const res = await listVehicle({});
        if (res?.code === 0 && res?.data) {
          const vehicleOptions = res.data.map((item: any) => ({
            label: item.vehicleNo || `车辆${item.id}`, // 添加后备显示文本
            value: item.id
          }));
          console.log("车辆数据：", vehicleOptions);
          setVehicles(vehicleOptions);
        }
      } catch (error) {
        console.error('获取车辆数据失败:', error);
      }
    };

    // 获取司机数据
    const fetchDrivers = async () => {
      try {
        // 获取所有司机数据，不设置过滤条件
        const res = await listDriver({});
        if (res?.code === 0 && res?.data) {
          const driverOptions = res.data.map((item: any) => ({
            label: item.driverName || item.name || `司机${item.id}`, // 添加后备显示文本
            value: item.id
          }));
          console.log("司机数据：", driverOptions);
          setDrivers(driverOptions);
        }
      } catch (error) {
        console.error('获取司机数据失败:', error);
      }
    };

    fetchStations();
    fetchVehicles();
    fetchDrivers();
  }, []);

  // 组件加载时获取任务列表和统计数据
  useEffect(() => {
    fetchStatistics();
    loadTaskData();
  }, []);

  // 统计数据查询
  const fetchStatistics = async () => {
    try {
      // 调用任务统计API获取统计数据
      const res = await getTaskStatistics();

      if (res?.code === 0 && res?.data) {
        setStatistics({
          total: res.data.total || 0,
          pending: res.data.pending || 0,
          assigned: res.data.assigned || 0,
          inProgress: res.data.inProgress || 0,
          completed: res.data.completed || 0,
          cancelled: res.data.cancelled || 0
        });
      } else {
        message.error('获取任务统计数据失败');
      }
    } catch (error) {
      console.error('获取任务统计出错:', error);
      message.error('获取任务统计数据失败');
    }
  };

  // 加载任务列表数据
  const loadTaskData = async (params: TaskQueryParams = {}) => {
    setLoading(true);
    try {
      // 合并查询参数和分页参数
      const requestParams = {
        ...queryParams,  // 先使用已保存的查询参数
        ...params,       // 再使用传入的新参数覆盖
        current: params.current || current,
        pageSize: params.pageSize || pageSize,
      };

      const res = await listTransportTaskByPage(requestParams);

      if (res?.code === 0 && res?.data) {
        setTaskList(res.data.records || []);
        setTotal(res.data.total || 0);

        // 更新分页信息
        if (res.data.current && !params.current) {
          setCurrent(res.data.current);
        }
      } else {
        message.error('获取任务列表失败');
      }
    } catch (error) {
      console.error('获取任务列表出错:', error);
      message.error('获取任务列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 查看任务详情
  const handleViewTask = (task: TransportTaskType) => {
    setCurrentTask(task);
    setDetailModalVisible(true);
  };

  // 分配任务
  const handleAssignTask = (task: TransportTaskType) => {
    setCurrentTask(task);
    setAssignModalVisible(true);
  };

  // 删除任务
  const handleDeleteTask = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '确定要删除这个任务吗？此操作不可恢复。',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await deleteTransportTask({ id });
          if (res?.code === 0) {
            message.success('删除成功');
            loadTaskData();
            fetchStatistics();
          } else {
            message.error(res?.message || '删除失败');
          }
        } catch (error) {
          console.error('删除任务出错:', error);
          message.error('删除失败');
        }
      },
    });
  };

  // 取消任务
  const handleCancelTask = (id: number) => {
    Modal.confirm({
      title: '确认取消',
      icon: <ExclamationCircleOutlined />,
      content: '确定要取消这个任务吗？',
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await cancelTask({ id });
          if (res?.code === 0) {
            message.success('任务已取消');
            loadTaskData();
            fetchStatistics();
          } else {
            message.error(res?.message || '取消失败');
          }
        } catch (error) {
          console.error('取消任务出错:', error);
          message.error('取消失败');
        }
      },
    });
  };

  // 开始执行任务
  const handleStartTask = (id: number) => {
    Modal.confirm({
      title: '确认开始执行',
      icon: <ExclamationCircleOutlined />,
      content: '确定要开始执行这个任务吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await updateTaskStatus({ id, status: TaskStatus.IN_PROGRESS });
          if (res?.code === 0) {
            message.success('任务已开始执行');
            loadTaskData();
            fetchStatistics();
          } else {
            message.error(res?.message || '操作失败');
          }
        } catch (error) {
          console.error('开始任务出错:', error);
          message.error('操作失败');
        }
      },
    });
  };

  // 完成任务
  const handleCompleteTask = (id: number) => {
    Modal.confirm({
      title: '确认完成',
      icon: <ExclamationCircleOutlined />,
      content: '确定要完成这个任务吗？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          // 先获取任务详情，以便获取关联的订单ID
          const taskDetailRes = await getTransportTaskById({ id });
          if (taskDetailRes?.code !== 0 || !taskDetailRes?.data) {
            message.error('获取任务详情失败');
            return;
          }

          const task = taskDetailRes.data;
          const orderId = task.orderId;

          // 更新任务状态为已完成
          const taskRes = await updateTaskStatus({ id, status: TaskStatus.COMPLETED });

          if (taskRes?.code === 0) {
            // 如果任务更新成功，同时更新关联的订单状态
            if (orderId) {
              try {
                // 获取订单详情，判断订单是否已完成
                const orderDetailRes = await getTransportOrderById({ id: orderId });
                if (orderDetailRes?.code === 0 && orderDetailRes?.data) {
                  const order = orderDetailRes.data;
                  // 判断是否需要更新订单状态
                  if (order.status !== OrderStatus.COMPLETED) {
                    // 更新订单状态为已完成
                    const orderRes = await updateTransportOrder({
                      id: orderId,
                      status: OrderStatus.COMPLETED,
                      // 设置实际交付时间为当前时间
                      actualDelivery: new Date()
                    });

                    if (orderRes?.code === 0) {
                      console.log('订单状态已同步更新为已完成');
                    } else {
                      console.error('同步更新订单状态失败:', orderRes?.message);
                    }
                  }
                }
              } catch (orderError) {
                console.error('更新订单状态时出错:', orderError);
              }
            }

            message.success('任务已完成');
            loadTaskData();
            fetchStatistics();
          } else {
            message.error(taskRes?.message || '操作失败');
          }
        } catch (error) {
          console.error('完成任务出错:', error);
          message.error('操作失败');
        }
      },
    });
  };

  // 从订单创建任务
  const handleCreateTaskFromOrder = () => {
    setCreateModalVisible(true);
  };

  // 分页切换处理
  const handlePageChange = (page: number, size?: number) => {
    setCurrent(page);
    if (size && size !== pageSize) {
      setPageSize(size);
    }
    loadTaskData({ current: page, pageSize: size || pageSize });
  };

  // 刷新数据
  const handleRefresh = () => {
    loadTaskData();
    fetchStatistics();
  };

  // 创建任务成功回调
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    message.success('任务创建成功');
    loadTaskData();
    fetchStatistics();
  };

  // 分配任务成功回调
  const handleAssignSuccess = () => {
    setAssignModalVisible(false);
    message.success('任务分配成功');
    loadTaskData();
    fetchStatistics();
  };

  // 搜索表单提交
  const handleSearch = () => {
    const values = form.getFieldsValue();

    // 处理日期范围
    const { plannedStartRange, plannedEndRange, ...rest } = values;

    // 构建查询参数
    const newParams: TaskQueryParams = { ...rest };

    if (plannedStartRange) {
      newParams.plannedStartBegin = plannedStartRange[0];
      newParams.plannedStartEnd = plannedStartRange[1];
    }

    if (plannedEndRange) {
      newParams.plannedEndBegin = plannedEndRange[0];
      newParams.plannedEndEnd = plannedEndRange[1];
    }

    // 重置分页到第一页
    setCurrent(1);

    // 保存查询参数并加载数据
    setQueryParams(newParams);
    loadTaskData({ ...newParams, current: 1 });
  };

  // 重置搜索表单
  const handleReset = () => {
    form.resetFields();
    // 直接传空对象作为参数，而不是依赖状态中的queryParams
    setCurrent(1);
    setQueryParams({});
    loadTaskData({ current: 1, pageSize, taskNo: undefined, orderNo: undefined, vehicleId: undefined, driverId: undefined, sourceId: undefined, targetId: undefined, status: undefined, plannedStartBegin: undefined, plannedStartEnd: undefined, plannedEndBegin: undefined, plannedEndEnd: undefined });
  };

  // 查看订单详情
  const handleViewOrder = async (orderId: number) => {
    try {
      setLoading(true);
      const res = await getTransportOrderById({ id: orderId });
      if (res?.code === 0 && res?.data) {
        setCurrentOrder(res.data);
        setOrderDetailModalVisible(true);
      } else {
        message.error('获取订单详情失败');
      }
    } catch (error) {
      console.error('获取订单详情出错:', error);
      message.error('获取订单详情失败');
    } finally {
      setLoading(false);
    }
  };

  // 渲染统计卡片
  const renderStatistics = () => {
    // 计算任务完成百分比
    const getPercent = (value: number) => {
      if (statistics.total === 0) return 0;
      return Math.round((value / statistics.total) * 100);
    };

    return (
      <Row gutter={[16, 16]} className={styles.statisticsRow}>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className={styles.statisticCard}>
            <Statistic
              title="全部任务"
              value={statistics.total}
              valueStyle={{ color: '#1890ff' }}
            />
            <div className={styles.statisticFooter}>
              <Progress percent={100} showInfo={false} strokeWidth={3} />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className={styles.statisticCard}>
            <Statistic
              title="待分配"
              value={statistics.pending}
              valueStyle={{ color: TaskStatusColorMap[TaskStatus.PENDING] }}
            />
            <div className={styles.statisticFooter}>
              <Progress
                percent={getPercent(statistics.pending)}
                showInfo={false}
                strokeWidth={3}
                strokeColor={TaskStatusColorMap[TaskStatus.PENDING]}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className={styles.statisticCard}>
            <Statistic
              title="待执行"
              value={statistics.assigned}
              valueStyle={{ color: TaskStatusColorMap[TaskStatus.ASSIGNED] }}
            />
            <div className={styles.statisticFooter}>
              <Progress
                percent={getPercent(statistics.assigned)}
                showInfo={false}
                strokeWidth={3}
                strokeColor={TaskStatusColorMap[TaskStatus.ASSIGNED]}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className={styles.statisticCard}>
            <Statistic
              title="执行中"
              value={statistics.inProgress}
              valueStyle={{ color: TaskStatusColorMap[TaskStatus.IN_PROGRESS] }}
            />
            <div className={styles.statisticFooter}>
              <Progress
                percent={getPercent(statistics.inProgress)}
                showInfo={false}
                strokeWidth={3}
                strokeColor={TaskStatusColorMap[TaskStatus.IN_PROGRESS]}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className={styles.statisticCard}>
            <Statistic
              title="已完成"
              value={statistics.completed}
              valueStyle={{ color: TaskStatusColorMap[TaskStatus.COMPLETED] }}
            />
            <div className={styles.statisticFooter}>
              <Progress
                percent={getPercent(statistics.completed)}
                showInfo={false}
                strokeWidth={3}
                strokeColor={TaskStatusColorMap[TaskStatus.COMPLETED]}
              />
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card bordered={false} className={styles.statisticCard}>
            <Statistic
              title="已取消"
              value={statistics.cancelled}
              valueStyle={{ color: TaskStatusColorMap[TaskStatus.CANCELLED] }}
            />
            <div className={styles.statisticFooter}>
              <Progress
                percent={getPercent(statistics.cancelled)}
                showInfo={false}
                strokeWidth={3}
                strokeColor={TaskStatusColorMap[TaskStatus.CANCELLED]}
              />
            </div>
          </Card>
        </Col>
      </Row>
    );
  };

  // 渲染筛选表单
  const renderFilterForm = () => {
    return (
      <Form
        form={form}
        layout="vertical"
        className={styles.filterForm}
        onFinish={handleSearch}
      >
        <Row gutter={[16, 0]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="taskNo" label="任务编号">
              <Input placeholder="请输入任务编号" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="orderNo" label="订单编号">
              <Input placeholder="请输入关联订单编号" allowClear />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="vehicleId" label="车辆">
              <Select
                placeholder="请选择车辆"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {vehicles.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="driverId" label="司机">
              <Select
                placeholder="请选择司机"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {drivers.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="sourceId" label="起点站点">
              <Select
                placeholder="请选择起点站点"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {stations.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="targetId" label="终点站点">
              <Select
                placeholder="请选择终点站点"
                allowClear
                showSearch
                optionFilterProp="children"
              >
                {stations.map(item => (
                  <Select.Option key={item.value} value={item.value}>
                    {item.label}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Form.Item name="status" label="任务状态">
              <Select
                placeholder="请选择任务状态"
                allowClear
                options={[
                  { label: '待分配', value: TaskStatus.PENDING },
                  { label: '待执行', value: TaskStatus.ASSIGNED },
                  { label: '执行中', value: TaskStatus.IN_PROGRESS },
                  { label: '已完成', value: TaskStatus.COMPLETED },
                  { label: '已取消', value: TaskStatus.CANCELLED },
                ]}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={24} md={24} lg={24} style={{ textAlign: 'right' }}>
            <Space>
              <Button onClick={handleReset}>重置</Button>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                搜索
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    );
  };

  // 渲染工具栏
  const renderToolbar = () => {
    return (
      <Row justify="space-between" className={styles.toolbar}>
        <Col>
          <Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreateTaskFromOrder}
            >
              从订单创建任务
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
          </Space>
        </Col>
        <Col>
          <Space>
            <span>视图:</span>
            <Segmented
              options={[
                {
                  value: 'card',
                  icon: <AppstoreOutlined />,
                },
                {
                  value: 'table',
                  icon: <TableOutlined />,
                },
              ]}
              value={viewType}
              onChange={(value) => setViewType(value as 'card' | 'table')}
            />
          </Space>
        </Col>
      </Row>
    );
  };

  // 渲染卡片视图
  const renderCardView = () => {
    if (loading) {
      return (
        <div className={styles.loading}>
          <Spin tip="加载中..." />
        </div>
      );
    }

    if (taskList.length === 0) {
      return (
        <Empty
          description="暂无任务数据"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }

    return (
      <div className={styles.cardContainer}>
        <Row gutter={[16, 16]}>
          {taskList.map(task => (
            <Col xs={24} sm={12} md={8} lg={6} key={task.id}>
              <TaskCard
                task={task}
                onView={handleViewTask}
                onViewOrder={handleViewOrder}
                onAssign={handleAssignTask}
                onDelete={handleDeleteTask}
                onCancel={handleCancelTask}
                onStart={handleStartTask}
                onComplete={handleCompleteTask}
              />
            </Col>
          ))}
        </Row>

        <div className={styles.pagination}>
          <Pagination
            current={current}
            pageSize={pageSize}
            total={total}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条`}
            onChange={handlePageChange}
            onShowSizeChange={handlePageChange}
          />
        </div>
      </div>
    );
  };

  // 渲染表格视图
  const renderTableView = () => {
    const columns = [
      {
        title: '任务编号',
        dataIndex: 'taskNo',
        key: 'taskNo',
        width: 150,
      },
      {
        title: '关联订单',
        dataIndex: 'orderNo',
        key: 'orderNo',
        width: 150,
      },
      {
        title: '起点-终点',
        key: 'route',
        width: 250,
        render: (_: any, record: TransportTaskType) => (
          <Space>
            <span>{record.sourceName}</span>
            <RightOutlined />
            <span>{record.targetName}</span>
          </Space>
        ),
      },
      {
        title: '车辆',
        dataIndex: 'vehicleNo',
        key: 'vehicleNo',
        width: 120,
        render: (text: string) => text || '-',
      },
      {
        title: '司机',
        dataIndex: 'driverName',
        key: 'driverName',
        width: 120,
        render: (text: string) => text || '-',
      },
      {
        title: '计划时间',
        key: 'plannedTime',
        width: 200,
        render: (_: any, record: TransportTaskType) => {
          const formatDate = (date?: Date) => {
            if (!date) return '-';
            return new Date(date).toLocaleString('zh-CN', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
          };
          return (
            <div>
              <div>{formatDate(record.plannedStart)}</div>
              <div>至</div>
              <div>{formatDate(record.plannedEnd)}</div>
            </div>
          );
        },
      },
      {
        title: '状态',
        dataIndex: 'statusName',
        key: 'status',
        width: 100,
        render: (text: string, record: TransportTaskType) => (
          <Tag color={TaskStatusColorMap[record.status]}>
            {text}
          </Tag>
        ),
      },
      {
        title: '操作',
        key: 'action',
        fixed: 'right' as const,
        width: 180,
        render: (_: any, record: TransportTaskType) => {
          // 根据任务状态展示不同的操作按钮
          const actions = [
            <Button
              key="view"
              type="link"
              size="small"
              onClick={() => handleViewTask(record)}
            >
              查看
            </Button>
          ];

          if (record.status === TaskStatus.PENDING) {
            actions.push(
              <Button
                key="assign"
                type="link"
                size="small"
                onClick={() => handleAssignTask(record)}
              >
                分配
              </Button>
            );
          }

          if (record.status === TaskStatus.ASSIGNED) {
            actions.push(
              <Button
                key="start"
                type="link"
                size="small"
                onClick={() => handleStartTask(record.id)}
              >
                开始
              </Button>
            );
          }

          if (record.status === TaskStatus.IN_PROGRESS) {
            actions.push(
              <Button
                key="complete"
                type="link"
                size="small"
                onClick={() => handleCompleteTask(record.id)}
              >
                完成
              </Button>
            );
          }

          if (record.status === TaskStatus.PENDING || record.status === TaskStatus.ASSIGNED) {
            actions.push(
              <Button
                key="cancel"
                type="link"
                size="small"
                danger
                onClick={() => handleCancelTask(record.id)}
              >
                取消
              </Button>
            );
          }

          return <Space>{actions}</Space>;
        },
      },
    ];

    return (
      <Table
        columns={columns}
        dataSource={taskList}
        rowKey="id"
        pagination={{
          current,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total) => `共 ${total} 条`,
          onChange: handlePageChange,
          onShowSizeChange: handlePageChange,
        }}
        scroll={{ x: 1300 }}
        loading={loading}
      />
    );
  };

  return (
    <div className={styles.taskAdminContainer}>
      {/* 统计卡片 */}
      {renderStatistics()}

      {/* 搜索筛选 */}
      <Card title="筛选条件" className={styles.filterCard}>
        {renderFilterForm()}
      </Card>

      {/* 工具栏 */}
      {renderToolbar()}

      {/* 列表内容 */}
      <Card className={styles.contentCard} bordered={false}>
        {viewType === 'card' ? renderCardView() : renderTableView()}
      </Card>

      {/* 任务详情弹窗 */}
      <TaskDetailModal
        visible={detailModalVisible}
        task={currentTask}
        onCancel={() => setDetailModalVisible(false)}
      />

      {/* 创建任务弹窗 */}
      <CreateTaskModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* 分配任务弹窗 */}
      <AssignTaskModal
        visible={assignModalVisible}
        task={currentTask}
        onCancel={() => setAssignModalVisible(false)}
        onSuccess={handleAssignSuccess}
      />

      {/* 订单详情弹窗 */}
      <OrderDetailModal
        visible={orderDetailModalVisible}
        order={currentOrder}
        onCancel={() => setOrderDetailModalVisible(false)}
      />
    </div>
  );
};

export default TaskAdmin;
