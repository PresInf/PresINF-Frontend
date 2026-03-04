import React, { useEffect, useState } from 'react';
import instance from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { MdDelete, MdEdit } from "react-icons/md";
import { useNotify } from '../context/notificationContext';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import EditarUsuario from './EditarUsuario';

const UsuariosGestion = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);
    const [editingUserId, setEditingUserId] = useState(null);
    const notify = useNotify();

    const fetchUsuarios = async () => {
        try {
            const res = await instance.get('/usuarios');
            setUsuarios(res.data);
        } catch (err) {
            setError('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleDeleteClick = (id) => {
        setUserToDelete(id);
        setConfirmOpen(true);
    };

    const handleConfirmDelete = async () => {
        try {
            await instance.delete(`/usuarios/${userToDelete}`);
            setUsuarios((prev) => prev.filter(u => u.id !== userToDelete));
            notify.success('Usuario eliminado correctamente');
        } catch (err) {
            notify.error('Error al eliminar usuario');
        } finally {
            setConfirmOpen(false);
        }
    };

    return (
        <div className="container py-4">
            <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
            <button
                type="button"
                className="px-5 py-2.5 mt-3 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg text-center"
                onClick={() => navigate('/usuarios/agregar')}
            >
                Agregar usuario
            </button>
            {error && <div className="text-red-500">{error}</div>}
            <div className="overflow-x-visible">
                {loading ? (
                    <div className="text-center py-4">Cargando usuarios...</div>
                ) : (
                    <table className="m-3 min-w-full bg-white border border-gray-300">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">ID</th>
                                <th className="py-2 px-4 border-b">Nombre</th>
                                <th className="py-2 px-4 border-b">Email</th>
                                <th className="py-2 px-4 border-b">Rol</th>
                                <th className="py-2 px-4 border-b">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuarios.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b">{u.id}</td>
                                    <td className="py-2 px-4 border-b">{u.nombre}</td>
                                    <td className="py-2 px-4 border-b">{u.email}</td>
                                    <td className="py-2 px-4 border-b">{u.rol?.nombre || 'Sin rol'}</td>
                                    <td className="py-2 px-4 border-b flex gap-2">
                                        <button
                                            className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded"
                                            onClick={() => setEditingUserId(u.id)}
                                        >
                                            <MdEdit />
                                        </button>
                                        <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" onClick={() => handleDeleteClick(u.id)}>
                                            <MdDelete />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <ConfirmDialog
                open={confirmOpen}
                title="Eliminar usuario"
                message="Esta acción no se puede deshacer."
                confirmText="Eliminar"
                onConfirm={handleConfirmDelete}
                onCancel={() => setConfirmOpen(false)}
            />

            <EditarUsuario
                isOpen={editingUserId !== null}
                onClose={(wasUpdated) => {
                    setEditingUserId(null);
                    if (wasUpdated) {
                        fetchUsuarios();
                    }
                }}
                userId={editingUserId}
            />
        </div>
    );
};

export default UsuariosGestion;