import { useEffect } from 'react';

function isNativeShell() {
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

export function useNativeShell() {
    useEffect(() => {
        const root = document.documentElement;
        const queries = [
            window.matchMedia('(display-mode: standalone)'),
            window.matchMedia('(display-mode: fullscreen)'),
            window.matchMedia('(max-width: 768px)'),
            window.matchMedia('(hover: none) and (pointer: coarse)'),
        ];

        const sync = () => {
            root.toggleAttribute('data-native-shell', isNativeShell());
        };

        sync();
        queries.forEach((query) => query.addEventListener('change', sync));
        return () => queries.forEach((query) => query.removeEventListener('change', sync));
    }, []);
}
