import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Form, Select, Button, Descriptions, Empty, Spin, message, Tabs, Switch, Slider, Tooltip, Space, Radio, Tag, Table } from 'antd';
import { InfoCircleOutlined, SettingOutlined, ReloadOutlined } from '@ant-design/icons';
import { listStation } from '@/services/api';
import { getOptimalRoute, getOptimalRouteAdvanced } from '@/services/backend/routeService';
import RouteMap from './components/RouteMap';
import BatchOrderProcessor from './components/BatchOrderProcessor';
import EnhancedRouteMap from './components/EnhancedRouteMap';
import PlanningHistory from './components/PlanningHistory';
import { MapConfig, clearAllRouteElements, drawRealisticRoute } from '@/utils/mapUtils';
import styles from './index.less';

const { Option } = Select;
const { TabPane } = Tabs;

/**
 * 路径规划页面
 * 支持单点规划和批量订单处理两种模式
 */
const PathPlanning = () => {
  const [form] = Form.useForm();
  const [stations, setStations] = useState([]);
  const [routeData, setRouteData] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stationLoading, setStationLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('single');
  const [resultsPanelVisible, setResultsPanelVisible] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [showTraffic, setShowTraffic] = useState(false);
  const [drivingPolicy, setDrivingPolicy] = useState(MapConfig.drivingPolicy);
  const [showRouteGuide, setShowRouteGuide] = useState(MapConfig.rendering.showRouteGuide);
  const [planningParams, setPlanningParams] = useState({
    distanceWeight: 0.5,
    timeWeight: 0.3,
    costWeight: 0.2,
    trafficFactor: 1.0,
    enforceTransfer: true
  });
  const [selectedBatchOrderId, setSelectedBatchOrderId] = useState(null);

  // 加载站点数据
  useEffect(() => {
    fetchStations();
  }, []);

  // 获取站点列表
  const fetchStations = async () => {
    setStationLoading(true);
    try {
      const response = await listStation({});
      if (response && response.data) {
        setStations(response.data);
      }
    } catch (error) {
      message.error('获取站点列表失败');
      console.error('获取站点列表失败:', error);
    } finally {
      setStationLoading(false);
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (values) => {
    // 在开始新的路径规划前，先将路由数据置为null，确保清除旧路径
    setRouteData(null);
    setLoading(true);

    try {
      let response;

      console.log('开始路径规划，参数:', values);

      // 根据是否启用高级模式选择不同的API
      if (advancedMode) {
        console.log('使用高级模式API，参数:', {
          fromStationId: values.fromStationId,
          toStationId: values.toStationId,
          distanceWeight: planningParams.distanceWeight,
          timeWeight: planningParams.timeWeight,
          costWeight: planningParams.costWeight,
          trafficFactor: planningParams.trafficFactor,
          enforceTransfer: planningParams.enforceTransfer
        });

        response = await getOptimalRouteAdvanced({
          fromStationId: values.fromStationId,
          toStationId: values.toStationId,
          distanceWeight: planningParams.distanceWeight,
          timeWeight: planningParams.timeWeight,
          costWeight: planningParams.costWeight,
          trafficFactor: planningParams.trafficFactor,
          enforceTransfer: planningParams.enforceTransfer
        });
      } else {
        console.log('使用基础模式API，参数:', {
          fromStationId: values.fromStationId,
          toStationId: values.toStationId
        });

        response = await getOptimalRoute(
          values.fromStationId,
          values.toStationId
        );
      }

      console.log('路径规划返回结果:', response);

      // 深入分析返回的数据结构
      console.log('返回数据结构分析:');
      console.log('- 是否有路径点数组:', response && response.pathPoints ? '是' : '否');
      if (response && response.pathPoints) {
        console.log('- 路径点数组长度:', response.pathPoints.length);
        if (response.pathPoints.length > 0) {
          console.log('- 第一个路径点示例:', response.pathPoints[0]);
          console.log('- 最后一个路径点示例:', response.pathPoints[response.pathPoints.length - 1]);
        }
      }
      console.log('- 总距离:', response ? response.totalDistance : '未知');
      console.log('- 预计时间:', response ? response.estimatedTime : '未知');

      if (response) {
        let statusMessage = '';

        // 检查是否为默认生成的路径
        if (response.isDefault) {
          statusMessage = '系统自动生成的简化路径，仅供参考';
          message.warning(statusMessage);
          console.warn('使用默认生成的路径数据');
        }
        // 检查是否返回了错误标志
        else if (response.error) {
          statusMessage = '系统无法计算路径，将显示起终点直线路径作为参考';
          message.warning(statusMessage);
          console.warn('路径计算出错，使用直线路径');
        }
        // 检查路径点数量
        else if (!response.pathPoints || response.pathPoints.length === 0) {
          statusMessage = '返回的路径点为空，无法绘制路径';
          message.warning(statusMessage);
          console.warn('路径点数组为空');
        }
        else if (response.pathPoints.length === 1) {
          statusMessage = '返回的路径点只有一个，无法绘制完整路径';
          message.warning(statusMessage);
          console.warn('只有一个路径点');
        }
        else {
          statusMessage = `路径规划成功，共${response.pathPoints.length}个路径点`;
          message.success(statusMessage);
          console.log(`路径规划成功，包含${response.pathPoints.length}个路径点`);
        }

        // 检查路径点是否都有有效的经纬度和站点名
        const invalidPointsCount = response.pathPoints ?
          response.pathPoints.filter(point =>
            !point ||
            typeof point.longitude !== 'number' ||
            typeof point.latitude !== 'number' ||
            isNaN(point.longitude) ||
            isNaN(point.latitude) ||
            !point.stationName
          ).length : 0;

        if (invalidPointsCount > 0) {
          const warningMsg = `检测到${invalidPointsCount}个无效路径点，可能影响路径显示`;
          message.warning(warningMsg);
          console.warn(warningMsg);
        }

        // 始终尝试显示路径数据，即使是空的或者只有两个点
        // 我们已经改进了EnhancedRouteMap组件来更好地处理这些情况
        setRouteData({
          route: {
            pathPoints: response.pathPoints,
            totalDistance: response.totalDistance,
            estimatedTime: response.estimatedTime
          },
          fromStationId: values.fromStationId,
          toStationId: values.toStationId,
          statusMessage: statusMessage,
          isDefault: response.isDefault,
          error: response.error
        });
        setResultsPanelVisible(true);
      }
    } catch (error) {
      // 更详细的错误信息
      const errorMsg = error.message || '未知错误';
      message.error(`路径规划失败 (${errorMsg})`);
      console.error('路径规划失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 处理单个订单选择
  const handleSelectOrder = (orderData) => {
    // 在处理新订单前，先将路由数据置为null，确保清除旧路径
    setRouteData(null);

    form.setFieldsValue({
      fromStationId: orderData.fromStationId,
      toStationId: orderData.toStationId
    });

    // 如果已经包含路径数据，直接显示
    if (orderData.routeData) {
      setRouteData({
        route: {
          pathPoints: orderData.routeData.pathPoints,
          totalDistance: orderData.routeData.totalDistance,
          estimatedTime: orderData.routeData.estimatedTime
        },
        fromStationId: orderData.fromStationId,
        toStationId: orderData.toStationId
      });
      setResultsPanelVisible(true);
    } else {
      // 否则触发表单提交
      form.submit();
    }

    // 切换到单路径规划标签
    setActiveTab('single');
  };

  // 处理批量处理完成
  const handleBatchCompleted = (results) => {
    // 在处理批量结果前，先将路由数据置为null，确保清除旧路径
    setRouteData(null);

    if (results && results.length > 0) {
      // 为结果添加更详细的信息，确保每个订单有正确的起终点名称
      const enhancedResults = results.map(result => {
        // 查找起终点站名
        const fromStation = stations.find(s => s.id === parseInt(result.fromStationId));
        const toStation = stations.find(s => s.id === parseInt(result.toStationId));

        return {
          ...result,
          fromStationName: result.fromStationName || fromStation?.name || `站点${result.fromStationId}`,
          toStationName: result.toStationName || toStation?.name || `站点${result.toStationId}`,
          // 将路径点信息格式化为统一格式
          route: {
            ...result.route,
            pathPoints: result.route?.pathPoints || [],
            totalDistance: result.route?.totalDistance || 0,
            estimatedTime: result.route?.estimatedTime || 0
          }
        };
      });

      // 更新批量结果数据
      setBatchResults(enhancedResults);

      // 显示结果面板
      setResultsPanelVisible(true);

      // 切换到批量订单处理标签页
      setActiveTab('batch');

      // 如果有成功的规划结果，设置第一个成功结果为选中的路径，以便直接显示
      const firstSuccess = enhancedResults.find(r => r.status === 'completed' || r.success);
      if (firstSuccess) {
        setRouteData({
          route: firstSuccess.route,
          fromStationId: firstSuccess.fromStationId,
          toStationId: firstSuccess.toStationId,
          fromStationName: firstSuccess.fromStationName,
          toStationName: firstSuccess.toStationName,
          orderNo: firstSuccess.orderNo,
          orderId: firstSuccess.orderId || firstSuccess.id
        });
      }
    }
  };

  // 查看结果详情
  const handleViewResult = (result) => {
    if (result && result.route) {
      // 详细的路由数据设置，确保包含所有需要的字段
      setRouteData({
        route: {
          pathPoints: result.route.pathPoints,
          totalDistance: result.route.totalDistance,
          estimatedTime: result.route.estimatedTime
        },
        fromStationId: result.fromStationId,
        toStationId: result.toStationId,
        fromStationName: result.fromStationName || stations.find(s => s.id === parseInt(result.fromStationId))?.name,
        toStationName: result.toStationName || stations.find(s => s.id === parseInt(result.toStationId))?.name,
        orderNo: result.orderNo,
        orderId: result.orderId || result.id,
        customerName: result.customerName
      });
      setResultsPanelVisible(true);
      setActiveTab('batch');
    }
  };

  // 渲染单一路径规划表单
  const renderSinglePathForm = () => {
    return (
      <Card title="单路径规划" className={styles.formCard}>
        <Form
          form={form}
          onFinish={handleFormSubmit}
          layout="vertical"
        >
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                name="fromStationId"
                label="起点站点"
                rules={[{ required: true, message: '请选择起点站点' }]}
              >
                <Select
                  placeholder="选择起点站点"
                  showSearch
                  optionFilterProp="children"
                  loading={stationLoading}
                >
                  {stations.map(station => (
                    <Option key={station.id} value={station.id}>{station.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item
                name="toStationId"
                label="终点站点"
                rules={[{ required: true, message: '请选择终点站点' }]}
              >
                <Select
                  placeholder="选择终点站点"
                  showSearch
                  optionFilterProp="children"
                  loading={stationLoading}
                >
                  {stations.map(station => (
                    <Option key={station.id} value={station.id}>{station.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item label="高级选项">
                <Switch
                  checked={advancedMode}
                  onChange={setAdvancedMode}
                  checkedChildren="已启用"
                  unCheckedChildren="已禁用"
                />
              </Form.Item>
            </Col>
          </Row>

          {advancedMode && (
            <Card size="small" title="高级参数" className={styles.advancedParams}>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="距离权重">
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={planningParams.distanceWeight}
                      onChange={(value) => {
                        // 保持总和为1
                        const remaining = 1 - value;
                        const ratio = planningParams.timeWeight / (planningParams.timeWeight + planningParams.costWeight);

                        setPlanningParams({
                          ...planningParams,
                          distanceWeight: value,
                          timeWeight: remaining * ratio,
                          costWeight: remaining * (1 - ratio)
                        });
                      }}
                    />
                    <div className={styles.weightValue}>{planningParams.distanceWeight.toFixed(1)}</div>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="时间权重">
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={planningParams.timeWeight}
                      onChange={(value) => {
                        // 保持总和为1
                        const distWeight = planningParams.distanceWeight;
                        const remaining = 1 - distWeight;
                        const costWeight = remaining - value;

                        if (costWeight >= 0) {
                          setPlanningParams({
                            ...planningParams,
                            timeWeight: value,
                            costWeight: costWeight
                          });
                        }
                      }}
                    />
                    <div className={styles.weightValue}>{planningParams.timeWeight.toFixed(1)}</div>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="成本权重">
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={planningParams.costWeight}
                      onChange={(value) => {
                        // 保持总和为1
                        const distWeight = planningParams.distanceWeight;
                        const remaining = 1 - distWeight;
                        const timeWeight = remaining - value;

                        if (timeWeight >= 0) {
                          setPlanningParams({
                            ...planningParams,
                            costWeight: value,
                            timeWeight: timeWeight
                          });
                        }
                      }}
                    />
                    <div className={styles.weightValue}>{planningParams.costWeight.toFixed(1)}</div>
                  </Form.Item>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="交通因子">
                    <Select
                      value={planningParams.trafficFactor}
                      onChange={(value) => setPlanningParams({...planningParams, trafficFactor: value})}
                    >
                      <Option value={0.8}>畅通 (0.8)</Option>
                      <Option value={1.0}>正常 (1.0)</Option>
                      <Option value={1.2}>轻度拥堵 (1.2)</Option>
                      <Option value={1.5}>中度拥堵 (1.5)</Option>
                      <Option value={2.0}>严重拥堵 (2.0)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="区域间中转">
                    <Radio.Group
                      value={planningParams.enforceTransfer}
                      onChange={(e) => setPlanningParams({...planningParams, enforceTransfer: e.target.value})}
                    >
                      <Radio value={true}>启用</Radio>
                      <Radio value={false}>禁用</Radio>
                    </Radio.Group>
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          )}

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              规划路径
            </Button>
          </Form.Item>
        </Form>
      </Card>
    );
  };

  // 渲染路径规划结果
  const renderRouteResult = () => {
    // 检查是否有路径数据
    if (!routeData || !routeData.route || !routeData.route.pathPoints || routeData.route.pathPoints.length < 2) {
      if (!resultsPanelVisible) {
        return null; // 当结果面板不可见时不显示空状态
      }
      return (
        <Card className={styles.resultCard} title="路径查询结果">
          <Empty
            description={
              !routeData ? "请开始路径查询" : "找不到有效的路径数据"
            }
          />
        </Card>
      );
    }

    // 获取路径数据
    const { route, statusMessage, isDefault, error } = routeData;
    const { pathPoints, totalDistance, estimatedTime } = route;

    // 获取起终点信息
    const startPoint = pathPoints[0];
    const endPoint = pathPoints[pathPoints.length - 1];

    return (
      <Card
        className={styles.resultCard}
        title={
          <span>
            路径规划结果
            {statusMessage && (
              <Tooltip title={statusMessage}>
                <InfoCircleOutlined style={{ marginLeft: 8, color: error ? '#ff4d4f' : isDefault ? '#faad14' : '#52c41a' }} />
              </Tooltip>
            )}
          </span>
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card
              title="路径详情"
              size="small"
              bordered={false}
              className={styles.routeDetailsCard}
            >
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="起点站">
                  {startPoint ? startPoint.stationName : '未知'}
                </Descriptions.Item>
                <Descriptions.Item label="终点站">
                  {endPoint ? endPoint.stationName : '未知'}
                </Descriptions.Item>
                <Descriptions.Item label="途经站点">
                  {pathPoints.length - 2 > 0 ? pathPoints.length - 2 : 0} 个站点
                </Descriptions.Item>
                <Descriptions.Item label="总距离">
                  {parseFloat(totalDistance || 0).toFixed(2)} 公里
                </Descriptions.Item>
                <Descriptions.Item label="路线策略">
                  {drivingPolicy === 'LEAST_TIME' && '最快路线'}
                  {drivingPolicy === 'LEAST_DISTANCE' && '最短路线'}
                  {drivingPolicy === 'LEAST_FEE' && '经济路线'}
                  {drivingPolicy === 'REAL_TRAFFIC' && '考虑路况'}
                </Descriptions.Item>
                <Descriptions.Item label="显示路线指引">
                  <Switch
                    checked={showRouteGuide}
                    onChange={(checked) => {
                      setShowRouteGuide(checked);
                      // 设置全局配置
                      MapConfig.rendering.showRouteGuide = checked;
                      // 如果已有路线数据，强制重绘路线应用新的指引设置
                      if (routeData && routeData.route && routeData.route.pathPoints) {
                        // 使用setTimeout确保MapConfig配置已更新
                        setTimeout(() => {
                          // 获取全局地图实例
                          const mapInst = window.currentMapInstance;
                          // 触发路线重绘
                          const pathPoints = routeData.route.pathPoints;
                          if (mapInst) {
                            clearAllRouteElements(mapInst);
                            drawRealisticRoute(mapInst, pathPoints);
                          }
                        }, 50);
                      }
                    }}
                    disabled={!routeData}
                  />
                </Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
          <Col xs={24} md={16}>
            <div className={styles.mapContainer}>
              <RouteMap
                routeData={routeData}
                showTraffic={showTraffic}
                drivingPolicy={drivingPolicy}
                showRouteGuide={showRouteGuide}
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  // Add a new function to render batch results
  const renderBatchRouteResults = () => {
    if (!batchResults || batchResults.length === 0) {
      return (
        <Card className={styles.resultCard} title="批量路径规划结果">
          <Empty description="尚无批量规划结果" />
        </Card>
      );
    }

    // Find selected order or use the first one
    const selectedOrder = selectedBatchOrderId
      ? batchResults.find(order => `${order.fromStationId}-${order.toStationId}` === selectedBatchOrderId)
      : batchResults[0];

    // Set default selection if none is selected
    if (!selectedBatchOrderId && batchResults.length > 0) {
      const firstOrder = batchResults[0];
      setSelectedBatchOrderId(`${firstOrder.fromStationId}-${firstOrder.toStationId}`);
    }
    
    // 准备传递给地图组件的路由数据
    let mapRouteData = null;
    if (selectedOrder && selectedOrder.route && selectedOrder.route.pathPoints && selectedOrder.route.pathPoints.length >= 2) {
      mapRouteData = {
        route: {
          pathPoints: selectedOrder.route.pathPoints,
          totalDistance: selectedOrder.route.totalDistance || 0,
          estimatedTime: selectedOrder.route.estimatedTime || 0
        },
        fromStationId: selectedOrder.fromStationId,
        toStationId: selectedOrder.toStationId,
        fromStationName: selectedOrder.fromStationName,
        toStationName: selectedOrder.toStationName
      };
    }

    return (
      <Card
        className={styles.resultCard}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>批量路径规划结果</span>
            <div style={{ width: '500px' }}>
              <Select
                placeholder="选择订单查看路径"
                style={{ width: '100%' }}
                value={selectedBatchOrderId}
                onChange={(value) => {
                  // 先清除地图上的现有路线
                  if (window.currentMapInstance) {
                    clearAllRouteElements(window.currentMapInstance);
                  }
                  
                  // 更新选中的订单ID
                  setSelectedBatchOrderId(value);
                  
                  // 选择新订单后，确保地图刷新
                  const newSelectedOrder = batchResults.find(order => `${order.fromStationId}-${order.toStationId}` === value);
                  if (newSelectedOrder && newSelectedOrder.route && newSelectedOrder.route.pathPoints) {
                    // 在下一个事件循环中执行，确保UI已更新
                    setTimeout(() => {
                      const mapInst = window.currentMapInstance;
                      if (mapInst) {
                        // 重新绘制新路线
                        drawRealisticRoute(mapInst, newSelectedOrder.route.pathPoints);
                      }
                    }, 50);
                  }
                }}
                optionLabelProp="label"
                dropdownMatchSelectWidth={false}
                dropdownStyle={{ minWidth: '400px' }}
              >
                {batchResults.map(order => (
                  <Option
                    key={`${order.fromStationId}-${order.toStationId}`}
                    value={`${order.fromStationId}-${order.toStationId}`}
                    label={`${order.orderNo || '未知订单'}: ${order.fromStationName} → ${order.toStationName}`}
                  >
                    <div style={{ padding: '4px 0' }}>
                      <div><strong>{order.orderNo || '未知订单'}</strong></div>
                      <div>{order.fromStationName} → {order.toStationName}</div>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        }
      >
        <Row gutter={16}>
          <Col xs={24} md={8}>
            <Card
              title="路径详情"
              size="small"
              bordered={false}
              className={styles.routeDetailsCard}
              extra={selectedOrder && selectedOrder.orderNo && (
                <Tag color="blue">订单号: {selectedOrder.orderNo}</Tag>
              )}
            >
              {selectedOrder ? (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label="起点站">
                    {selectedOrder.fromStationName || '未知'}
                  </Descriptions.Item>
                  <Descriptions.Item label="终点站">
                    {selectedOrder.toStationName || '未知'}
                  </Descriptions.Item>
                  <Descriptions.Item label="途经站点">
                    {selectedOrder.route?.pathPoints
                      ? selectedOrder.route.pathPoints.length - 2 > 0
                        ? selectedOrder.route.pathPoints.length - 2
                        : 0
                      : 0} 个站点
                  </Descriptions.Item>
                  <Descriptions.Item label="总距离">
                    {selectedOrder.route?.totalDistance
                      ? parseFloat(selectedOrder.route.totalDistance).toFixed(2)
                      : 0} 公里
                  </Descriptions.Item>
                  <Descriptions.Item label="路线策略">
                    {drivingPolicy === 'LEAST_TIME' && '最快路线'}
                    {drivingPolicy === 'LEAST_DISTANCE' && '最短路线'}
                    {drivingPolicy === 'LEAST_FEE' && '经济路线'}
                    {drivingPolicy === 'REAL_TRAFFIC' && '考虑路况'}
                  </Descriptions.Item>
                  <Descriptions.Item label="显示路线指引">
                    <Switch
                      checked={showRouteGuide}
                      onChange={(checked) => {
                        setShowRouteGuide(checked);
                        // 设置全局配置
                        MapConfig.rendering.showRouteGuide = checked;
                        // 如果已有选中的订单数据，强制重绘路线应用新的指引设置
                        if (selectedOrder && selectedOrder.route && selectedOrder.route.pathPoints) {
                          // 使用setTimeout确保MapConfig配置已更新
                          setTimeout(() => {
                            // 获取全局地图实例
                            const mapInst = window.currentMapInstance;
                            // 触发路线重绘
                            const pathPoints = selectedOrder.route.pathPoints;
                            if (mapInst) {
                              clearAllRouteElements(mapInst);
                              drawRealisticRoute(mapInst, pathPoints);
                            }
                          }, 50);
                        }
                      }}
                      disabled={!selectedOrder || !selectedOrder.route?.pathPoints}
                    />
                  </Descriptions.Item>
                </Descriptions>
              ) : (
                <Empty description="请选择订单查看详情" />
              )}
            </Card>
          </Col>
          <Col xs={24} md={16}>
            <div className={styles.mapContainer}>
              <RouteMap
                key={`batch-map-${selectedBatchOrderId}`}
                routeData={mapRouteData}
                showTraffic={showTraffic}
                drivingPolicy={drivingPolicy}
                showRouteGuide={showRouteGuide}
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className={styles.container}>
      <Tabs activeKey={activeTab} onChange={(key) => {
        // Clear route data when switching tabs to prevent rendering errors
        if (key !== activeTab) {
          clearAllRouteElements(); // Clear any existing route elements on map
          if (activeTab === 'batch' && key === 'single' && routeData) {
            // When switching from batch to single, make sure we reset the route data
            // to prevent invalid coordinates errors
            setRouteData(null);
            setResultsPanelVisible(false);
          }
        }
        setActiveTab(key);
      }}>
        <TabPane tab="单路径规划" key="single">
          {renderSinglePathForm()}
          {resultsPanelVisible && activeTab === 'single' && renderRouteResult()}
        </TabPane>
        <TabPane tab="批量订单处理" key="batch">
          <BatchOrderProcessor
            onSelectOrder={handleSelectOrder}
            onBatchCompleted={handleBatchCompleted}
          />
          {batchResults && batchResults.length > 0 && (
            <>
              <div style={{ marginTop: '16px' }}>
                <Tabs defaultActiveKey="map" className={styles.resultsTabs}>
                  <TabPane tab="路径可视化" key="map">
                    {renderBatchRouteResults()}
                  </TabPane>
                  <TabPane tab="结果管理" key="management">
                    <PlanningHistory
                      currentResults={batchResults}
                      onViewResult={handleViewResult}
                    />
                  </TabPane>
                </Tabs>
              </div>
            </>
          )}
        </TabPane>
      </Tabs>
    </div>
  );
};

export default PathPlanning;
