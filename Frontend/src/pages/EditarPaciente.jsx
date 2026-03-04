import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MdSave, MdArrowBack } from "react-icons/md";
import instance from "../api/axios";
import { useNotify } from "../context/notificationContext";
import Modal from '../components/Modal';

const EditarPaciente = ({ isOpen, onClose, pacienteId }) => {
    // Soporta dos modos:
    // - modal mode: recibe isOpen/onClose/pacienteId (usado desde la lista)
    // - route mode: si no recibe isOpen, usa useParams() y navega tras guardar
    const params = useParams();
    const routeId = params?.id;
    const id = pacienteId ?? routeId;
    const [form, setForm] = useState({
        nombre: "",
        apellido: "",
        fechaNacimiento: "",
        dni: "",
        sexo: "",
        domicilio: "",
        localidad: "",
        provincia: "",
        tipoPersona: "",
        num_telefono: "",
    });
    const [localidades, setLocalidades] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [personas, setPersonas] = useState([]);
    const navigate = useNavigate();
    const notify = useNotify();

    useEffect(() => {
        const cargar = async () => {
            try {
                if (!id) return;
                const { data } = await instance.get(`/persona/${id}`);
                setForm({
                    nombre: data.nombre || "",
                    apellido: data.apellido || "",
                    fechaNacimiento: data.fecha_nacimiento ? data.fecha_nacimiento.slice(0, 10) : "",
                    dni: data.dni || "",
                    sexo: data.generoId ? String(data.generoId) : "",
                    domicilio: data.domicilio || "",
                    localidad: data.localidadId ? String(data.localidadId) : "",
                    provincia: data.provinciaId ? String(data.provinciaId) : "",
                    tipoPersona: data.tipo_personaId ? String(data.tipo_personaId) : "",
                    num_telefono: data.num_telefono || "",
                });
                const [locs, provs, tipos] = await Promise.all([
                    instance.get('/localidades'),
                    instance.get('/provincia'),
                    instance.get('/tipoPersona'),
                ]);
                setLocalidades(locs.data);
                setProvincias(provs.data);
                setPersonas(tipos.data.filter((persona) => persona.id_persona_tipo !== 3));
            } catch (e) {
                notify.error('Error al cargar datos del paciente');
            }
        };
        // Cargar sólo si tenemos un id (route o modal)
        cargar();
    }, [id, notify]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const paciente = {
            nombre: form.nombre,
            apellido: form.apellido,
            fecha_nacimiento: form.fechaNacimiento,
            dni: form.dni.toString(),
            domicilio: form.domicilio,
            generoId: parseInt(form.sexo),
            id_localidad: parseInt(form.localidad),
            id_provincia: parseInt(form.provincia),
            id_persona_tipo: parseInt(form.tipoPersona),
            ...((form.tipoPersona === "1" || getTipoPersonaNombre(form.tipoPersona) === "Tutor") && form.num_telefono ? { num_telefono: form.num_telefono } : {})
        };
        try {
            await instance.patch(`/persona/${id}`, paciente);
            notify.success('Paciente actualizado correctamente');
            // Si estamos en modo modal avisamos al padre y no navegamos
            if (typeof onClose === 'function') {
                onClose(true);
            } else {
                setTimeout(() => navigate("/viewPacientes"), 1200);
            }
        } catch (err) {
            notify.error('Error al actualizar paciente');
        }
    };

    function getTipoPersonaNombre(id) {
        const tipo = personas.find((p) => String(p.id_persona_tipo) === String(id));
        return tipo ? tipo.tipo : "";
    }

    const content = (
        <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="mb-3">
                    <label className="form-label">Nombre</label>
                    <input type="text" className="form-control" name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Apellido</label>
                    <input type="text" className="form-control" name="apellido" value={form.apellido} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Fecha de Nacimiento</label>
                    <input type="date" className="form-control" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">DNI</label>
                    <input type="number" className="form-control" name="dni" value={form.dni} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Sexo</label>
                    <select className="form-select" name="sexo" value={form.sexo} onChange={handleChange} required>
                        <option value="">Seleccione</option>
                        <option value="1">Masculino</option>
                        <option value="2">Femenino</option>
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Domicilio</label>
                    <input type="text" className="form-control" name="domicilio" value={form.domicilio} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Localidad</label>
                    <select className="form-select" name="localidad" value={form.localidad} onChange={handleChange} required>
                        <option value="">Seleccione una localidad</option>
                        {localidades.map((loc) => (
                            <option key={loc.id_localidad} value={loc.id_localidad}>{loc.localidad}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Provincia</label>
                    <select className="form-select" name="provincia" value={form.provincia} onChange={handleChange} required>
                        <option value="">Seleccione una provincia</option>
                        {provincias.map((prov) => (
                            <option key={prov.id_provincia} value={prov.id_provincia}>{prov.provincia}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-3">
                    <label className="form-label">Tipo de persona</label>
                    <select className="form-select" name="tipoPersona" value={form.tipoPersona} onChange={handleChange} required>
                        <option value="">Seleccione el tipo de persona a registrar</option>
                        {personas.map((pers) => (
                            <option key={pers.id_persona_tipo} value={pers.id_persona_tipo}>{pers.tipo}</option>
                        ))}
                    </select>
                </div>
                {(form.tipoPersona === "1" || getTipoPersonaNombre(form.tipoPersona) === "Tutor") && (
                    <div className="mb-3">
                        <label className="form-label">Teléfono</label>
                        <input type="text" className="form-control" name="num_telefono" value={form.num_telefono} onChange={handleChange} required />
                    </div>
                )}
            </div>
            <div className="flex flex-col md:flex-row gap-2">
                {/* En modo modal delegamos el cierre al padre */}
                {typeof isOpen === 'undefined' ? (
                    <button type="button" className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded flex items-center gap-2" onClick={() => navigate("/viewPacientes")}>
                        <MdArrowBack size={20} /> Volver
                    </button>
                ) : (
                    <button type="button" className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 rounded flex items-center gap-2" onClick={() => typeof onClose === 'function' ? onClose(false) : null}>
                        <MdArrowBack size={20} /> Cancelar
                    </button>
                )}
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded flex items-center gap-2 md:flex-1 justify-center">
                    <MdSave size={20} /> Guardar Cambios
                </button>
            </div>
        </form>
    );

    // Si se usa como modal, envolver en Modal
    if (typeof isOpen !== 'undefined') {
        return (
            <Modal isOpen={isOpen} onClose={() => typeof onClose === 'function' ? onClose(false) : null} title="Editar Paciente">
                {content}
            </Modal>
        );
    }

    // Modo ruta normal
    return (
        <div className="container mt-5">
            <div className="card shadow">
                <div className="card-header bg-primary text-white">
                    <h4 className="mb-0">Editar Persona</h4>
                </div>
                <div className="card-body">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default EditarPaciente;
