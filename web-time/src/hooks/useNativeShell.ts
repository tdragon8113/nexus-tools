import { useEffect } from 'react';
import { startViewportMetricsSync } from './viewportMetrics';

export function useNativeShell() {
    useEffect(() => startViewportMetricsSync(), []);
}
