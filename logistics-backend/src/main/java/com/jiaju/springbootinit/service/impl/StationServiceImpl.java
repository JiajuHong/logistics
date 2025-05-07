package com.jiaju.springbootinit.service.impl;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.mapper.StationMapper;
import com.jiaju.springbootinit.model.entity.Region;
import com.jiaju.springbootinit.model.entity.Station;
import com.jiaju.springbootinit.model.vo.StationVO;
import com.jiaju.springbootinit.service.RegionService;
import com.jiaju.springbootinit.service.StationService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 站点服务实现
 */
@Service
public class StationServiceImpl extends ServiceImpl<StationMapper, Station> implements StationService {

    @Resource
    private RegionService regionService;

    @Override
    public void validStation(Station station, boolean add) {
        if (station == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        String name = station.getName();
        String code = station.getCode();
        Long regionId = station.getRegionId();
        
        // 创建时必须要有名称、编码和所属区域
        if (add) {
            if (StringUtils.isAnyBlank(name, code) || regionId == null) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "站点名称、编码和所属区域不能为空");
            }
        }
        
        if (StringUtils.isNotBlank(name) && name.length() > 50) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "站点名称过长");
        }
        
        if (StringUtils.isNotBlank(code)) {
            if (code.length() > 20) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "站点编码过长");
            }
            
            // 创建时校验站点编码是否已存在
            if (add) {
                QueryWrapper<Station> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("code", code);
                long count = this.count(queryWrapper);
                if (count > 0) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "站点编码已存在");
                }
            }
        }
    }
    
    @Override
    public StationVO getStationVO(Station station) {
        if (station == null) {
            return null;
        }
        StationVO stationVO = new StationVO();
        BeanUtils.copyProperties(station, stationVO);
        
        // 填充区域名称
        Long regionId = station.getRegionId();
        if (regionId != null) {
            Region region = regionService.getById(regionId);
            if (region != null) {
                stationVO.setRegionName(region.getName());
            }
        }
        
        return stationVO;
    }

    @Override
    public List<StationVO> getStationVO(List<Station> stationList) {
        if (CollUtil.isEmpty(stationList)) {
            return new ArrayList<>();
        }
        
        // 获取所有区域ID
        Set<Long> regionIdSet = stationList.stream()
                .map(Station::getRegionId)
                .filter(id -> id != null)
                .collect(Collectors.toSet());
        
        // 批量查询区域信息
        Map<Long, String> regionIdNameMap = new java.util.HashMap<>();
        if (CollUtil.isNotEmpty(regionIdSet)) {
            List<Region> regionList = regionService.listByIds(regionIdSet);
            regionIdNameMap = regionList.stream()
                    .collect(Collectors.toMap(Region::getId, Region::getName));
        }
        
        // 填充VO对象
        Map<Long, String> finalRegionIdNameMap = regionIdNameMap;
        return stationList.stream().map(station -> {
            StationVO stationVO = new StationVO();
            BeanUtils.copyProperties(station, stationVO);
            
            // 填充区域名称
            Long regionId = station.getRegionId();
            if (regionId != null) {
                stationVO.setRegionName(finalRegionIdNameMap.get(regionId));
            }
            
            return stationVO;
        }).collect(Collectors.toList());
    }
} 