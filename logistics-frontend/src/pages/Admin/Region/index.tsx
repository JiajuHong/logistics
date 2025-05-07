import { DownOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  PageContainer,
  ProTable,
} from '@ant-design/pro-components';
import { Button, message, Popconfirm, Radio, Space, Switch, Tooltip, Spin, Card } from 'antd';
import React, { useRef, useState, useEffect, lazy, Suspense } from 'react';
import {
  addRegion,
  deleteRegion,
  listRegion,
  updateRegion
} from '@/services/api';
import CreateModal from './components/CreateModal';
import UpdateModal from './components/UpdateModal';
import CustomPagination from '@/components/CustomPagination';
const RegionMap = lazy(() => import('./components/RegionMap'));

// 视图类型枚举
type ViewType = 'table' | 'tree' | 'map';

// 扩展RegionVO类型，添加children属性和其他必要属性
declare namespace API {
  interface RegionVO {
    id: number;
    name?: string;
    code?: string;
    parentId?: number;
    parentName?: string;
    level?: number;
    status?: number;
    createTime?: string;
    updateTime?: string;
    children?: RegionVO[];
  }

  interface RegionAddRequest {
    [key: string]: any;
  }

  interface RegionUpdateRequest {
    [key: string]: any;
  }
}

/**
 * 构建树形结构
 */
const buildTree = (flatData: API.RegionVO[]): API.RegionVO[] => {
  const map = new Map();
  const treeData: API.RegionVO[] = [];

  // 先把所有节点放入map
  flatData.forEach(item => {
    map.set(item.id, { ...item, children: [] as API.RegionVO[] });
  });

  // 组织树形结构
  flatData.forEach(item => {
    const node = map.get(item.id);
    if (item.parentId === null || item.parentId === 0) {
      // 根节点
      treeData.push(node);
    } else {
      // 子节点，添加到父节点的children
      const parent = map.get(item.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        // 如果找不到父节点，就放到根节点
        treeData.push(node);
      }
    }
  });

  return treeData;
};

/**
 * 获取所有节点ID
 */
const getAllIds = (treeData: API.RegionVO[]): number[] => {
  const ids: number[] = [];

  const traverse = (nodes: API.RegionVO[]) => {
    if (!nodes) return;

    nodes.forEach(node => {
      if (node.id) {
        ids.push(node.id);
      }
      if ((node as any).children && (node as any).children.length > 0) {
        traverse((node as any).children);
      }
    });
  };

  traverse(treeData);
  return ids;
};

