import type { CSSProperties } from 'react';

type PullToRefreshIndicatorProps = {
    offset: number;
    threshold: number;
    holdOffset: number;
    isRefreshing: boolean;
    phase: 'idle' | 'pulling' | 'hold' | 'refreshing' | 'collapsing';
};

export default function PullToRefreshIndicator({
    offset,
    threshold,
    holdOffset,
    isRefreshing,
    phase,
}: PullToRefreshIndicatorProps) {
    const isHolding = phase === 'hold' || phase === 'refreshing';
    const progress = isHolding ? 1 : Math.min(offset / threshold, 1);
    const visible =
        isHolding || (phase === 'pulling' && offset > 6);
    const ready = offset >= threshold || isRefreshing;
    const label = isRefreshing ? '同步中…' : ready ? '松开刷新' : '下拉刷新';
    const displayOffset = isHolding ? holdOffset : offset;

    const style = {
        '--pull-progress': `${progress}`,
        '--pull-indicator-offset': `${displayOffset}px`,
    } as CSSProperties;

    if (!visible) {
        return null;
    }

    return (
        <div className="tj-pull-refresh tj-pull-refresh-visible" style={style} aria-live="polite" aria-busy={isRefreshing}>
            <div
                className={`tj-pull-refresh-inner${isRefreshing ? ' tj-pull-refresh-inner-spin' : ''}`}
            >
                <span className="tj-pull-refresh-icon" aria-hidden="true" />
                <span className="tj-pull-refresh-label">{label}</span>
            </div>
        </div>
    );
}
