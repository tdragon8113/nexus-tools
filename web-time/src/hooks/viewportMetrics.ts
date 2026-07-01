export function isStandalonePwa() {
    const nav = navigator as Navigator & { standalone?: boolean };
    return nav.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

export function isNativeShell() {
    if (isStandalonePwa()) {
        return true;
    }
    return (
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(max-width: 768px)').matches ||
        window.matchMedia('(hover: none) and (pointer: coarse)').matches
    );
}

export function syncNativeShell() {
    const root = document.documentElement;
    root.toggleAttribute('data-native-shell', isNativeShell());
    root.toggleAttribute('data-standalone-pwa', isStandalonePwa());
}

export function startNativeShellSync() {
    syncNativeShell();

    const queries = [
        window.matchMedia('(display-mode: standalone)'),
        window.matchMedia('(display-mode: fullscreen)'),
        window.matchMedia('(max-width: 768px)'),
        window.matchMedia('(hover: none) and (pointer: coarse)'),
    ];

    queries.forEach((query) => query.addEventListener('change', syncNativeShell));

    return () => queries.forEach((query) => query.removeEventListener('change', syncNativeShell));
}
