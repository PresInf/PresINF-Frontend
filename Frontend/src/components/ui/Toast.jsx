import React, { useEffect, useRef, useState } from 'react';

const COLORS = {
  success: 'bg-green-600 border-green-700',
  error: 'bg-red-600 border-red-700',
  info: 'bg-blue-600 border-blue-700',
  vacuna: 'bg-red-600 border-red-700',
};

const ICONS = {
  success: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  error: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M8.257 3.099c.766-1.36 2.72-1.36 3.486 0l6.518 11.582c.75 1.334-.213 2.993-1.743 2.993H3.482c-1.53 0-2.493-1.659-1.743-2.993L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-2a1 1 0 01-1-1V7a1 1 0 112 0v4a1 1 0 01-1 1z" clipRule="evenodd" />
    </svg>
  ),
  info: (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10A8 8 0 11.001 10 8 8 0 0118 10zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
    </svg>
  ),
  vacuna:(
    <svg fill="#000000" width="80px" height="80px" viewBox="0 0 32 32" version="1.1" xmlSpace="preserve" xmlns="http://www.w3.org/2000/svg" xmln:serif="http://www.serif.com/" xmlnXlink="http://www.w3.org/1999/xlink"><path d="M22.043,8.549l-0.595,-0.595c-1.172,-1.172 -3.071,-1.172 -4.243,-0l-9.922,9.922l-1.574,-1.573c-0.391,-0.39 -1.024,-0.39 -1.414,0.001c-0.39,0.39 -0.39,1.024 0,1.414l4.289,4.285l-1.769,1.773l-1.49,-1.489c-0.39,-0.39 -1.024,-0.39 -1.414,0.001c-0.39,0.39 -0.39,1.024 0.001,1.414l4.368,4.366c0.391,0.39 1.025,0.39 1.415,-0.001c0.39,-0.39 0.39,-1.024 -0.001,-1.414l-1.464,-1.464l1.768,-1.772l4.295,4.291c0.391,0.39 1.024,0.39 1.414,-0c0.39,-0.391 0.39,-1.024 -0,-1.415l-1.35,-1.349l9.919,-9.919c1.172,-1.172 1.172,-3.071 0,-4.243l-0.819,-0.819l4.251,-4.256c0.39,-0.391 0.389,-1.025 -0.001,-1.415c-0.391,-0.39 -1.025,-0.389 -1.415,0.001l-4.249,4.256Zm-9.101,14.982l9.92,-9.92c0.391,-0.391 0.391,-1.024 0,-1.415c0,0 -2.828,-2.828 -2.828,-2.828c-0.391,-0.391 -1.024,-0.391 -1.414,-0l-0.858,0.857l1.108,1.108c0.39,0.39 0.39,1.024 -0,1.414c-0.39,0.391 -1.024,0.391 -1.414,0l-1.108,-1.107l-1.6,1.6l1.108,1.107c0.39,0.39 0.39,1.024 -0,1.414c-0.391,0.391 -1.024,0.391 -1.414,0l-1.108,-1.107l-1.572,1.571l1.108,1.108c0.39,0.39 0.39,1.024 -0,1.414c-0.39,0.391 -1.024,0.391 -1.414,0l-1.108,-1.107l-1.65,1.65l4.244,4.241Z"/></svg>
  ),
};

export const Toast = ({ type = 'info', message, duration = 4000, onClose }) => {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timerRef.current);
  }, [duration]);

  useEffect(() => {
    if (!visible) {
      const t = setTimeout(() => onClose?.(), 300);
      return () => clearTimeout(t);
    }
  }, [visible, onClose]);

  return (
    <div
      className={`flex items-center gap-3 text-white px-4 py-3 rounded-md shadow-lg border ${COLORS[type]} transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      role="alert"
    >
      <div className="shrink-0">{ICONS[type]}</div>
      <div className="text-sm break-words">{message}</div>
      <button onClick={() => setVisible(false)} className="ml-2 opacity-85 hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
