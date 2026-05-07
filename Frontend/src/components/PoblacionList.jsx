import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import instance from '../api/axios';
import PoblacionForm from './PoblacionForm';

export default function PoblacionList({ anio, onDataChanged }) {
  const [poblaciones, setPoblaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rangosEdades, setRangosEdades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const obtenerPoblaciones = async () => {
    try {
      setLoading(true);
      const res = await instance.get(`/estadisticas/poblacion-por-edad/${anio}`);
      setPoblaciones(res.data || []);
    } catch (err) {
      console.error('Error al obtener poblaciones:', err);
      setPoblaciones([]);
    } finally {
      setLoading(false);
    }
  };

  const obtenerRangos = async () => {
    try {
      const res = await instance.get('/estadisticas/rango-edades');
      setRangosEdades(res.data || []);
    } catch (err) {
      console.error('Error al obtener rangos:', err);
    }
  };

  useEffect(() => {
    obtenerPoblaciones();
    obtenerRangos();
  }, [anio]);

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await instance.delete(`/estadisticas/poblacion/${id}`);
      setPoblaciones((prev) => prev.filter((p) => p.id_poblacion_anual !== id));
      setDeleteConfirmId(null);
      if (onDataChanged) {
        onDataChanged();
      }
    } catch (err) {
      console.error('Error al eliminar población:', err);
      alert('Error al eliminar población');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSuccess = () => {
    obtenerPoblaciones();
    setEditingData(null);
    if (onDataChanged) {
      onDataChanged();
    }
  };

  const getRangoTitulo = (id_edades) => {
    const rango = rangosEdades.find((r) => r.id_edades === id_edades);
    return rango?.titulo || 'Desconocido';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800">
          Poblaciones por Rango de Edad - {anio}
        </h3>
        <button
          onClick={() => {
            setEditingData(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          disabled={loading}
        >
          <FaPlus /> Agregar
        </button>
      </div>

      {loading && <div className="text-center py-4 text-gray-500">Cargando...</div>}

      {!loading && poblaciones.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
          <p>No hay poblaciones registradas para {anio}</p>
          <p className="text-sm mt-2">Haz clic en "Agregar" para crear una</p>
        </div>
      )}

      {!loading && poblaciones.length > 0 && (
        <div className="overflow-x-auto border rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Rango de Edad
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Año</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Población
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {poblaciones.map((poblacion) => (
                <tr
                  key={poblacion.id_poblacion_anual}
                  className="border-b hover:bg-gray-50 transition"
                >
                  <td className="px-4 py-3 text-gray-700">
                    {getRangoTitulo(poblacion.id_edades)}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{poblacion.anio}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900">
                    {poblacion.poblacion.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingData(poblacion);
                        setShowForm(true);
                      }}
                      className="p-2 rounded-lg text-blue-600 hover:bg-blue-100 transition disabled:opacity-50"
                      title="Editar"
                      disabled={deletingId !== null}
                    >
                      <FaEdit />
                    </button>
                    {deleteConfirmId === poblacion.id_poblacion_anual ? (
                      <div className="flex gap-1 items-center">
                        <button
                          onClick={() =>
                            handleDelete(poblacion.id_poblacion_anual)
                          }
                          className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                          disabled={deletingId !== null}
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-2 py-1 bg-gray-300 text-gray-700 text-xs rounded hover:bg-gray-400 disabled:opacity-50"
                          disabled={deletingId !== null}
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() =>
                          setDeleteConfirmId(poblacion.id_poblacion_anual)
                        }
                        className="p-2 rounded-lg text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                        title="Eliminar"
                        disabled={deletingId !== null}
                      >
                        <FaTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PoblacionForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setEditingData(null);
        }}
        onSuccess={handleSuccess}
        editingData={editingData}
        anio={anio}
        rangosEdades={rangosEdades}
      />
    </div>
  );
}
