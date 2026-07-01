import { useRef } from 'react';
import { BarChart3, Home, PlusCircle, User } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import PullToRefreshIndicator from '../components/PullToRefreshIndicator';
import { useNativeShell } from '../hooks/useNativeShell';
import { usePageRefresh } from '../hooks/PageRefreshProvider';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import ActivityDetailRoute from '../pages/ActivityDetailRoute';
import HomeRoute from '../pages/HomeRoute';
import RecordPage from '../pages/RecordPage';

const tabs = [
    { id: 'home', to: '/', label: '首页', icon: Home, end: true },
    { id: 'record', to: '/record', label: '记录', icon: PlusCircle, end: true },
    { id: 'stats', to: '/stats', label: '统计', icon: BarChart3, end: true },
    { id: 'profile', to: '/profile', label: '我的', icon: User, end: false },
] as const;

function isProfileRoute(pathname: string) {
    return pathname === '/profile' || pathname.startsWith('/profile/');
}

function isTabActive(tabId: (typeof tabs)[number]['id'], pathname: string) {
    if (tabId === 'home') {
        return isHomeTabActive(pathname);
    }
    if (tabId === 'profile') {
        return isProfileRoute(pathname);
    }
    if (tabId === 'record') {
        return pathname === '/record';
    }
    if (tabId === 'stats') {
        return pathname === '/stats';
    }
    return false;
}

function isHomeTabActive(pathname: string) {
    return pathname === '/' || pathname.startsWith('/activity/');
}

function isHomeRoute(pathname: string) {
    return pathname === '/';
}

function shouldShowTabbar(pathname: string) {
    return (
        pathname === '/' ||
        pathname === '/record' ||
        pathname === '/stats' ||
        pathname === '/profile'
    );
}

export function AppLayout() {
    useNativeShell();
    const { pathname } = useLocation();
    const { refreshCurrentPage } = usePageRefresh();
    const scrollElementRef = useRef<HTMLElement | null>(null);
    const contentRef = useRef<HTMLDivElement | null>(null);
    const isRecordRoute = pathname === '/record';
    const showHome = isHomeRoute(pathname);
    const isActivityDetail = pathname.startsWith('/activity/');
    const showTabbar = shouldShowTabbar(pathname);

    const { offset, phase, isPulling, isRefreshing, isAnimating, threshold, holdOffset } =
        usePullToRefresh({
            scrollElementRef,
            contentRef,
            onRefresh: refreshCurrentPage,
            enabled: true,
        });

    const pullTransform =
        offset > 0 || isAnimating ? `translate3d(0, ${offset}px, 0)` : undefined;

    return (
        <div className="tj-shell">
            <div className="tj-phone">
                <main className="tj-main" ref={scrollElementRef}>
                    <div className="tj-page-pull-wrap">
                        <div
                            ref={contentRef}
                            className={`tj-page-pull-content${isAnimating ? ' tj-page-pull-content-animating' : ''}${isPulling ? ' tj-page-pull-content-dragging' : ''}`}
                            style={pullTransform ? { transform: pullTransform } : undefined}
                        >
                            <PullToRefreshIndicator
                                offset={offset}
                                threshold={threshold}
                                holdOffset={holdOffset}
                                isRefreshing={isRefreshing}
                                phase={phase}
                            />
                            <div
                                className={showHome ? undefined : 'tj-home-page-host'}
                                aria-hidden={!showHome}
                            >
                                <HomeRoute />
                            </div>
                            {isActivityDetail ? <ActivityDetailRoute /> : null}
                            <div
                                className={isRecordRoute ? undefined : 'tj-record-page-host'}
                                aria-hidden={!isRecordRoute}
                            >
                                <RecordPage />
                            </div>
                            {!showHome && !isRecordRoute ? <Outlet /> : null}
                        </div>
                    </div>
                </main>

                {showTabbar ? (
                    <nav className="tj-tabbar" aria-label="主导航">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const active = isTabActive(tab.id, pathname);
                            return (
                                <NavLink
                                    key={tab.id}
                                    to={tab.to}
                                    end={tab.end}
                                    className={`tj-tab ${active ? 'tj-tab-active' : ''}`}
                                    aria-current={active ? 'page' : undefined}
                                >
                                    <span className="tj-tab-icon-wrap">
                                        <Icon
                                            size={24}
                                            strokeWidth={active ? 2.5 : 1.8}
                                        />
                                    </span>
                                    <span className="tj-tab-label">{tab.label}</span>
                                </NavLink>
                            );
                        })}
                    </nav>
                ) : null}
            </div>
        </div>
    );
}
