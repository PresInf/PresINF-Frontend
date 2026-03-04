import React from 'react';

export const ConfirmDialog = ({ open, title = 'Confirmar', message, confirmText = 'Confirmar', cancelText = 'Cancelar', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-50 p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl">
        <div className="p-5">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
          {message && <p className="text-gray-600 text-sm">{message}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
