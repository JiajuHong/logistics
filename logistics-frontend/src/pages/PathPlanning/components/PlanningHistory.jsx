import React, { useState, useEffect } from 'react';
import { Tabs, Table, Card, Empty, Button, Space, Tag, Tooltip, message, Popconfirm } from 'antd';
import { HistoryOutlined, DeleteOutlined, ExportOutlined, EyeOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from './PlanningHistory.less';

const { TabPane } = Tabs;

/**
 * 路径规划历史记录组件
 * 支持结果持久化和历史查看
 */
const PlanningHistory = ({ currentResults = [], onViewResult }) => {
  const [historyRecords, setHistoryRecords] = useState([]);
  const [activeTab, setActiveTab] = useState('current');
  
  // 从localStorage加载历史规划记录
  useEffect(() => {
    loadHistoryRecords();
  }, []);
  
  // 当有新的当前结果时，保存到历史记录
  useEffect(() => {
    if (currentResults && currentResults.length > 0) {
      saveCurrentResultsToHistory();
    }
  }, [currentResults]);
  
  // 加载历史记录
  const loadHistoryRecords = () => {
    try {
      const savedRecords = localStorage.getItem('routePlanningHistory');
      if (savedRecords) {
        setHistoryRecords(JSON.parse(savedRecords));
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  };
  
  // 保存当前结果到历史记录
  const saveCurrentResultsToHistory = () => {
    try {
      // 创建新的历史记录
      const newRecord = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        name: `规划方案 ${dayjs().format('YYYY-MM-DD HH:mm')}`,
        count: currentResults.length,
        successCount: currentResults.filter(r => r.success).length,
        failedCount: currentResults.filter(r => !r.success).length,
        results: currentResults,
      };
      
      // 合并历史记录并保存
      const updatedRecords = [newRecord, ...historyRecords].slice(0, 20); // 保留最近20条
      setHistoryRecords(updatedRecords);
      localStorage.setItem('routePlanningHistory', JSON.stringify(updatedRecords));
      
      // 切换到历史记录标签
      setActiveTab('history');
      message.success('已保存当前规划结果到历史记录');
    } catch (error) {
      console.error('保存历史记录失败:', error);
      message.error('保存历史记录失败');
    }
  };
  
  // 删除历史记录
  const deleteHistoryRecord = (recordId) => {
    try {
      const updatedRecords = historyRecords.filter(record => record.id !== recordId);
      setHistoryRecords(updatedRecords);
      localStorage.setItem('routePlanningHistory', JSON.stringify(updatedRecords));
      message.success('已删除历史记录');
    } catch (error) {
      console.error('删除历史记录失败:', error);
      message.error('删除历史记录失败');
    }
  };
  
  // 清空所有历史记录
  const clearAllHistory = () => {
    try {
      setHistoryRecords([]);
      localStorage.removeItem('routePlanningHistory');
      message.success('已清空所有历史记录');
    } catch (error) {
      console.error('清空历史记录失败:', error);
      message.error('清空历史记录失败');
    }
  };
  
  // 当前结果表格列定义
  const currentResultColumns = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      key: 'orderNo',
    },
    {
      title: '起点',
      dataIndex: 'fromStationName',
      key: 'fromStationName',
      render: (text, record) => record.route?.pathPoints?.[0]?.stationName || text,
    },
    {
      title: '终点',
      dataIndex: 'toStationName', 
      key: 'toStationName',
      render: (text, record) => {
        const points = record.route?.pathPoints;
        return points ? points[points.length - 1]?.stationName : text;
      },
    },
    {
      title: '状态',
      dataIndex: 'success',
      key: 'success',
      render: (success) => (
        <Tag color={success ? 'success' : 'error'}>
          {success ? '成功' : '失败'}
        </Tag>
      ),
    },
    {
      title: '总距离',
      dataIndex: 'totalDistance',
      key: 'totalDistance',
      render: (text, record) => record.route?.totalDistance ? `${record.route.totalDistance.toFixed(2)} 公里` : '-',
      sorter: (a, b) => (a.route?.totalDistance || 0) - (b.route?.totalDistance || 0),
    },
    {
      title: '预计时间',
      dataIndex: 'estimatedTime',
      key: 'estimatedTime',
      render: (text, record) => record.route?.estimatedTime ? `${record.route.estimatedTime} 分钟` : '-',
      sorter: (a, b) => (a.route?.estimatedTime || 0) - (b.route?.estimatedTime || 0),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            disabled={!record.success}
            onClick={() => onViewResult(record)}
          >
            查看
          </Button>
        </Space>
      ),
    },
  ];
  
  // 历史记录表格列定义
  const historyColumns = [
    {
      title: '方案名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '创建时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (timestamp) => dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss'),
      sorter: (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    },
    {
      title: '路径数量',
      dataIndex: 'count',
      key: 'count',
    },
    {
      title: '成功/失败',
      key: 'successRate',
      render: (_, record) => (
        <Space>
          <Tag color="success">{record.successCount || 0}</Tag>
          <Tag color="error">{record.failedCount || 0}</Tag>
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => onViewHistoryDetail(record)}
          >
            查看详情
          </Button>
          <Popconfirm
            title="确定要删除这条历史记录吗?"
            onConfirm={() => deleteHistoryRecord(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];
  
  // 查看历史记录详情
  const onViewHistoryDetail = (record) => {
    if (record.results && record.results.length > 0) {
      // 使用传入的回调查看历史结果
      if (onViewResult) {
        // 显示历史记录中的第一个结果
        const firstSuccessResult = record.results.find(r => r.success);
        if (firstSuccessResult) {
          onViewResult(firstSuccessResult);
        } else {
          message.warning('该历史记录中没有成功的路径规划结果');
        }
      }
    } else {
      message.warning('该历史记录数据不完整');
    }
  };

  // 渲染当前结果标签页内容
  const renderCurrentTab = () => {
    if (!currentResults || currentResults.length === 0) {
      return (
        <Empty
          description="暂无规划结果"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    
    return (
      <div className={styles.currentResultsContainer}>
        <div className={styles.actionsBar}>
          <Button 
            type="primary"
            icon={<HistoryOutlined />}
            onClick={saveCurrentResultsToHistory}
          >
            保存到历史记录
          </Button>
        </div>
        <Table
          rowKey={(record) => `${record.fromStationId}-${record.toStationId}`}
          columns={currentResultColumns}
          dataSource={currentResults}
          pagination={{ pageSize: 5 }}
        />
      </div>
    );
  };
  
  // 渲染历史记录标签页内容
  const renderHistoryTab = () => {
    if (historyRecords.length === 0) {
      return (
        <Empty
          description="暂无历史记录"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      );
    }
    
    return (
      <div className={styles.historyContainer}>
        <div className={styles.actionsBar}>
          <Popconfirm
            title="确定要清空所有历史记录吗?"
            onConfirm={clearAllHistory}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              danger
              icon={<DeleteOutlined />}
            >
              清空历史记录
            </Button>
          </Popconfirm>
        </div>
        <Table
          rowKey="id"
          columns={historyColumns}
          dataSource={historyRecords}
          pagination={{ pageSize: 5 }}
        />
      </div>
    );
  };
  
  return (
    <Card className={styles.planningHistoryCard}>
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="当前规划" key="current">
          {renderCurrentTab()}
        </TabPane>
        <TabPane tab="历史记录" key="history">
          {renderHistoryTab()}
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default PlanningHistory; 