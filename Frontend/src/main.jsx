// import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { NotificationProvider } from './context/notificationContext';
import React, { lazy } from 'react';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <NotificationProvider>
        <App />
        <React.Suspense fallback={null}>
        </React.Suspense>
      </NotificationProvider>
    </BrowserRouter>
  </React.StrictMode>
);