import React from 'react';

export const Spinner = ({ size = '8', color = 'border-blue-500' }) => (
  <div className={`animate-spin h-${size} w-${size} rounded-full border-2 ${color} border-t-transparent`} />
);

export const FullscreenSpinner = () => (
  <div className="min-h-[40vh] w-full flex items-center justify-center p-6">
    <Spinner />
  </div>
);

export default Spinner;
