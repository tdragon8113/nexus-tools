import { BrowserRouter, useRoutes } from 'react-router-dom';
import { PageRefreshProvider } from '../hooks/PageRefreshProvider';
import { TimeJournalProvider } from '../hooks/TimeJournalProvider';
import { routes } from './routes';

function AppRoutes() {
    return useRoutes(routes);
}

export function App() {
    return (
        <TimeJournalProvider>
            <BrowserRouter basename="/manage/time">
                <PageRefreshProvider>
                    <AppRoutes />
                </PageRefreshProvider>
            </BrowserRouter>
        </TimeJournalProvider>
    );
}
