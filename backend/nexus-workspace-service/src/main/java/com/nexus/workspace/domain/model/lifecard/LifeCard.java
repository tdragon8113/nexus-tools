package com.nexus.workspace.domain.model.lifecard;

import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class LifeCard {
    private Long id;
    private Long userId;
    private String name;
    private int sortOrder;
    private List<LifeCardChild> children = new ArrayList<>();
}
