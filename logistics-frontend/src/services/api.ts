// 适配器文件 - 将OpenAPI生成的函数名导出为简化名称
// 该文件不会被OpenAPI生成过程覆盖

import * as userAPI from './backend/userController';
import * as fileAPI from './backend/fileController';
import * as regionAPI from './backend/regionController';
import * as stationAPI from './backend/stationController';
import * as vehicleAPI from './backend/vehicleController';
import * as driverAPI from './backend/driverController';
import * as orderAPI from './backend/transportOrderController';
import * as customerAPI from './backend/customerController';
import * as taskAPI from './backend/transportTaskController';

// 用户相关
export const userLogin = userAPI.userLoginUsingPost;
export const userRegister = userAPI.userRegisterUsingPost;
export const getLoginUser = userAPI.getLoginUserUsingGet;
export const userLogout = userAPI.userLogoutUsingPost;
export const getUserVoById = userAPI.getUserVoByIdUsingGet;
export const getUserById = userAPI.getUserByIdUsingGet;

// 用户管理相关
export const addUser = userAPI.addUserUsingPost;
export const updateUser = userAPI.updateUserUsingPost;
export const deleteUser = userAPI.deleteUserUsingPost;
export const listUserByPage = userAPI.listUserByPageUsingPost;
export const listUserVoByPage = userAPI.listUserVoByPageUsingPost;
export const updateMyUser = userAPI.updateMyUserUsingPost;

// 文件上传相关
export const uploadFile = fileAPI.uploadFileUsingPost;

// 区域管理相关
export const addRegion = regionAPI.addRegionUsingPost;
export const deleteRegion = regionAPI.deleteRegionUsingPost;
export const updateRegion = regionAPI.updateRegionUsingPost;
export const getRegionById = regionAPI.getRegionByIdUsingGet;
export const listRegion = regionAPI.listRegionUsingGet;
export const listRegionByPage = regionAPI.listRegionByPageUsingGet;

// 站点管理相关
export const addStation = stationAPI.addStationUsingPost;
export const deleteStation = stationAPI.deleteStationUsingPost;
export const updateStation = stationAPI.updateStationUsingPost;
export const getStationById = stationAPI.getStationByIdUsingGet;
export const listStation = stationAPI.listStationUsingGet;
export const listStationByPage = stationAPI.listStationByPageUsingGet;

// 车辆管理相关
export const addVehicle = vehicleAPI.addVehicleUsingPost;
export const deleteVehicle = vehicleAPI.deleteVehicleUsingPost;
export const updateVehicle = vehicleAPI.updateVehicleUsingPost;
export const getVehicleById = vehicleAPI.getVehicleByIdUsingGet;
export const listVehicle = vehicleAPI.listVehicleUsingGet;
export const listVehicleByPage = vehicleAPI.listVehicleByPageUsingGet;
export const listVehicleTypes = vehicleAPI.listVehicleTypesUsingGet;
export const getVehicleStatistics = vehicleAPI.getVehicleStatisticsUsingGet;
export const listAvailableVehicles = vehicleAPI.listAvailableVehiclesUsingGet;

// 司机管理相关
export const addDriver = driverAPI.addDriverUsingPost;
export const deleteDriver = driverAPI.deleteDriverUsingPost;
export const updateDriver = driverAPI.updateDriverUsingPost;
export const getDriverById = driverAPI.getDriverByIdUsingGet;
export const listDriver = driverAPI.listDriverUsingGet;
export const listDriverByPage = driverAPI.listDriverByPageUsingGet;
export const listAvailableDrivers = driverAPI.listAvailableDriversUsingGet;
export const getDriverStatistics = driverAPI.getDriverStatisticsUsingGet;

// 订单管理相关
export const addTransportOrder = orderAPI.addTransportOrderUsingPost;
export const deleteTransportOrder = orderAPI.deleteTransportOrderUsingPost;
export const updateTransportOrder = orderAPI.updateTransportOrderUsingPost;
export const getTransportOrderById = orderAPI.getTransportOrderByIdUsingGet;
export const listTransportOrder = orderAPI.listTransportOrderUsingGet;
export const listTransportOrderByPage = orderAPI.listTransportOrderByPageUsingGet;
export const cancelOrder = orderAPI.cancelOrderUsingPost;
export const getOrderStatistics = orderAPI.getOrderStatisticsUsingGet;

// 客户管理相关
export const addCustomer = customerAPI.addCustomerUsingPost;
export const deleteCustomer = customerAPI.deleteCustomerUsingPost;
export const updateCustomer = customerAPI.updateCustomerUsingPost;
export const getCustomerById = customerAPI.getCustomerByIdUsingGet;
export const listCustomer = customerAPI.listCustomerUsingGet;
export const listCustomerByPage = customerAPI.listCustomerByPageUsingGet;

// 任务管理相关
export const listTransportTaskByPage = taskAPI.listTransportTaskByPageUsingGet;
export const getTransportTaskById = taskAPI.getTransportTaskByIdUsingGet;
export const addTransportTask = taskAPI.addTransportTaskUsingPost;
export const createTaskFromOrder = taskAPI.createTaskFromOrderUsingPost;
export const assignTask = taskAPI.assignTaskUsingPost;
export const cancelTask = taskAPI.cancelTaskUsingPost;
export const updateTaskStatus = taskAPI.updateTaskStatusUsingPost;
export const deleteTransportTask = taskAPI.deleteTransportTaskUsingPost;
export const getTaskStatistics = taskAPI.getTaskStatisticsUsingGet;

// 便捷别名
export const login = userLogin;
export const logout = userLogout;
export const register = userRegister;