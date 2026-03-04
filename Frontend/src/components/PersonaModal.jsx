import React, { useEffect, useState } from "react";
import instance from "../api/axios";
import Modal from './Modal';
import { useNotify } from "../context/notificationContext";
import PersonaForm from './PersonaForm';

export default function PersonaModal({ isOpen, onClose, onCreated }) {
  const [newPersonForm, setNewPersonForm] = useState({
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
  const [tiposPersona, setTiposPersona] = useState([]);
  const notify = useNotify();

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;
    (async () => {
      try {
        const [locRes, provRes, tiposRes] = await Promise.all([
          instance.get('/localidades'),
          instance.get('/provincia'),
          instance.get('/tipoPersona'),
        ]);
        if (!mounted) return;
        setLocalidades(locRes.data || []);
        setProvincias(provRes.data || []);
        setTiposPersona((tiposRes.data || []).filter(t => t.id_persona_tipo !== 3));
      } catch (e) {
        // ignorar errores de carga
      }
    })();
    return () => { mounted = false; };
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const personaPayload = {
      nombre: newPersonForm.nombre,
      apellido: newPersonForm.apellido,
      fecha_nacimiento: newPersonForm.fechaNacimiento,
      dni: String(newPersonForm.dni || ''),
      domicilio: newPersonForm.domicilio,
      id_genero: newPersonForm.sexo ? Number(newPersonForm.sexo) : undefined,
      id_localidad: newPersonForm.localidad ? Number(newPersonForm.localidad) : undefined,
      id_provincia: newPersonForm.provincia ? Number(newPersonForm.provincia) : undefined,
      id_persona_tipo: newPersonForm.tipoPersona ? Number(newPersonForm.tipoPersona) : undefined,
      num_telefono: newPersonForm.num_telefono || null,
    };

    try {
      console.log('PersonaModal: enviando payload', personaPayload);
      setSubmitting(true);
      // POST a /persona (singular) — coincide con otras llamadas en la app
      const { data } = await instance.post('/persona', personaPayload);
      console.log('PersonaModal: respuesta persona', data);
      let createdPaciente = null;

      // Intentar crear el paciente asociado inmediatamente si el backend lo soporta
      try {
        if (data?.id_persona) {
          const pacientePayload = { id_persona: data.id_persona };
          const { data: pac } = await instance.post('/pacientes', pacientePayload);
          createdPaciente = pac;
        }
      } catch (errPac) {
        // Si falla la creación del paciente, lo ignoramos pero informamos
        console.warn('No se creó el recurso paciente automáticamente', errPac);
      }

      if (onCreated) onCreated({ persona: data, paciente: createdPaciente });
      onClose?.();
      notify.success('Persona registrada');
      setNewPersonForm({ nombre: "", apellido: "", fechaNacimiento: "", dni: "", sexo: "", domicilio: "", localidad: "", provincia: "", tipoPersona: "", num_telefono: "" });
    } catch (err) {
      console.error('Error creando persona', err);
      const msg = err?.response?.data?.message || err?.message || 'Error al crear persona';
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cargar paciente">
      <PersonaForm
        form={newPersonForm}
        setForm={setNewPersonForm}
        localidades={localidades}
        provincias={provincias}
        tiposPersona={tiposPersona}
        onSubmit={handleSubmit}
        submitting={submitting}
        submitLabel="Registrar paciente"
      />
    </Modal>
  );
}
