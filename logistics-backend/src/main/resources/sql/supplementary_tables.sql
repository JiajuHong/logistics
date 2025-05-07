-- 任务调度补充表结构

-- 任务执行记录表：记录任务状态变更和执行过程
CREATE TABLE task_execution_log (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL COMMENT '关联的任务ID',
    status TINYINT NOT NULL COMMENT '任务状态：0-创建 1-分配 2-执行中 3-完成 4-异常 5-取消',
    previous_status TINYINT COMMENT '前一个状态',
    execution_time DATETIME NOT NULL COMMENT '执行/状态变更时间',
    operator_id BIGINT COMMENT '操作人ID',
    location VARCHAR(100) COMMENT '位置信息(经纬度)',
    remark VARCHAR(255) COMMENT '备注信息',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_task_id (task_id),
    INDEX idx_execution_time (execution_time)
) COMMENT '任务执行记录表';

-- 调度规则表：配置不同类型任务的调度策略
CREATE TABLE scheduling_rule (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(50) NOT NULL COMMENT '规则名称',
    rule_code VARCHAR(50) NOT NULL COMMENT '规则代码',
    description VARCHAR(255) COMMENT '规则描述',
    task_type VARCHAR(50) NOT NULL COMMENT '任务类型',
    priority_level INT DEFAULT 0 COMMENT '优先级别(0-9)，数字越大优先级越高',
    weight_factor DECIMAL(5,2) DEFAULT 1.00 COMMENT '载重因子',
    distance_factor DECIMAL(5,2) DEFAULT 1.00 COMMENT '距离因子',
    time_factor DECIMAL(5,2) DEFAULT 1.00 COMMENT '时间因子',
    vehicle_type_constraint VARCHAR(255) COMMENT '车辆类型约束(JSON格式)',
    driver_requirement VARCHAR(255) COMMENT '司机要求(JSON格式)',
    is_enabled TINYINT DEFAULT 1 COMMENT '是否启用: 0-禁用 1-启用',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_rule_code (rule_code),
    INDEX idx_task_type (task_type)
) COMMENT '调度规则表';

-- 任务优先级表：支持特殊订单优先处理
CREATE TABLE task_priority (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    task_id BIGINT NOT NULL COMMENT '任务ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    priority_level INT NOT NULL DEFAULT 0 COMMENT '优先级(0-9)，数字越大优先级越高',
    reason VARCHAR(255) COMMENT '优先级调整原因',
    expire_time DATETIME COMMENT '优先级过期时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_task_id (task_id),
    INDEX idx_order_id (order_id),
    INDEX idx_priority_level (priority_level)
) COMMENT '任务优先级表';

-- 算法支持表结构

-- 直线距离缓存表：存储站点间直线距离，用于A*算法的启发函数
CREATE TABLE station_distance_cache (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_station_id BIGINT NOT NULL COMMENT '起始站点ID',
    to_station_id BIGINT NOT NULL COMMENT '目标站点ID',
    distance DECIMAL(10,2) NOT NULL COMMENT '直线距离(公里)',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_from_to (from_station_id, to_station_id),
    INDEX idx_from_station (from_station_id),
    INDEX idx_to_station (to_station_id)
) COMMENT '站点间直线距离缓存表';

-- 最优路径缓存表：存储常用路径计算结果提高效率
CREATE TABLE optimal_route_cache (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    from_station_id BIGINT NOT NULL COMMENT '起始站点ID',
    to_station_id BIGINT NOT NULL COMMENT '目标站点ID',
    path_nodes TEXT NOT NULL COMMENT '路径节点ID列表(JSON格式)',
    total_distance DECIMAL(10,2) NOT NULL COMMENT '总距离(公里)',
    estimated_time INT NOT NULL COMMENT '估计时间(分钟)',
    traffic_factor DECIMAL(3,2) DEFAULT 1.00 COMMENT '交通因子',
    calculation_time DATETIME NOT NULL COMMENT '计算时间',
    expire_time DATETIME COMMENT '过期时间',
    hit_count INT DEFAULT 0 COMMENT '命中次数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    UNIQUE KEY uk_from_to_traffic (from_station_id, to_station_id, traffic_factor),
    INDEX idx_from_to (from_station_id, to_station_id),
    INDEX idx_expire_time (expire_time)
) COMMENT '最优路径缓存表'; 