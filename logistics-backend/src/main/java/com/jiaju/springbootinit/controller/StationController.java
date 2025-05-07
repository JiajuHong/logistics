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
import com.jiaju.springbootinit.model.dto.station.StationAddRequest;
import com.jiaju.springbootinit.model.dto.station.StationQueryRequest;
import com.jiaju.springbootinit.model.dto.station.StationUpdateRequest;
import com.jiaju.springbootinit.model.entity.Station;
import com.jiaju.springbootinit.model.vo.StationVO;
import com.jiaju.springbootinit.service.StationService;
import com.jiaju.springbootinit.utils.SqlUtils;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.List;

/**
 * 站点接口
 */
@RestController
@RequestMapping("/station")
@Slf4j
public class StationController {

    @Resource
    private StationService stationService;

    // region 增删改查

    /**
     * 创建站点
     *
     * @param stationAddRequest
     * @param request
     * @return
     */
    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Long> addStation(@RequestBody StationAddRequest stationAddRequest, HttpServletRequest request) {
        if (stationAddRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Station station = new Station();
        BeanUtils.copyProperties(stationAddRequest, station);
        // 校验
        stationService.validStation(station, true);
        boolean result = stationService.save(station);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(station.getId());
    }

    /**
     * 删除站点
     *
     * @param deleteRequest
     * @param request
     * @return
     */
    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> deleteStation(@RequestBody DeleteRequest deleteRequest, HttpServletRequest request) {
        if (deleteRequest == null || deleteRequest.getId() <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        long id = deleteRequest.getId();
        // 判断是否存在
        Station oldStation = stationService.getById(id);
        ThrowUtils.throwIf(oldStation == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = stationService.removeById(id);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 更新站点
     *
     * @param stationUpdateRequest
     * @param request
     * @return
     */
    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    public BaseResponse<Boolean> updateStation(@RequestBody StationUpdateRequest stationUpdateRequest,
                                            HttpServletRequest request) {
        if (stationUpdateRequest == null || stationUpdateRequest.getId() == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Station station = new Station();
        BeanUtils.copyProperties(stationUpdateRequest, station);
        // 参数校验
        stationService.validStation(station, false);
        long id = stationUpdateRequest.getId();
        // 判断是否存在
        Station oldStation = stationService.getById(id);
        ThrowUtils.throwIf(oldStation == null, ErrorCode.NOT_FOUND_ERROR);
        boolean result = stationService.updateById(station);
        ThrowUtils.throwIf(!result, ErrorCode.OPERATION_ERROR);
        return ResultUtils.success(true);
    }

    /**
     * 根据 id 获取站点
     *
     * @param id
     * @return
     */
    @GetMapping("/get")
    public BaseResponse<StationVO> getStationById(long id) {
        if (id <= 0) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Station station = stationService.getById(id);
        if (station == null) {
            throw new BusinessException(ErrorCode.NOT_FOUND_ERROR);
        }
        return ResultUtils.success(stationService.getStationVO(station));
    }

    /**
     * 获取站点列表（仅管理员可使用）
     *
     * @param stationQueryRequest
     * @return
     */
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @GetMapping("/list")
    public BaseResponse<List<StationVO>> listStation(StationQueryRequest stationQueryRequest) {
        Station stationQuery = new Station();
        if (stationQueryRequest != null) {
            BeanUtils.copyProperties(stationQueryRequest, stationQuery);
        }
        QueryWrapper<Station> queryWrapper = new QueryWrapper<>(stationQuery);
        List<Station> stationList = stationService.list(queryWrapper);
        return ResultUtils.success(stationService.getStationVO(stationList));
    }

    /**
     * 分页获取站点列表
     *
     * @param stationQueryRequest
     * @return
     */
    @GetMapping("/list/page")
    public BaseResponse<Page<StationVO>> listStationByPage(StationQueryRequest stationQueryRequest) {
        if (stationQueryRequest == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        Station stationQuery = new Station();
        BeanUtils.copyProperties(stationQueryRequest, stationQuery);
        long current = stationQueryRequest.getCurrent();
        long size = stationQueryRequest.getPageSize();
        String sortField = stationQueryRequest.getSortField();
        String sortOrder = stationQueryRequest.getSortOrder();
        // 限制爬虫
        ThrowUtils.throwIf(size > 50, ErrorCode.PARAMS_ERROR);
        QueryWrapper<Station> queryWrapper = new QueryWrapper<>();
        queryWrapper.like(StringUtils.isNotBlank(stationQuery.getName()), "name", stationQuery.getName());
        queryWrapper.like(StringUtils.isNotBlank(stationQuery.getCode()), "code", stationQuery.getCode());
        queryWrapper.eq(stationQuery.getRegionId() != null, "region_id", stationQuery.getRegionId());
        queryWrapper.like(StringUtils.isNotBlank(stationQuery.getAddress()), "address", stationQuery.getAddress());
        queryWrapper.like(StringUtils.isNotBlank(stationQuery.getContactName()), "contact_name", stationQuery.getContactName());
        queryWrapper.like(StringUtils.isNotBlank(stationQuery.getContactPhone()), "contact_phone", stationQuery.getContactPhone());
        queryWrapper.eq(stationQuery.getStatus() != null, "status", stationQuery.getStatus());
        queryWrapper.orderBy(SqlUtils.validSortField(sortField), sortOrder.equals(CommonConstant.SORT_ORDER_ASC),
                sortField);
        Page<Station> stationPage = stationService.page(new Page<>(current, size), queryWrapper);
        
        // 转换为VO列表
        Page<StationVO> stationVOPage = new Page<>(stationPage.getCurrent(), stationPage.getSize(), stationPage.getTotal());
        List<StationVO> stationVOList = stationService.getStationVO(stationPage.getRecords());
        stationVOPage.setRecords(stationVOList);
        
        return ResultUtils.success(stationVOPage);
    }

    // endregion
} 