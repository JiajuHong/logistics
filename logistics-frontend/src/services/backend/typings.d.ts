declare namespace API {
  type BaseResponseBoolean_ = {
    code?: number;
    data?: boolean;
    message?: string;
  };

  type BaseResponseCustomerVO_ = {
    code?: number;
    data?: CustomerVO;
    message?: string;
  };

  type BaseResponseDriverStatisticsVO_ = {
    code?: number;
    data?: DriverStatisticsVO;
    message?: string;
  };

  type BaseResponseDriverVO_ = {
    code?: number;
    data?: DriverVO;
    message?: string;
  };

  type BaseResponseListCustomerVO_ = {
    code?: number;
    data?: CustomerVO[];
    message?: string;
  };

  type BaseResponseListDriverVO_ = {
    code?: number;
    data?: DriverVO[];
    message?: string;
  };

  type BaseResponseListRegionVO_ = {
    code?: number;
    data?: RegionVO[];
    message?: string;
  };

  type BaseResponseListStationVO_ = {
    code?: number;
    data?: StationVO[];
    message?: string;
  };

  type BaseResponseListString_ = {
    code?: number;
    data?: string[];
    message?: string;
  };

  type BaseResponseListTransportOrderVO_ = {
    code?: number;
    data?: TransportOrderVO[];
    message?: string;
  };

  type BaseResponseListVehicleVO_ = {
    code?: number;
    data?: VehicleVO[];
    message?: string;
  };

  type BaseResponseLoginUserVO_ = {
    code?: number;
    data?: LoginUserVO;
    message?: string;
  };

  type BaseResponseLong_ = {
    code?: number;
    data?: number;
    message?: string;
  };

  type BaseResponsePageCustomerVO_ = {
    code?: number;
    data?: PageCustomerVO_;
    message?: string;
  };

  type BaseResponsePageDriverVO_ = {
    code?: number;
    data?: PageDriverVO_;
    message?: string;
  };

  type BaseResponsePageRegionVO_ = {
    code?: number;
    data?: PageRegionVO_;
    message?: string;
  };

  type BaseResponsePageStationVO_ = {
    code?: number;
    data?: PageStationVO_;
    message?: string;
  };

  type BaseResponsePageTransportOrderVO_ = {
    code?: number;
    data?: PageTransportOrderVO_;
    message?: string;
  };

  type BaseResponsePageUser_ = {
    code?: number;
    data?: PageUser_;
    message?: string;
  };

  type BaseResponsePageUserVO_ = {
    code?: number;
    data?: PageUserVO_;
    message?: string;
  };

  type BaseResponsePageVehicleVO_ = {
    code?: number;
    data?: PageVehicleVO_;
    message?: string;
  };

  type BaseResponseRegionVO_ = {
    code?: number;
    data?: RegionVO;
    message?: string;
  };

  type BaseResponseStationVO_ = {
    code?: number;
    data?: StationVO;
    message?: string;
  };

  type BaseResponseString_ = {
    code?: number;
    data?: string;
    message?: string;
  };

  type BaseResponseTransportOrderVO_ = {
    code?: number;
    data?: TransportOrderVO;
    message?: string;
  };

  type BaseResponseUser_ = {
    code?: number;
    data?: User;
    message?: string;
  };

  type BaseResponseUserVO_ = {
    code?: number;
    data?: UserVO;
    message?: string;
  };

  type BaseResponseVehicleStatisticsVO_ = {
    code?: number;
    data?: VehicleStatisticsVO;
    message?: string;
  };

  type BaseResponseVehicleVO_ = {
    code?: number;
    data?: VehicleVO;
    message?: string;
  };

  type cancelOrderUsingPOSTParams = {
    /** id */
    id?: number;
  };

  type checkUsingGETParams = {
    /** echostr */
    echostr?: string;
    /** nonce */
    nonce?: string;
    /** signature */
    signature?: string;
    /** timestamp */
    timestamp?: string;
  };

  type CustomerAddRequest = {
    address?: string;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    customerType?: number;
    email?: string;
    name?: string;
    regionId?: number;
    status?: number;
  };

  type CustomerUpdateRequest = {
    address?: string;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    customerType?: number;
    email?: string;
    id?: number;
    name?: string;
    regionId?: number;
    status?: number;
  };

  type CustomerVO = {
    address?: string;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    createTime?: string;
    customerType?: number;
    email?: string;
    id?: number;
    name?: string;
    regionId?: number;
    regionName?: string;
    status?: number;
  };

  type DeleteRequest = {
    id?: number;
  };

  type DriverAddRequest = {
    avatar?: string;
    code?: string;
    experience?: number;
    licenseNo?: string;
    licenseType?: string;
    name?: string;
    phone?: string;
    status?: number;
  };

  type DriverStatisticsVO = {
    disabled?: number;
    idle?: number;
    inTask?: number;
    total?: number;
  };

  type DriverUpdateRequest = {
    avatar?: string;
    code?: string;
    experience?: number;
    id?: number;
    licenseNo?: string;
    licenseType?: string;
    name?: string;
    phone?: string;
    status?: number;
  };

  type DriverVO = {
    avatar?: string;
    code?: string;
    createTime?: string;
    experience?: number;
    id?: number;
    licenseNo?: string;
    licenseType?: string;
    name?: string;
    phone?: string;
    status?: number;
  };

  type File = {
    absolute?: boolean;
    absoluteFile?: File;
    absolutePath?: string;
    canonicalFile?: File;
    canonicalPath?: string;
    directory?: boolean;
    file?: boolean;
    freeSpace?: number;
    hidden?: boolean;
    name?: string;
    parent?: string;
    parentFile?: File;
    path?: string;
    totalSpace?: number;
    usableSpace?: number;
  };

  type getCustomerByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getDriverByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getRegionByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getStationByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getTransportOrderByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getUserByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getUserVOByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type getVehicleByIdUsingGETParams = {
    /** id */
    id?: number;
  };

  type InputStream = true;

  type listCustomerByPageUsingGETParams = {
    address?: string;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    current?: number;
    customerType?: number;
    email?: string;
    name?: string;
    pageSize?: number;
    regionId?: number;
    sortField?: string;
    sortOrder?: string;
    status?: number;
  };

  type listCustomerUsingGETParams = {
    address?: string;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    current?: number;
    customerType?: number;
    email?: string;
    name?: string;
    pageSize?: number;
    regionId?: number;
    sortField?: string;
    sortOrder?: string;
    status?: number;
  };

  type listDriverByPageUsingGETParams = {
    code?: string;
    current?: number;
    experience?: number;
    licenseNo?: string;
    licenseType?: string;
    name?: string;
    pageSize?: number;
    phone?: string;
    sortField?: string;
    sortOrder?: string;
    status?: number;
  };

  type listDriverUsingGETParams = {
    code?: string;
    current?: number;
    experience?: number;
    licenseNo?: string;
    licenseType?: string;
    name?: string;
    pageSize?: number;
    phone?: string;
    sortField?: string;
    sortOrder?: string;
    status?: number;
  };

  type listRegionByPageUsingGETParams = {
    code?: string;
    current?: number;
    level?: number;
    name?: string;
    pageSize?: number;
    parentId?: number;
    sortField?: string;
    sortOrder?: string;
    status?: number;
  };

  type listRegionUsingGETParams = {
    code?: string;
    current?: number;
    level?: number;
    name?: string;
    pageSize?: number;
    parentId?: number;
    sortField?: string;
    sortOrder?: string;
    status?: number;
  };

  type listStationByPageUsingGETParams = {
    address?: string;
    capacity?: number;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    current?: number;
    name?: string;
    pageSize?: number;
    regionId?: number;
    sortField?: string;
    sortOrder?: string;
    status?: number;
  };

  type listStationUsingGETParams = {
    address?: string;
    capacity?: number;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    current?: number;
    name?: string;
    pageSize?: number;
    regionId?: number;
    sortField?: string;
    sortOrder?: string;
    status?: number;
  };

  type listTransportOrderByPageUsingGETParams = {
    cargoDesc?: string;
    createTimeEnd?: string;
    createTimeStart?: string;
    current?: number;
    customerId?: number;
    expectedDeliveryEnd?: string;
    expectedDeliveryStart?: string;
    id?: number;
    maxVolume?: number;
    maxWeight?: number;
    minVolume?: number;
    minWeight?: number;
    orderNo?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    sourceStationId?: number;
    status?: number;
    targetStationId?: number;
  };

  type listTransportOrderUsingGETParams = {
    cargoDesc?: string;
    createTimeEnd?: string;
    createTimeStart?: string;
    current?: number;
    customerId?: number;
    expectedDeliveryEnd?: string;
    expectedDeliveryStart?: string;
    id?: number;
    maxVolume?: number;
    maxWeight?: number;
    minVolume?: number;
    minWeight?: number;
    orderNo?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    sourceStationId?: number;
    status?: number;
    targetStationId?: number;
  };

  type listVehicleByPageUsingGETParams = {
    current?: number;
    driverId?: number;
    loadCapacity?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    stationId?: number;
    status?: number;
    vehicleNo?: string;
    vehicleType?: string;
    volumeCapacity?: number;
  };

  type listVehicleUsingGETParams = {
    current?: number;
    driverId?: number;
    loadCapacity?: number;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    stationId?: number;
    status?: number;
    vehicleNo?: string;
    vehicleType?: string;
    volumeCapacity?: number;
  };

  type LoginUserVO = {
    createTime?: string;
    id?: number;
    updateTime?: string;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type OrderItem = {
    asc?: boolean;
    column?: string;
  };

  type PageCustomerVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: CustomerVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageDriverVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: DriverVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageRegionVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: RegionVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageStationVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: StationVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageTransportOrderVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: TransportOrderVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageUser_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: User[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageUserVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: UserVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type PageVehicleVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: OrderItem[];
    pages?: number;
    records?: VehicleVO[];
    searchCount?: boolean;
    size?: number;
    total?: number;
  };

  type RegionAddRequest = {
    boundaryPoints?: string;
    centerLatitude?: number;
    centerLongitude?: number;
    code?: string;
    level?: number;
    name?: string;
    parentId?: number;
    status?: number;
  };

  type RegionUpdateRequest = {
    boundaryPoints?: string;
    centerLatitude?: number;
    centerLongitude?: number;
    code?: string;
    id?: number;
    level?: number;
    name?: string;
    parentId?: number;
    status?: number;
  };

  type RegionVO = {
    boundaryPoints?: string;
    centerLatitude?: number;
    centerLongitude?: number;
    code?: string;
    createTime?: string;
    id?: number;
    level?: number;
    name?: string;
    parentId?: number;
    parentName?: string;
    status?: number;
    updateTime?: string;
  };

  type Resource = {
    description?: string;
    file?: File;
    filename?: string;
    inputStream?: InputStream;
    open?: boolean;
    readable?: boolean;
    uri?: URI;
    url?: URL;
  };

  type StationAddRequest = {
    address?: string;
    capacity?: number;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    latitude?: number;
    longitude?: number;
    name?: string;
    regionId?: number;
    status?: number;
  };

  type StationUpdateRequest = {
    address?: string;
    capacity?: number;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    id?: number;
    latitude?: number;
    longitude?: number;
    name?: string;
    regionId?: number;
    status?: number;
  };

  type StationVO = {
    address?: string;
    capacity?: number;
    code?: string;
    contactName?: string;
    contactPhone?: string;
    createTime?: string;
    id?: number;
    latitude?: number;
    longitude?: number;
    name?: string;
    regionId?: number;
    regionName?: string;
    status?: number;
    updateTime?: string;
  };

  type TransportOrderAddRequest = {
    amount?: number;
    cargoDesc?: string;
    customerId?: number;
    expectedDelivery?: string;
    expectedPickup?: string;
    orderNo?: string;
    remark?: string;
    sourceStationId?: number;
    status?: number;
    targetStationId?: number;
    volume?: number;
    weight?: number;
  };

  type TransportOrderUpdateRequest = {
    actualDelivery?: string;
    actualPickup?: string;
    amount?: number;
    cargoDesc?: string;
    customerId?: number;
    expectedDelivery?: string;
    expectedPickup?: string;
    id?: number;
    orderNo?: string;
    remark?: string;
    sourceStationId?: number;
    status?: number;
    targetStationId?: number;
    volume?: number;
    weight?: number;
  };

  type TransportOrderVO = {
    actualDelivery?: string;
    actualPickup?: string;
    amount?: number;
    cargoDesc?: string;
    createTime?: string;
    customerId?: number;
    customerName?: string;
    expectedDelivery?: string;
    expectedPickup?: string;
    id?: number;
    orderNo?: string;
    remark?: string;
    sourceStationId?: number;
    sourceStationName?: string;
    status?: number;
    statusName?: string;
    targetStationId?: number;
    targetStationName?: string;
    volume?: number;
    weight?: number;
  };

  type uploadFileUsingPOSTParams = {
    biz?: string;
  };

  type URI = {
    absolute?: boolean;
    authority?: string;
    fragment?: string;
    host?: string;
    opaque?: boolean;
    path?: string;
    port?: number;
    query?: string;
    rawAuthority?: string;
    rawFragment?: string;
    rawPath?: string;
    rawQuery?: string;
    rawSchemeSpecificPart?: string;
    rawUserInfo?: string;
    scheme?: string;
    schemeSpecificPart?: string;
    userInfo?: string;
  };

  type URL = {
    authority?: string;
    content?: Record<string, any>;
    defaultPort?: number;
    file?: string;
    host?: string;
    path?: string;
    port?: number;
    protocol?: string;
    query?: string;
    ref?: string;
    userInfo?: string;
  };

  type User = {
    createTime?: string;
    id?: number;
    isDelete?: number;
    mpOpenId?: string;
    unionId?: string;
    updateTime?: string;
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userPassword?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserAddRequest = {
    userAccount?: string;
    userAvatar?: string;
    userName?: string;
    userRole?: string;
  };

  type userLoginByWxOpenUsingGETParams = {
    /** code */
    code: string;
  };

  type UserLoginRequest = {
    userAccount?: string;
    userPassword?: string;
  };

  type UserQueryRequest = {
    current?: number;
    id?: number;
    mpOpenId?: string;
    pageSize?: number;
    sortField?: string;
    sortOrder?: string;
    unionId?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserRegisterRequest = {
    checkPassword?: string;
    userAccount?: string;
    userPassword?: string;
  };

  type UserUpdateMyRequest = {
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
  };

  type UserUpdateRequest = {
    id?: number;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type UserVO = {
    createTime?: string;
    id?: number;
    userAvatar?: string;
    userName?: string;
    userProfile?: string;
    userRole?: string;
  };

  type VehicleAddRequest = {
    driverId?: number;
    loadCapacity?: number;
    stationId?: number;
    status?: number;
    vehicleNo?: string;
    vehicleType?: string;
    volumeCapacity?: number;
  };

  type VehicleStatisticsVO = {
    idle?: number;
    inTask?: number;
    maintenance?: number;
    total?: number;
  };

  type VehicleUpdateRequest = {
    driverId?: number;
    id?: number;
    loadCapacity?: number;
    stationId?: number;
    status?: number;
    vehicleNo?: string;
    vehicleType?: string;
    volumeCapacity?: number;
  };

  type VehicleVO = {
    createTime?: string;
    driverId?: number;
    driverName?: string;
    id?: number;
    loadCapacity?: number;
    stationId?: number;
    stationName?: string;
    status?: number;
    vehicleNo?: string;
    vehicleType?: string;
    volumeCapacity?: number;
  };
}
