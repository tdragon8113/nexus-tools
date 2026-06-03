package com.nexus.workspace.application.service;

import com.nexus.common.exception.BusinessException;
import com.nexus.workspace.application.support.LifeCardDefaults;
import com.nexus.workspace.domain.model.lifecard.LifeCard;
import com.nexus.workspace.domain.model.lifecard.LifeCardChild;
import com.nexus.workspace.domain.repository.LifeCardRepository;
import com.nexus.workspace.interfaces.dto.lifecard.LifeCardChildDto;
import com.nexus.workspace.interfaces.dto.lifecard.LifeCardDto;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class LifeCardApplicationService {

    private final LifeCardRepository lifeCardRepository;

    public LifeCardApplicationService(LifeCardRepository lifeCardRepository) {
        this.lifeCardRepository = lifeCardRepository;
    }

    @Transactional(readOnly = true)
    public List<LifeCardDto> getLifeCards(Long userId) {
        List<LifeCard> cards = lifeCardRepository.findByUserId(userId);
        if (cards.isEmpty()) {
            return seedDefaults(userId);
        }
        return toDtoList(cards);
    }

    @Transactional
    public List<LifeCardDto> saveLifeCards(Long userId, List<LifeCardDto> cards) {
        validateCards(cards);
        List<LifeCard> entities = toEntityList(userId, cards);
        List<LifeCard> saved = lifeCardRepository.saveAll(userId, entities);
        log.info("Life cards saved: userId={}, count={}", userId, saved.size());
        return toDtoList(saved);
    }

    @Transactional
    public List<LifeCardDto> resetLifeCards(Long userId) {
        List<LifeCard> defaults = buildDefaultEntities(userId);
        lifeCardRepository.replaceAll(userId, defaults);
        log.info("Life cards reset to defaults: userId={}", userId);
        return toDtoList(defaults);
    }

    private List<LifeCardDto> seedDefaults(Long userId) {
        List<LifeCard> defaults = buildDefaultEntities(userId);
        lifeCardRepository.replaceAll(userId, defaults);
        log.info("Life cards seeded with defaults: userId={}", userId);
        return toDtoList(defaults);
    }

    private List<LifeCard> buildDefaultEntities(Long userId) {
        List<LifeCard> cards = new ArrayList<>();
        int cardIndex = 0;
        for (LifeCardDefaults.DefaultCard template : LifeCardDefaults.createDefaultCards()) {
            LifeCard card = new LifeCard();
            card.setUserId(userId);
            card.setName(template.name());
            card.setSortOrder(cardIndex++);

            List<LifeCardChild> children = new ArrayList<>();
            int childIndex = 0;
            for (String childName : template.childNames()) {
                LifeCardChild child = new LifeCardChild();
                child.setUserId(userId);
                child.setName(childName);
                child.setSortOrder(childIndex++);
                children.add(child);
            }
            card.setChildren(children);
            cards.add(card);
        }
        return cards;
    }

    private List<LifeCard> toEntityList(Long userId, List<LifeCardDto> cards) {
        List<LifeCard> entities = new ArrayList<>();
        for (int i = 0; i < cards.size(); i++) {
            LifeCardDto dto = cards.get(i);
            LifeCard card = new LifeCard();
            card.setId(parseId(dto.getId()));
            card.setUserId(userId);
            card.setName(dto.getLabel().trim());
            card.setSortOrder(i);

            List<LifeCardChildDto> childDtos = dto.getChildren() != null ? dto.getChildren() : List.of();
            List<LifeCardChild> children = new ArrayList<>();
            for (int j = 0; j < childDtos.size(); j++) {
                LifeCardChildDto childDto = childDtos.get(j);
                LifeCardChild child = new LifeCardChild();
                child.setId(parseId(childDto.getId()));
                child.setUserId(userId);
                child.setName(childDto.getLabel().trim());
                child.setSortOrder(j);
                children.add(child);
            }
            card.setChildren(children);
            entities.add(card);
        }
        return entities;
    }

    private Long parseId(String id) {
        if (id == null || id.isBlank()) {
            return null;
        }
        try {
            return Long.parseLong(id);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private List<LifeCardDto> toDtoList(List<LifeCard> cards) {
        List<LifeCardDto> dtos = new ArrayList<>();
        for (LifeCard card : cards) {
            LifeCardDto dto = new LifeCardDto();
            dto.setId(String.valueOf(card.getId()));
            dto.setLabel(card.getName());

            List<LifeCardChildDto> childDtos = new ArrayList<>();
            for (LifeCardChild child : card.getChildren()) {
                LifeCardChildDto childDto = new LifeCardChildDto();
                childDto.setId(String.valueOf(child.getId()));
                childDto.setLabel(child.getName());
                childDtos.add(childDto);
            }
            dto.setChildren(childDtos);
            dtos.add(dto);
        }
        return dtos;
    }

    private void validateCards(List<LifeCardDto> cards) {
        if (cards == null || cards.isEmpty()) {
            throw new BusinessException(400, "至少保留一个生活分类");
        }

        Set<String> cardLabels = new HashSet<>();
        for (LifeCardDto card : cards) {
            if (card.getLabel() == null || card.getLabel().isBlank()) {
                throw new BusinessException(400, "分类名称不能为空");
            }
            String label = card.getLabel().trim();
            if (!cardLabels.add(label)) {
                throw new BusinessException(400, "分类名称重复: " + label);
            }

            Set<String> childLabels = new HashSet<>();
            List<LifeCardChildDto> children = card.getChildren() != null ? card.getChildren() : List.of();
            for (LifeCardChildDto child : children) {
                if (child.getLabel() == null || child.getLabel().trim().isBlank()) {
                    throw new BusinessException(400, "子项名称不能为空");
                }
                String childLabel = child.getLabel().trim();
                if (!childLabels.add(childLabel)) {
                    throw new BusinessException(400, "子项名称重复: " + childLabel);
                }
            }
        }
    }
}
