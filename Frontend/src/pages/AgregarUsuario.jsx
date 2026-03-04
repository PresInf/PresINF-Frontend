import React, { useEffect, useState } from 'react';
import instance from '@/api/axios';
import { useNavigate } from 'react-router-dom';
import { useNotify } from '@/context/notificationContext';

const AgregarUsuario = () => {
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rolId: '' });
  const [roles, setRoles] = useState([]);
  const navigate = useNavigate();
  const notify = useNotify();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value.toLowerCase() });
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await instance.get('/roles');
        setRoles(res.data);
      } catch (err) {
        notify.error('Error al cargar roles');
      }
    };
    fetchRoles();
  }, [notify]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await instance.post('/auth/register', form);
      notify.success('Usuario agregado correctamente');
      setTimeout(() => navigate('/usuarios'), 1200);
    } catch (err) {
      notify.error('Error al agregar usuario');
    }
  };

  return (
    <div className="container py-4">
      <h1 className="text-2xl font-bold mb-4">Agregar Usuario</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-6 rounded shadow">
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Nombre</label>
          <input type="text" name="nombre" value={form.nombre} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Email</label>
          <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Contraseña</label>
          <input type="password" name="password" value={form.password} onChange={handleChange} className="w-full border px-3 py-2 rounded" required />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Rol</label>
          <select name="rolId" value={form.rolId} onChange={handleChange} className="w-full border px-3 py-2 rounded" required>
            <option value="">Seleccionar rol</option>
            {roles.map((rol) => (
              <option key={rol.id} value={rol.id}>
                {rol.nombre}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Agregar</button>
      </form>
    </div>
  );
};

export default AgregarUsuario;
