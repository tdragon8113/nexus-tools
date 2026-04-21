package com.nexus.common.dto;

import lombok.Data;

/**
 * 分页请求参数
 */
@Data
public class PageRequest {
    private int page = 1;
    private int size = 20;
    private String sortBy;
    private String sortDirection = "DESC";

    public int getOffset() {
        return (page - 1) * size;
    }
}