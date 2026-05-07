// import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NotificationProvider } from './context/notificationContext';
import React, { lazy } from 'react';
import NotificationBell from './components/NotificationBell';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <App />
        <NotificationBell global onNavigate={() => { /* noop: global placement */ }} />
        <React.Suspense fallback={null}>
        </React.Suspense>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);