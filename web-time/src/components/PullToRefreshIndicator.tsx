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
    const slotHeight = isHolding ? holdOffset : offset;
    const progress = isHolding ? 1 : Math.min(offset / threshold, 1);
    const visible = isHolding || (phase === 'pulling' && offset > 6) || phase === 'collapsing';
    const ready = offset >= threshold || isRefreshing;
    const label = isRefreshing ? '同步中…' : ready ? '松开刷新' : '下拉刷新';
    const opacity = isHolding ? 1 : Math.max(0.35, progress);

    if (!visible) {
        return null;
    }

    return (
        <div
            className="tj-pull-refresh-slot"
            style={{
                height: slotHeight,
                marginTop: slotHeight > 0 ? -slotHeight : 0,
            }}
            aria-live="polite"
            aria-busy={isRefreshing}
        >
            <div
                className={`tj-pull-refresh-inner${isRefreshing ? ' tj-pull-refresh-inner-spin' : ''}`}
                style={{ opacity }}
            >
                <span className="tj-pull-refresh-icon" aria-hidden="true" />
                <span className="tj-pull-refresh-label">{label}</span>
            </div>
        </div>
    );
}
