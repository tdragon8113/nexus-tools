import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { syncNativeShell, syncViewportMetrics } from './hooks/viewportMetrics';
import './styles/style.css';

syncNativeShell();
syncViewportMetrics();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
