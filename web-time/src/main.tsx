import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './app/App';
import { syncNativeShell } from './hooks/viewportMetrics';
import './styles/style.css';

syncNativeShell();

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
);
