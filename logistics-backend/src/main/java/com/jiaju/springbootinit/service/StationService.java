package com.jiaju.springbootinit.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jiaju.springbootinit.model.entity.Station;
import com.jiaju.springbootinit.model.vo.StationVO;

import java.util.List;

/**
 * 站点服务
 */
public interface StationService extends IService<Station> {

    /**
     * 校验站点是否合法
     * 
     * @param station 站点信息
     * @param add 是否为创建校验
     */
    void validStation(Station station, boolean add);
    
    /**
     * 获取站点视图对象
     *
     * @param station
     * @return
     */
    StationVO getStationVO(Station station);

    /**
     * 获取站点视图对象列表
     *
     * @param stationList
     * @return
     */
    List<StationVO> getStationVO(List<Station> stationList);
} 