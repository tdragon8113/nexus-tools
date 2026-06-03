package com.nexus.workspace.infrastructure.persistence.mapper;

import com.nexus.workspace.domain.model.lifecard.LifeCard;
import com.nexus.workspace.domain.model.lifecard.LifeCardChild;
import org.apache.ibatis.annotations.Param;

import java.util.List;

public interface LifeCardMapper {
    List<LifeCard> findCardsByUserId(@Param("userId") Long userId);

    List<LifeCardChild> findChildrenByUserId(@Param("userId") Long userId);

    List<LifeCardChild> findChildrenByLifeCardId(@Param("lifeCardId") Long lifeCardId);

    int deleteChildrenByUserId(@Param("userId") Long userId);

    int deleteCardsByUserId(@Param("userId") Long userId);

    int insertCard(LifeCard card);

    int updateCard(LifeCard card);

    int insertChild(LifeCardChild child);

    int updateChild(LifeCardChild child);

    int deleteChildrenByLifeCardId(@Param("lifeCardId") Long lifeCardId);

    int deleteChildrenByLifeCardIdExcept(
        @Param("lifeCardId") Long lifeCardId,
        @Param("keepIds") List<Long> keepIds
    );

    int deleteCardsByUserIdExcept(@Param("userId") Long userId, @Param("keepIds") List<Long> keepIds);
}
