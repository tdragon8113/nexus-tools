import { BrowserRouter, useRoutes } from 'react-router-dom';
import { TimeJournalProvider } from '../hooks/TimeJournalProvider';
import { routes } from './routes';

function AppRoutes() {
    return useRoutes(routes);
}

export function App() {
    return (
        <TimeJournalProvider>
            <BrowserRouter basename="/manage/time">
                <AppRoutes />
            </BrowserRouter>
        </TimeJournalProvider>
    );
}
