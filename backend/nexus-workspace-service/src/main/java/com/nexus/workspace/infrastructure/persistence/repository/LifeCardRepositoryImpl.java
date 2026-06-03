package com.nexus.workspace.infrastructure.persistence.repository;

import com.nexus.workspace.domain.model.lifecard.LifeCard;
import com.nexus.workspace.domain.model.lifecard.LifeCardChild;
import com.nexus.workspace.domain.repository.LifeCardRepository;
import com.nexus.workspace.infrastructure.persistence.mapper.LifeCardMapper;
import org.springframework.stereotype.Repository;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Repository
public class LifeCardRepositoryImpl implements LifeCardRepository {

    private final LifeCardMapper lifeCardMapper;

    public LifeCardRepositoryImpl(LifeCardMapper lifeCardMapper) {
        this.lifeCardMapper = lifeCardMapper;
    }

    @Override
    public List<LifeCard> findByUserId(Long userId) {
        List<LifeCard> cards = lifeCardMapper.findCardsByUserId(userId);
        if (cards.isEmpty()) {
            return List.of();
        }

        Map<Long, List<LifeCardChild>> childrenByCardId = lifeCardMapper.findChildrenByUserId(userId).stream()
            .collect(Collectors.groupingBy(LifeCardChild::getLifeCardId));

        for (LifeCard card : cards) {
            card.setChildren(new ArrayList<>(childrenByCardId.getOrDefault(card.getId(), List.of())));
        }
        return cards;
    }

    @Override
    public List<LifeCard> saveAll(Long userId, List<LifeCard> cards) {
        Set<Long> existingIds = lifeCardMapper.findCardsByUserId(userId).stream()
            .map(LifeCard::getId)
            .collect(Collectors.toSet());

        List<Long> keptCardIds = new ArrayList<>();
        for (int i = 0; i < cards.size(); i++) {
            LifeCard card = cards.get(i);
            card.setUserId(userId);
            card.setSortOrder(i);

            if (card.getId() != null && existingIds.contains(card.getId())) {
                lifeCardMapper.updateCard(card);
                saveChildren(card, true);
            } else {
                card.setId(null);
                lifeCardMapper.insertCard(card);
                saveChildren(card, false);
            }

            keptCardIds.add(card.getId());
        }

        lifeCardMapper.deleteCardsByUserIdExcept(userId, keptCardIds);
        return findByUserId(userId);
    }

    @Override
    public void replaceAll(Long userId, List<LifeCard> cards) {
        lifeCardMapper.deleteChildrenByUserId(userId);
        lifeCardMapper.deleteCardsByUserId(userId);

        for (int i = 0; i < cards.size(); i++) {
            LifeCard card = cards.get(i);
            card.setUserId(userId);
            card.setSortOrder(i);
            card.setId(null);
            lifeCardMapper.insertCard(card);
            saveChildren(card, false);
        }
    }

    private void saveChildren(LifeCard card, boolean mergeExisting) {
        List<LifeCardChild> children = card.getChildren() != null ? card.getChildren() : List.of();
        List<LifeCardChild> savedChildren = new ArrayList<>();
        Set<Long> existingChildIds = new HashSet<>();

        if (mergeExisting && card.getId() != null) {
            existingChildIds = lifeCardMapper.findChildrenByLifeCardId(card.getId()).stream()
                .map(LifeCardChild::getId)
                .collect(Collectors.toSet());
        }

        List<Long> keptChildIds = new ArrayList<>();
        for (int j = 0; j < children.size(); j++) {
            LifeCardChild child = children.get(j);
            child.setLifeCardId(card.getId());
            child.setUserId(card.getUserId());
            child.setSortOrder(j);

            if (mergeExisting && child.getId() != null && existingChildIds.contains(child.getId())) {
                lifeCardMapper.updateChild(child);
            } else {
                child.setId(null);
                lifeCardMapper.insertChild(child);
            }

            keptChildIds.add(child.getId());
            savedChildren.add(child);
        }

        if (mergeExisting && card.getId() != null) {
            lifeCardMapper.deleteChildrenByLifeCardIdExcept(card.getId(), keptChildIds);
        }

        card.setChildren(savedChildren);
    }

    private void insertChildren(LifeCard card) {
        saveChildren(card, false);
    }
}
