declare module 'slash2';
declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
declare module 'omit.js';
declare module 'numeral';
declare module '@antv/data-set';
declare module 'mockjs';
declare module 'react-fittext';
declare module 'bizcharts-plugin-slider';

declare const REACT_APP_ENV: 'test' | 'dev' | 'pre' | false;

/**
 * 分页信息
 */
interface PageInfo<T> {
  current: number;
  size: number;
  total: number;
  records: T[];
}

/**
 * 分页请求
 */
interface PageRequest {
  current?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

/**
 * 删除请求
 */
interface DeleteRequest {
  id: number;
}

/**
 * 返回封装
 */
interface BaseResponse<T> {
  code: number;
  data: T;
  message?: string;
}

/**
 * 全局初始化状态
 */
interface InitialState {
  currentUser?: API.LoginUserVO;
}

// 地图相关类型定义
declare namespace AntVL7 {
  // 地图场景
  interface Scene {
    // 场景配置
    config: any;
    // 添加图层
    addLayer(layer: Layer): void;
    // 渲染
    render(): void;
    // 销毁
    destroy(): void;
    // 监听事件
    on(event: string, callback: Function): void;
    // 更新配置
    setConfig(config: any): void;
    // 获取容器
    getContainer(): HTMLElement;
    // 更新容器大小
    updateSize(): void;
  }

  // 地图图层基础接口
  interface Layer {
    // 图层配置
    config: any;
    // 添加到场景
    addTo(scene: Scene): void;
    // 设置数据
    setData(data: any): void;
    // 设置缩放级别
    setZoom(zoom: number): void;
    // 设置可见性
    setVisible(visible: boolean): void;
    // 设置样式
    setStyle(style: any): void;
    // 监听事件
    on(event: string, callback: Function): void;
    // 移除事件监听
    off(event: string, callback: Function): void;
  }

  // 点图层
  interface PointLayer extends Layer {
    // 点图层特有方法
    setRadius(radius: number): void;
    setOpacity(opacity: number): void;
    setFillColor(color: string | Function): void;
    setStrokeColor(color: string | Function): void;
    setStrokeWidth(width: number): void;
  }

  // 线图层
  interface LineLayer extends Layer {
    // 线图层特有方法
    setWidth(width: number | Function): void;
    setColor(color: string | Function): void;
    setOpacity(opacity: number): void;
    setSourceColor(color: string): void;
    setTargetColor(color: string): void;
  }

  // 多边形图层
  interface PolygonLayer extends Layer {
    // 多边形图层特有方法
    setFillColor(color: string | Function): void;
    setStrokeColor(color: string | Function): void;
    setStrokeWidth(width: number): void;
    setStrokeOpacity(opacity: number): void;
    setFillOpacity(opacity: number): void;
  }

  // 文本图层
  interface TextLayer extends Layer {
    // 文本图层特有方法
    setTextField(field: string): void;
    setTextColor(color: string | Function): void;
    setTextSize(size: number | Function): void;
    setTextOpacity(opacity: number): void;
    setTextAnchor(anchor: string): void;
    setTextOffset(offset: [number, number]): void;
  }

  // 热力图层
  interface HeatmapLayer extends Layer {
    // 热力图层特有方法
    setIntensity(intensity: number): void;
    setRadius(radius: number): void;
    setOpacity(opacity: number): void;
    setColorRamp(colors: string[]): void;
    setWeight(weight: string | Function): void;
  }

  // 区域图层
  interface DistrictLayer extends Layer {
    // 区域图层特有方法
    setAdcode(adcode: string): void;
    setDepth(depth: number): void;
    setChildrenFill(fill: boolean): void;
    setFillColor(color: string | Function): void;
    setStrokeColor(color: string | Function): void;
    setStrokeWidth(width: number): void;
    setFillOpacity(opacity: number): void;
  }

  // 区域数据
  interface DistrictData {
    // 行政区划编码
    adcode: string;
    // 名称
    name: string;
    // 级别
    level: string;
    // 边界坐标数组
    coordinates: number[][][];
    // 中心点
    center: [number, number];
    // 子区域
    children?: DistrictData[];
  }
}

// 声明全局L7对象
declare global {
  interface Window {
    L7: {
      Scene: new (config: any) => AntVL7.Scene;
      PointLayer: new (config?: any) => AntVL7.PointLayer;
      LineLayer: new (config?: any) => AntVL7.LineLayer;
      PolygonLayer: new (config?: any) => AntVL7.PolygonLayer;
      TextLayer: new (config?: any) => AntVL7.TextLayer;
      HeatmapLayer: new (config?: any) => AntVL7.HeatmapLayer;
    };
    L7District: {
      District: new (config: any) => AntVL7.DistrictLayer;
      // 获取区域数据
      getDistrictByAdcode: (adcode: string) => Promise<AntVL7.DistrictData>;
    };
  }
}

declare namespace API {
  type TransportOrderQueryRequest = {
    id?: number;
    orderNo?: string;
    customerId?: number;
    sourceStationId?: number;
    targetStationId?: number;
    cargoDesc?: string;
    minWeight?: number;
    maxWeight?: number;
    minVolume?: number;
    maxVolume?: number;
    expectedDeliveryStart?: Date;
    expectedDeliveryEnd?: Date;
    status?: number;
    createTimeStart?: Date;
    createTimeEnd?: Date;
    current?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
  };
  
  type TransportOrderAddRequest = {
    orderNo: string;
    customerId: number;
    sourceStationId: number;
    targetStationId: number;
    cargoDesc?: string;
    weight: number;
    volume: number;
    amount?: number;
    expectedPickup?: Date;
    expectedDelivery?: Date;
    status?: number;
    remark?: string;
  };
  
  type TransportOrderUpdateRequest = {
    id: number;
    orderNo?: string;
    customerId?: number;
    sourceStationId?: number;
    targetStationId?: number;
    cargoDesc?: string;
    weight?: number;
    volume?: number;
    amount?: number;
    expectedPickup?: Date;
    expectedDelivery?: Date;
    actualPickup?: Date;
    actualDelivery?: Date;
    status?: number;
    remark?: string;
  };
  
  type TransportOrderVO = {
    id: number;
    orderNo: string;
    customerId: number;
    customerName?: string;
    sourceStationId: number;
    sourceStationName?: string;
    targetStationId: number;
    targetStationName?: string;
    cargoDesc?: string;
    weight: number;
    volume: number;
    amount?: number;
    expectedPickup?: Date;
    expectedDelivery?: Date;
    actualPickup?: Date;
    actualDelivery?: Date;
    status: number;
    statusName?: string;
    remark?: string;
    createTime?: Date;
  };
  
  type OrderStatistics = {
    total: number;
    pending: number;
    assigned: number;
    inTransit: number;
    completed: number;
    cancelled: number;
  };
  
  type BaseResponseOrderStatistics_ = {
    code: number;
    data: OrderStatistics;
    message: string;
  };
  
  type BaseResponseListTransportOrderVO_ = {
    code: number;
    data: TransportOrderVO[];
    message: string;
  };
  
  type BaseResponsePageTransportOrderVO_ = {
    code: number;
    data: {
      records: TransportOrderVO[];
      total: number;
      size: number;
      current: number;
      pages: number;
    };
    message: string;
  };
}
