-- 向transport_task表添加assign_time字段
ALTER TABLE transport_task
ADD COLUMN assign_time DATETIME COMMENT '任务分配时间';

-- 向transport_order表添加cancel_time字段
ALTER TABLE transport_order
ADD COLUMN cancel_time DATETIME COMMENT '订单取消时间';

-- 向transport_order表添加reject_time字段
ALTER TABLE transport_order
ADD COLUMN reject_time DATETIME COMMENT '订单拒绝时间'; 