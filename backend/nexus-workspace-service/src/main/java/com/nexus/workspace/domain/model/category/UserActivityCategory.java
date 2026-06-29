package com.nexus.workspace.domain.model.category;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UserActivityCategory {
    private Long id;
    private Long userId;
    private String slug;
    private String label;
    private String emoji;
    private int xpPerHour;
    private int sortOrder;
}
