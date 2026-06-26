import { defineProtoDevControls, type ProtoDevControlInput } from '@axhub/annotation';

export type StatsVariant = 'drill' | 'balance' | 'report' | 'tabs';

export const statsVariantControls: ProtoDevControlInput[] = [
    {
        type: 'segmented',
        attributeId: 'stats_variant',
        displayName: '统计页方案',
        info: '多方案探索：可在 Genie 工具栏切换对比四种统计页布局方向。',
        initialValue: 'drill',
        options: [
            {
                label: '可下钻',
                value: 'drill',
            },
            {
                label: '生活平衡',
                value: 'balance',
            },
            {
                label: '一屏周报',
                value: 'report',
            },
            {
                label: '分 Tab',
                value: 'tabs',
            },
        ],
    },
];

let registered = false;

export function ensureStatsExploreControls() {
    if (registered) {
        return;
    }
    defineProtoDevControls(statsVariantControls);
    registered = true;
}

export function resolveStatsVariant(value: unknown): StatsVariant {
    if (value === 'balance' || value === 'report' || value === 'tabs') {
        return value;
    }
    return 'drill';
}
