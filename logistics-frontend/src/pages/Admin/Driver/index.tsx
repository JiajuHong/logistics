import CreateModal from '@/pages/Admin/Driver/components/CreateModal';
import UpdateModal from '@/pages/Admin/Driver/components/UpdateModal';
import DriverCard from '@/pages/Admin/Driver/components/DriverCard';
import { deleteDriver, listDriverByPage, getDriverStatistics } from '@/services/api';
import { driverStatusMap, LICENSE_TYPE_OPTIONS, DriverStatistics, DRIVER_STATUS } from '@/typings/driver';
import { 
  PlusOutlined, 
  TableOutlined, 
  AppstoreOutlined, 
  ReloadOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  StopOutlined 
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import '@umijs/max';
import { Avatar, Button, message, Space, Tag, Typography, Statistic, Row, Col, Card, Radio, Empty, Spin, Progress } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import CustomPagination from '@/components/CustomPagination';
import styles from './index.less';

/**
 * 司机管理页面
 */
const DriverAdminPage: React.FC = () => {
  // 是否显示新建窗口
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  // 是否显示更新窗口
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const actionRef = useRef<ActionType>();
  // 当前点击的司机数据
  const [currentRow, setCurrentRow] = useState<API.DriverVO>();
  // 用于存储总记录数
  const [total, setTotal] = useState<number>(0);
  // 当前页码
  const [current, setCurrent] = useState<number>(1);
  // 每页条数
  const [pageSize, setPageSize] = useState<number>(10);
  // 司机数据列表
  const [driverList, setDriverList] = useState<API.DriverVO[]>([]);
  // 视图类型: table-表格视图, card-卡片视图
  const [viewType, setViewType] = useState<string>('table');
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 统计数据
  const [statistics, setStatistics] = useState<DriverStatistics>({
    total: 0,
    idle: 0,
    inTask: 0,
    disabled: 0,
  });

  // 获取司机统计数据
  const fetchDriverStatistics = async () => {
    try {
      const response = await getDriverStatistics();
      if (response.code === 0 && response.data) {
        setStatistics({
          total: response.data.total || 0,
          idle: response.data.idle || 0,
          inTask: response.data.inTask || 0,
          disabled: response.data.disabled || 0,
        });
      }
    } catch (error) {
      console.error('获取司机统计数据失败:', error);
    }
  };

  // 组件挂载时或分页参数变化时，确保表格使用正确的分页参数
  useEffect(() => {
    fetchDriverStatistics();
    if (actionRef.current) {
      actionRef.current.setPageInfo?.({
        current,
        pageSize
      });
    }
  }, []);

  /**
   * 删除司机
   *
   * @param row
   */
  const handleDelete = async (row: API.DriverVO) => {
    const hide = message.loading('正在删除');
    if (!row) return true;
    try {
      await deleteDriver({
        id: row.id as any,
      });
      hide();
      message.success('删除成功');
      actionRef?.current?.reload();
      fetchDriverStatistics();
      return true;
    } catch (error: any) {
      hide();
      message.error('删除失败，' + error.message);
      return false;
    }
  };

  /**
   * 获取司机状态标签
   */
  const getStatusTag = (status?: number) => {
    if (status === undefined) return <Tag color="default">未知</Tag>;
    const statusInfo = driverStatusMap[status] || { text: '未知', color: 'default' };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  /**
   * 手动加载数据（用于卡片视图）
   */
  const loadData = async (params: any) => {
    setLoading(true);
    try {
      const response = await listDriverByPage(params);
      setLoading(false);
      if (response.code === 0 && response.data) {
        setDriverList(response.data.records || []);
        setTotal(response.data.total || 0);
      }
    } catch (error) {
      setLoading(false);
      console.error('加载数据失败:', error);
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<API.DriverVO>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'text',
      hideInForm: true,
      width: 80,
    },
    {
      title: '头像',
      dataIndex: 'avatar',
      valueType: 'image',
      hideInSearch: true,
      width: 80,
      render: (_, record) => (
        <Avatar
          src={record.avatar}
          size={40}
          style={{ backgroundColor: record.avatar ? 'transparent' : '#1890ff' }}
        >
          {record.name?.slice(0, 1)}
        </Avatar>
      )
    },
    {
      title: '姓名',
      dataIndex: 'name',
      valueType: 'text',
    },
    {
      title: '编号',
      dataIndex: 'code',
      valueType: 'text',
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      valueType: 'text',
    },
    {
      title: '驾驶证号',
      dataIndex: 'licenseNo',
      valueType: 'text',
      hideInSearch: true,
    },
    {
      title: '驾驶证类型',
      dataIndex: 'licenseType',
      valueType: 'select',
      valueEnum: LICENSE_TYPE_OPTIONS.reduce((acc, curr) => {
        acc[curr.value] = { text: curr.label };
        return acc;
      }, {} as Record<string, { text: string }>),
    },
    {
      title: '驾龄（年）',
      dataIndex: 'experience',
      valueType: 'digit',
      hideInSearch: true,
      sorter: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        0: { text: '停用', status: 'Default' },
        1: { text: '空闲', status: 'Success' },
        2: { text: '任务中', status: 'Processing' },
      },
      render: (_, record) => getStatusTag(record.status),
    },
    {
      title: '创建时间',
      sorter: true,
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInSearch: true,
      hideInForm: true,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => (
        <Space size="middle">
          <Typography.Link
            onClick={() => {
              setCurrentRow(record);
              setUpdateModalVisible(true);
            }}
          >
            修改
          </Typography.Link>
          <Typography.Link type="danger" onClick={() => handleDelete(record)}>
            删除
          </Typography.Link>
        </Space>
      ),
    },
  ];

  // 处理视图切换
  const handleViewChange = (e: any) => {
    const newViewType = e.target.value;
    setViewType(newViewType);

    // 如果切换到卡片视图，需要手动加载数据
    if (newViewType === 'card') {
      loadData({
        current,
        pageSize,
      });
    }
  };

  // 处理创建成功
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchDriverStatistics();
    if (viewType === 'table') {
      actionRef.current?.reload();
    } else {
      loadData({
        current,
        pageSize,
      });
    }
  };

  // 处理更新成功
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentRow(undefined);
    fetchDriverStatistics();
    if (viewType === 'table') {
      actionRef.current?.reload();
    } else {
      loadData({
        current,
        pageSize,
      });
    }
  };

  // 处理分页变化
  const handlePageChange = (page: number, size?: number) => {
    setCurrent(page);
    if (size) setPageSize(size);
    
    if (viewType === 'table') {
      actionRef.current?.setPageInfo?.({
        current: page,
        pageSize: size || pageSize,
      });
    } else {
      loadData({
        current: page,
        pageSize: size || pageSize,
      });
    }
  };

  return (
    <PageContainer>
      {/* 统计信息卡片 */}
      <Card className={styles.statisticCard} bordered={false}>
        <Row gutter={[24, 24]}>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="司机总数" 
                value={statistics.total} 
                valueStyle={{ fontSize: '22px', fontWeight: 'bold' }}
                prefix={<TeamOutlined style={{ marginRight: 8 }} />}
              />
              <div className={styles.orderTotal}>
                <Progress type="dashboard" percent={100} strokeColor="#1890ff" format={() => '全部'} width={60} />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="空闲司机" 
                value={statistics.idle} 
                valueStyle={{ color: '#52c41a', fontSize: '22px', fontWeight: 'bold' }}
                prefix={<CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                suffix={<small style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{`/${statistics.total}`}</small>}
              />
              <div className={styles.progressWrapper}>
                <Progress 
                  type="circle" 
                  percent={statistics.total > 0 ? Math.round((statistics.idle / statistics.total) * 100) : 0} 
                  strokeColor="#52c41a" 
                  width={60} 
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="任务中" 
                value={statistics.inTask} 
                valueStyle={{ color: '#1890ff', fontSize: '22px', fontWeight: 'bold' }}
                prefix={<SyncOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                suffix={<small style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{`/${statistics.total}`}</small>}
              />
              <div className={styles.progressWrapper}>
                <Progress 
                  type="circle" 
                  percent={statistics.total > 0 ? Math.round((statistics.inTask / statistics.total) * 100) : 0} 
                  strokeColor="#1890ff" 
                  width={60} 
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6} lg={6}>
            <Card className={styles.statItem} bordered={false}>
              <Statistic 
                title="停用" 
                value={statistics.disabled} 
                valueStyle={{ color: '#ff4d4f', fontSize: '22px', fontWeight: 'bold' }}
                prefix={<StopOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />}
                suffix={<small style={{ fontSize: '12px', color: 'rgba(0,0,0,0.45)' }}>{`/${statistics.total}`}</small>}
              />
              <div className={styles.progressWrapper}>
                <Progress 
                  type="circle" 
                  percent={statistics.total > 0 ? Math.round((statistics.disabled / statistics.total) * 100) : 0} 
                  strokeColor="#ff4d4f" 
                  width={60} 
                />
              </div>
            </Card>
          </Col>
        </Row>
      </Card>

      {/* 工具栏 - 包含视图切换和新建按钮 */}
      <div className={styles.toolbar}>
        <Space>
          <Radio.Group value={viewType} onChange={handleViewChange} buttonStyle="solid">
            <Radio.Button value="table"><TableOutlined /> 表格视图</Radio.Button>
            <Radio.Button value="card"><AppstoreOutlined /> 卡片视图</Radio.Button>
          </Radio.Group>
          <Button 
            icon={<ReloadOutlined />} 
            onClick={() => {
              if (viewType === 'table') {
                actionRef.current?.reload();
              } else {
                loadData({
                  current,
                  pageSize,
                });
              }
              fetchDriverStatistics();
            }}
          >
            刷新
          </Button>
        </Space>
        <Button
          type="primary"
          onClick={() => {
            setCreateModalVisible(true);
          }}
        >
          <PlusOutlined /> 新建
        </Button>
      </div>

      {/* 表格视图 */}
      {viewType === 'table' && (
        <ProTable<API.DriverVO>
          headerTitle="司机管理"
          actionRef={actionRef}
          rowKey="id"
          search={{
            labelWidth: 120,
          }}
          pagination={false}
          params={{
            pageSize: pageSize,
            current: current
          }}
          tableRender={(_, dom) => (
            <div>
              {dom}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <CustomPagination
                  current={current}
                  total={total}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  onShowSizeChange={(current, size) => {
                    setCurrent(current);
                    setPageSize(size);
                    handlePageChange(current, size);
                  }}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(t) => `共 ${t} 条记录，共 ${Math.ceil(t / pageSize)} 页`}
                />
              </div>
            </div>
          )}
          toolBarRender={false}
          request={async (params, sort, filter) => {
            const sortField = Object.keys(sort)?.[0];
            const sortOrder = sort?.[sortField] ?? undefined;

            // 确保使用正确的分页参数
            const requestParams = {
              ...params,
              pageSize: params.pageSize || pageSize,
              current: params.current || current,
              sortField,
              sortOrder,
              ...filter,
            };

            try {
              const msg = await listDriverByPage(requestParams);
              setTotal(msg.data?.total || 0);
              return {
                data: msg.data?.records || [],
                success: msg.code === 0,
                total: msg.data?.total || 0,
              };
            } catch (error) {
              message.error('获取数据失败');
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          }}
          columns={columns}
        />
      )}

      {/* 卡片视图 */}
      {viewType === 'card' && (
        <div className={styles.cardContainer}>
          <Spin spinning={loading}>
            {driverList.length > 0 ? (
              <Row gutter={[16, 16]}>
                {driverList.map(driver => (
                  <Col xs={24} sm={12} md={8} lg={6} xl={6} xxl={4} key={driver.id}>
                    <DriverCard
                      driver={driver}
                      onEdit={(driver) => {
                        setCurrentRow(driver);
                        setUpdateModalVisible(true);
                      }}
                      onDelete={(driver) => handleDelete(driver)}
                    />
                  </Col>
                ))}
              </Row>
            ) : (
              <Empty description="暂无数据" />
            )}
          </Spin>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
            <CustomPagination
              current={current}
              total={total}
              pageSize={pageSize}
              onChange={handlePageChange}
              onShowSizeChange={(current, size) => {
                setCurrent(current);
                setPageSize(size);
                handlePageChange(current, size);
              }}
              showSizeChanger
              showQuickJumper
              showTotal={(t) => `共 ${t} 条记录，共 ${Math.ceil(t / pageSize)} 页`}
            />
          </div>
        </div>
      )}

      {/* 创建司机弹窗 */}
      <CreateModal
        visible={createModalVisible}
        columns={columns}
        onSubmit={handleCreateSuccess}
        onCancel={() => setCreateModalVisible(false)}
      />

      {/* 更新司机弹窗 */}
      <UpdateModal
        oldData={currentRow}
        visible={updateModalVisible}
        columns={columns}
        onSubmit={handleUpdateSuccess}
        onCancel={() => {
          setUpdateModalVisible(false);
          setCurrentRow(undefined);
        }}
      />
    </PageContainer>
  );
};

export default DriverAdminPage;
