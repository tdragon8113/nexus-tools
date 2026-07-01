import { useEffect, useRef, useState, type RefObject } from 'react';

export type PullToRefreshPhase = 'idle' | 'pulling' | 'hold' | 'refreshing' | 'collapsing';

type PullToRefreshState = {
    offset: number;
    phase: PullToRefreshPhase;
};

type UsePullToRefreshOptions = {
    scrollElementRef: RefObject<HTMLElement | null>;
    contentRef: RefObject<HTMLElement | null>;
    onRefresh: () => Promise<void>;
    enabled?: boolean;
    threshold?: number;
    holdOffset?: number;
};

const DEFAULT_THRESHOLD = 56;
const DEFAULT_HOLD = 48;
const MIN_REFRESH_MS = 420;
const COLLAPSE_MS = 320;

function rubberBand(delta: number, max: number) {
    if (delta <= 0) {
        return 0;
    }
    return max * (1 - 1 / ((delta * 0.55) / max + 1));
}

function wait(ms: number) {
    return new Promise<void>((resolve) => {
        window.setTimeout(resolve, ms);
    });
}

export function usePullToRefresh({
    scrollElementRef,
    contentRef,
    onRefresh,
    enabled = true,
    threshold = DEFAULT_THRESHOLD,
    holdOffset = DEFAULT_HOLD,
}: UsePullToRefreshOptions) {
    const [state, setState] = useState<PullToRefreshState>({
        offset: 0,
        phase: 'idle',
    });

    const stateRef = useRef(state);
    stateRef.current = state;
    const onRefreshRef = useRef(onRefresh);
    onRefreshRef.current = onRefresh;
    const pullingRef = useRef(false);
    const startYRef = useRef(0);
    const rafRef = useRef(0);
    const pendingOffsetRef = useRef(0);

    const applyOffset = (offset: number, phase: PullToRefreshPhase) => {
        pendingOffsetRef.current = offset;
        if (rafRef.current) {
            return;
        }
        rafRef.current = window.requestAnimationFrame(() => {
            rafRef.current = 0;
            setState({ offset: pendingOffsetRef.current, phase });
        });
    };

    const waitForCollapse = () =>
        new Promise<void>((resolve) => {
            const node = contentRef.current;
            if (!node) {
                window.setTimeout(resolve, COLLAPSE_MS);
                return;
            }

            let settled = false;
            const finish = () => {
                if (settled) {
                    return;
                }
                settled = true;
                node.removeEventListener('transitionend', onTransitionEnd);
                resolve();
            };

            const onTransitionEnd = (event: TransitionEvent) => {
                if (event.target === node && event.propertyName === 'transform') {
                    finish();
                }
            };

            node.addEventListener('transitionend', onTransitionEnd);
            window.setTimeout(finish, COLLAPSE_MS + 80);
        });

    useEffect(() => {
        if (!enabled) {
            pullingRef.current = false;
            setState({ offset: 0, phase: 'idle' });
        }
    }, [enabled]);

    useEffect(() => {
        const element = scrollElementRef.current;
        if (!element || !enabled) {
            return;
        }

        const resetPull = () => {
            pullingRef.current = false;
            if (stateRef.current.phase === 'pulling') {
                setState({ offset: 0, phase: 'collapsing' });
                void waitForCollapse().then(() => {
                    setState({ offset: 0, phase: 'idle' });
                });
            }
        };

        const onTouchStart = (event: TouchEvent) => {
            const { phase, offset } = stateRef.current;
            if (phase === 'refreshing' || phase === 'hold' || phase === 'collapsing') {
                return;
            }
            if (offset > 0 || element.scrollTop > 0) {
                return;
            }
            startYRef.current = event.touches[0]?.clientY ?? 0;
            pullingRef.current = true;
            applyOffset(0, 'pulling');
        };

        const onTouchMove = (event: TouchEvent) => {
            if (!pullingRef.current || stateRef.current.phase !== 'pulling') {
                return;
            }
            if (element.scrollTop > 0) {
                resetPull();
                return;
            }

            const currentY = event.touches[0]?.clientY ?? startYRef.current;
            const delta = currentY - startYRef.current;
            if (delta <= 0) {
                applyOffset(0, 'pulling');
                return;
            }

            event.preventDefault();
            applyOffset(rubberBand(delta, threshold * 1.5), 'pulling');
        };

        const onTouchEnd = () => {
            if (!pullingRef.current || stateRef.current.phase !== 'pulling') {
                return;
            }
            pullingRef.current = false;

            const { offset } = stateRef.current;
            if (offset >= threshold) {
                setState({ offset: holdOffset, phase: 'hold' });
                window.setTimeout(() => {
                    setState({ offset: holdOffset, phase: 'refreshing' });
                    void Promise.all([onRefreshRef.current(), wait(MIN_REFRESH_MS)])
                        .catch(() => undefined)
                        .finally(() => {
                            setState({ offset: 0, phase: 'collapsing' });
                            void waitForCollapse().then(() => {
                                setState({ offset: 0, phase: 'idle' });
                            });
                        });
                }, 120);
                return;
            }

            setState({ offset: 0, phase: 'collapsing' });
            void waitForCollapse().then(() => {
                setState({ offset: 0, phase: 'idle' });
            });
        };

        element.addEventListener('touchstart', onTouchStart, { passive: true });
        element.addEventListener('touchmove', onTouchMove, { passive: false });
        element.addEventListener('touchend', onTouchEnd);
        element.addEventListener('touchcancel', onTouchEnd);

        return () => {
            element.removeEventListener('touchstart', onTouchStart);
            element.removeEventListener('touchmove', onTouchMove);
            element.removeEventListener('touchend', onTouchEnd);
            element.removeEventListener('touchcancel', onTouchEnd);
            if (rafRef.current) {
                window.cancelAnimationFrame(rafRef.current);
            }
        };
    }, [contentRef, enabled, holdOffset, scrollElementRef, threshold]);

    const isPulling = state.phase === 'pulling';
    const isRefreshing = state.phase === 'refreshing' || state.phase === 'hold';
    const isAnimating =
        state.phase === 'hold' || state.phase === 'refreshing' || state.phase === 'collapsing';

    return {
        offset: state.offset,
        phase: state.phase,
        isPulling,
        isRefreshing,
        isAnimating,
        threshold,
        holdOffset,
    };
}
