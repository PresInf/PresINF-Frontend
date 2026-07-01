import React, { useState, useEffect } from 'react';
import instance from '../api/axios';
import { useNotify } from '../context/notificationContext';
import { useAuth } from '../context/authContext';

export default function ObservacionesModal({ isOpen, onClose, pacienteId }) {
  const notify = useNotify();
  const { user } = useAuth();
  const [observaciones, setObservaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nuevaObservacion, setNuevaObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editTexto, setEditTexto] = useState('');

  useEffect(() => {
    if (isOpen && pacienteId) {
      fetchObservaciones();
    }
  }, [isOpen, pacienteId]);

  const fetchObservaciones = async () => {
    try {
      setLoading(true);
      const { data } = await instance.get(`/observaciones-paciente/paciente/${pacienteId}`);
      setObservaciones(data || []);
    } catch (err) {
      notify.error('Error al cargar observaciones');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!nuevaObservacion.trim()) return;
    try {
      setSaving(true);
      await instance.post('/observaciones-paciente', {
        id_paciente: Number(pacienteId),
        observacion: nuevaObservacion.trim()
      });
      notify.success('Observación guardada');
      setNuevaObservacion('');
      fetchObservaciones();
    } catch (err) {
      notify.error('Error al guardar observación');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editTexto.trim()) return;
    try {
      setSaving(true);
      await instance.patch(`/observaciones-paciente/${id}`, {
        observacion: editTexto.trim()
      });
      notify.success('Observación actualizada');
      setEditingId(null);
      setEditTexto('');
      fetchObservaciones();
    } catch (err) {
      notify.error('Error al actualizar observación');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">Observaciones del Paciente</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">&times;</button>
        </div>

        <div className="p-4 overflow-y-auto flex-1">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Cargando...</div>
          ) : observaciones.length === 0 ? (
            <div className="text-center py-4 text-gray-500">No hay observaciones registradas.</div>
          ) : (
            <div className="space-y-4">
              {observaciones.map(obs => (
                <div key={obs.id_observaciones} className="bg-gray-50 p-3 rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-xs text-gray-500">
                      <strong>{obs.usuario?.nombre || 'Usuario'}</strong> • {new Date(obs.fecha).toLocaleString()}
                    </div>
                    {user?.id === obs.id_usuario && (
                      <button onClick={() => { setEditingId(obs.id_observaciones); setEditTexto(obs.observacion); }} className="text-blue-600 hover:underline text-sm">
                        Editar
                      </button>
                    )}
                  </div>
                  {editingId === obs.id_observaciones ? (
                    <div>
                      <textarea value={editTexto} onChange={e => setEditTexto(e.target.value)} className="w-full border rounded p-2 text-sm" rows="3" />
                      <div className="flex gap-2 mt-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 border rounded">Cancelar</button>
                        <button onClick={() => handleUpdate(obs.id_observaciones)} disabled={saving} className="text-xs px-2 py-1 bg-blue-600 text-white rounded">Guardar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-800 whitespace-pre-wrap">{obs.observacion}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">Agregar nueva observación</label>
          <textarea
            value={nuevaObservacion}
            onChange={e => setNuevaObservacion(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
            rows="3"
            placeholder="Escribe una observación..."
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleCreate}
              disabled={saving || !nuevaObservacion.trim()}
              className="bg-green-600 text-white px-4 py-2 rounded shadow hover:bg-green-700 transition-colors text-sm font-medium"
            >
              {saving ? 'Guardando...' : 'Guardar Observación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
