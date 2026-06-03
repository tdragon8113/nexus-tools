package com.nexus.workspace.domain.model.lifecard;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LifeCardChild {
    private Long id;
    private Long lifeCardId;
    private Long userId;
    private String name;
    private int sortOrder;
}
