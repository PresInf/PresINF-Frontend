// App.jsx

import { AuthProvider, useAuth } from './context/authContext';
import { AppRouter } from './routes/AppRoutes';
import React, { lazy, Suspense } from 'react'; // 1. Importa lazy y Suspense

const GlobalAlertChecker = lazy(() => import('./components/GlobalAlertChecker'));

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();

  return (
    <div className="container-fluid bg-light min-vh-100">
      <div className="row">

        <AppRouter />

        <Suspense fallback={null}>
          {!loading && isAuthenticated && <GlobalAlertChecker />}
        </Suspense>

      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;