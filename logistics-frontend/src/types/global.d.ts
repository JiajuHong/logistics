// 全局类型声明
interface Window {
  AMap: any;
  initBMapGL?: () => void;
}

// 如果需要扩展全局接口，可以在这里添加 