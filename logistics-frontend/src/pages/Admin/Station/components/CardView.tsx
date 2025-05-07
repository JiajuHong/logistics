import React from 'react';
import { Card, Row, Col, Tag, Skeleton, Empty, Badge, Typography, Space, Tooltip } from 'antd';
import { 
  EnvironmentOutlined, 
  PhoneOutlined, 
  UserOutlined, 
  GlobalOutlined,
  EditOutlined,
  DeleteOutlined,
  EnvironmentFilled
} from '@ant-design/icons';
import styles from './CardView.less';
import CustomPagination from '@/components/CustomPagination';

const { Text, Title } = Typography;

interface CardViewProps {
  loading: boolean;
  dataSource: API.StationVO[];
  onEdit: (record: API.StationVO) => void;
  onDelete: (record: API.StationVO) => void;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize?: number) => void;
    onShowSizeChange: (current: number, size: number) => void;
  };
}

const CardView: React.FC<CardViewProps> = ({ 
  loading, 
  dataSource, 
  onEdit, 
  onDelete,
  pagination 
}) => {
  // 调试信息
  React.useEffect(() => {
    console.log('CardView渲染:', { 
      loading, 
      dataSourceLength: dataSource?.length,
      pagination: pagination ? {
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: pagination.total
      } : null
    });
  }, [loading, dataSource, pagination]);

  // 站点状态对应的颜色和文本
  const statusMap = {
    0: { color: 'error', text: '禁用' },
    1: { color: 'success', text: '启用' },
  };

  // 根据站点名称生成随机颜色
  const getColorFromName = (name: string = '') => {
    const colors = [
      '#1890ff', '#13c2c2', '#52c41a', '#faad14', '#722ed1',
      '#eb2f96', '#fa8c16', '#a0d911', '#eb2f96', '#fadb14'
    ];
    
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    const index = sum % colors.length;
    return colors[index];
  };

  // 如果没有数据，显示空状态
  if (!loading && (!dataSource || dataSource.length === 0)) {
    console.log('显示空数据状态');
    return <Empty description="暂无站点数据" />;
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {loading ? (
          // 加载状态，显示骨架屏
          Array(6).fill(null).map((_, index) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={`skeleton-${index}`}>
              <Card>
                <Skeleton active avatar paragraph={{ rows: 4 }} />
              </Card>
            </Col>
          ))
        ) : (
          // 渲染数据卡片
          dataSource.map((item) => (
            <Col xs={24} sm={12} md={8} lg={6} xl={6} key={item.id}>
              <Card
                hoverable
                className={styles.stationCard}
                cover={
                  // 内联实现站点图片或占位图
                  item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name} 
                      className={styles.stationImage}
                    />
                  ) : (
                    <div 
                      className={styles.placeholder} 
                      style={{ backgroundColor: getColorFromName(item.name) }}
                    >
                      <EnvironmentFilled className={styles.icon} />
                      <div className={styles.stationName}>{item.name}</div>
                    </div>
                  )
                }
                actions={[
                  <Tooltip title="编辑站点">
                    <EditOutlined key="edit" onClick={() => onEdit(item)} />
                  </Tooltip>,
                  <Tooltip title="删除站点">
                    <DeleteOutlined key="delete" onClick={() => onDelete(item)} style={{ color: '#ff4d4f' }} />
                  </Tooltip>,
                ]}
              >
                <div className={styles.cardHeader}>
                  <Title level={4} className={styles.stationName}>
                    {item.name}
                  </Title>
                  <Badge 
                    status={statusMap[item.status as 0 | 1]?.color as "error" | "success"} 
                    text={statusMap[item.status as 0 | 1]?.text} 
                  />
                </div>
                
                <div className={styles.cardContent}>
                  <p>
                    <Space>
                      <GlobalOutlined />
                      <Text className={styles.labelText}>站点编码:</Text>
                      <Text strong>{item.code || '-'}</Text>
                    </Space>
                  </p>
                  
                  <p>
                    <Space>
                      <EnvironmentOutlined />
                      <Text className={styles.labelText}>所属区域:</Text>
                      <Text>{item.regionName || '-'}</Text>
                    </Space>
                  </p>
                  
                  <p>
                    <Text className={styles.labelText}>详细地址:</Text>
                    <Text>{item.address || '-'}</Text>
                  </p>
                  
                  <p>
                    <Space>
                      <UserOutlined />
                      <Text className={styles.labelText}>联系人:</Text>
                      <Text>{item.contactName || '-'}</Text>
                    </Space>
                  </p>
                  
                  <p>
                    <Space>
                      <PhoneOutlined />
                      <Text className={styles.labelText}>联系电话:</Text>
                      <Text>{item.contactPhone || '-'}</Text>
                    </Space>
                  </p>
                </div>
              </Card>
            </Col>
          ))
        )}
      </Row>
      
      {/* 添加自定义分页组件 */}
      {pagination && !loading && dataSource && dataSource.length > 0 && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <CustomPagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onChange={(page, pageSize) => {
              console.log('CardView分页变化:', { page, pageSize });
              pagination.onChange(page, pageSize);
            }}
            onShowSizeChange={(current, size) => {
              console.log('CardView每页条数变化:', { current, size });
              pagination.onShowSizeChange(current, size);
            }}
            showSizeChanger
            showQuickJumper
            showTotal={(total) => `共 ${total} 条记录，共 ${Math.ceil(total / pagination.pageSize)} 页`}
          />
        </div>
      )}
    </div>
  );
};

export default CardView; 