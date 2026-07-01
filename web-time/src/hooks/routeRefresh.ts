import { tokenStorage } from '../auth/tokenStorage';
import type { TimeJournalRefreshApi } from './TimeJournalProvider';

function matchArchiveKind(pathname: string) {
    if (pathname === '/profile/record-days' || pathname === '/profile/activities') {
        return 'activities' as const;
    }
    if (
        pathname === '/profile/reflections' ||
        pathname === '/profile/month-summaries' ||
        pathname === '/profile/year-summaries'
    ) {
        return 'reflections' as const;
    }
    return null;
}

export async function refreshRouteData(
    pathname: string,
    api: TimeJournalRefreshApi,
    pageOverride?: (() => Promise<void>) | null,
): Promise<void> {
    if (pageOverride) {
        await pageOverride();
        return;
    }

    if (!tokenStorage.hasTokens()) {
        return;
    }

    if (pathname === '/') {
        await api.refreshData(['activities', 'reflections', 'summary', 'ongoing']);
        return;
    }

    if (pathname === '/record') {
        await api.refreshData(['categories', 'activities', 'ongoing']);
        return;
    }

    if (pathname === '/profile') {
        await api.refreshData(['session', 'summary', 'reflections']);
        return;
    }

    if (pathname.startsWith('/activity/')) {
        await api.refreshData(['activities']);
        return;
    }

    if (pathname === '/profile/categories') {
        await api.refreshData(['categories']);
        return;
    }

    if (pathname === '/profile/account') {
        await api.refreshData(['session']);
        return;
    }

    if (pathname === '/profile/help' || pathname === '/profile/change-password') {
        return;
    }

    const archiveKind = matchArchiveKind(pathname);
    if (archiveKind === 'activities') {
        await api.refreshData(['activities']);
        return;
    }
    if (archiveKind === 'reflections') {
        await api.refreshData(['reflections']);
    }
}
