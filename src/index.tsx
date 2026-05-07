import React from 'react';
import ReactDOM from 'react-dom/client';
import { PersistGate } from 'redux-persist/integration/react';
import { Loader2 } from 'lucide-react';
import { persistor } from './store';
import { ErrorBoundary } from './components/common';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Benign Chromium quirk: ResizeObserver often logs this during layout (tldraw, resizable panels, MUI).
// CRA's overlay listens for window "error"; suppress so it is not treated as fatal.
function isBenignResizeObserverMessage(message: string): boolean {
  return /ResizeObserver loop/i.test(message);
}
function suppressResizeObserverError(event: Event) {
  const e = event as ErrorEvent;
  if (!isBenignResizeObserverMessage(String(e.message || ''))) return;
  e.stopImmediatePropagation();
  e.preventDefault();
}
window.addEventListener('error', suppressResizeObserverError, true);

const prevOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === 'string' && isBenignResizeObserverMessage(message)) {
    return true;
  }
  return prevOnError?.(message, source, lineno, colno, error) ?? false;
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const PersistGateLoading = (
  <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background text-muted-foreground">
    <Loader2 className="h-10 w-10 animate-spin text-primary" aria-hidden />
    <p className="text-sm">Loading…</p>
  </div>
);

root.render(
  <ErrorBoundary>
    <PersistGate loading={PersistGateLoading} persistor={persistor}>
      <App />
    </PersistGate>
  </ErrorBoundary>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
