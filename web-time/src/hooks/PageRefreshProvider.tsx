import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';
import { refreshRouteData } from './routeRefresh';
import { useTimeJournal } from './TimeJournalProvider';

type PageRefreshContextValue = {
    registerPageRefresh: (handler: () => Promise<void>) => () => void;
    refreshCurrentPage: () => Promise<void>;
};

const PageRefreshContext = createContext<PageRefreshContextValue | null>(null);

export function PageRefreshProvider({ children }: { children: ReactNode }) {
    const { pathname } = useLocation();
    const { refreshData } = useTimeJournal();
    const overrideRef = useRef<(() => Promise<void>) | null>(null);

    const refreshApi = useMemo(() => ({ refreshData }), [refreshData]);

    const registerPageRefresh = useCallback((handler: () => Promise<void>) => {
        overrideRef.current = handler;
        return () => {
            if (overrideRef.current === handler) {
                overrideRef.current = null;
            }
        };
    }, []);

    const refreshCurrentPage = useCallback(async () => {
        await refreshRouteData(pathname, refreshApi, overrideRef.current);
    }, [pathname, refreshApi]);

    const skipRouteEnterRef = useRef(true);

    useEffect(() => {
        if (skipRouteEnterRef.current) {
            skipRouteEnterRef.current = false;
            return;
        }
        void refreshCurrentPage().catch(() => undefined);
    }, [pathname, refreshCurrentPage]);

    useEffect(() => {
        const syncOnVisible = () => {
            if (document.visibilityState !== 'visible') {
                return;
            }
            void refreshCurrentPage().catch(() => undefined);
        };

        document.addEventListener('visibilitychange', syncOnVisible);
        return () => document.removeEventListener('visibilitychange', syncOnVisible);
    }, [refreshCurrentPage]);

    const value = useMemo(
        () => ({ registerPageRefresh, refreshCurrentPage }),
        [registerPageRefresh, refreshCurrentPage],
    );

    return (
        <PageRefreshContext.Provider value={value}>{children}</PageRefreshContext.Provider>
    );
}

export function usePageRefresh(): PageRefreshContextValue {
    const context = useContext(PageRefreshContext);
    if (!context) {
        throw new Error('usePageRefresh must be used within PageRefreshProvider');
    }
    return context;
}
