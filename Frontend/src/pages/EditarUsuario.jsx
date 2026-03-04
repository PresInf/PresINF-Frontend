import React, { useEffect, useState } from 'react';
import instance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '../context/notificationContext';
import Modal from '../components/Modal';

const EditarUsuario = ({ isOpen, onClose, userId }) => {
  const [form, setForm] = useState({ nombre: '', email: '', rolId: '' });
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    const fetchUsuario = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const res = await instance.get(`/usuarios/${userId}`);
        setForm({
          nombre: res.data.nombre || '',
          email: res.data.email || '',
          rolId: res.data.rolId || '',
        });
      } catch (err) {
        setError('Error al cargar usuario');
        notify.error('Error al cargar usuario');
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchUsuario();
    } else {
      // Reset loading state when modal closes
      setLoading(true);
    }
  }, [userId, isOpen, notify]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await instance.get('/roles');
        setRoles(res.data);
      } catch (err) {
        setError('Error al cargar roles');
      }
    };
    fetchRoles();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await instance.patch(`/usuarios/${userId}`, form);
      notify.success('Usuario actualizado correctamente');
      onClose();
      // Opcional: callback para actualizar la lista de usuarios
      if (typeof onClose === 'function') {
        onClose(true); // true indica actualización exitosa
      }
    } catch (err) {
      notify.error('Error al actualizar usuario');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Editar Usuario"
    >
      {loading ? (
        <div className="text-center py-4">Cargando...</div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block mb-1 font-semibold">Nombre</label>
            <input
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-semibold">Rol</label>
            <select
              name="rolId"
              value={form.rolId}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Seleccionar rol</option>
              {roles.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Guardar cambios
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

export default EditarUsuario;
