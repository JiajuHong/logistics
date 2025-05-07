import React from 'react';
import { Image } from 'antd';
import { EnvironmentFilled } from '@ant-design/icons';
import styles from './index.less';

interface StationImageProps {
  imageUrl?: string;
  stationName?: string;
  fallbackColor?: string;
}

/**
 * 站点图片组件
 * 如果有图片则显示图片，否则显示一个带背景色的占位符
 */
const StationImage: React.FC<StationImageProps> = ({ 
  imageUrl, 
  stationName = '站点', 
  fallbackColor 
}) => {
  // 根据站点名称生成随机颜色
  const getColorFromName = (name: string) => {
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
  
  const bgColor = fallbackColor || getColorFromName(stationName);
  
  if (!imageUrl) {
    // 无图片时显示占位符
    return (
      <div 
        className={styles.placeholder} 
        style={{ backgroundColor: bgColor }}
      >
        <EnvironmentFilled className={styles.icon} />
        <div className={styles.stationName}>{stationName}</div>
      </div>
    );
  }
  
  // 有图片时显示图片
  return (
    <Image
      src={imageUrl}
      alt={stationName}
      className={styles.stationImage}
 