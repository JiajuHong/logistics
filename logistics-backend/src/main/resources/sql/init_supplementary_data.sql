-- 为补充表结构生成测试数据

-- 初始化调度规则数据
INSERT INTO scheduling_rule 
(rule_name, rule_code, description, task_type, priority_level, weight_factor, distance_factor, time_factor, vehicle_type_constraint, driver_requirement, is_enabled, create_time) 
VALUES
('普通运输调度', 'NORMAL_DELIVERY', '适用于普通货物运输的调度规则', 'NORMAL', 5, 1.0, 1.0, 1.0, '{"allowed":["VAN","TRUCK","LORRY"]}', '{"minExperience":1}', 1, NOW()),
('快速运输调度', 'EXPRESS_DELIVERY', '适用于加急货物运输的调度规则', 'EXPRESS', 8, 0.8, 1.2, 1.5, '{"allowed":["VAN","SMALL_TRUCK"]}', '{"minExperience":3}', 1, NOW()),
('重型货物调度', 'HEAVY_DELIVERY', '适用于大型或重型货物运输的调度规则', 'HEAVY', 6, 1.5, 0.8, 0.9, '{"allowed":["LORRY","HEAVY_TRUCK"]}', '{"minExperience":5,"licenseTypes":["A","B"]}', 1, NOW()),
('冷链运输调度', 'COLD_CHAIN', '适用于需要温控的货物运输', 'COLD_CHAIN', 7, 1.2, 1.0, 1.3, '{"allowed":["REFRIGERATED_TRUCK"]}', '{"minExperience":2,"specialTraining":["COLD_CHAIN"]}', 1, NOW()),
('危险品运输调度', 'DANGEROUS_GOODS', '适用于危险品货物运输的特殊调度规则', 'DANGEROUS', 9, 1.3, 0.7, 1.1, '{"allowed":["SPECIAL_TRUCK"]}', '{"minExperience":5,"specialTraining":["HAZMAT"],"licenseTypes":["A"]}', 1, NOW()),
('省内短途调度', 'SHORT_DISTANCE', '适用于省内短途运输的调度规则', 'SHORT', 4, 0.9, 1.1, 0.8, '{"allowed":["VAN","SMALL_TRUCK","TRUCK"]}', '{"minExperience":1}', 1, NOW()),
('跨省长途调度', 'LONG_DISTANCE', '适用于跨省长途运输的调度规则', 'LONG', 6, 1.1, 0.9, 1.2, '{"allowed":["TRUCK","LORRY"]}', '{"minExperience":3,"healthCheck":true}', 1, NOW()),
('节能低碳调度', 'ECO_FRIENDLY', '优先使用新能源车辆的调度规则', 'ECO', 5, 0.8, 1.0, 0.9, '{"allowed":["NEW_ENERGY_TRUCK","NEW_ENERGY_VAN"]}', '{"minExperience":2}', 1, NOW());

-- 假设系统已有一些transport_task记录，我们根据这些任务生成任务执行记录
-- 首先为任务执行记录生成数据(假设任务ID从1-20)

