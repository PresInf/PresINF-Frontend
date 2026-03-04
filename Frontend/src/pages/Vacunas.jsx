import React, { useState, useEffect } from "react";
import instance from "../api/axios";
import { useAuth } from "../context/authContext";
import { useNotify } from "../context/notificationContext";
import { useVacunasData } from "../Hooks/useVacunasData";
import VacunaForm from "../components/VacunaForm";
import DosesTable from "../components/DosesTable";
import Modal from '../components/Modal';


const Vacunas = () => {
  const { user } = useAuth();
  const notify = useNotify();
  const {
    lista, vacunas, pacientes, personas, areas, resultados, vacunadores,
    loading, error,
    createDose, updateDose, deleteDose, createVacuna, updateVacuna, deleteVacuna,
  } = useVacunasData();
  const [crearNuevoPaciente, setCrearNuevoPaciente] = useState(false);
  const [form, setForm] = useState({
    fecha: "",
    id_vacuna: "",
    id_paciente: "",
    id_persona: "",
    id_area_programatica: "",
    dosis_numero: undefined,
    external_source: undefined,
    external_id: undefined,
  });

  const [editingDoseId, setEditingDoseId] = useState(null);
  const [doseForm, setDoseForm] = useState({
    fecha: "",
    id_vacuna: "",
    id_paciente: "",
    dosis_numero: undefined,
    external_source: undefined,
    external_id: undefined,
  });
  // autocomplete state for lote in edit modal
  const [editLoteSearch, setEditLoteSearch] = useState('');
  const [editLoteSuggestions, setEditLoteSuggestions] = useState([]);
  const [editLoteLoading, setEditLoteLoading] = useState(false);
  const [showEditLoteSuggestions, setShowEditLoteSuggestions] = useState(false);
  const EDIT_LOTE_MIN = 1;
  const [creatingEditLote, setCreatingEditLote] = useState(false);
  const [newEditLoteDate, setNewEditLoteDate] = useState('');
  // autocomplete state for edit modal
  const [editPatientSearch, setEditPatientSearch] = useState('');
  const [editPatientSuggestions, setEditPatientSuggestions] = useState([]);
  const [editPatientLoading, setEditPatientLoading] = useState(false);
  const [showEditPatientSuggestions, setShowEditPatientSuggestions] = useState(false);
  const EDIT_PATIENT_MIN = 2;

  useEffect(() => {
    let mounted = true;
    const handler = setTimeout(async () => {
      const qstr = (editPatientSearch || '').trim();
      if (qstr.length >= EDIT_PATIENT_MIN) {
        setEditPatientLoading(true);
        try {
          const q = `/pacientes?search=${encodeURIComponent(qstr)}&limit=10`;
          const { data } = await instance.get(q);
          if (!mounted) return;
          const arr = Array.isArray(data) ? data : [];
          const isNumeric = /^\d/.test(qstr);
          if (isNumeric) {
            setEditPatientSuggestions(arr.slice(0, 10));
          } else {
            const m = new Map();
            arr.forEach((p) => {
              const personaId = p.persona?.id_persona;
              const dni = p.persona?.dni;
              const pacienteId = p.id_paciente ?? p.paciente?.id_paciente;
              const key = personaId ?? dni ?? pacienteId ?? `${(p.persona?.nombre ?? '')}-${(p.persona?.apellido ?? '')}-${String(pacienteId)}`;
              if (!m.has(String(key))) m.set(String(key), p);
            });
            setEditPatientSuggestions(Array.from(m.values()).slice(0, 10));
          }
        } catch (err) {
          // fallback local
          const s = qstr.toLowerCase();
          const local = (pacientes || []).filter(p => (`${p.persona?.nombre ?? ''} ${p.persona?.apellido ?? ''} ${p.persona?.dni ?? ''}`).toLowerCase().includes(s)).slice(0, 10);
          const isNumericLocal = /^\d/.test(qstr);
          if (isNumericLocal) {
            if (mounted) setEditPatientSuggestions(local);
          } else {
            const m2 = new Map();
            local.forEach((p) => {
              const personaId = p.persona?.id_persona;
              const dni = p.persona?.dni;
              const pacienteId = p.id_paciente ?? p.paciente?.id_paciente;
              const key = personaId ?? dni ?? pacienteId ?? `${(p.persona?.nombre ?? '')}-${(p.persona?.apellido ?? '')}-${String(pacienteId)}`;
              if (!m2.has(String(key))) m2.set(String(key), p);
            });
            if (mounted) setEditPatientSuggestions(Array.from(m2.values()).slice(0, 10));
          }
        } finally {
          if (mounted) setEditPatientLoading(false);
        }
      } else {
        setEditPatientSuggestions([]);
      }
    }, 300);

    return () => { mounted = false; clearTimeout(handler); };
  }, [editPatientSearch, pacientes]);

  useEffect(() => {
    let mounted = true;
    const handler = setTimeout(async () => {
      const qstr = (editLoteSearch || '').trim();
      if (qstr.length >= EDIT_LOTE_MIN) {
        setEditLoteLoading(true);
        try {
          const { data } = await instance.get('/lotes');
          const arr = Array.isArray(data) ? data : [];
          const s = qstr.toLowerCase();
          const filtered = arr.filter(l => String(l.lote ?? '').toLowerCase().includes(s) || String(l.id_lote ?? '').startsWith(qstr)).slice(0, 10);
          if (mounted) setEditLoteSuggestions(filtered);
        } catch (err) {
          if (mounted) setEditLoteSuggestions([]);
        } finally {
          if (mounted) setEditLoteLoading(false);
        }
      } else {
        setEditLoteSuggestions([]);
      }
    }, 200);
    return () => { mounted = false; clearTimeout(handler); };
  }, [editLoteSearch]);


  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Si se desea crear lote, usar el botón 'Crear y asociar lote' en el formulario
      const base = {
        fecha: form.fecha,
        id_vacuna: Number(form.id_vacuna),
        id_vacunador: user.id,
        id_lote: form.id_lote ? Number(form.id_lote) : undefined,
        dosis_numero: form.dosis_numero ? Number(form.dosis_numero) : undefined,
        external_source: form.external_source || undefined,
        external_id: form.external_id || undefined,
      };

      let payload;
      if (form.id_paciente) {
        payload = { ...base, id_paciente: Number(form.id_paciente) };
      } else if (form.id_persona) {
        payload = { ...base, id_persona: Number(form.id_persona), id_area_programatica: form.id_area_programatica ? Number(form.id_area_programatica) : undefined };
      } else {
        // No existe paciente ni persona seleccionada: crear paciente rápido y usar su id
        const raw = (form._person_search || '').trim();
        let dni = null;
        let nombre = '';
        let apellido = '';
        if (/^\d{6,}$/.test(raw)) {
          dni = raw;
          nombre = raw;
          apellido = '';
        } else {
          const parts = raw.split(/\s+/).filter(Boolean);
          if (parts.length === 0) {
            notify.error('Ingrese nombre o DNI para crear paciente');
            return;
          } else if (parts.length === 1) {
            nombre = parts[0];
            apellido = '';
          } else {
            nombre = parts.slice(0, -1).join(' ');
            apellido = parts.slice(-1).join(' ');
          }
        }

        try {
          const { data: created } = await instance.post('/pacientes/quick', { nombre, apellido, dni, id_area_programatica: form.id_area_programatica ? Number(form.id_area_programatica) : undefined });
          if (!created || !created.id_paciente) throw new Error('No creado');
          payload = { ...base, id_paciente: Number(created.id_paciente) };
        } catch (err) {
          notify.error('Error al crear paciente automáticamente');
          return;
        }
      }

      await createDose(payload);
      setForm({
        fecha: "",
        id_vacuna: "",
        id_paciente: "",
        id_persona: "",
        id_area_programatica: "",
      });
      notify.success("Dosis registrada");
    } catch (err) {
      notify.error(err?.response?.data?.message || "Error al registrar dosis");
    }
  };

  const startEditDose = (d) => {
    setEditingDoseId(d.id_dosis_aplicada);
    setDoseForm({
      fecha: d.fecha?.split("T")[0] ?? "",
      id_vacuna: d.id_vacuna ?? d.vacuna?.id_vacuna ?? "",
      id_paciente: d.id_paciente ?? d.paciente?.id_paciente ?? "",
      dosis_numero: d.dosis_numero ?? undefined,
      external_source: d.external_source ?? undefined,
      external_id: d.external_id ?? undefined,
      id_lote: d.id_lote ?? d.lote?.id_lote ?? undefined,
      _lote_search: d.lote?.lote ?? (d.id_lote ? `Lote #${d.id_lote}` : ''),
    });
  };

  const saveEditDose = async () => {
    try {
      // Si en la edición se quiere crear un lote, utilizar el botón "Crear y asociar lote" en la modal
      await updateDose(editingDoseId, {
        ...doseForm,
        id_vacuna: Number(doseForm.id_vacuna),
        id_paciente: Number(doseForm.id_paciente),
        id_lote: doseForm.id_lote ? Number(doseForm.id_lote) : undefined,
        dosis_numero: doseForm.dosis_numero ? Number(doseForm.dosis_numero) : undefined,
        external_source: doseForm.external_source || undefined,
        external_id: doseForm.external_id || undefined,
      });
      setEditingDoseId(null);
      notify.success("Dosis actualizada");
    } catch (e) {
      notify.error("Error al actualizar");
    }
  };

  const cancelEditDose = () => {
    setEditingDoseId(null);
    setDoseForm({ fecha: "", id_vacuna: "", id_paciente: "", dosis_numero: undefined, external_source: undefined, external_id: undefined });
  };



  const confirmDeleteDose = async (id) => {
    await deleteDose(id);
    notify.success("Dosis eliminada");
  };

  if (loading) return <p className="text-gray-500 p-4">Cargando...</p>;
  if (error) return <p className="text-red-500 p-4">{error}</p>;

  return (
    <div className="p-4 space-y-8">
      <h2 className="text-2xl font-bold">Gestión de vacunas</h2>

      {/* Formulario para registrar dosis */}
      <VacunaForm
        {...{
          user,
          crearNuevoPaciente,
          setCrearNuevoPaciente,
          form,
          setForm,
          vacunas,
          pacientes,
          personas,
          areas,
          onSubmit: handleCreate,
          loading,
        }}
      />


      {/* Filtro integrado en la tabla para ahorrar espacio */}
      {/* Tabla de dosis */}
      <DosesTable
        {...{
          lista: resultados.length > 0 ? resultados : lista, //  muestra filtrados o todos
          vacunas,
          pacientes,
          vacunadores,
          editingDoseId,
          doseForm,
          setDoseForm,
          onStartEditDose: startEditDose,
          onSaveEditDose: saveEditDose,
          onCancelEditDose: cancelEditDose,
          onConfirmDeleteDose: confirmDeleteDose,
          hideInternalFilter: false,
        }}
      />

      {/* Modal para editar dosis: se abre sólo cuando editingDoseId != null */}
      <Modal isOpen={editingDoseId !== null} onClose={cancelEditDose} title="Editar Dosis">
        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Fecha</label>
            <input type="date" value={doseForm.fecha} onChange={(e) => setDoseForm(s => ({ ...s, fecha: e.target.value }))} className="w-full border px-3 py-2 rounded" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Vacuna</label>
            <select value={doseForm.id_vacuna} onChange={(e) => setDoseForm(s => ({ ...s, id_vacuna: e.target.value }))} className="w-full border px-3 py-2 rounded">
              <option value="">Seleccione</option>
              {vacunas.map(v => <option key={v.id_vacuna ?? v.id} value={v.id_vacuna ?? v.id}>{v.nombre ?? v.vacunas}</option>)}
            </select>
          </div>
          <div className="relative">
            <label className="block mb-1 font-medium">Paciente</label>
            <input
              type="text"
              value={doseForm._patient_search ?? (doseForm.id_paciente ? (pacientes.find(p => String(p.id_paciente) === String(doseForm.id_paciente))?.persona ? `${pacientes.find(p => String(p.id_paciente) === String(doseForm.id_paciente))?.persona.nombre} ${pacientes.find(p => String(p.id_paciente) === String(doseForm.id_paciente))?.persona.apellido}` : `Paciente #${doseForm.id_paciente}`) : '')}
              onChange={(e) => { const v = e.target.value; setDoseForm(s => ({ ...s, _patient_search: v, id_paciente: '' })); setEditPatientSearch(v); setShowEditPatientSuggestions(true); }}
              onFocus={() => { if ((doseForm._patient_search ?? '').length >= EDIT_PATIENT_MIN) setShowEditPatientSuggestions(true); }}
              placeholder="Buscar paciente por nombre, apellido o documento"
              className="border rounded px-3 py-2 w-full"
            />

            <select value={doseForm.id_paciente} onChange={(e) => setDoseForm(s => ({ ...s, id_paciente: e.target.value }))} className="hidden">
              <option value="">Seleccione</option>
              {pacientes.map(p => <option key={p.id_paciente} value={p.id_paciente}>{p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${p.id_paciente}`}</option>)}
            </select>

            {showEditPatientSuggestions && (
              <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-auto text-sm">
                {editPatientLoading ? (
                  <div className="p-2 text-gray-500">Buscando...</div>
                ) : (
                  <>
                    {editPatientSuggestions.length === 0 ? (
                      <div className="p-2 text-gray-500">No hay coincidencias</div>
                    ) : (
                      editPatientSuggestions.map(p => (
                        <div key={p.id_paciente} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => { setDoseForm(s => ({ ...s, id_paciente: String(p.id_paciente), _patient_search: p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${p.id_paciente}` })); setShowEditPatientSuggestions(false); }}>
                          {p.persona ? `${p.persona.nombre} ${p.persona.apellido} — ${p.persona.dni ?? ''}` : `Paciente #${p.id_paciente}`}
                        </div>
                      ))
                    )}
                  </>
                )}
              </div>
            )}
            <div className="relative mt-3">
              <label className="block mb-1 font-medium">Lote (opcional)</label>
              <input
                type="text"
                value={doseForm._lote_search ?? (doseForm.id_lote ? (`Lote #${doseForm.id_lote}`) : '')}
                onChange={(e) => { const v = e.target.value; setDoseForm(s => ({ ...s, _lote_search: v, id_lote: '' })); setEditLoteSearch(v); setShowEditLoteSuggestions(true); }}
                onFocus={() => { if ((doseForm._lote_search ?? '').length >= EDIT_LOTE_MIN) setShowEditLoteSuggestions(true); }}
                placeholder="Buscar o ingresar lote"
                className="border rounded px-3 py-2 w-full"
              />
              <input type="hidden" value={doseForm.id_lote ?? ''} />

              {showEditLoteSuggestions && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-auto text-sm">
                  {editLoteLoading ? (
                    <div className="p-2 text-gray-500">Buscando...</div>
                  ) : (
                    <>
                      {editLoteSuggestions.length === 0 ? (
                        <div className="p-2 text-gray-500">No hay coincidencias</div>
                      ) : (
                        editLoteSuggestions.map(l => (
                          <div key={l.id_lote} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => { setDoseForm(s => ({ ...s, id_lote: String(l.id_lote), _lote_search: l.lote })); setShowEditLoteSuggestions(false); }}>
                            {l.lote} {l.fecha_vencimiento ? `— ${l.fecha_vencimiento}` : ''}
                          </div>
                        ))
                      )}

                      {/* Crear lote manualmente en la modal si el usuario escribió algo y no seleccionó */}
                      {(!doseForm.id_lote && (doseForm._lote_search ?? '').trim().length > 0) && (
                        <div className="p-2 border-t flex items-center gap-2 bg-gray-50">
                          <input type="date" value={newEditLoteDate} onChange={(e) => setNewEditLoteDate(e.target.value)} className="border rounded px-2 py-1" />
                          <button type="button" onClick={async () => {
                            if (!doseForm._lote_search || doseForm._lote_search.trim().length === 0) return;
                            setCreatingEditLote(true);
                            try {
                              const payload = { lote: doseForm._lote_search.trim() };
                              if (newEditLoteDate) payload.fecha_vencimiento = newEditLoteDate;
                              const { data: created } = await instance.post('/lotes', payload);
                              if (created && created.id_lote) {
                                setDoseForm(s => ({ ...s, id_lote: String(created.id_lote), _lote_search: created.lote }));
                                setShowEditLoteSuggestions(false);
                              }
                            } catch (err) {
                              console.warn('Error creando lote', err);
                            } finally {
                              setCreatingEditLote(false);
                            }
                          }} className="px-3 py-1 bg-green-600 text-white rounded">{creatingEditLote ? 'Creando...' : 'Crear y asociar lote'}</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block mb-1 font-medium">Número de dosis</label>
                <input type="number" min={1} value={doseForm.dosis_numero ?? ''} onChange={(e) => setDoseForm(s => ({ ...s, dosis_numero: e.target.value ? Number(e.target.value) : undefined }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block mb-1 font-medium">External source</label>
                <input type="text" value={doseForm.external_source ?? ''} onChange={(e) => setDoseForm(s => ({ ...s, external_source: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block mb-1 font-medium">External id</label>
                <input type="text" value={doseForm.external_id ?? ''} onChange={(e) => setDoseForm(s => ({ ...s, external_id: e.target.value }))} className="w-full border px-3 py-2 rounded" />
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button className="px-4 py-2 border rounded" onClick={cancelEditDose}>Cancelar</button>
            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={saveEditDose}>Guardar cambios</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Vacunas;
