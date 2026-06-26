import { defineProtoDevControls, type ProtoDevControlInput } from '@axhub/annotation';

export type ProfileVariant = 'steady' | 'balanced' | 'bold';

export const profileVariantControls: ProtoDevControlInput[] = [
    {
        type: 'segmented',
        attributeId: 'profile_variant',
        displayName: '个人中心方案',
        info: '多方案探索：可在 Genie 工具栏切换对比三种布局方向。',
        initialValue: 'balanced',
        options: [
            {
                label: '稳健型',
                value: 'steady',
            },
            {
                label: '平衡型',
                value: 'balanced',
            },
            {
                label: '突破型',
                value: 'bold',
            },
        ],
    },
];

let registered = false;

export function ensureProfileExploreControls() {
    if (registered) {
        return;
    }
    defineProtoDevControls(profileVariantControls);
    registered = true;
}

export function resolveProfileVariant(value: unknown): ProfileVariant {
    if (value === 'steady' || value === 'bold') {
        return value;
    }
    return 'balanced';
}
