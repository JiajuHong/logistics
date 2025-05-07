import React, { useState, useEffect } from 'react';
import { Table, Button, Checkbox, Select, Modal, Spin, message, Tag, Space, Tooltip, Drawer, Steps, Progress, Radio, Slider, Card, Alert, Statistic } from 'antd';
import { SyncOutlined, CheckCircleOutlined, ClockCircleOutlined, CarOutlined, InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';
import { getOrders } from '@/services/backend/transportOrderService';
import { batchCalculateRoutes } from '@/services/backend/routeService';
import styles from './BatchOrderProcessor.less';
import dayjs from 'dayjs';

const { Option } = Select;
const { Step } = Steps;

/**
 * 批量订单处理组件 (增强版)
 * 支持多订单同时路径规划、优先级排序与动态权重调整
 */
const BatchOrderProcessor = ({ onSelectOrder, onBatchCompleted }) => {
  const [orders, setOrders] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processModalVisible, setProcessModalVisible] = useState(false);
  const [processingResults, setProcessingResults] = useState([]);
  const [processingStatus, setProcessingStatus] = useState('idle');
  const [processingPhase, setProcessingPhase] = useState(''); // 'preparing', 'fetching', 'calculating', 'visualizing'
  const [progress, setProgress] = useState(0);
  
  // 路径规划参数
  const [planningParams, setPlanningParams] = useState({
    trafficFactor: 1.0,
    distanceWeight: 0.5,
    timeWeight: 0.3,
    costWeight: 0.2,
    enforceTransfer: true,
    priorityOrder: true
  });
  
  // 高级选项设置
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  
  // 加载订单数据
  useEffect(() => {
    fetchOrders();
  }, []);

  // 获取订单列表
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders({});
      if (response && response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      message.error('获取订单列表失败');
      console.error('获取订单列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '客户',
      dataIndex: 'customerName',
      key: 'customerName',
    },
    {
      title: '起点',
      dataIndex: 'sourceStationName',
      key: 'sourceStationName',
    },
    {
      title: '终点',
      dataIndex: 'targetStationName',
      key: 'targetStationName',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const color = priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green';
        const text = priority === 'high' ? '高' : priority === 'medium' ? '中' : '低';
        return <Tag color={color}>{text}</Tag>;
      },
      filters: [
        { text: '高', value: 'high' },
        { text: '中', value: 'medium' },
        { text: '低', value: 'low' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: '预计交付时间',
      dataIndex: 'expectedDelivery',
      key: 'expectedDelivery',
      sorter: (a, b) => new Date(a.expectedDelivery) - new Date(b.expectedDelivery),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          onClick={() => handleViewOrder(record)}
        >
          规划路径
        </Button>
      ),
    },
  ];

  // 查看单个订单
  const handleViewOrder = (record) => {
    if (onSelectOrder) {
      onSelectOrder({
        fromStationId: record.sourceStationId,
        toStationId: record.targetStationId,
        orderId: record.id
      });
    }
  };

  // 批量处理选中的订单
  const handleBatchProcess = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请至少选择一个订单');
      return;
    }

    // 显示进度面板
    setProcessModalVisible(true);
    setProcessingStatus('processing');
    setProcessingResults([]);
    setProgress(0);
    setProcessingPhase('preparing');

    try {
      // 准备阶段
      setProcessingPhase('preparing');
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟处理时间
      setProgress(20);
      
      // 数据获取阶段
      setProcessingPhase('fetching');
      await new Promise(resolve => setTimeout(resolve, 600)); // 模拟处理时间
      setProgress(40);
      
      // 路径计算阶段
      setProcessingPhase('calculating');
      
      // 批量路径规划请求
      const response = await batchCalculateRoutes({
        orderIds: selectedRowKeys,
        trafficFactor: planningParams.trafficFactor,
        distanceWeight: planningParams.distanceWeight,
        timeWeight: planningParams.timeWeight,
        costWeight: planningParams.costWeight,
        enforceTransfer: planningParams.enforceTransfer,
        priorityOrder: planningParams.priorityOrder
      });
      
      setProgress(80);
      setProcessingPhase('visualizing');
      
      if (response && response.data) {
        // 处理响应数据
        const batchResult = response.data;
        
        // 将结果与订单数据关联，增强订单信息
        const mappedResults = batchResult.results.map(result => {
          // 查找对应的订单完整信息
          const matchedOrder = orders.find(order => 
            order.id === result.orderId || (
              order.sourceStationId === result.fromStationId && 
              order.targetStationId === result.toStationId
            )
          );
          
          // 构建增强版结果对象，包含完整的订单信息
          return {
            ...result,
            orderNo: matchedOrder?.orderNo || '未知',
            orderName: matchedOrder?.name || '未知订单',
            customerName: matchedOrder?.customerName,
            id: matchedOrder?.id,
            orderId: matchedOrder?.id || result.orderId,
            priority: matchedOrder?.priority || 'low',
            sourceStationId: result.fromStationId,
            targetStationId: result.toStationId,
            fromStationName: matchedOrder?.sourceStationName || result.fromStationName || '未知起点',
            toStationName: matchedOrder?.targetStationName || result.toStationName || '未知终点',
            totalDistance: result.route?.totalDistance,
            estimatedTime: result.route?.estimatedTime,
            routeData: result.route,
            status: result.success ? 'completed' : 'failed',
            expectedDelivery: matchedOrder?.expectedDelivery
          };
        });

        setProcessingResults(mappedResults);
        setProcessingStatus('completed');
        setProgress(100);
        
        // 通知父组件处理完成，传递结果
        if (onBatchCompleted) {
          onBatchCompleted(mappedResults);
        }
        
        if (batchResult.failedCount > 0) {
          message.warning(`批量处理完成：成功 ${batchResult.successCount} 个，失败 ${batchResult.failedCount} 个，耗时 ${batchResult.executionTime}ms`);
        } else {
          message.success(`成功处理 ${batchResult.successCount} 个订单的路径规划，耗时 ${batchResult.executionTime}ms`);
        }
      } else {
        setProcessingStatus('error');
        message.error('批量处理返回数据格式错误');
        console.error('批量处理响应数据格式错误', response);
      }
    } catch (error) {
      setProcessingStatus('error');
      
      // 提供更详细的错误信息
      if (error.response) {
        // 服务器返回了错误状态码
        const status = error.response.status;
        const errorData = error.response.data || {};
        const errorMsg = errorData.message || `服务器错误(${status})`;
        
        message.error(`批量处理失败: ${errorMsg}`);
        console.error('批量处理失败:', errorData);
      } else if (error.request) {
        // 请求发出但没有收到响应
        message.error('服务器无响应，请检查网络连接');
        console.error('批量处理无响应:', error.request);
      } else {
        // 请求设置时出错
        message.error(`请求错误: ${error.message || '未知错误'}`);
        console.error('批量处理请求错误:', error);
      }
    }
  };

  // 重试批量处理
  const handleRetry = () => {
    handleBatchProcess();
  };

  // 表格选择配置
  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys, selectedRows) => {
      setSelectedRowKeys(newSelectedRowKeys);
      setSelectedOrders(selectedRows);
    },
  };

  // 结果表格列定义
  const resultColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const color = priority === 'high' ? 'red' : priority === 'medium' ? 'orange' : 'green';
        const text = priority === 'high' ? '高' : priority === 'medium' ? '中' : '低';
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        if (status === 'completed') {
          return <Tag icon={<CheckCircleOutlined />} color="success">成功</Tag>;
        } else if (status === 'processing') {
          return <Tag icon={<SyncOutlined spin />} color="processing">处理中</Tag>;
        } else if (status === 'pending') {
          return <Tag icon={<ClockCircleOutlined />} color="default">等待处理</Tag>;
        } else {
          return <Tag color="error">失败</Tag>;
        }
      },
    },
    {
      title: '总距离',
      dataIndex: 'totalDistance',
      key: 'totalDistance',
      render: (distance) => distance ? `${distance.toFixed(2)} 公里` : '-',
      sorter: (a, b) => (a.totalDistance || 0) - (b.totalDistance || 0),
    },
    {
      title: '预计时间',
      dataIndex: 'estimatedTime',
      key: 'estimatedTime',
      render: (time) => time ? `${time} 分钟` : '-',
      sorter: (a, b) => (a.estimatedTime || 0) - (b.estimatedTime || 0),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            disabled={record.status !== 'completed'}
            onClick={() => {
              if (onSelectOrder) {
                onSelectOrder({
                  fromStationId: record.sourceStationId,
                  toStationId: record.targetStationId,
                  orderId: record.id,
                  routeData: record.routeData
                });
              }
              setProcessModalVisible(false);
            }}
          >
            查看路径
          </Button>
        </Space>
      ),
    },
  ];
  
  // 渲染处理阶段描述
  const getPhaseDescription = (phase) => {
    switch (phase) {
      case 'preparing':
        return '正在准备数据和验证参数...';
      case 'fetching':
        return '正在获取订单详细信息...';
      case 'calculating':
        return '正在计算最优路径...';
      case 'visualizing':
        return '正在生成结果可视化...';
      default:
        return '处理中...';
    }
  };
  
  // 获取当前阶段对应的步骤索引
  const getPhaseStepIndex = (phase) => {
    switch (phase) {
      case 'preparing': return 0;
      case 'fetching': return 1;
      case 'calculating': return 2;
      case 'visualizing': return 3;
      default: return 0;
    }
  };
  
  // 渲染高级选项卡片
  const renderAdvancedOptions = () => {
    // 权重和参数之和必须为1
    const totalWeight = planningParams.distanceWeight + planningParams.timeWeight + planningParams.costWeight;
    
    return (
      <Card 
        title={
          <Space>
            <SettingOutlined />
            高级路径规划参数
          </Space>
        }
        className={styles.advancedOptionsCard}
        style={{ display: showAdvancedOptions ? 'block' : 'none' }}
      >
        <div className={styles.optionItem}>
          <div className={styles.optionLabel}>
            <Tooltip title="交通因子影响路径时间估计，值越大表示道路越拥堵">
              <Space>
                交通因子
                <InfoCircleOutlined />
              </Space>
            </Tooltip>
          </div>
          <div className={styles.optionControl}>
            <Select
              value={planningParams.trafficFactor}
              onChange={(value) => setPlanningParams({...planningParams, trafficFactor: value})}
              style={{ width: 160 }}
            >
              <Option value={0.8}>畅通 (0.8)</Option>
              <Option value={1.0}>正常 (1.0)</Option>
              <Option value={1.2}>轻度拥堵 (1.2)</Option>
              <Option value={1.5}>中度拥堵 (1.5)</Option>
              <Option value={2.0}>严重拥堵 (2.0)</Option>
            </Select>
          </div>
        </div>
        
        <div className={styles.optionItem}>
          <div className={styles.optionLabel}>
            <Tooltip title="距离权重 - 路径规划中对距离因素的重视程度">
              <Space>
                距离权重
                <InfoCircleOutlined />
              </Space>
            </Tooltip>
          </div>
          <div className={styles.optionControl}>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={planningParams.distanceWeight}
              onChange={(value) => {
                // 调整其他权重，确保总和为1
                const remaining = 1 - value;
                const timeRatio = planningParams.timeWeight / (planningParams.timeWeight + planningParams.costWeight);
                
                setPlanningParams({
                  ...planningParams, 
                  distanceWeight: value,
                  timeWeight: remaining * timeRatio,
                  costWeight: remaining * (1 - timeRatio)
                });
              }}
              style={{ width: 160 }}
            />
            <span className={styles.weightValue}>{planningParams.distanceWeight.toFixed(1)}</span>
          </div>
        </div>
        
        <div className={styles.optionItem}>
          <div className={styles.optionLabel}>
            <Tooltip title="时间权重 - 路径规划中对时间因素的重视程度">
              <Space>
                时间权重
                <InfoCircleOutlined />
              </Space>
            </Tooltip>
          </div>
          <div className={styles.optionControl}>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={planningParams.timeWeight}
              onChange={(value) => {
                // 调整其他权重，确保总和为1
                const distanceWeight = planningParams.distanceWeight;
                const remaining = 1 - distanceWeight;
                const costWeight = remaining - value;
                
                if (costWeight >= 0) {
                  setPlanningParams({
                    ...planningParams, 
                    timeWeight: value,
                    costWeight: costWeight
                  });
                }
              }}
              style={{ width: 160 }}
            />
            <span className={styles.weightValue}>{planningParams.timeWeight.toFixed(1)}</span>
          </div>
        </div>
        
        <div className={styles.optionItem}>
          <div className={styles.optionLabel}>
            <Tooltip title="成本权重 - 路径规划中对成本因素的重视程度">
              <Space>
                成本权重
                <InfoCircleOutlined />
              </Space>
            </Tooltip>
          </div>
          <div className={styles.optionControl}>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={planningParams.costWeight}
              onChange={(value) => {
                // 调整其他权重，确保总和为1
                const distanceWeight = planningParams.distanceWeight;
                const remaining = 1 - distanceWeight;
                const timeWeight = remaining - value;
                
                if (timeWeight >= 0) {
                  setPlanningParams({
                    ...planningParams, 
                    costWeight: value,
                    timeWeight: timeWeight
                  });
                }
              }}
              style={{ width: 160 }}
            />
            <span className={styles.weightValue}>{planningParams.costWeight.toFixed(1)}</span>
          </div>
        </div>
        
        <div className={styles.optionItem}>
          <div className={styles.optionLabel}>
            <Tooltip title="是否在不同区域间强制使用中转站">
              <Space>
                区域间中转
                <InfoCircleOutlined />
              </Space>
            </Tooltip>
          </div>
          <div className={styles.optionControl}>
            <Radio.Group
              value={planningParams.enforceTransfer}
              onChange={(e) => setPlanningParams({...planningParams, enforceTransfer: e.target.value})}
            >
              <Radio value={true}>启用</Radio>
              <Radio value={false}>禁用</Radio>
            </Radio.Group>
          </div>
        </div>
        
        <div className={styles.optionItem}>
          <div className={styles.optionLabel}>
            <Tooltip title="是否按订单优先级顺序处理">
              <Space>
                优先级排序
                <InfoCircleOutlined />
              </Space>
            </Tooltip>
          </div>
          <div className={styles.optionControl}>
            <Radio.Group
              value={planningParams.priorityOrder}
              onChange={(e) => setPlanningParams({...planningParams, priorityOrder: e.target.value})}
            >
              <Radio value={true}>启用</Radio>
              <Radio value={false}>禁用</Radio>
            </Radio.Group>
          </div>
        </div>
        
        {Math.abs(totalWeight - 1) > 0.01 && (
          <Alert
            message="权重总和必须为1"
            description="距离、时间和成本权重的总和应该等于1，当前总和为 ${totalWeight.toFixed(2)}。"
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    );
  };

  // 渲染结果统计信息
  const renderResultsSummary = () => {
    if (!processingResults || processingResults.length === 0) return null;
    
    const totalCount = processingResults.length;
    const successCount = processingResults.filter(r => r.status === 'completed').length;
    const failedCount = totalCount - successCount;
    
    // 计算平均距离和时间
    const successfulRoutes = processingResults.filter(r => r.status === 'completed');
    const avgDistance = successfulRoutes.reduce((sum, r) => sum + (r.totalDistance || 0), 0) / (successfulRoutes.length || 1);
    const avgTime = successfulRoutes.reduce((sum, r) => sum + (r.estimatedTime || 0), 0) / (successfulRoutes.length || 1);
    
    return (
      <div className={styles.resultsSummary}>
        <div className={styles.summaryCards}>
          <Card className={styles.summaryCard}>
            <Statistic 
              title="总计划数" 
              value={totalCount} 
              suffix={`条`}
            />
          </Card>
          <Card className={styles.summaryCard}>
            <Statistic 
              title="成功" 
              value={successCount} 
              valueStyle={{ color: '#3f8600' }}
              suffix={`(${(successCount / totalCount * 100).toFixed(1)}%)`}
            />
          </Card>
          <Card className={styles.summaryCard}>
            <Statistic 
              title="失败" 
              value={failedCount} 
              valueStyle={{ color: '#cf1322' }}
              suffix={`(${(failedCount / totalCount * 100).toFixed(1)}%)`}
            />
          </Card>
          <Card className={styles.summaryCard}>
            <Statistic 
              title="平均距离" 
              value={avgDistance.toFixed(2)} 
              suffix="公里"
            />
          </Card>
          <Card className={styles.summaryCard}>
            <Statistic 
              title="平均时间" 
              value={avgTime.toFixed(0)} 
              suffix="分钟"
            />
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.tableToolbar}>
        <Space>
          <Button
            type="primary"
            onClick={handleBatchProcess}
            disabled={selectedRowKeys.length === 0}
          >
            批量规划路径
          </Button>
          <Button onClick={fetchOrders}>刷新</Button>
          <Button 
            type={showAdvancedOptions ? 'primary' : 'default'}
            icon={<SettingOutlined />}
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
          >
            高级选项
          </Button>
          <Tooltip title="交通因子影响路径规划，值越大表示交通越拥堵">
            <Space className={showAdvancedOptions ? styles.hidden : ''}>
              <span>交通因子:</span>
              <Select
                value={planningParams.trafficFactor}
                onChange={(value) => setPlanningParams({...planningParams, trafficFactor: value})}
                style={{ width: 120 }}
              >
                <Option value={0.8}>畅通 (0.8)</Option>
                <Option value={1.0}>正常 (1.0)</Option>
                <Option value={1.2}>轻度拥堵 (1.2)</Option>
                <Option value={1.5}>中度拥堵 (1.5)</Option>
                <Option value={2.0}>严重拥堵 (2.0)</Option>
              </Select>
            </Space>
          </Tooltip>
        </Space>
        <div>
          已选择 {selectedRowKeys.length} 个订单
        </div>
      </div>
      
      {renderAdvancedOptions()}

      <Table
        rowKey="id"
        rowSelection={rowSelection}
        columns={columns}
        dataSource={orders}
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Drawer
        title="批量路径规划"
        open={processModalVisible}
        width={800}
        onClose={() => {
          // 只有完成或出错状态才能关闭
          if (processingStatus !== 'processing') {
            setProcessModalVisible(false);
          }
        }}
        footer={
          processingStatus === 'completed' ? (
            <div className={styles.drawerFooter}>
              <Button onClick={() => setProcessModalVisible(false)}>关闭</Button>
              <Button 
                type="primary" 
                onClick={() => {
                  // 通知父组件显示结果
                  if (onBatchCompleted) {
                    onBatchCompleted(processingResults);
                  }
                  setProcessModalVisible(false);
                }}
              >
                查看详细结果
              </Button>
            </div>
          ) : null
        }
      >
        {processingStatus === 'processing' && (
          <div className={styles.progressContainer}>
            <Progress percent={progress} status="active" />
            <div className={styles.phaseIndicator}>
              {getPhaseDescription(processingPhase)}
            </div>
            <Steps current={getPhaseStepIndex(processingPhase)}>
              <Step title="准备" description="验证数据" />
              <Step title="获取" description="加载订单信息" />
              <Step title="计算" description="规划最优路径" />
              <Step title="可视化" description="生成结果视图" />
            </Steps>
          </div>
        )}
        
        {processingStatus === 'completed' && (
          <>
            {renderResultsSummary()}
            <Table
              rowKey={(record) => `${record.fromStationId}-${record.toStationId}`}
              columns={resultColumns}
              dataSource={processingResults}
              pagination={false}
              className={styles.resultsTable}
            />
          </>
        )}
        
        {processingStatus === 'error' && (
          <div className={styles.errorContainer}>
            <Alert
              message="处理失败"
              description="路径规划过程中出现错误，请检查网络连接或联系系统管理员。"
              type="error"
              showIcon
              action={
                <Button size="small" danger onClick={handleRetry}>
                  重试
                </Button>
              }
            />
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default BatchOrderProcessor; 