const MAX_SAFE_BOTTOM = 34;

export function isNativeShell() {
    const nav = navigator as Navigator & { standalone?: boolean };
    if (nav.standalone) {
        return true;
    }
    return (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(max-width: 768px)').matches ||
        window.matchMedia('(hover: none) and (pointer: coarse)').matches
    );
}

export function syncNativeShell() {
    document.documentElement.toggleAttribute('data-native-shell', isNativeShell());
}

export function syncViewportMetrics() {
    const root = document.documentElement;
    const height = window.visualViewport?.height ?? window.innerHeight;
    root.style.setProperty('--app-vh', `${height}px`);

    if (!isNativeShell()) {
        root.style.removeProperty('--app-safe-bottom');
        return;
    }

    if (!document.body) {
        return;
    }

    const probe = document.createElement('div');
    probe.style.cssText =
        'position:fixed;left:-9999px;bottom:0;padding-bottom:env(safe-area-inset-bottom,0px);visibility:hidden;pointer-events:none;';
    document.body.appendChild(probe);
    const measured = Number.parseFloat(window.getComputedStyle(probe).paddingBottom) || 0;
    probe.remove();

    const safeBottom = Math.min(Math.max(measured, 0), MAX_SAFE_BOTTOM);
    root.style.setProperty('--app-safe-bottom', `${safeBottom}px`);
}

export function startViewportMetricsSync() {
    syncNativeShell();
    syncViewportMetrics();

    const resync = () => {
        syncNativeShell();
        syncViewportMetrics();
    };

    const resyncIfVisible = () => {
        if (!document.hidden) {
            resync();
            window.setTimeout(resync, 100);
        }
    };

    const queries = [
        window.matchMedia('(display-mode: standalone)'),
        window.matchMedia('(display-mode: fullscreen)'),
        window.matchMedia('(max-width: 768px)'),
        window.matchMedia('(hover: none) and (pointer: coarse)'),
    ];

    window.addEventListener('resize', resync);
    window.addEventListener('orientationchange', resync);
    window.addEventListener('pageshow', resync);
    document.addEventListener('visibilitychange', resyncIfVisible);
    window.visualViewport?.addEventListener('resize', resync);
    queries.forEach((query) => query.addEventListener('change', resync));

    return () => {
        window.removeEventListener('resize', resync);
        window.removeEventListener('orientationchange', resync);
        window.removeEventListener('pageshow', resync);
        document.removeEventListener('visibilitychange', resyncIfVisible);
        window.visualViewport?.removeEventListener('resize', resync);
        queries.forEach((query) => query.removeEventListener('change', resync));
    };
}
