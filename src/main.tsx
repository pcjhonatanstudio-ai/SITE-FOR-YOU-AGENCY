import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  // Ignora erros inofensivos de WebSocket do Vite decorrentes do ambiente de sandbox
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (
      reason === 'WebSocket closed without opened.' ||
      (reason && reason.message === 'WebSocket closed without opened.') ||
      (typeof reason === 'string' && reason.includes('WebSocket')) ||
      (reason && reason.message && reason.message.includes('WebSocket'))
    ) {
      event.preventDefault();
      // Oculta silenciando console ou apenas alertando de forma limpa
    }
  });

  window.addEventListener('error', (event) => {
    if (event.message && (event.message.includes('WebSocket') || event.message.includes('websocket'))) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

