import React from 'react';
import ReactDOM from 'react-dom/client';
import { PersistGate } from 'redux-persist/integration/react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { persistor } from './store';
import { ErrorBoundary } from './components/common';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const PersistGateLoading = (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
    <CircularProgress size={48} />
    <Typography variant="body2" color="text.secondary">Loading...</Typography>
  </Box>
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
