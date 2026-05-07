import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import instance from '../api/axios';

export default function PoblacionForm({
  isOpen,
  onClose,
  onSuccess,
  editingData = null,
  anio,
  rangosEdades = [],
  preselectedIdEdades = null,
  preselectedRangoTitulo = null,
}) {
  const [formData, setFormData] = useState({
    anio: anio || new Date().getFullYear(),
    id_edades: preselectedIdEdades || '',
    poblacion: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rangos, setRangos] = useState(rangosEdades);

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        anio: anio || new Date().getFullYear(),
        id_edades: preselectedIdEdades || '',
        poblacion: '',
      });
      setError('');
    } else if (editingData) {
      setFormData({
        anio: editingData.anio,
        id_edades: editingData.id_edades,
        poblacion: editingData.poblacion,
      });
    } else {
      // Cuando se abre para crear, pre-seleccionar si viene desde un gráfico
      setFormData((prev) => ({
        ...prev,
        id_edades: preselectedIdEdades || prev.id_edades,
        anio: anio || prev.anio,
      }));
    }
  }, [isOpen, editingData, anio, preselectedIdEdades]);

  // Cargar rangos si no vienen como prop
  useEffect(() => {
    if (rangosEdades.length > 0) {
      setRangos(rangosEdades);
    } else if (isOpen && rangos.length === 0) {
      const obtenerRangos = async () => {
        try {
          const res = await instance.get('/estadisticas/rango-edades');
          setRangos(res.data || []);
        } catch (err) {
          console.error('Error al obtener rangos de edad:', err);
          setError('Error al cargar rangos de edad');
        }
      };
      obtenerRangos();
    }
  }, [isOpen, rangosEdades]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'poblacion' || name === 'anio' ? Number(value) : value,
    }));
    setError('');
  };

  const validarFormulario = () => {
    if (!formData.anio) {
      setError('El año es requerido');
      return false;
    }
    if (!formData.id_edades) {
      setError('Debe seleccionar un rango de edad');
      return false;
    }
    if (!formData.poblacion || formData.poblacion <= 0) {
      setError('La población debe ser mayor a 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (editingData) {
        // Actualizar
        await instance.put(`/estadisticas/poblacion/${editingData.id_poblacion_anual}`, {
          poblacion: formData.poblacion,
        });
      } else {
        // Crear
        await instance.post('/estadisticas/poblacion', {
          anio: formData.anio,
          id_edades: parseInt(formData.id_edades),
          poblacion: formData.poblacion,
        });
      }

      onSuccess();
      onClose();
    } catch (err) {
      const mensaje =
        err?.response?.data?.message || err?.response?.data?.error || 'Error al guardar población';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Mostrar título personalizado si es pre-seleccionado
  const titulo = preselectedRangoTitulo
    ? `Cargar población: ${preselectedRangoTitulo}`
    : editingData
      ? 'Editar Población'
      : 'Crear Población';

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-screen overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{titulo}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition"
            disabled={loading}
          >
            <FaTimes size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Año
            </label>
            <input
              type="number"
              name="anio"
              value={formData.anio}
              onChange={handleChange}
              disabled={editingData || loading}
              className="w-full border rounded-lg px-3 py-2 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
              min="1900"
              max="2099"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Rango de Edad
            </label>
            <select
              name="id_edades"
              value={formData.id_edades}
              onChange={handleChange}
              disabled={editingData || loading || preselectedIdEdades !== null}
              className="w-full border rounded-lg px-3 py-2 text-gray-700 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">Seleccionar rango de edad...</option>
              {rangos.length > 0 ? (
                rangos.map((rango) => (
                  <option key={rango.id_edades} value={rango.id_edades}>
                    {rango.titulo}
                  </option>
                ))
              ) : (
                <option disabled>Cargando rangos...</option>
              )}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Población
            </label>
            <input
              type="number"
              name="poblacion"
              value={formData.poblacion}
              onChange={handleChange}
              disabled={loading}
              className="w-full border rounded-lg px-3 py-2 text-gray-700 disabled:bg-gray-100"
              min="1"
              placeholder="Ej: 100"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
