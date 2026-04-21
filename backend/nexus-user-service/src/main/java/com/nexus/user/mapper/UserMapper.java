package com.nexus.user.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.nexus.user.entity.User;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserMapper extends BaseMapper<User> {
    User findByUsername(String username);
    User findByEmail(String email);
}