// 添加错误边界处理
class ErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, info: any) {
    console.error("地图组件加载失败:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * 区域管理页面
 */
const RegionAdmin: React.FC = () => {
  // 引用表格实例
  const actionRef = useRef<ActionType>();
  // 新建窗口的弹窗
  const [createModalVisible, setCreateModalVisible] = useState<boolean>(false);
  // 更新窗口的弹窗
  const [updateModalVisible, setUpdateModalVisible] = useState<boolean>(false);
  // 当前区域数据
  const [currentRow, setCurrentRow] = useState<API.RegionVO>();
  // 视图类型: table-表格视图, tree-树形视图, map-地图视图
  const [viewType, setViewType] = useState<ViewType>('tree');
  // 是否默认展开所有
  const [expandAll, setExpandAll] = useState<boolean>(true);
  // 树形数据
  const [treeData, setTreeData] = useState<API.RegionVO[]>([]);
  // 展开的行键
  const [expandedRowKeys, setExpandedRowKeys] = useState<number[]>([]);
  // 添加一个辅助状态来反映当前是否全部展开
  // 是否实际上全部展开（用于UI显示，不控制逻辑）
  const [isActuallyAllExpanded, setIsActuallyAllExpanded] = useState<boolean>(true);
  // 平铺的所有区域数据（用于地图视图）
  const [allRegions, setAllRegions] = useState<API.RegionVO[]>([]);
  // 地图数据加载状态
  const [mapLoading, setMapLoading] = useState<boolean>(false);
  // 分页相关状态
  const [current, setCurrent] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // 修改useEffect，增加对expandedRowKeys的监听
  useEffect(() => {
    if (expandAll) {
      setExpandedRowKeys(getAllIds(treeData));
    } else {
      setExpandedRowKeys([]);
    }
  }, [expandAll, treeData]);

  // 添加对expandedRowKeys的监听，更新实际展开状态
  useEffect(() => {
    // 只在树形视图下处理
    if (viewType !== 'tree') return;

    const allIds = getAllIds(treeData);
    // 判断当前是否全部展开
    const allExpanded = allIds.length > 0 && expandedRowKeys.length === allIds.length;
    setIsActuallyAllExpanded(allExpanded);
  }, [expandedRowKeys, treeData, viewType]);

  /**
   * 添加区域
   * @param fields
   */
  const handleAdd = async (fields: API.RegionAddRequest) => {
    const hide = message.loading('正在添加');
    try {
      await addRegion({ ...fields });
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
   * 更新区域
   * @param fields
   */
  const handleUpdate = async (fields: API.RegionUpdateRequest) => {
    if (!currentRow) {
      return false;
    }
    const hide = message.loading('正在更新');
    try {
      await updateRegion({
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
   * 删除区域
   * @param record
   */
  const handleDelete = async (record: API.RegionVO) => {
    const hide = message.loading('正在删除');
    if (!record) return true;
    try {
      await deleteRegion({
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
   * 表格列配置
   */
  const columns: ProColumns<API.RegionVO>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      valueType: 'text',
      width: 80,
    },
    {
      title: '区域名称',
      dataIndex: 'name',
      valueType: 'text',
      render: (dom, entity) => {
        return (
          <span>
            {entity.level === 0 && entity.name === '中国' ? '🇨🇳 ' :
             entity.level === 0 ? '🌏 ' :
             entity.level === 1 ? '🏙️ ' :
             entity.level === 2 ? '🏢 ' : '🏠 '}
            {dom}
          </span>
        );
      },
    },
    {
      title: '区域编码',
      dataIndex: 'code',
      valueType: 'text',
    },
    {
      title: '父级区域',
      dataIndex: 'parentId',
      valueType: 'text',
      hideInForm: true,
      search: false,
      renderText: (val: number, record) => {
        return record.parentName || '-';
      },
    },
    {
      title: '层级',
      dataIndex: 'level',
      valueType: 'select',
      valueEnum: {
        0: { text: '国家', status: 'Default' },
        1: { text: '省/直辖市', status: 'Processing' },
        2: { text: '市', status: 'Success' },
        3: { text: '区/县', status: 'Warning' },
      },
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
          title="您确定要删除这个区域吗？"
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
   * 加载所有区域数据
   */
  const loadAllRegions = async () => {
    setMapLoading(true);
    try {
      const res = await listRegion({});
      if (res?.data) {
        setAllRegions(res.data as any);
      }
    } catch (error) {
      message.error('加载区域数据失败');
    } finally {
      setMapLoading(false);
    }
  };

  /**
   * 地图区域点击处理
   */
  const handleMapRegionSelect = (region: API.RegionVO) => {
    setCurrentRow(region);
  };

  // 视图切换时的处理
  useEffect(() => {
    if (viewType === 'map') {
      loadAllRegions();
    }
  }, [viewType]);

  // 渲染视图内容
  const renderViewContent = () => {
    switch (viewType) {
      case 'map':
        return (
          <ErrorBoundary
            fallback={
              <Card title="区域地图视图" style={{ height: 'calc(100vh - 260px)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <div style={{ marginBottom: 16 }}>地图加载失败</div>
                  <Button type="primary" onClick={() => loadAllRegions()}>
                    重试
                  </Button>
                </div>
              </Card>
            }
          >
            <Suspense fallback={<Spin tip="加载地图组件中..." style={{ display: 'flex', justifyContent: 'center', padding: '50px' }} />}>
              <RegionMap
                regions={allRegions}
                loading={mapLoading}
                onSelectRegion={handleMapRegionSelect as any}
              />
            </Suspense>
          </ErrorBoundary>
        );
      case 'table':
      case 'tree':
      default:
        return (
          <ProTable<API.RegionVO>
            headerTitle={
              <Space>
                区域管理
                {viewType === 'tree' && (
                  <Tooltip title="展开或折叠所有节点">
                    <Switch
                      checkedChildren={isActuallyAllExpanded ? "已全部展开" : "全部展开"}
                      unCheckedChildren="全部折叠"
                      checked={expandAll}
                      onChange={(checked) => {
                        setExpandAll(checked);
                        // 确保状态更新后立即应用展开/折叠效果
                        if (checked) {
                          setExpandedRowKeys(getAllIds(treeData));
                        } else {
                          setExpandedRowKeys([]);
                        }
                      }}
                    />
                  </Tooltip>
                )}
              </Space>
            }
            actionRef={actionRef}
            rowKey="id"
            search={viewType === 'tree' ? false : {
              labelWidth: 120,
            }}
            pagination={viewType === 'tree' ? false : false}
            tableRender={(_, dom) => {
              // 在树形视图下不显示分页器
              if (viewType === 'tree') {
                return dom;
              }
              return (
                <div>
                  {dom}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                    <CustomPagination
                      current={current}
                      total={totalRecords}
                      pageSize={pageSize}
                      onChange={(page, size) => {
                        setCurrent(page);
                        if (size) setPageSize(size);
                        actionRef.current?.setPageInfo?.({
                          current: page,
                          pageSize: size || pageSize,
                        });
                      }}
                      onShowSizeChange={(current, size) => {
                        setCurrent(current);
                        setPageSize(size);
                        actionRef.current?.setPageInfo?.({
                          current: current,
                          pageSize: size,
                        });
                      }}
                      showSizeChanger
                      showQuickJumper
                      showTotal={(t) => `共 ${t} 条记录，共 ${Math.ceil(t / pageSize)} 页`}
                    />
                  </div>
                </div>
              );
            }}
            tableAlertRender={false}
            toolBarRender={() => [
              <Button
                type="primary"
                key="primary"
                onClick={() => {
                  setCreateModalVisible(true);
                }}
              >
                <PlusOutlined /> 新建区域
              </Button>,
            ]}
            request={(async (params: any) => {
              if (viewType === 'tree') {
                // 树形结构 - 获取所有数据
                const res = await listRegion({});
                if (res?.data) {
                  // 转换为树形结构
                  const newTreeData = buildTree(res.data as any);
                  setTreeData(newTreeData);
                  // 如果是展开全部状态，则设置所有行展开
                  if (expandAll) {
                    setExpandedRowKeys(getAllIds(newTreeData));
                  }
                  return {
                    data: newTreeData,
                    success: true,
                  };
                } else {
                  setTreeData([]);
                  setExpandedRowKeys([]);
                  return {
                    data: [],
                    success: false,
                  };
                }
              } else {
                // 表格结构 - 分页获取
                setExpandedRowKeys([]);
                const res = await listRegion({
                  ...params
                } as any);
                if (res?.data) {
                  return {
                    data: res.data,
                    success: true,
                    total: res.data.length, // Use data length as total
                  };
                } else {
                  return {
                    data: [],
                    success: false,
                    total: 0,
                  };
                }
              }
            }) as any}
            expandable={viewType === 'tree' ? {
              expandedRowKeys: expandedRowKeys,
              onExpandedRowsChange: (expandedRows) => {
                // 只更新展开的行键，不自动更改expandAll状态
                setExpandedRowKeys(expandedRows as number[]);
              },
              expandIcon: ({ expanded, onExpand, record }) => {
                if (((record as any).children?.length || 0) === 0) return null;
                return expanded ? (
                  <DownOutlined onClick={e => onExpand(record, e)} style={{ marginRight: 8 }} />
                ) : (
                  <DownOutlined onClick={e => onExpand(record, e)} style={{ transform: 'rotate(-90deg)', marginRight: 8 }} />
                );
              }
            } : undefined}
            columns={columns}
          />
        );
    }
  };

  return (
    <PageContainer
      header={{
        title: '区域管理',
        extra: [
          <Radio.Group
            key="viewSwitch"
            value={viewType}
            onChange={(e) => {
              setViewType(e.target.value);
              // 视图切换后立即重新加载数据
              setTimeout(() => {
                if (e.target.value !== 'map') {
                  actionRef.current?.reload();
                }
              }, 0);
            }}
            optionType="button"
            buttonStyle="solid"
            options={[
              { label: '树形视图', value: 'tree' },
              { label: '表格视图', value: 'table' },
              { label: '地图视图', value: 'map' },
            ]}
          />
        ],
      }}
    >
      {renderViewContent()}

      <CreateModal
        columns={columns as any}
        onCancel={() => {
          setCreateModalVisible(false);
        }}
        onSubmit={(values) => {
          return handleAdd(values);
        }}
        visible={createModalVisible}
      />
      <UpdateModal
        columns={columns as any}
        onCancel={() => {
          setUpdateModalVisible(false);
        }}
        onSubmit={(values) => {
          return handleUpdate(values);
        }}
        values={currentRow || {}}
        visible={updateModalVisible}
      />
    </PageContainer>
  );
};

export default RegionAdmin;
