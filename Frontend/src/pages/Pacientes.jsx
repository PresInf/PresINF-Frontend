import React, { useState, useEffect } from "react";
import instance from "../api/axios";
import { useNotify } from "../context/notificationContext";
import { getErrorMessage } from "../utils/errorHandler";
import PersonaForm from "../components/PersonaForm";

const Pacientes = () => {
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
    num_telefono: "", // siempre presente
  });

  const [localidades, setLocalidades] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [personas, setPersonas] = useState([]);
  const notify = useNotify();

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
      id_genero: parseInt(form.sexo),
      id_localidad: parseInt(form.localidad),
      id_provincia: parseInt(form.provincia),
      id_persona_tipo: parseInt(form.tipoPersona),
      num_telefono: form.num_telefono || null, // siempre se envía
    };

    try {
      const { data } = await instance.post("/persona", paciente);
      notify.success("Paciente registrado correctamente");
      setForm({
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
    } catch (error) {
      const msg = getErrorMessage(error);
      notify.error(`❌ ${msg}`);
      console.error("Error del backend:", error);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [loc, prov, tipos] = await Promise.all([
          instance.get("/localidades"),
          instance.get("/provincia"),
          instance.get("/tipoPersona"),
        ]);
        setLocalidades(loc.data || []);
        setProvincias(prov.data || []);
        const tiposPersonaFiltrados = (tipos.data || []).filter((persona) => persona.id_persona_tipo !== 3);
        setPersonas(tiposPersonaFiltrados);
      } catch (err) {
        notify.error("Error al cargar datos iniciales");
      }
    };
    load();
  }, [notify]);

  return (
    <div className="container mt-5">
      <div className="card shadow">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">Registro de Personas</h4>
        </div>
        <div className="card-body">
          <PersonaForm
            form={form}
            setForm={setForm}
            localidades={localidades}
            provincias={provincias}
            tiposPersona={personas}
            onSubmit={handleSubmit}
            submitLabel="Registrar Paciente"
          />
        </div>
      </div>
    </div>
  );
};

export default Pacientes;
