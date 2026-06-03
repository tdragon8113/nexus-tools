package com.nexus.workspace.application.support;

import java.util.List;

public final class LifeCardDefaults {

    private LifeCardDefaults() {}

    public record DefaultCard(String name, List<String> childNames) {}

    public static List<DefaultCard> createDefaultCards() {
        return List.of(
            new DefaultCard("日常", List.of("做饭", "家务", "购物")),
            new DefaultCard("工作", List.of("会议", "写代码", "沟通")),
            new DefaultCard("休息", List.of("午睡", "放松", "娱乐")),
            new DefaultCard("运动", List.of("跑步", "健身", "散步")),
            new DefaultCard("阅读", List.of("读书", "文章")),
            new DefaultCard("社交", List.of("见面", "聊天")),
            new DefaultCard("出行", List.of("通勤", "外出"))
        );
    }
}
