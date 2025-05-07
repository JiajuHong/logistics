create table if not exists station
(
    id            bigint auto_increment comment 'id'
        primary key,
    name          varchar(100)                       not null comment '站点名称',
    code          varchar(50)                        not null comment '站点编码',
    region_id     bigint                             not null comment '所属区域ID',
    address       varchar(200)                       not null comment '详细地址',
    contact_name  varchar(50)                        null comment '联系人',
    contact_phone varchar(20)                        null comment '联系电话',
    capacity      decimal(10, 2)                     null comment '站点容量（可存储量）',
    status        tinyint  default 1                 not null comment '状态：0-停用, 1-启用',
    create_time   datetime default CURRENT_TIMESTAMP not null comment '创建时间',
    update_time   datetime default CURRENT_TIMESTAMP not null on update CURRENT_TIMESTAMP comment '更新时间',
    is_delete     tinyint  default 0                 not null comment '是否删除',
    longitude     decimal(10, 6)                     null,
    latitude      decimal(10, 6)                     null,
    constraint uk_code
        unique (code)
)
    comment '站点信息表' collate = utf8mb4_unicode_ci;

INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (1, '华北物流枢纽中心', 'BJ-ZX-01', 2, '北京市东城区东直门南大街9号', '王经理', '13801010101', 5000.00, 1, '2025-05-02 20:01:15', '2025-05-02 23:07:15', 0, 116.437885, 39.940910);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (2, '北京朝阳分拣中心', 'BJ-D-01', 9, '北京市朝阳区朝阳北路107号', '李经理', '13802020202', 3000.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 116.494802, 39.941981);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (3, '北京莲花池转运站', 'BJ-X-01', 8, '北京市西城区莲花池东路121号', '王经理', '13803030303', 3500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 116.321592, 39.894756);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (4, '中关村科技园配送中心', 'BJ-B-01', 10, '北京市海淀区北四环西路9号', '赵经理', '13804040404', 2500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 116.339966, 39.967033);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (5, '华东物流枢纽中心', 'SH-ZX-01', 3, '上海市黄浦区人民大道200号', '陈经理', '13901010101', 6000.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 121.473701, 31.230416);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (6, '浦东外高桥保税区仓储基地', 'SH-D-01', 13, '上海市浦东新区张杨路601号', '吴经理', '13902020202', 4000.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 121.558987, 31.249592);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (7, '静安嘉里中心配送站', 'SH-X-01', 12, '上海市静安区恒丰路329号', '徐经理', '13903030303', 3800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 121.456951, 31.269628);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (8, '上海南站物流园区', 'SH-N-01', 14, '上海市徐汇区沪闵路9001号', '孙经理', '13904040404', 3200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 121.430538, 31.156894);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (9, '珠三角物流枢纽中心', 'GZ-ZX-01', 15, '广州市天河区天河路385号', '黄经理', '13911110101', 5500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.330134, 23.138593);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (10, '天河体育中心配送站', 'GZ-D-01', 27, '广州市天河区林和西横路1号', '刘经理', '13912220202', 3600.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.325834, 23.152483);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (11, '广州琶洲会展中心分拣中心', 'GZ-N-01', 29, '广州市海珠区新港东路1068号', '钱经理', '13913330303', 3300.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.269573, 23.062359);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (12, '白云国际机场物流基地', 'GZ-B-01', 30, '广州市白云区白云大道北199号', '周经理', '13914440404', 2800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.266619, 23.218361);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (13, '深圳福田综合物流中心', 'SZ-ZX-01', 16, '深圳市福田区深南大道7888号', '朱经理', '13921210101', 5200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.066036, 22.548412);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (14, '龙华民治转运中心', 'SZ-B-01', 16, '深圳市龙华区民治大道1号', '郭经理', '13922220202', 3400.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.029818, 22.609858);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (15, '盐田港集装箱中转站', 'SZ-D-01', 16, '深圳市盐田区深盐路2002号', '邓经理', '13923230303', 2600.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.240799, 22.559511);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (16, '南山科技园配送中心', 'SZ-X-01', 16, '深圳市南山区月亮湾大道2045号', '冯经理', '13924240404', 2900.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.927798, 22.545216);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (17, '南京鼓楼物流中心', 'NJ-ZX-01', 19, '南京市鼓楼区中央路1号', '何经理', '13931310101', 4800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 118.788587, 32.063713);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (18, '南京南站物流园', 'NJ-N-01', 19, '南京市雨花台区雨花东路1号', '彭经理', '13932320202', 3700.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 118.798128, 31.969737);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (19, '江宁开发区配送中心', 'NJ-B-01', 19, '南京市浦口区新浦路1号', '林经理', '13933330303', 2500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 118.718512, 32.128413);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (20, '杭州城东物流枢纽', 'HZ-ZX-01', 23, '杭州市上城区解放东路18号', '谢经理', '13941410101', 4600.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 120.175918, 30.259463);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (21, '萧山空港物流基地', 'HZ-D-01', 23, '杭州市江干区天城路1号', '尹经理', '13942420202', 3500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 120.213309, 30.289552);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (22, '西湖科技园配送中心', 'HZ-X-01', 23, '杭州市西湖区古翠路1号', '姚经理', '13943430303', 2700.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 120.121292, 30.276521);

