export default [
  { path: '/user', layout: false, routes: [{ path: '/user/login', component: './User/Login' }] },
  { path: '/welcome', icon: 'smile', component: './Welcome', name: "欢迎页" },
  {
    path: '/admin',
    icon: 'crown',
    name: "管理页",
    access: 'canAdmin',
    routes: [
      { path: '/admin', redirect: '/admin/user' },
      { icon: 'team', path: '/admin/user', component: './Admin/User', name: "用户管理" },
      { icon: 'apartment', path: '/admin/region', component: './Admin/Region', name: "区域管理" },
      { icon: 'environment', path: '/admin/station', component: './Admin/Station', name: "站点管理" },
      { icon: 'car', path: '/admin/vehicle', component: './Admin/Vehicle', name: "车辆管理" },
      { icon: 'idcard', path: '/admin/driver', component: './Admin/Driver', name: "司机管理" },
      { icon: 'profile', path: '/admin/order', component: './Admin/Order', name: "订单管理" },
      { icon: 'schedule', path: '/admin/task', component: './Admin/Task', name: "任务管理" },
    ],
  },
  {
    path: '/pathPlanning',
    icon: 'car',
    name: "路径规划",
    component: './PathPlanning',
    access: 'isUser',
  },
  {
    path: '/account',
    hideInMenu: true,
    access: 'isUser',
    routes: [
      { path: '/account', redirect: '/account/center' },
      { path: '/account/center', component: './Account/Center', name: '个人中心' },
    ],
  },
  { path: '/403', component: './403', layout: false },
  { path: '/', redirect: '/welcome', layout: false },
  { path: '*', layout: false, component: './404' },
];
