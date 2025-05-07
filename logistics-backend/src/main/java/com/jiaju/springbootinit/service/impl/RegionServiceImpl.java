package com.jiaju.springbootinit.service.impl;

import cn.hutool.core.collection.CollUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.mapper.RegionMapper;
import com.jiaju.springbootinit.model.entity.Region;
import com.jiaju.springbootinit.model.vo.RegionVO;
import com.jiaju.springbootinit.service.RegionService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * 区域服务实现
 */
@Service
public class RegionServiceImpl extends ServiceImpl<RegionMapper, Region> implements RegionService {

    @Override
    public void validRegion(Region region, boolean add) {
        if (region == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        
        String name = region.getName();
        String code = region.getCode();
        
        // 创建时必须要有名称和编码
        if (add) {
            if (StringUtils.isAnyBlank(name, code)) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "区域名称和编码不能为空");
            }
        }
        
        if (StringUtils.isNotBlank(name) && name.length() > 50) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "区域名称过长");
        }
        
        if (StringUtils.isNotBlank(code)) {
            if (code.length() > 20) {
                throw new BusinessException(ErrorCode.PARAMS_ERROR, "区域编码过长");
            }
            
            // 创建时校验区域编码是否已存在
            if (add) {
                QueryWrapper<Region> queryWrapper = new QueryWrapper<>();
                queryWrapper.eq("code", code);
                long count = this.count(queryWrapper);
                if (count > 0) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "区域编码已存在");
                }
            }
        }
    }
    
    @Override
    public RegionVO getRegionVO(Region region) {
        if (region == null) {
            return null;
        }
        RegionVO regionVO = new RegionVO();
        BeanUtils.copyProperties(region, regionVO);
        
        // 如果有父级区域ID，查询父级区域名称并填充
        if (region.getParentId() != null && region.getParentId() > 0) {
            Region parentRegion = this.getById(region.getParentId());
            if (parentRegion != null) {
                regionVO.setParentName(parentRegion.getName());
            }
        }
        
        return regionVO;
    }

    @Override
    public List<RegionVO> getRegionVO(List<Region> regionList) {
        if (CollUtil.isEmpty(regionList)) {
            return new ArrayList<>();
        }
        
        // 优化：批量查询父级区域信息，减少数据库查询次数
        // 1. 收集所有父级区域ID
        Set<Long> parentIds = regionList.stream()
                .map(Region::getParentId)
                .filter(Objects::nonNull)
                .filter(id -> id > 0)
                .collect(Collectors.toSet());
                
        // 2. 一次性查询所有父级区域信息
        Map<Long, String> parentNameMap = new HashMap<>();
        if (!parentIds.isEmpty()) {
            List<Region> parentRegions = this.listByIds(parentIds);
            parentNameMap = parentRegions.stream()
                    .collect(Collectors.toMap(Region::getId, Region::getName));
        }
        
        // 3. 转换为VO并填充父级区域名称
        List<RegionVO> regionVOList = new ArrayList<>(regionList.size());
        for (Region region : regionList) {
            RegionVO regionVO = new RegionVO();
            BeanUtils.copyProperties(region, regionVO);
            
            // 填充父级区域名称
            if (region.getParentId() != null && region.getParentId() > 0) {
                regionVO.setParentName(parentNameMap.get(region.getParentId()));
            }
            
            regionVOList.add(regionVO);
        }
        
        return regionVOList;
    }
} 