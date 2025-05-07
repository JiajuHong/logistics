import React from 'react';
import { Card, Avatar, Tag, Typography, Space, Button, Tooltip } from 'antd';
import { driverStatusMap } from '@/typings/driver';
import styles from './DriverCard.less';

const { Text } = Typography;

interface DriverCardProps {
  driver: API.DriverVO;
  onEdit: (driver: API.DriverVO) => void;
  onDelete: (driver: API.DriverVO) => void;
}

const DriverCard: React.FC<DriverCardProps> = ({ driver, onEdit, onDelete }) => {
  // 根据屏幕宽度格式化驾驶证号
  const formatLicenseNo = (licenseNo: string | undefined) => {
    if (!licenseNo) return '未知';
    
    // 根据屏幕宽度判断显示方式
    const isMobile = window.innerWidth < 768;
    
    // 移动端显示前6位+...，桌面端尝试显示更多
    return licenseNo.length > (isMobile ? 6 : 10) 
      ? `${licenseNo.substring(0, isMobile ? 6 : 10)}...` 
      : licenseNo;
  };

  return (
    <Card 
      hoverable 
      className={styles.driverCard}
      actions={[
        <Button type="link" key="edit" onClick={() => onEdit(driver)}>修改</Button>,
        <Button type="link" danger key="delete" onClick={() => onDelete(driver)}>删除</Button>
      ]}
    >
      <div className={styles.cardContent}>
        <div className={styles.avatarSection}>
          <Avatar 
            size={64} 
            src={driver.avatar} 
            style={{ backgroundColor: driver.avatar ? 'transparent' : '#1890ff' }}
          >
            {driver.name?.slice(0, 1)}
          </Avatar>
          <Tag 
            color={driverStatusMap[driver.status || 0].color} 
            className={styles.statusTag}
          >
            {driverStatusMap[driver.status || 0].text}
          </Tag>
        </div>
        
        <div className={styles.infoSection}>
          <Text strong className={styles.driverName}>{driver.name}</Text>
          <Space direction="vertical" size={0} className={styles.driverDetails}>
            <Text>编号: {driver.code}</Text>
            <Text>电话: {driver.phone}</Text>
            <Text>驾照: {driver.licenseType} ({driver.experience}年)</Text>
            <Tooltip title={driver.licenseNo || '未知'} placement="topLeft">
              <Text className={styles.licenseText}>驾驶证号: {formatLicenseNo(driver.licenseNo)}</Text>
            </Tooltip>
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default DriverCard;