-- 添加新的站点数据
-- 安徽省合肥市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (23, '合肥综合物流枢纽中心', 'AH-HF-01', 37, '合肥市瑶海区临泉东路399号', '马经理', '13951510101', 4200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.311448, 31.868418);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (24, '合肥高新区物流园', 'AH-HF-02', 57, '合肥市蜀山区黄山路599号', '高经理', '13952520202', 3300.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.241992, 31.832566);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (25, '庐阳区转运中心', 'AH-HF-03', 56, '合肥市庐阳区北二环路188号', '胡经理', '13953530303', 2800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.265456, 31.892754);

-- 福建省福州市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (26, '福州物流集散中心', 'FJ-FZ-01', 40, '福州市鼓楼区杨桥东路112号', '林经理', '13961610101', 4500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 119.313018, 26.082284);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (27, '台江区配送中心', 'FJ-FZ-02', 59, '福州市台江区茶亭街道五一南路1号', '吴经理', '13962620202', 3100.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 119.314156, 26.053625);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (28, '仓山物流园区', 'FJ-FZ-03', 60, '福州市仓山区浦上大道398号', '叶经理', '13963630303', 3600.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 119.270971, 26.038853);

-- 福建省厦门市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (29, '厦门集美物流中心', 'FJ-XM-01', 41, '厦门市集美区杏林湾路98号', '张经理', '13964640404', 4300.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 118.097536, 24.575253);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (30, '厦门海沧保税区仓储基地', 'FJ-XM-02', 41, '厦门市海沧区海沧大道2388号', '赖经理', '13965650505', 5200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 118.033482, 24.485244);

-- 甘肃省兰州市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (31, '兰州西站物流中心', 'GS-LZ-01', 43, '兰州市七里河区西站西路89号', '马经理', '13971710101', 3800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 103.747158, 36.068313);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (32, '兰州新区物流园', 'GS-LZ-02', 43, '兰州新区中川北路1688号', '杨经理', '13972720202', 4200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 103.693574, 36.513587);

-- 贵州省贵阳市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (33, '贵阳综合物流中心', 'GZ-GY-01', 46, '贵阳市南明区花果园中央商务区', '龙经理', '13981810101', 4100.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 106.713478, 26.578343);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (34, '贵阳龙洞堡空港物流基地', 'GZ-GY-02', 46, '贵阳市白云区龙洞堡国际机场路10号', '陈经理', '13982820202', 3500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 106.800858, 26.538504);

-- 河北省石家庄市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (35, '石家庄物流转运中心', 'HB-SJZ-01', 49, '石家庄市桥西区南二环西路66号', '李经理', '13991910101', 4600.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.502461, 38.045474);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (36, '正定物流园区', 'HB-SJZ-02', 49, '石家庄市正定县正定新区商务大街1号', '刘经理', '13992920202', 3800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.57058, 38.144384);

-- 河南省郑州市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (37, '郑州国际物流中心', 'HN-ZZ-01', 52, '郑州市中原区中原西路233号', '王经理', '13901010101', 5500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.611696, 34.747329);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (38, '郑州航空港经济区物流基地', 'HN-ZZ-02', 52, '郑州航空港区新港大道88号', '钱经理', '13902020202', 6500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.841276, 34.526932);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (39, '郑州二七区配送中心', 'HN-ZZ-03', 62, '郑州市二七区长江路108号', '张经理', '13903030303', 3700.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.640583, 34.725821);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (40, '管城区物流站', 'HN-ZZ-04', 63, '郑州市管城回族区航海东路89号', '孙经理', '13904040404', 2800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 113.677803, 34.753215);

