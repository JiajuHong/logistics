import { PlusOutlined, TableOutlined, AppstoreOutlined, EnvironmentOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  PageContainer,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Radio, Space } from 'antd';
import React, { useRef, useState, useEffect } from 'react';
import {
  addStation,
  deleteStation,
  listRegion,
  listStationByPage,
  updateStation
} from '@/services/api';
import CreateModal from './components/CreateModal';
import UpdateModal from './components/UpdateModal';
import CardView from './components/CardView';
import MapView from './components/MapView';
import CustomPagination from '@/components/CustomPagination';

// 视图类型枚举
type ViewType = 'table' | 'card' | 'map';

/**
 * 站点管理页面
 */
const StationAdmin: React.FC = () => {
  // 引用表格实例
  const actionRef = useRef<ActionType>();
  // 新建窗口的弹窗
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  // 更新窗口的弹窗
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  // 当前站点数据
  const [currentRow, setCurrentRow] = useState<API.StationVO>();
  // 当前视图类型
  const [viewType, setViewType] = useState<ViewType>('table');
  // 站点数据列表
  const [stationList, setStationList] = useState<API.StationVO[]>([]);
  // 加载状态
  const [loading, setLoading] = useState<boolean>(false);
  // 总记录数
  const [total, setTotal] = useState<number>(0);
  // 表格视图分页状态
  const [tableCurrent, setTableCurrent] = useState<number>(1);
  const [tablePageSize, setTablePageSize] = useState<number>(8);
  const [tableTotal, setTableTotal] = useState<number>(0);
  // 卡片视图分页状态
  const [cardCurrent, setCardCurrent] = useState<number>(1);
  const [cardPageSize, setCardPageSize] = useState<number>(8);

  // 组件加载时的调试日志
  useEffect(() => {
    console.log('站点管理页面初始化');
    // 表格视图的数据会通过ProTable自动加载
    // 只有在卡片视图或地图视图时才需要手动加载数据
    if (viewType !== 'table') {
      loadStationData();
    } else {
      // 确保表格视图首次加载时使用正确的分页参数
      // 让ProTable自行加载数据，但不调用reload以避免重复请求
      actionRef.current?.setPageInfo?.({
        current: tableCurrent,
        pageSize: tablePageSize,
      });
    }
    return () => {
      console.log('站点管理页面卸载');
    };
  }, [viewType]); // 添加viewType作为依赖，确保视图类型变化时重新初始化

  /**
   * 添加站点
   * @param fields
   */
  const handleAdd = async (fields: API.StationAddRequest) => {
    const hide = message.loading('正在添加');
    try {
      await addStation({ ...fields });
      hide();
      message.success('创建成功');
      // 创建成功后关闭表单
      setCreateModalVisible(false);
      // 刷新表格
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error('创建失败，' + error.message);
      return false;
    }
  };

  /**
   * 更新站点
   * @param fields
   */
  const handleUpdate = async (fields: API.StationUpdateRequest) => {
    if (!currentRow) {
      return false;
    }
    const hide = message.loading('正在更新');
    try {
      await updateStation({
        id: currentRow.id,
        ...fields,
      });
      hide();
      message.success('更新成功');
      // 更新成功后关闭表单
      setUpdateModalVisible(false);
      // 刷新表格
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error('更新失败，' + error.message);
      return false;
    }
  };

  /**
   * 删除站点
   * @param record
   */
  const handleDelete = async (record: API.StationVO) => {
    const hide = message.loading('正在删除');
    if (!record) return true;
    try {
      await deleteStation({
        id: record.id,
      });
      hide();
      message.success('删除成功');
      // 刷新表格
      actionRef.current?.reload();
      return true;
    } catch (error: any) {
      hide();
      message.error('删除失败，' + error.message);
      return false;
    }
  };

  /**
   * 获取区域列表（用于下拉选择）
   */
  const fetchRegionOptions = async () => {
    try {
      const result = await listRegion({});
      if (result.data) {
        return result.data.map((item) => ({
          label: item.name,
          value: item.id,
        }));
      }
      return [];
    } catch (error) {
      console.error('获取区域列表失败', error);
      return [];
    }
  };

  /**
   * 表格列配置
   */
  const columns: ProColumns<API.StationVO>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'text',
      width: 80,
    },
    {
      title: '站点名称',
      dataIndex: 'name',
      valueType: 'text',
    },
    {
      title: '站点编码',
      dataIndex: 'code',
      valueType: 'text',
    },
    {
      title: '所属区域',
      dataIndex: 'regionId',
      valueType: 'select',
      request: fetchRegionOptions,
      render: (_, record) => record.regionName || '-',
    },
    {
      title: '详细地址',
      dataIndex: 'address',
      valueType: 'text',
      search: false,
    },
    {
      title: '联系人',
      dataIndex: 'contactName',
      valueType: 'text',
    },
    {
      title: '联系电话',
      dataIndex: 'contactPhone',
      valueType: 'text',
    },
    {
      title: '状态',
      dataIndex: 'status',
      valueType: 'select',
      valueEnum: {
        0: { text: '禁用', status: 'Error' },
        1: { text: '启用', status: 'Success' },
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      hideInForm: true,
      search: false,
    },
    {
      title: '更新时间',
      dataIndex: 'updateTime',
      valueType: 'dateTime',
      hideInForm: true,
      search: false,
    },
    {
      title: '操作',
      dataIndex: 'option',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="update"
          onClick={() => {
            setUpdateModalVisible(true);
            setCurrentRow(record);
          }}
        >
          编辑
        </a>,
        <Popconfirm
          key="delete"
          title="您确定要删除这个站点吗？"
          onConfirm={() => handleDelete(record)}
          okText="确定"
          cancelText="取消"
        >
          <a style={{ color: 'red' }}>删除</a>
        </Popconfirm>,
      ],
    },
  ];

  /**
   * 加载站点数据
   */
  const loadStationData = async (params?: any) => {
    setLoading(true);
    console.log('开始加载站点数据，参数:', params);
    try {
      // 确保参数格式正确，后端API可能对current和pageSize有严格要求
      const requestParams = {
        // 为卡片视图提供默认分页参数
        current: cardCurrent,
        pageSize: cardPageSize,
        // 合并其他查询参数
        ...params,
      };
      console.log('格式化后的请求参数:', requestParams);

      const res = await listStationByPage(requestParams);
      console.log('站点数据加载结果:', res);
      if (res?.data) {
        console.log('成功获取站点记录数:', res.data.records?.length || 0);
        setStationList(res.data.records || []);
        setTotal(res.data.total || 0);
        
        // 如果没有明确传入page参数，则使用返回的current
        if (!params || !params.current) {
          setCardCurrent(res.data.current || cardCurrent);
        }
      } else {
        console.warn('获取站点数据失败，响应没有data字段:', res);
        message.error('加载站点数据失败');
      }
    } catch (error) {
      console.error('加载站点数据出错:', error);
      message.error('加载站点数据时发生错误');
    } finally {
      setLoading(false);
    }
  };

  // 视图切换时加载数据
  React.useEffect(() => {
    console.log('视图类型改变:', viewType);
    if (viewType === 'card' || viewType === 'map') {
      // 清空现有数据，避免显示旧数据
      setStationList([]);
      // 切换到卡片视图时，重置分页状态
      if (viewType === 'card') {
        setCardCurrent(1);
      }
      // 延迟10毫秒触发加载，确保UI状态先更新
      setTimeout(() => {
        loadStationData();
      }, 10);
    } else if (viewType === 'table') {
      // 切换回表格视图时，恢复表格的分页状态
      setTimeout(() => {
        actionRef.current?.setPageInfo?.({
          current: tableCurrent,
          pageSize: tablePageSize,
        });
      }, 10);
    }
  }, [viewType]);

  // 处理编辑站点
  const handleEditStation = (record: API.StationVO) => {
    setCurrentRow(record);
    setUpdateModalVisible(true);
  };

  return (
    <PageContainer>
      <div style={{ marginBottom: 16 }}>
        <Space size="large">
          <Radio.Group
            value={viewType}
            onChange={(e) => setViewType(e.target.value)}
            buttonStyle="solid"
          >
            <Radio.Button value="table">
              <TableOutlined /> 表格视图
            </Radio.Button>
            <Radio.Button value="card">
              <AppstoreOutlined /> 卡片视图
            </Radio.Button>
            <Radio.Button value="map">
              <EnvironmentOutlined /> 地图视图
            </Radio.Button>
          </Radio.Group>

          <Button
            type="primary"
            onClick={() => {
              setCreateModalVisible(true);
            }}
          >
            <PlusOutlined /> 新建站点
          </Button>
        </Space>
      </div>

      {/* 表格视图 */}
      {viewType === 'table' && (
        <ProTable<API.StationVO>
          headerTitle={<>站点管理</>}
          actionRef={actionRef}
          rowKey="id"
          search={{
            labelWidth: 120,
          }}
          pagination={false}
          params={{ 
            pageSize: tablePageSize, 
            current: tableCurrent 
          }}
          tableRender={(_, dom) => {
            // 在表格视图下才显示自定义分页器
            if (viewType === 'table') {
              return (
                <div>
                  {dom}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <CustomPagination
                      current={tableCurrent}
                      total={tableTotal}
                      pageSize={tablePageSize}
                      onChange={(page, pageSize) => {
                        console.log('分页切换:', { page, pageSize: pageSize || tablePageSize });
                        setTableCurrent(page);
                        if (pageSize) setTablePageSize(pageSize);
                        actionRef.current?.setPageInfo?.({
                          current: page,
                          pageSize: pageSize || tablePageSize,
                        });
                      }}
                      onShowSizeChange={(current, size) => {
                        console.log('每页条数变化:', { current, size });
                        setTableCurrent(current);
                        setTablePageSize(size);
                        actionRef.current?.setPageInfo?.({
                          current: current,
                          pageSize: size,
                        });
                      }}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(t) => `共 ${t} 条记录，共 ${Math.ceil(t / tablePageSize)} 页`}
                    />
                  </div>
                </div>
              );
            }
            return dom;
          }}
          toolBarRender={() => [
            // 表格视图的工具栏渲染逻辑
          ]}
          request={async (params) => {
            console.log('ProTable请求参数:', params);
            // 确保使用正确的pageSize
            const pageSize = params.pageSize || tablePageSize;
            const current = params.current || tableCurrent;
            
            const res = await listStationByPage({
              ...params,
              pageSize: pageSize,
              current: current,
            });
            console.log('ProTable请求结果:', res);
            if (res?.data) {
              // 更新表格分页状态
              setTableCurrent(current);
              setTablePageSize(pageSize);
              setTableTotal(res.data.total || 0);
              
              return {
                data: res?.data.records || [],
                success: true,
                total: res?.data.total || 0,
              };
            } else {
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
        <CardView
          loading={loading}
          dataSource={stationList}
          onEdit={handleEditStation}
          onDelete={handleDelete}
          pagination={{
            current: cardCurrent,
            pageSize: cardPageSize,
            total: total,
            onChange: (page, pageSize) => {
              // 更新分页信息
              setCardCurrent(page);
              if (pageSize) setCardPageSize(pageSize);
              loadStationData({
                current: page,
                pageSize: pageSize || cardPageSize,
              });
            },
            onShowSizeChange: (current, size) => {
              // 更新每页显示数量
              setCardCurrent(current);
              setCardPageSize(size);
              loadStationData({
                current: current,
                pageSize: size,
              });
            }
          }}
        />
      )}

      {/* 添加一个单独的调试组件 */}
      {viewType === 'card' && (
        <div style={{ display: 'none' }}>
          {(() => {
            console.log('渲染卡片视图:', {
              loading,
              stationListLength: stationList?.length,
              stationList
            });
            return null;
          })()}
        </div>
      )}

      {/* 地图视图 */}
      {viewType === 'map' && (
        <MapView
          loading={loading}
          dataSource={stationList}
          onMarkerClick={handleEditStation}
        />
      )}

      <CreateModal
        columns={columns}
        onCancel={() => {
          setCreateModalVisible(false);
        }}
        onSubmit={async (values) => {
          const result = await handleAdd(values);
          if (result && (viewType === 'card' || viewType === 'map')) {
            // 创建成功后重新加载数据
            loadStationData();
          }
          return result;
        }}
        visible={createModalVisible}
      />
      <UpdateModal
        columns={columns}
        onCancel={() => {
          setUpdateModalVisible(false);
        }}
        onSubmit={async (values) => {
          const result = await handleUpdate(values);
          if (result && (viewType === 'card' || viewType === 'map')) {
            // 更新成功后重新加载数据
            loadStationData();
          }
          return result;
        }}
        visible={updateModalVisible}
        oldData={currentRow || {}}
      />
    </PageContainer>
  );
};

export default StationAdmin;
