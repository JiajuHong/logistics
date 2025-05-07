package com.jiaju.springbootinit.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.jiaju.springbootinit.model.entity.Region;
import com.jiaju.springbootinit.model.vo.RegionVO;

import java.util.List;

/**
 * 区域服务
 */
public interface RegionService extends IService<Region> {

    /**
     * 校验区域是否合法
     * 
     * @param region 区域信息
     * @param add 是否为创建校验
     */
    void validRegion(Region region, boolean add);
    
    /**
     * 获取区域视图对象
     *
     * @param region
     * @return
     */
    RegionVO getRegionVO(Region region);

    /**
     * 获取区域视图对象列表
     *
     * @param regionList
     * @return
     */
    List<RegionVO> getRegionVO(List<Region> regionList);
} 