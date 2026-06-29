package com.nexus.workspace.domain.model.reflection;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class UserReflection {
    private Long id;
    private Long userId;
    private ReflectionScope scope;
    private String periodKey;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
