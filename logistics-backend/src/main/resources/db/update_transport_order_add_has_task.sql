-- 添加has_task字段到transport_order表
ALTER TABLE transport_order 
ADD COLUMN has_task BOOLEAN DEFAULT false COMMENT '是否已创建任务：true-已创建，false-未创建';

-- 更新现有的订单，根据是否有关联任务设置has_task值
UPDATE transport_order o
SET o.has_task = EXISTS (
    SELECT 1 
    FROM transport_task t 
    WHERE t.order_id = o.id 
    AND t.is_delete = 0
);

-- 索引可以加快查询速度
CREATE INDEX idx_order_has_task ON transport_order(has_task); 