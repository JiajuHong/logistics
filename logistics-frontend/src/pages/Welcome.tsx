import { PageContainer } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Card, Row, Col, Typography, Button, Space, Divider, List, Avatar, message } from 'antd';
import React from 'react';
import { 
  CarOutlined, 
  EnvironmentOutlined, 
  TeamOutlined, 
  RocketOutlined, 
  BarChartOutlined, 
  ClockCircleOutlined,
  SettingOutlined,
  GlobalOutlined,
  BulbOutlined,
  SafetyOutlined,
  RiseOutlined,
  CompassOutlined
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { listStation } from '@/services/api';

const { Title, Paragraph, Text } = Typography;

// 引入了自定义样式
import './Welcome.less';

/**
 * 功能卡片组件
 */
const FeatureCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  delay?: number;
  onClick: (path: string) => void;
}> = ({ title, description, icon, path, color, delay = 0, onClick }) => {
  return (
    <div className="feature-card-container" style={{ animationDelay: `${delay}ms` }}>
      <Card
        hoverable
        className="feature-card"
        style={{ height: '100%' }}
        bodyStyle={{ padding: 24 }}
        onClick={() => onClick(path)}
      >
        <div style={{ color, fontSize: 36, marginBottom: 16 }} className="feature-icon">
          {icon}
        </div>
        <Title level={4}>{title}</Title>
        <Paragraph type="secondary" style={{ minHeight: 60 }}>
          {description}
        </Paragraph>
        <Button type="link" style={{ padding: 0 }} className="feature-button">
          立即使用 →
        </Button>
      </Card>
    </div>
  );
};