-- 河南省开封市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (41, '开封物流中心', 'HN-KF-01', 53, '开封市龙亭区北土街26号', '李经理', '13905050505', 3100.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.307251, 34.797855);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (42, '开封金明物流园区', 'HN-KF-02', 53, '开封市金明区金明大道18号', '周经理', '13906060606', 2600.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.373935, 34.777456);

-- 补充新站点数据
-- 湖北省武汉市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (43, '武汉物流枢纽中心', 'HUB-WH-01', 72, '武汉市江汉区江汉路288号', '陈经理', '13807270101', 5800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.283105, 30.584354);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (44, '武汉吴家山物流园', 'HUB-WH-02', 89, '武汉市东西湖区吴家山大道1号', '郑经理', '13807270202', 4200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.136871, 30.620822);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (45, '武汉天河机场货运中心', 'HUB-WH-03', 72, '武汉市黄陂区天河机场货运区', '周经理', '13807270303', 3500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 114.208603, 30.784633);

-- 四川省成都市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (46, '成都青白江铁路集装箱中心站', 'SC-CD-01', 78, '成都市青白江区大弯镇', '杨经理', '13808280101', 6200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 104.315876, 30.881319);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (47, '成都双流国际机场物流园', 'SC-CD-02', 91, '成都市双流区空港四路999号', '刘经理', '13808280202', 5500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 103.950855, 30.578931);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (48, '成都青羊区物流配送中心', 'SC-CD-03', 90, '成都市青羊区日月大道88号', '何经理', '13808280303', 3800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 104.063963, 30.674788);

-- 山东省济南市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (49, '济南物流中心', 'SD-JN-01', 80, '济南市历下区工业北路17号', '张经理', '13809290101', 4500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.02648, 36.651329);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (50, '济南历城物流园区', 'SD-JN-02', 92, '济南市历城区工业园路111号', '徐经理', '13809290202', 3900.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.065222, 36.680171);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (51, '章丘铁路物流基地', 'SD-JN-03', 93, '济南市章丘区济青路88号', '王经理', '13809290303', 4200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.534749, 36.714044);

-- 山东省青岛市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (52, '青岛港物流中心', 'SD-QD-01', 81, '青岛市黄岛区港润路18号', '孙经理', '13809290404', 6800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 120.192315, 35.966362);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (53, '青岛胶东国际机场货运中心', 'SD-QD-02', 81, '青岛市胶州市胶东机场路99号', '李经理', '13809290505', 5300.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 120.076285, 36.315193);

-- 辽宁省沈阳市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (54, '沈阳国际物流中心', 'LN-SY-01', 82, '沈阳市沈河区沈水路15号', '赵经理', '13810300101', 5100.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 123.458981, 41.796177);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (55, '沈阳于洪物流园区', 'LN-SY-02', 95, '沈阳市于洪区沈大高速路口', '钱经理', '13810300202', 4700.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 123.308119, 41.793726);

-- 辽宁省大连市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (56, '大连港集装箱物流中心', 'LN-DL-01', 83, '大连市中山区港湾街28号', '郭经理', '13810300303', 7200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 121.644733, 38.919345);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (57, '大连保税区物流园', 'LN-DL-02', 83, '大连市保税区海关路167号', '黄经理', '13810300404', 5800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 121.80666, 39.070469);

-- 天津市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (58, '天津港物流中心', 'TJ-BH-01', 87, '天津市滨海新区塘沽海港路88号', '李经理', '13811310101', 8500.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.735859, 39.005006);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (59, '天津空港物流区', 'TJ-BH-02', 87, '天津市滨海新区空港经济区', '王经理', '13811310202', 6200.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.401054, 39.104504);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (60, '天津西站物流园', 'TJ-HP-01', 86, '天津市红桥区西站前广场1号', '张经理', '13811310303', 3900.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 117.165475, 39.158282);

-- 重庆市站点
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (61, '重庆果园港物流中心', 'CQ-JB-01', 85, '重庆市江北区鱼嘴镇果园港', '陈经理', '13812320101', 5900.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 106.651846, 29.724284);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (62, '重庆西部物流园', 'CQ-YZ-01', 84, '重庆市沙坪坝区西永镇', '周经理', '13812320202', 6300.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 106.431598, 29.659861);
INSERT INTO logistics.station (id, name, code, region_id, address, contact_name, contact_phone, capacity, status, create_time, update_time, is_delete, longitude, latitude) VALUES (63, '重庆江北国际机场物流中心', 'CQ-JB-02', 85, '重庆市渝北区江北国际机场', '吴经理', '13812320303', 4800.00, 1, '2025-05-02 20:01:15', '2025-05-02 20:01:15', 0, 106.643696, 29.718634);

