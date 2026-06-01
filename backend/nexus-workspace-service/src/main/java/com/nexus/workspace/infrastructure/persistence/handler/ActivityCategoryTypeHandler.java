package com.nexus.workspace.infrastructure.persistence.handler;

import com.nexus.workspace.domain.model.activity.ActivityCategory;
import org.apache.ibatis.type.BaseTypeHandler;
import org.apache.ibatis.type.JdbcType;
import org.apache.ibatis.type.MappedTypes;

import java.sql.CallableStatement;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

@MappedTypes(ActivityCategory.class)
public class ActivityCategoryTypeHandler extends BaseTypeHandler<ActivityCategory> {

    @Override
    public void setNonNullParameter(PreparedStatement ps, int i, ActivityCategory parameter, JdbcType jdbcType)
        throws SQLException {
        ps.setString(i, parameter.getCode());
    }

    @Override
    public ActivityCategory getNullableResult(ResultSet rs, String columnName) throws SQLException {
        return ActivityCategory.fromString(rs.getString(columnName));
    }

    @Override
    public ActivityCategory getNullableResult(ResultSet rs, int columnIndex) throws SQLException {
        return ActivityCategory.fromString(rs.getString(columnIndex));
    }

    @Override
    public ActivityCategory getNullableResult(CallableStatement cs, int columnIndex) throws SQLException {
        return ActivityCategory.fromString(cs.getString(columnIndex));
    }
}
