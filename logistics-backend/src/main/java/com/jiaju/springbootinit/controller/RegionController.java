package com.jiaju.springbootinit.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.jiaju.springbootinit.annotation.AuthCheck;
import com.jiaju.springbootinit.common.BaseResponse;
import com.jiaju.springbootinit.common.DeleteRequest;
import com.jiaju.springbootinit.common.ErrorCode;
import com.jiaju.springbootinit.common.ResultUtils;
import com.jiaju.springbootinit.constant.CommonConstant;
import com.jiaju.springbootinit.constant.UserConstant;
import com.jiaju.springbootinit.exception.BusinessException;
import com.jiaju.springbootinit.exception.ThrowUtils;
import com.jiaju.springbootinit.model.dto.region.RegionAddRequest;
import com.jiaju.springbootinit.model.dto.region.RegionQueryRequest;
import com.jiaju.springbootinit.model.dto.region.RegionUpdateRequest;
import com.jiaju.springbootinit.model.entity.Region;
import com.jiaju.springbootinit.model.vo.RegionVO;
import com.jiaju.springbootinit.service.RegionService;
import com.jiaju.springbootinit.service.UserService;
import com.jiaju.springbootinit.utils.SqlUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 区域接口
 */
@RestController
@RequestMapping("/region")
@Slf4j
public class RegionController {

    @Resource
    private RegionService regionService;

    @Resource
    private UserService userService;

    // region 增删改查

    /**
     * 创建区域
     *
     * @param regionAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Long> addRegion(@RequestBody RegionAddRequest regionAddRequest, HttpServletRequest request) {
        if (regionAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Region region = new Region();
        BeanUtils.copyProperties(regionAddRequest, region);
        // 校验
        regionService.validRegion(region, true);
        boolean result = regionService.save(region);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(region.getId());
    }

    /**
     * 删除区域
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteRegion(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long id = deleteRequest.getId();
        // 判断是否存在
        Region oldRegion = regionService.getById(id);
        ThrowUtils.throwIf(oldRegion == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = regionService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 更新区域
     *
     * @param regionUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateRegion(@RequestBody RegionUpdateRequest regionUpdateRequest,
                                            HttpServletRequest request) {
        if (regionUpdateRequest == null || regionUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Region region = new Region();
        BeanUtils.copyProperties(regionUpdateRequest, region);
        // 参数校验
        regionService.validRegion(region, false);
        long id = regionUpdateRequest.getId();
        // 判断是否存在
        Region oldRegion = regionService.getById(id);
        ThrowUtils.throwIf(oldRegion == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = regionService.updateById(region);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取区域
     *
     * @param id
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<RegionVO> getRegionById(long id) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Region region = regionService.getById(id);
        if (region == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(regionService.getRegionVO(region));
    }

    /**
     * 获取区域列表（仅管理员可使用）
     *
     * @param regionQueryRequest
     * @return
     */
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @GetMapping("/list")
    public BaseResponse<List<RegionVO>> listRegion(RegionQueryRequest regionQueryRequest) {
        Region regionQuery = new Region();
        if (regionQueryRequest != null) {
            BeanUtils.copyProperties(regionQueryRequest, regionQuery);
        }
        QueryWrapper<Region> queryWrapper = new QueryWrapper<>(regionQuery);
        List<Region> regionList = regionService.list(queryWrapper);
        return ResultUtils.success(regionService.getRegionVO(regionList));
    }

    /**
     * 分页获取区域列表
     *
     * @param regionQueryRequest
     * @return
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<RegionVO>> listRegionByPage(RegionQueryRequest regionQueryRequest) {
        if (regionQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Region regionQuery = new Region();
        BeanUtils.copyProperties(regionQueryRequest, regionQuery);
        long current = regionQueryRequest.getCurrent();
        long size = regionQueryRequest.getPageSize();
        String sortField = regionQueryRequest.getSortField();
        String sortOrder = regionQueryRequest.getSortOrder();
        // 限制爬虫
        ThrowUtils.throwIf(size > 50, ErrorCode.PARAMS_ERROR);
        QueryWrapper<Region> queryWrapper = new QueryWrapper<>();
        queryWrapper.like(StringUtils.isNotBlank(regionQuery.getName()), "name", regionQuery.getName());
        queryWrapper.like(StringUtils.isNotBlank(regionQuery.getCode()), "code", regionQuery.getCode());
        queryWrapper.eq(regionQuery.getParentId() != null, "parent_id", regionQuery.getParentId());
        queryWrapper.eq(regionQuery.getLevel() != null, "level", regionQuery.getLevel());
        queryWrapper.eq(regionQuery.getStatus() != null, "status", regionQuery.getStatus());
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), sortOrder.equals(CommonConstant.SORT_ORDER_ASC),
                sortField);
        Page<Region> regionPage = regionService.page(new Page<>(current, size), queryWrapper);
        
        // 转换为VO列表
        Page<RegionVO> regionVOPage = new Page<>(regionPage.getCurrent(), regionPage.getSize(), regionPage.getTotal());
        List<RegionVO> regionVOList = regionService.getRegionVO(regionPage.getRecords());
        regionVOPage.setRecords(regionVOList);
        
        return ResultUtils.success(regionVOPage);
    }

    // endregion
} 