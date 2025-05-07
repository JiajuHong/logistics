import React, { useEffect, useState } from 'react';
import { PageContainer } from '@ant-design/pro-layout';
import { Button, Card, Col, Form, Input, Row, Select, Statistic, Space, message } from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import { VehicleQueryParams, VehicleStatistics, VehicleStatus, VehicleType } from '@/typings/vehicle';
import { listVehicleByPage, deleteVehicle, listVehicleTypes, getVehicleStatistics } from '@/services/api';
import CustomPagination from '@/components/CustomPagination';

// 直接引入相对路径下的组件
// @ts-ignore
import VehicleCard from './components/VehicleCard';
// @ts-ignore
import CreateVehicleModal from './components/CreateVehicleModal';
// @ts-ignore
import UpdateVehicleModal from './components/UpdateVehicleModal';

const { Option } = Select;
const { Countdown } = Statistic;

const VehicleManagement: React.FC = () => {
  // 状态管理
  const [vehicles, setVehicles] = useState<VehicleType[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  const [currentVehicle, setCurrentVehicle] = useState<VehicleType | undefined>(undefined);
  const [statistics, setStatistics] = useState<VehicleStatistics>({
    total: 0,
    idle: 0,
    inTask: 0,
    maintenance: 0,
  });
  // 车辆类型列表
  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);

  // 查询参数
  const [queryParams, setQueryParams] = useState<VehicleQueryParams>({
    current: 1,
    pageSize: 8,
  });

  // 表单
  const [form] = Form.useForm();

  // 加载车辆数据
  const fetchVehicles = async (params: VehicleQueryParams = queryParams) => {
    setLoading(true);
    try {
      const response = await listVehicleByPage(params);
      setLoading(false);
      
      if (response.code === 0 && response.data) {
        const list = response.data.records || [];
        const totalCount = response.data.total || 0;
        
        // 将后端返回的数据转换为前端类型
        const vehicleList: VehicleType[] = list.map((item: any) => ({
          id: item.id,
          vehicleNo: item.vehicleNo,
          vehicleType: item.vehicleType,
          loadCapacity: item.loadCapacity,
          volumeCapacity: item.volumeCapacity,
          stationId: item.stationId,
          stationName: item.stationName,
          driverId: item.driverId,
          driverName: item.driverName,
          status: item.status,
          createTime: item.createTime,
        }));
        
        setVehicles(vehicleList);
        setTotal(totalCount);
        
        // 使用专门的接口获取统计数据
        fetchVehicleStatistics();
      } else {
        message.error(response.message || '获取车辆数据失败');
      }
    } catch (error) {
      setLoading(false);
      message.error('获取车辆数据失败');
      console.error('获取车辆数据出错:', error);
    }
  };
  
  // 获取车辆统计数据
  const fetchVehicleStatistics = async () => {
    try {
      const response = await getVehicleStatistics();
      if (response.code === 0 && response.data) {
        // 将后端返回的统计数据转换为前端需要的格式
        const stats: VehicleStatistics = {
          total: response.data.total || 0,
          idle: response.data.idle || 0,
          inTask: response.data.inTask || 0,
          maintenance: response.data.maintenance || 0,
        };
        setStatistics(stats);
      } else {
        console.error('获取车辆统计数据失败:', response.message);
      }
    } catch (error) {
      console.error('获取车辆统计数据异常:', error);
    }
  };

  // 加载车辆类型数据
  const fetchVehicleTypes = async () => {
    try {
      console.log('开始获取车辆类型...');
      const response = await listVehicleTypes();
      console.log('车辆类型API响应:', response);
      if (response.code === 0 && response.data) {
        setVehicleTypes(response.data);
        if (response.data.length === 0) {
          console.log('车辆类型列表为空，请先添加车辆');
          message.info('没有可用的车辆类型，请先添加车辆');
        }
      } else {
        console.error('获取车辆类型失败，API返回错误:', response.message);
        // 设置一个默认车辆类型列表，以便用户可以继续操作
        message.error(`获取车辆类型失败: ${response.message || '未知错误'}`);
      }
    } catch (error) {
      console.error('获取车辆类型异常:', error);
      // 设置一个默认车辆类型列表，以便用户可以继续操作
      message.error('获取车辆类型失败，请检查网络或后端服务');
      
      // 由于API调用失败，临时使用输入框替代下拉选择框
      setVehicleTypes([]);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchVehicles();
    fetchVehicleTypes();
    fetchVehicleStatistics(); // 初始加载时也获取一次统计数据
  }, []);

  // 处理搜索
  const handleSearch = () => {
    const values = form.getFieldsValue();
    const newParams = {
      ...queryParams,
      ...values,
      current: 1, // 重置为第一页
    };
    setQueryParams(newParams);
    fetchVehicles(newParams);
  };

  // 处理重置
  const handleReset = () => {
    form.resetFields();
    const newParams = {
      current: 1,
      pageSize: queryParams.pageSize,
    };
    setQueryParams(newParams);
    fetchVehicles(newParams);
  };

  // 处理分页变化
  const handlePageChange = (page: number, pageSize?: number) => {
    const newParams = {
      ...queryParams,
      current: page,
      pageSize: pageSize || queryParams.pageSize,
    };
    setQueryParams(newParams);
    fetchVehicles(newParams);
  };

  // 处理每页数量变化
  const handlePageSizeChange = (current: number, size: number) => {
    const newParams = {
      ...queryParams,
      current,
      pageSize: size,
    };
    setQueryParams(newParams);
    fetchVehicles(newParams);
  };

  // 处理删除车辆
  const handleDelete = async (id: number) => {
    try {
      const response = await deleteVehicle({ id });
      if (response.code === 0) {
        message.success('删除成功');
        fetchVehicles();
        fetchVehicleStatistics(); // 删除后更新统计数据
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  // 处理编辑车辆
  const handleEdit = (vehicle: VehicleType) => {
    setCurrentVehicle(vehicle);
    setUpdateModalVisible(true);
  };

  // 处理创建成功
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchVehicles();
    fetchVehicleStatistics(); // 创建后更新统计数据
  };

  // 处理更新成功
  const handleUpdateSuccess = () => {
    setUpdateModalVisible(false);
    setCurrentVehicle(undefined);
    fetchVehicles();
    fetchVehicleStatistics(); // 更新后更新统计数据
  };

  return (
    <PageContainer
      header={{
        title: '车辆管理',
      }}
    >
      {/* 统计信息卡片 */}
      <div style={{ marginBottom: 24 }}>
        <Row gutter={24}>
          <Col xs={24} sm={12} md={6}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                height: '100%'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }}>车辆总数</div>
                  <div style={{ 
                    fontSize: '30px', 
                    fontWeight: 'bold', 
                    color: '#262626',
                    lineHeight: 1
                  }}>
                    <Statistic 
                      value={statistics.total} 
                      valueStyle={{ fontSize: '30px', fontWeight: 'bold', color: '#262626', lineHeight: 1 }}
                    />
                  </div>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #5142E4 0%, #8D7AFE 100%)', 
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="car" width="24" height="24" fill="white" aria-hidden="true">
                    <path d="M380 704h264c4.4 0 8-3.6 8-8v-84c0-4.4-3.6-8-8-8h-40c-4.4 0-8 3.6-8 8v36H428v-36c0-4.4-3.6-8-8-8h-40c-4.4 0-8 3.6-8 8v84c0 4.4 3.6 8 8 8zm340-123a40 40 0 1080 0 40 40 0 10-80 0zm239-167.6L935.3 372a8 8 0 00-10.9-2.9l-50.7 29.6-78.3-216.2a63.9 63.9 0 00-60.9-44.4H301.2c-34.7 0-65.5 22.4-76.2 55.5l-74.6 205.2-50.8-29.6a8 8 0 00-10.9 2.9L65 413.4c-2.2 3.8-.9 8.6 2.9 10.8l60.4 35.2-14.5 40c-1.2 3.2-1.8 6.6-1.8 10v348.2c0 15.7 11.8 28.4 26.3 28.4h67.6c12.3 0 23-9.3 25.6-22.3l7.7-37.7h545.6l7.7 37.7c2.7 13 13.3 22.3 25.6 22.3h67.6c14.5 0 26.3-12.7 26.3-28.4V509.4c0-3.4-.6-6.8-1.8-10l-14.5-40 60.3-35.2a8 8 0 003-10.8zM840 517v237H184V517l15.6-43h624.8l15.6 43zM292.7 218.1l.5-1.3.4-1.3c1.1-3.3 4.1-5.5 7.6-5.5h427.6l75.4 208H220l72.7-199.9z"></path>
                  </svg>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                height: '100%'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }}>空闲车辆</div>
                  <div style={{ 
                    fontSize: '30px', 
                    fontWeight: 'bold', 
                    color: '#3f8600',
                    lineHeight: 1
                  }}>
                    <Statistic 
                      value={statistics.idle} 
                      valueStyle={{ fontSize: '30px', fontWeight: 'bold', color: '#3f8600', lineHeight: 1 }}
                    />
                  </div>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #52C41A 0%, #73D13D 100%)', 
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="check-circle" width="24" height="24" fill="white" aria-hidden="true">
                    <path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64zm0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"></path>
                    <path d="M512 140c-205.4 0-372 166.6-372 372s166.6 372 372 372 372-166.6 372-372-166.6-372-372-372zm193.4 225.7l-210.6 292a31.8 31.8 0 01-51.7 0L318.5 484.9c-3.8-5.3 0-12.7 6.5-12.7h46.9c10.3 0 19.9 5 25.9 13.3l71.2 98.8 157.2-218c6-8.4 15.7-13.3 25.9-13.3H699c6.5 0 10.3 7.4 6.4 12.7z"></path>
                  </svg>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                height: '100%'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }}>任务中车辆</div>
                  <div style={{ 
                    fontSize: '30px', 
                    fontWeight: 'bold', 
                    color: '#1890ff',
                    lineHeight: 1
                  }}>
                    <Statistic 
                      value={statistics.inTask} 
                      valueStyle={{ fontSize: '30px', fontWeight: 'bold', color: '#1890ff', lineHeight: 1 }}
                    />
                  </div>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #1677FF 0%, #69C0FF 100%)', 
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="loading" width="24" height="24" fill="white" aria-hidden="true">
                    <path d="M959 413.4L935.3 372a8 8 0 0 0-10.9-2.9l-50.7 29.6-78.3-216.2a63.9 63.9 0 0 0-60.9-44.4H301.2c-34.7 0-65.5 22.4-76.2 55.5l-74.6 205.2-50.8-29.6a8 8 0 0 0-10.9 2.9L65 413.4c-2.2 3.8-.9 8.6 2.9 10.8l60.4 35.2-14.5 40c-1.2 3.2-1.8 6.6-1.8 10v348.2c0 15.7 11.8 28.4 26.3 28.4h67.6c12.3 0 23-9.3 25.6-22.3l7.7-37.7h545.6l7.7 37.7c2.7 13 13.3 22.3 25.6 22.3h67.6c14.5 0 26.3-12.7 26.3-28.4V509.4c0-3.4-.6-6.8-1.8-10l-14.5-40 60.3-35.2a8 8 0 0 0 3-10.8zM264 621c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zm388 75c0 4.4-3.6 8-8 8H380c-4.4 0-8-3.6-8-8v-84c0-4.4 3.6-8 8-8h40c4.4 0 8 3.6 8 8v36h168v-36c0-4.4 3.6-8 8-8h40c4.4 0 8 3.6 8 8v84zm108-75c-22.1 0-40-17.9-40-40s17.9-40 40-40 40 17.9 40 40-17.9 40-40 40zM220 418l72.7-199.9.5-1.3.4-1.3c1.1-3.3 4.1-5.5 7.6-5.5h427.6l75.4 208H220z"></path>
                  </svg>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card 
              hoverable
              style={{ 
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                height: '100%'
              }}
              bodyStyle={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '14px', color: 'rgba(0, 0, 0, 0.45)', marginBottom: '8px' }}>维修中车辆</div>
                  <div style={{ 
                    fontSize: '30px', 
                    fontWeight: 'bold', 
                    color: '#faad14',
                    lineHeight: 1
                  }}>
                    <Statistic 
                      value={statistics.maintenance} 
                      valueStyle={{ fontSize: '30px', fontWeight: 'bold', color: '#faad14', lineHeight: 1 }}
                    />
                  </div>
                </div>
                <div style={{ 
                  background: 'linear-gradient(135deg, #FA8C16 0%, #FFC53D 100%)', 
                  padding: '16px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <svg viewBox="64 64 896 896" focusable="false" data-icon="tool" width="24" height="24" fill="white" aria-hidden="true">
                    <path d="M924.8 625.7l-65.5-56c3.1-19 4.7-38.4 4.7-57.8s-1.6-38.8-4.7-57.8l65.5-56a32.03 32.03 0 0 0 9.3-35.2l-.9-2.6a443.74 443.74 0 0 0-79.7-137.9l-1.8-2.1a32.12 32.12 0 0 0-35.1-9.5l-81.3 28.9c-30-24.6-63.5-44-99.7-57.6l-15.7-85a32.05 32.05 0 0 0-25.8-25.7l-2.7-.5c-52.1-9.4-106.9-9.4-159 0l-2.7.5a32.05 32.05 0 0 0-25.8 25.7l-15.8 85.4a351.86 351.86 0 0 0-99 57.4l-81.9-29.1a32 32 0 0 0-35.1 9.5l-1.8 2.1a446.02 446.02 0 0 0-79.7 137.9l-.9 2.6c-4.5 12.5-.8 26.5 9.3 35.2l66.3 56.6c-3.1 18.8-4.6 38-4.6 57.1 0 19.2 1.5 38.4 4.6 57.1L99 625.5a32.03 32.03 0 0 0-9.3 35.2l.9 2.6c18.1 50.4 44.9 96.9 79.7 137.9l1.8 2.1a32.12 32.12 0 0 0 35.1 9.5l81.9-29.1c29.8 24.5 63.1 43.9 99 57.4l15.8 85.4a32.05 32.05 0 0 0 25.8 25.7l2.7.5a449.4 449.4 0 0 0 159 0l2.7-.5a32.05 32.05 0 0 0 25.8-25.7l15.7-85a350 350 0 0 0 99.7-57.6l81.3 28.9a32 32 0 0 0 35.1-9.5l1.8-2.1c34.8-41.1 61.6-87.5 79.7-137.9l.9-2.6c4.5-12.3.8-26.3-9.3-35zM788.3 465.9c2.5 15.1 3.8 30.6 3.8 46.1s-1.3 31-3.8 46.1l-6.6 40.1 74.7 63.9a370.03 370.03 0 0 1-42.6 73.6L721 702.8l-31.4 25.8c-23.9 19.6-50.5 35-79.3 45.8l-38.1 14.3-17.9 97a377.5 377.5 0 0 1-85 0l-17.9-97.2-37.8-14.5c-28.5-10.8-55-26.2-78.7-45.7l-31.4-25.9-93.4 33.2c-17-22.9-31.2-47.6-42.6-73.6l75.5-64.5-6.5-40c-2.4-14.9-3.7-30.3-3.7-45.5 0-15.3 1.2-30.6 3.7-45.5l6.5-40-75.5-64.5c11.3-26.1 25.6-50.7 42.6-73.6l93.4 33.2 31.4-25.9c23.7-19.5 50.2-34.9 78.7-45.7l37.9-14.3 17.9-97.2c28.1-3.2 56.8-3.2 85 0l17.9 97 38.1 14.3c28.7 10.8 55.4 26.2 79.3 45.8l31.4 25.8 92.8-32.9c17 22.9 31.2 47.6 42.6 73.6L781.8 426l6.5 39.9zM512 326c-97.2 0-176 78.8-176 176s78.8 176 176 176 176-78.8 176-176-78.8-176-176-176zm79.2 255.2A111.6 111.6 0 0 1 512 614c-29.9 0-58-11.7-79.2-32.8A111.6 111.6 0 0 1 400 502c0-29.9 11.7-58 32.8-79.2C454 401.6 482.1 390 512 390c29.9 0 58 11.6 79.2 32.8A111.6 111.6 0 0 1 624 502c0 29.9-11.7 58-32.8 79.2z"></path>
                  </svg>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>

      {/* 搜索和操作区 */}
      <Card 
        style={{ 
          marginBottom: 24,
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}
        bodyStyle={{ padding: '24px' }}
      >
        <Form form={form} layout="inline" style={{ marginBottom: 24 }}>
          <Form.Item name="vehicleNo" label="车牌号">
            <Input placeholder="请输入车牌号" allowClear style={{ width: 200 }} />
          </Form.Item>
          <Form.Item name="vehicleType" label="车辆类型">
            {vehicleTypes.length > 0 ? (
              <Select 
                placeholder="请选择车辆类型" 
                allowClear 
                style={{ width: 200 }}
                showSearch
                optionFilterProp="children"
              >
                {vehicleTypes.map((type: string) => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            ) : (
              <Input placeholder="请输入车辆类型" allowClear style={{ width: 200 }} />
            )}
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select placeholder="请选择状态" allowClear style={{ width: 150 }}>
              <Option value={VehicleStatus.IDLE}>空闲</Option>
              <Option value={VehicleStatus.IN_TASK}>任务中</Option>
              <Option value={VehicleStatus.MAINTENANCE}>维修中</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button 
                type="primary" 
                icon={<SearchOutlined />} 
                onClick={handleSearch}
              >
                搜索
              </Button>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={handleReset}
              >
                重置
              </Button>
            </Space>
          </Form.Item>
        </Form>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
          style={{ 
            boxShadow: '0 2px 6px rgba(22, 119, 255, 0.2)'
          }}
        >
          新增车辆
        </Button>
      </Card>

      {/* 车辆卡片列表 */}
      <Card 
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}
        bodyStyle={{ padding: '0 24px 24px' }}
        title="车辆列表"
      >
        {vehicles.length > 0 ? (
          <Row gutter={[24, 24]} style={{ marginTop: 16 }}>
            {vehicles.map((vehicle) => (
              <Col xs={24} sm={12} md={8} lg={6} key={vehicle.id}>
                <VehicleCard
                  vehicle={vehicle}
                  onEdit={() => handleEdit(vehicle)}
                  onDelete={() => handleDelete(vehicle.id!)}
                />
              </Col>
            ))}
          </Row>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 0', 
            color: 'rgba(0, 0, 0, 0.25)',
            fontSize: '16px'
          }}>
            {loading ? '加载中...' : '暂无车辆数据'}
          </div>
        )}

        {/* 分页 */}
        {total > 0 && (
          <div style={{ marginTop: 24, textAlign: 'right' }}>
            <CustomPagination
              current={queryParams.current || 1}
              total={total}
              pageSize={queryParams.pageSize || 8}
              onChange={handlePageChange}
              onShowSizeChange={handlePageSizeChange}
              showSizeChanger
              showQuickJumper
              showTotal={(t) => `共 ${t} 条记录，共 ${Math.ceil(t / (queryParams.pageSize || 8))} 页`}
            />
          </div>
        )}
      </Card>

      {/* 弹窗组件 */}
      <CreateVehicleModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={handleCreateSuccess}
      />
      <UpdateVehicleModal
        visible={updateModalVisible}
        vehicle={currentVehicle}
        onCancel={() => {
          setUpdateModalVisible(false);
          setCurrentVehicle(undefined);
        }}
        onSuccess={handleUpdateSuccess}
      />
    </PageContainer>
  );
};

export default VehicleManagement; 