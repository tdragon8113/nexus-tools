package com.nexus.workspace.interfaces.dto.response;

import lombok.Data;

@Data
public class ActivityCategoryResponse {
    private String id;
    private String label;
    private String emoji;
    private Integer xpPerHour;
    private Integer sortOrder;
}
