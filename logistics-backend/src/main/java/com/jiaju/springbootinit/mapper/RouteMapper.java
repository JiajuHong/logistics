package com.jiaju.springbootinit.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.jiaju.springbootinit.model.entity.Route;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RouteMapper extends BaseMapper<Route> {
}