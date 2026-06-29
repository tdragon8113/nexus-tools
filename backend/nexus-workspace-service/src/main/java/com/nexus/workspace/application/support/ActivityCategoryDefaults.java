package com.nexus.workspace.application.support;

import com.nexus.workspace.domain.model.category.UserActivityCategory;

import java.util.ArrayList;
import java.util.List;

public final class ActivityCategoryDefaults {

    private ActivityCategoryDefaults() {}

    public record DefaultCategory(String slug, String label, String emoji, int xpPerHour) {}

    public static List<DefaultCategory> createDefaults() {
        return List.of(
            new DefaultCategory("work", "工作", "💼", 20),
            new DefaultCategory("study", "学习", "📚", 25),
            new DefaultCategory("exercise", "运动", "🏃", 30),
            new DefaultCategory("social", "社交", "👥", 18),
            new DefaultCategory("sleep", "睡觉", "🛌", 10),
            new DefaultCategory("rest", "休息", "😴", 10),
            new DefaultCategory("entertainment", "娱乐", "🎮", 12),
            new DefaultCategory("other", "其他", "✨", 15)
        );
    }

    public static List<UserActivityCategory> buildEntities(Long userId) {
        List<UserActivityCategory> categories = new ArrayList<>();
        int index = 0;
        for (DefaultCategory template : createDefaults()) {
            UserActivityCategory category = new UserActivityCategory();
            category.setUserId(userId);
            category.setSlug(template.slug());
            category.setLabel(template.label());
            category.setEmoji(template.emoji());
            category.setXpPerHour(template.xpPerHour());
            category.setSortOrder(index++);
            categories.add(category);
        }
        return categories;
    }
}
