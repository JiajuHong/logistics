package com.jiaju.springbootinit.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jiaju.springbootinit.model.entity.TransportTask;
import com.jiaju.springbootinit.model.vo.TransportTaskVO;

import java.util.List;

/**
 * 运输任务服务
 */
public interface TransportTaskService extends IService<TransportTask> {

    /**
     * 校验运输任务是否合法
     * 
     * @param transportTask 运输任务信息
     * @param add 是否为创建校验
     */
    void validTransportTask(TransportTask transportTask, boolean add);
    
    /**
     * 获取运输任务VO
     *
     * @param transportTask 运输任务实体
     * @return 运输任务VO
     */
    TransportTaskVO getTransportTaskVO(TransportTask transportTask);
    
    /**
     * 获取运输任务VO列表
     *
     * @param transportTaskList 运输任务实体列表
     * @return 运输任务VO列表
     */
    List<TransportTaskVO> getTransportTaskVO(List<TransportTask> transportTaskList);
    
    /**
     * 分配车辆和司机
     * 
     * @param id 任务ID
     * @param vehicleId 车辆ID
     * @param driverId 司机ID
     * @return 是否分配成功
     */
    boolean assignTask(Long id, Long vehicleId, Long driverId);
    
    /**
     * 取消任务
     * 
     * @param id 任务ID
     * @return 是否取消成功
     */
    boolean cancelTask(Long id);
    
    /**
     * 更新任务状态，并根据状态自动设置相应的时间字段
     * 
     * @param id 任务ID
     * @param status 新状态：0-待分配, 1-待执行, 2-执行中, 3-已完成, 4-已取消
     * @return 是否更新成功
     */
    boolean updateTaskStatus(Long id, Integer status);
    
    /**
     * 从订单创建任务
     * 
     * @param orderId 订单ID
     * @return 任务ID
     */
    Long createTaskFromOrder(Long orderId);

    boolean removeById(Long id);
}