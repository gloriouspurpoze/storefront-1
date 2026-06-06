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

// Benign cancellation: an AbortError is what fetch throws when a request's signal
// is aborted (request timeouts, in-flight searches cancelled on unmount, and
// socket.io's polling transport aborting on reconnect). Modern Chromium phrases
// it "signal is aborted without reason". It's expected and already handled where
// it matters — but when it surfaces as an *unhandled rejection* it trips CRA's
// dev overlay repeatedly. Treat it as noise (never user-facing).
function isBenignAbortError(value: unknown): boolean {
  if (value instanceof DOMException && value.name === 'AbortError') return true;
  if (value instanceof Error) {
    return value.name === 'AbortError' || /signal is aborted|aborted without reason/i.test(value.message);
  }
  if (typeof value === 'string') {
    return /signal is aborted|aborted without reason/i.test(value);
  }
  return false;
}

/** React 19 dev overlay noise when a render error was caught and recovered synchronously. */
function isBenignReactConcurrentRecoveryMessage(message: string): boolean {
  return /There was an error during concurrent rendering but React was able to recover/i.test(message);
}

function suppressBenignError(event: Event) {
  const e = event as ErrorEvent;
  const msg = String(e.message || '');
  if (
    !isBenignResizeObserverMessage(msg) &&
    !isBenignAbortError(e.error ?? msg) &&
    !isBenignReactConcurrentRecoveryMessage(msg)
  ) {
    return;
  }
  e.stopImmediatePropagation();
  e.preventDefault();
}
window.addEventListener('error', suppressBenignError, true);

// AbortErrors most often arrive as unhandled promise rejections. Catch them in
// the capture phase and stop propagation so the overlay/global handlers ignore
// them, while leaving all other rejections untouched.
window.addEventListener(
  'unhandledrejection',
  (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    const reasonMsg =
      reason instanceof Error ? reason.message : typeof reason === 'string' ? reason : '';
    if (isBenignAbortError(reason) || isBenignReactConcurrentRecoveryMessage(reasonMsg)) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  },
  true,
);

const prevOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === 'string' && isBenignResizeObserverMessage(message)) {
    return true;
  }
  if (typeof message === 'string' && isBenignReactConcurrentRecoveryMessage(message)) {
    return true;
  }
  if (isBenignAbortError(error ?? message)) {
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
