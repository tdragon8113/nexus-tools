import { useEffect } from 'react';
import { startNativeShellSync } from './viewportMetrics';

export function useNativeShell() {
    useEffect(() => startNativeShellSync(), []);
}
