import React from 'react';
import ReactDOM from 'react-dom/client';
import { PersistGate } from 'redux-persist/integration/react';
import { Loader2 } from 'lucide-react';
import { persistor } from './store';
import { ErrorBoundary } from './components/common';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

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
