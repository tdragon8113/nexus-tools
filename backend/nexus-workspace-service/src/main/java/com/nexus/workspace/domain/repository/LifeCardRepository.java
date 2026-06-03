package com.nexus.workspace.domain.repository;

import com.nexus.workspace.domain.model.lifecard.LifeCard;

import java.util.List;

public interface LifeCardRepository {
    List<LifeCard> findByUserId(Long userId);

    List<LifeCard> saveAll(Long userId, List<LifeCard> cards);

    void replaceAll(Long userId, List<LifeCard> cards);
}