-- 假设有20个运输任务，为每个任务生成状态变更记录
-- 任务1-5：已完成的任务，有完整的状态流转
-- 任务6-10：正在执行中的任务
-- 任务11-15：刚分配的任务
-- 任务16-20：刚创建的任务
-- 为任务1生成完整的执行记录(创建->分配->执行中->完成)
INSERT INTO task_execution_log 
(task_id, status, previous_status, execution_time, operator_id, location, remark, create_time) 
VALUES
(1, 0, NULL, DATE_SUB(NOW(), INTERVAL 7 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(1, 1, 0, DATE_SUB(NOW(), INTERVAL 6 DAY), 1, NULL, '分配给车辆1, 司机2', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(1, 2, 1, DATE_SUB(NOW(), INTERVAL 5 DAY), 2, '30.5937,114.3055', '开始执行任务', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(1, 2, 2, DATE_SUB(NOW(), INTERVAL 4 DAY), 2, '31.2305,121.4737', '途经上海', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(1, 3, 2, DATE_SUB(NOW(), INTERVAL 3 DAY), 2, '39.9042,116.4074', '任务完成，已送达北京', DATE_SUB(NOW(), INTERVAL 3 DAY));

-- 为任务2生成完整的执行记录(创建->分配->执行中->完成)
INSERT INTO task_execution_log 
(task_id, status, previous_status, execution_time, operator_id, location, remark, create_time) 
VALUES
(2, 0, NULL, DATE_SUB(NOW(), INTERVAL 10 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(2, 1, 0, DATE_SUB(NOW(), INTERVAL 9 DAY), 1, NULL, '分配给车辆3, 司机4', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(2, 2, 1, DATE_SUB(NOW(), INTERVAL 8 DAY), 4, '22.5431,114.0579', '开始执行任务', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(2, 2, 2, DATE_SUB(NOW(), INTERVAL 7 DAY), 4, '23.1291,113.2644', '途经广州', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(2, 3, 2, DATE_SUB(NOW(), INTERVAL 6 DAY), 4, '24.4798,118.0894', '任务完成，已送达厦门', DATE_SUB(NOW(), INTERVAL 6 DAY));

-- 为任务3生成记录(创建->分配->执行中->异常->执行中->完成)
INSERT INTO task_execution_log 
(task_id, status, previous_status, execution_time, operator_id, location, remark, create_time) 
VALUES
(3, 0, NULL, DATE_SUB(NOW(), INTERVAL 15 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 15 DAY)),
(3, 1, 0, DATE_SUB(NOW(), INTERVAL 14 DAY), 1, NULL, '分配给车辆2, 司机5', DATE_SUB(NOW(), INTERVAL 14 DAY)),
(3, 2, 1, DATE_SUB(NOW(), INTERVAL 13 DAY), 5, '30.2741,120.1551', '开始执行任务', DATE_SUB(NOW(), INTERVAL 13 DAY)),
(3, 4, 2, DATE_SUB(NOW(), INTERVAL 12 DAY), 5, '31.8642,117.2832', '车辆故障，需要维修', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(3, 2, 4, DATE_SUB(NOW(), INTERVAL 11 DAY), 5, '31.8642,117.2832', '故障已修复，继续执行', DATE_SUB(NOW(), INTERVAL 11 DAY)),
(3, 3, 2, DATE_SUB(NOW(), INTERVAL 10 DAY), 5, '32.0584,118.7965', '任务完成，已送达南京', DATE_SUB(NOW(), INTERVAL 10 DAY));

-- 为任务4生成记录(创建->分配->取消)
INSERT INTO task_execution_log 
(task_id, status, previous_status, execution_time, operator_id, location, remark, create_time) 
VALUES
(4, 0, NULL, DATE_SUB(NOW(), INTERVAL 12 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(4, 1, 0, DATE_SUB(NOW(), INTERVAL 11 DAY), 1, NULL, '分配给车辆5, 司机3', DATE_SUB(NOW(), INTERVAL 11 DAY)),
(4, 5, 1, DATE_SUB(NOW(), INTERVAL 10 DAY), 1, NULL, '客户取消订单', DATE_SUB(NOW(), INTERVAL 10 DAY));

-- 为任务5生成完整的执行记录(创建->分配->执行中->完成)
INSERT INTO task_execution_log 
(task_id, status, previous_status, execution_time, operator_id, location, remark, create_time) 
VALUES
(5, 0, NULL, DATE_SUB(NOW(), INTERVAL 8 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(5, 1, 0, DATE_SUB(NOW(), INTERVAL 7 DAY), 1, NULL, '分配给车辆4, 司机1', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(5, 2, 1, DATE_SUB(NOW(), INTERVAL 6 DAY), 1, '34.2583,108.9286', '开始执行任务', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(5, 3, 2, DATE_SUB(NOW(), INTERVAL 5 DAY), 1, '34.3416,108.9398', '任务完成，已送达西安', DATE_SUB(NOW(), INTERVAL 5 DAY));

-- 为任务6-10生成正在执行中的任务记录
INSERT INTO task_execution_log 
(task_id, status, previous_status, execution_time, operator_id, location, remark, create_time) 
VALUES
(6, 0, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(6, 1, 0, DATE_SUB(NOW(), INTERVAL 4 DAY), 1, NULL, '分配给车辆6, 司机6', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(6, 2, 1, DATE_SUB(NOW(), INTERVAL 3 DAY), 6, '28.2568,112.9346', '开始执行任务', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(7, 0, NULL, DATE_SUB(NOW(), INTERVAL 5 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(7, 1, 0, DATE_SUB(NOW(), INTERVAL 4 DAY), 1, NULL, '分配给车辆7, 司机7', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(7, 2, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 7, '26.0745,119.2965', '开始执行任务', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(8, 0, NULL, DATE_SUB(NOW(), INTERVAL 4 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(8, 1, 0, DATE_SUB(NOW(), INTERVAL 3 DAY), 1, NULL, '分配给车辆8, 司机8', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(8, 2, 1, DATE_SUB(NOW(), INTERVAL 2 DAY), 8, '36.0638,120.3801', '开始执行任务', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 0, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(9, 1, 0, DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NULL, '分配给车辆9, 司机9', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(9, 2, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 9, '39.1422,117.1767', '开始执行任务', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(10, 0, NULL, DATE_SUB(NOW(), INTERVAL 3 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 3 DAY)),
(10, 1, 0, DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NULL, '分配给车辆10, 司机10', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(10, 2, 1, DATE_SUB(NOW(), INTERVAL 1 DAY), 10, '32.0617,118.7778', '开始执行任务', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 为任务11-15生成刚分配的任务记录
INSERT INTO task_execution_log 
(task_id, status, previous_status, execution_time, operator_id, location, remark, create_time) 
VALUES
(11, 0, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(11, 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), 1, NULL, '分配给车辆11, 司机11', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(12, 0, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(12, 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), 1, NULL, '分配给车辆12, 司机12', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(13, 0, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(13, 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), 1, NULL, '分配给车辆13, 司机13', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(14, 0, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(14, 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), 1, NULL, '分配给车辆14, 司机14', DATE_SUB(NOW(), INTERVAL 1 DAY)),
(15, 0, NULL, DATE_SUB(NOW(), INTERVAL 2 DAY), 1, NULL, '创建任务', DATE_SUB(NOW(), INTERVAL 2 DAY)),
(15, 1, 0, DATE_SUB(NOW(), INTERVAL 1 DAY), 1, NULL, '分配给车辆15, 司机15', DATE_SUB(NOW(), INTERVAL 1 DAY));

-- 为任务16-20生成刚创建的任务记录
INSERT INTO task_execution_log 
(task_id, status, previous_status, execution_time, operator_id, location, remark, create_time) 
VALUES
(16, 0, NULL, NOW(), 1, NULL, '创建任务', NOW()),
(17, 0, NULL, NOW(), 1, NULL, '创建任务', NOW()),
(18, 0, NULL, NOW(), 1, NULL, '创建任务', NOW()),
(19, 0, NULL, NOW(), 1, NULL, '创建任务', NOW()),
(20, 0, NULL, NOW(), 1, NULL, '创建任务', NOW());

-- 初始化任务优先级数据
INSERT INTO task_priority 
(task_id, order_id, priority_level, reason, expire_time, create_time) 
VALUES
(3, 3, 8, '客户是VIP，要求优先处理', DATE_ADD(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 15 DAY)),
(7, 7, 9, '紧急医疗物资运输', DATE_ADD(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 5 DAY)),
(11, 11, 7, '生鲜产品，需要加快运输', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(14, 14, 8, '客户急需货物，付费加急', DATE_ADD(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
(16, 16, 6, '货物体积大，优先安排车辆', DATE_ADD(NOW(), INTERVAL 7 DAY), NOW());

-- 假设系统中有10个站点，站点ID从1-10
-- 为站点间距离生成数据
-- 生成所有站点之间的直线距离缓存
-- 以下是为10个站点两两之间生成直线距离的数据

-- 生成站点1与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(1, 2, 150.25, NOW()),
(1, 3, 320.75, NOW()),
(1, 4, 480.50, NOW()),
(1, 5, 210.30, NOW()),
(1, 6, 560.70, NOW()),
(1, 7, 720.40, NOW()),
(1, 8, 830.60, NOW()),
(1, 9, 420.90, NOW()),
(1, 10, 950.20, NOW());

-- 生成站点2与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(2, 1, 150.25, NOW()),
(2, 3, 180.45, NOW()),
(2, 4, 330.75, NOW()),
(2, 5, 240.60, NOW()),
(2, 6, 410.30, NOW()),
(2, 7, 570.80, NOW()),
(2, 8, 680.40, NOW()),
(2, 9, 290.50, NOW()),
(2, 10, 800.10, NOW());

-- 生成站点3与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(3, 1, 320.75, NOW()),
(3, 2, 180.45, NOW()),
(3, 4, 160.30, NOW()),
(3, 5, 280.70, NOW()),
(3, 6, 240.80, NOW()),
(3, 7, 400.50, NOW()),
(3, 8, 510.20, NOW()),
(3, 9, 230.40, NOW()),
(3, 10, 630.60, NOW());

-- 生成站点4与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(4, 1, 480.50, NOW()),
(4, 2, 330.75, NOW()),
(4, 3, 160.30, NOW()),
(4, 5, 310.40, NOW()),
(4, 6, 140.60, NOW()),
(4, 7, 270.30, NOW()),
(4, 8, 380.50, NOW()),
(4, 9, 190.70, NOW()),
(4, 10, 470.90, NOW());

-- 生成站点5与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(5, 1, 210.30, NOW()),
(5, 2, 240.60, NOW()),
(5, 3, 280.70, NOW()),
(5, 4, 310.40, NOW()),
(5, 6, 350.20, NOW()),
(5, 7, 510.40, NOW()),
(5, 8, 620.70, NOW()),
(5, 9, 220.30, NOW()),
(5, 10, 740.80, NOW());

-- 生成其他站点的距离数据
-- 生成站点6与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(6, 1, 560.70, NOW()),
(6, 2, 410.30, NOW()),
(6, 3, 240.80, NOW()),
(6, 4, 140.60, NOW()),
(6, 5, 350.20, NOW()),
(6, 7, 160.40, NOW()),
(6, 8, 270.30, NOW()),
(6, 9, 190.20, NOW()),
(6, 10, 390.50, NOW());

-- 生成站点7与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(7, 1, 720.40, NOW()),
(7, 2, 570.80, NOW()),
(7, 3, 400.50, NOW()),
(7, 4, 270.30, NOW()),
(7, 5, 510.40, NOW()),
(7, 6, 160.40, NOW()),
(7, 8, 120.60, NOW()),
(7, 9, 300.70, NOW()),
(7, 10, 240.30, NOW());

-- 生成站点8与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(8, 1, 830.60, NOW()),
(8, 2, 680.40, NOW()),
(8, 3, 510.20, NOW()),
(8, 4, 380.50, NOW()),
(8, 5, 620.70, NOW()),
(8, 6, 270.30, NOW()),
(8, 7, 120.60, NOW()),
(8, 9, 410.80, NOW()),
(8, 10, 135.40, NOW());

-- 生成站点9与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(9, 1, 420.90, NOW()),
(9, 2, 290.50, NOW()),
(9, 3, 230.40, NOW()),
(9, 4, 190.70, NOW()),
(9, 5, 220.30, NOW()),
(9, 6, 190.20, NOW()),
(9, 7, 300.70, NOW()),
(9, 8, 410.80, NOW()),
(9, 10, 530.60, NOW());

-- 生成站点10与其他站点的距离
INSERT INTO station_distance_cache 
(from_station_id, to_station_id, distance, create_time) 
VALUES
(10, 1, 950.20, NOW()),
(10, 2, 800.10, NOW()),
(10, 3, 630.60, NOW()),
(10, 4, 470.90, NOW()),
(10, 5, 740.80, NOW()),
(10, 6, 390.50, NOW()),
(10, 7, 240.30, NOW()),
(10, 8, 135.40, NOW()),
(10, 9, 530.60, NOW());

-- 初始化最优路径缓存数据
-- 生成一些常用路径的最优路径缓存
INSERT INTO optimal_route_cache 
(from_station_id, to_station_id, path_nodes, total_distance, estimated_time, traffic_factor, calculation_time, expire_time, hit_count, create_time) 
VALUES
-- 路径1: 1->2->3->4
(1, 4, '[1,2,3,4]', 490.80, 360, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 12, NOW()),
-- 路径2: 1->5->9->7
(1, 7, '[1,5,9,7]', 731.40, 420, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 8, NOW()),
-- 路径3: 2->3->6->8
(2, 8, '[2,3,6,8]', 691.55, 390, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 5, NOW()),
-- 路径4: 3->4->6->7->10
(3, 10, '[3,4,6,7,10]', 710.60, 480, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 10, NOW()),
-- 路径5: 4->6->7->8
(4, 8, '[4,6,7,8]', 530.90, 300, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 6, NOW()),
-- 路径6: 5->9->3->6
(5, 6, '[5,9,3,6]', 661.30, 360, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 4, NOW()),
-- 路径7: 6->7->8->10
(6, 10, '[6,7,8,10]', 435.70, 240, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 15, NOW()),
-- 路径8: 7->8->10
(7, 10, '[7,8,10]', 375.70, 210, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 7, NOW()),
-- 路径9: 8->7->6->4
(8, 4, '[8,7,6,4]', 531.50, 300, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 3, NOW()),
-- 路径10: 9->3->2->1
(9, 1, '[9,3,2,1]', 561.10, 330, 1.0, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 9, NOW());

-- 添加不同交通因子下的路径缓存
INSERT INTO optimal_route_cache 
(from_station_id, to_station_id, path_nodes, total_distance, estimated_time, traffic_factor, calculation_time, expire_time, hit_count, create_time) 
VALUES
-- 路径1在不同交通因子下的缓存
(1, 4, '[1,2,3,4]', 490.80, 432, 1.2, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 5, NOW()),
(1, 4, '[1,5,9,4]', 612.30, 387, 0.9, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 3, NOW()),
-- 路径7在不同交通因子下的缓存
(6, 10, '[6,7,8,10]', 435.70, 288, 1.2, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 6, NOW()),
(6, 10, '[6,4,3,10]', 751.00, 410, 0.9, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 2, NOW());

-- 为某些热门路径添加高热度数据
UPDATE optimal_route_cache SET hit_count = 53 WHERE from_station_id = 1 AND to_station_id = 4 AND traffic_factor = 1.0;
UPDATE optimal_route_cache SET hit_count = 47 WHERE from_station_id = 6 AND to_station_id = 10 AND traffic_factor = 1.0; 