const Welcome: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const username = initialState?.currentUser?.userName || '亲爱的用户';
  
  // 检查用户是否已登录并处理导航
  const handleNavigation = (path: string) => {
    // 检查用户是否已登录
    if (!initialState?.currentUser) {
      message.info('请先登录以访问系统功能');
      
      // 跳转到登录页，并传递原始目标路径作为重定向URL
      setTimeout(() => {
        history.push(`/user/login?redirect=${encodeURIComponent(path)}`);
      }, 100);
      return;
    }
    
    // 用户已登录，直接导航到目标页面
    history.push(path);
  };
  
  // 系统特点数据
  const features = [
    {
      icon: <GlobalOutlined style={{ color: '#1677ff', fontSize: 24 }} />,
      title: '全局视角',
      description: '提供全面的物流网络视图，让您轻松掌控全局资源和状态'
    },
    {
      icon: <RiseOutlined style={{ color: '#52c41a', fontSize: 24 }} />,
      title: '智能分析',
      description: '基于数据的智能分析，帮助决策者做出最优选择'
    },
    {
      icon: <BulbOutlined style={{ color: '#fa8c16', fontSize: 24 }} />,
      title: '优化算法',
      description: '先进的路径规划算法，为您提供最高效的物流解决方案'
    },
    {
      icon: <SafetyOutlined style={{ color: '#eb2f96', fontSize: 24 }} />,
      title: '安全可靠',
      description: '数据加密传输，确保您的业务信息安全可靠'
    }
  ];
  
  // 快速访问数据
  const quickAccess = [
    {
      title: '开始规划路径',
      icon: <CompassOutlined />,
      color: '#1677ff',
      path: '/PathPlanning',
      description: '快速创建高效物流路径'
    },
    {
      title: '管理系统资源',
      icon: <SettingOutlined />,
      color: '#722ed1',
      path: '/Admin',
      description: '配置和管理系统资源'
    },
    {
      title: '查看物流站点',
      icon: <EnvironmentOutlined />,
      color: '#13c2c2',
      path: '/Admin/Station',
      description: '浏览物流站点分布'
    },
    {
      title: '订单处理中心',
      icon: <RocketOutlined />,
      color: '#fa8c16',
      path: '/Admin/Order',
      description: '管理和处理物流订单'
    }
  ];

  return (
    <PageContainer
      ghost={true}
      header={{
        title: '',
        ghost: true,
      }}
    >
      <Row gutter={[24, 24]}>
        <Col span={24} className="welcome-hero">
          <Card
            className="hero-card"
            style={{
              borderRadius: 8,
              overflow: 'hidden',
            }}
            bodyStyle={{
              backgroundImage: 'linear-gradient(45deg, #1677ff, #64b5ff)',
              padding: '40px 40px 30px',
              color: '#fff',
            }}
          >
            <div style={{ 
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <div style={{ flex: 1, minWidth: '280px', marginBottom: '20px' }}>
                <Title level={2} style={{ color: '#fff', margin: 0, marginBottom: 8 }}>
                  {username ? `${username}，欢迎回到` : '欢迎使用'}区域物流调度中心
                </Title>
                <Paragraph style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: 16, marginBottom: 16 }}>
                  高效、智能的物流调度解决方案，为您的业务提供全方位支持
                </Paragraph>
                <Space wrap>
                  <Button type="primary" size="large" onClick={() => handleNavigation('/PathPlanning')}>
                    开始规划路径
                  </Button>
                  <Button type="primary" size="large" onClick={() => handleNavigation('/Admin')}>
                    管理系统资源
                  </Button>
                </Space>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', minWidth: '200px' }}>
                <img 
                  src="/logistics-hero.svg" 
                  alt="Logistics" 
                  style={{ 
                    maxHeight: 160, 
                    maxWidth: '100%',
                    filter: 'drop-shadow(0px 0px 20px rgba(0, 0, 0, 0.15))',
                  }} 
                />
              </div>
            </div>
          </Card>
        </Col>

        {/* 系统特点板块 - 替换原统计数据 */}
        <Col span={24} className="features-section">
          <Card title="系统特点" className="feature-showcase-card">
            <Row gutter={[32, 32]}>
              {features.map((feature, index) => (
                <Col xs={24} sm={12} md={6} key={index}>
                  <div className="feature-item">
                    <div className="feature-icon-wrapper">
                      {feature.icon}
                    </div>
                    <div className="feature-content">
                      <Title level={5} style={{ marginTop: 16, marginBottom: 8 }}>
                        {feature.title}
                      </Title>
                      <Paragraph type="secondary" style={{ fontSize: 14, marginBottom: 0 }}>
                        {feature.description}
                      </Paragraph>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>
        
        {/* 快速访问卡片 */}
        <Col span={24} className="quick-access-section">
          <Title level={4}>快速访问</Title>
          <Row gutter={[16, 16]}>
            {quickAccess.map((item, index) => (
              <Col xs={24} sm={12} md={6} key={index}>
                <Card 
                  hoverable 
                  className="quick-access-card"
                  onClick={() => handleNavigation(item.path)}
                  bodyStyle={{ padding: 24 }}
                >
                  <div style={{ 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  }}>
                    <Avatar 
                      size={56} 
                      style={{ 
                        backgroundColor: item.color,
                        marginBottom: 16,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}
                      icon={React.cloneElement(item.icon, { style: { fontSize: 24, color: '#fff' } })}
                    />
                    <Title level={5} style={{ marginBottom: 8 }}>{item.title}</Title>
                    <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 14 }}>
                      {item.description}
                    </Paragraph>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>

        <Col span={24} className="features-title">
          <Title level={4}>主要功能</Title>
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard
            title="路径规划"
            description="基于实时路况和智能算法，为您提供最佳物流路径规划方案"
            icon={<EnvironmentOutlined />}
            path="/PathPlanning"
            color="#1677ff"
            delay={100}
            onClick={handleNavigation}
          />
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard
            title="车辆管理"
            description="实时监控车辆状态、位置和负载情况，优化车队调度效率"
            icon={<CarOutlined />}
            path="/Admin/Vehicle"
            color="#52c41a"
            delay={200}
            onClick={handleNavigation}
          />
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard
            title="站点管理"
            description="高效管理物流节点站点，监控站点运营状况和库存情况"
            icon={<ClockCircleOutlined />}
            path="/Admin/Station"
            color="#722ed1"
            delay={300}
            onClick={handleNavigation}
          />
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard
            title="订单处理"
            description="批量处理物流订单，自动分配和调度，提高订单处理效率"
            icon={<RocketOutlined />}
            path="/Admin/Order"
            color="#fa8c16"
            delay={400}
            onClick={handleNavigation}
          />
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard
            title="司机管理"
            description="管理司机信息、工作时间安排和路线分配，提高人力资源利用率"
            icon={<TeamOutlined />}
            path="/Admin/Driver"
            color="#eb2f96"
            delay={500}
            onClick={handleNavigation}
          />
        </Col>
        
        <Col xs={24} sm={12} lg={8}>
          <FeatureCard
            title="数据报表"
            description="全面的数据分析和可视化报表，助力决策优化和效率提升"
            icon={<BarChartOutlined />}
            path="/Admin"
            color="#f5222d"
            delay={600}
            onClick={handleNavigation}
          />
        </Col>
      </Row>
    </PageContainer>
  );
};

export default Welcome;
