import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast } from '../components/ui/Toast';

const NotificationContext = createContext(null);

export const useNotify = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotify must be used within NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, opts = {}) => {
    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2);
    const toast = { id, type, message, duration: opts.duration ?? 4000 };
    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const value = useMemo(() => ({
    success: (msg, opts) => push('success', msg, opts),
    error: (msg, opts) => push('error', msg, opts),
    info: (msg, opts) => push('info', msg, opts),
    vacuna: (msg, opts) => push('vacuna', msg, opts),
    remove,
  }), [push, remove]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Container de toasts */}
      <div className="fixed z-[60] bottom-4 right-4 flex flex-col gap-2 max-w-[90vw] sm:max-w-md">
        {toasts.map((t) => (
          <Toast key={t.id} type={t.type} message={t.message} duration={t.duration} onClose={() => remove(t.id)} />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
