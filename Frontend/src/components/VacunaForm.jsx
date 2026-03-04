import React, { useState, useEffect, useRef } from "react";
import instance from "../api/axios";
import { MdSave, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import PersonaModal from "./PersonaModal";
import { useNotify } from "../context/notificationContext";

export default function VacunaForm({
  user,
  crearNuevoPaciente,
  setCrearNuevoPaciente,
  form,
  setForm,
  vacunas = [],
  pacientes = [],
  personas = [],
  areas = [],
  onSubmit,
  loading,
}) {
    const notify = useNotify();
  const [open, setOpen] = useState(true);

  // Pacientes / personas search
  const [patientSearch, setPatientSearch] = useState("");
  const [patientSuggestions, setPatientSuggestions] = useState([]);
  const [patientLoading, setPatientLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const PAT_MIN = 1;

  const [personaSearch, setPersonaSearch] = useState("");
  const [personaSuggestions, setPersonaSuggestions] = useState([]);
  const [personaLoading, setPersonaLoading] = useState(false);
  const [showPersonaSuggestions, setShowPersonaSuggestions] = useState(false);
  const PERSONA_MIN = 1;

  // Lotes
  const [loteSearch, setLoteSearch] = useState("");
  const [loteSuggestions, setLoteSuggestions] = useState([]);
  const [loteLoading, setLoteLoading] = useState(false);
  const [showLoteSuggestions, setShowLoteSuggestions] = useState(false);
  const LOTE_MIN = 1;
  const [lotesCache, setLotesCache] = useState([]);

  const [newLoteDate, setNewLoteDate] = useState("");
  const [creatingLote, setCreatingLote] = useState(false);

  // Nuevo paciente modal
  const [showNewPersonModal, setShowNewPersonModal] = useState(false);

  // Badge cuando un paciente se crea y se selecciona automáticamente
  const [autoSelectedBadge, setAutoSelectedBadge] = useState("");
  const badgeTimerRef = useRef(null);
  const AUTO_BADGE_MS = 4000;

  // Cargar lotes iniciales
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await instance.get("/lotes");
        if (!mounted) return;
        if (Array.isArray(data)) setLotesCache(data);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Buscar pacientes y personas cuando cambia la búsqueda
  useEffect(() => {
    let mounted = true;
    const t = setTimeout(async () => {
      const q = (patientSearch || "").trim();

      // pacientes
      if (q.length < PAT_MIN) {
        if (mounted) setPatientSuggestions([]);
        return;
      }

      try {
        setPatientLoading(true);
        const { data: patients } = await instance.get(`/pacientes?search=${encodeURIComponent(q)}`);
        if (!mounted) return;
        setPatientSuggestions(Array.isArray(patients) ? patients : []);
      } catch (err) {
        console.warn("Error buscando pacientes", err);
        if (mounted) setPatientSuggestions([]);
      } finally {
        if (mounted) setPatientLoading(false);
      }
    }, 250);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [patientSearch]);

  // Buscar personas (separado para poder mostrar personas sin paciente)
  useEffect(() => {
    let mounted = true;
    const t = setTimeout(async () => {
      const q = (personaSearch || "").trim();
      if (q.length < PERSONA_MIN) {
        if (mounted) setPersonaSuggestions([]);
        return;
      }
      try {
        setPersonaLoading(true);
        const { data: pers } = await instance.get(`/persona?search=${encodeURIComponent(q)}`);
        if (!mounted) return;

        let allPersons = Array.isArray(pers) ? pers : [];
        if (allPersons.length === 0) {
          try {
            const resAll = await instance.get(`/persona`);
            const lowerQ = q.toLowerCase();
            allPersons = (Array.isArray(resAll.data) ? resAll.data : []).filter(p =>
              (p.nombre && p.nombre.toLowerCase().includes(lowerQ)) ||
              (p.apellido && p.apellido.toLowerCase().includes(lowerQ)) ||
              (p.dni && String(p.dni).includes(lowerQ))
            );
          } catch (e) { }
        }

        setPersonaSuggestions(allPersons);
      } catch (err) {
        console.warn("Error buscando personas", err);
        if (mounted) setPersonaSuggestions([]);
      } finally {
        if (mounted) setPersonaLoading(false);
      }
    }, 250);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [personaSearch]);

  // Buscar lotes
  useEffect(() => {
    let mounted = true;
    const t = setTimeout(async () => {
      const q = (loteSearch || "").trim();
      if (q.length < LOTE_MIN) {
        if (mounted) setLoteSuggestions([]);
        return;
      }
      try {
        setLoteLoading(true);
        
        // Filtrar siempre del cache local para búsqueda instantánea
        const lowerQ = q.toLowerCase();
        const filtered = lotesCache.filter(l => 
          l.lote && l.lote.toLowerCase().includes(lowerQ)
        );
        
        if (mounted) {
          setLoteSuggestions(filtered);
        }
      } catch (err) {
        console.warn("Error buscando lotes", err);
        if (mounted) setLoteSuggestions([]);
      } finally {
        if (mounted) setLoteLoading(false);
      }
    }, 200);
    return () => {
      mounted = false;
      clearTimeout(t);
    };
  }, [loteSearch, lotesCache]);

  return (
    <div className="bg-white rounded-2xl shadow-lg ring-1 ring-gray-200 p-5 w-full max-w-full relative">
      <div className="absolute top-4 right-4 flex flex-col items-end">
        <div className="absolute right-0 top-0">
          <button type="button" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded" onClick={() => setShowNewPersonModal(true)}>
            Cargar paciente
          </button>
          <div className="text-xs text-gray-500 mt-1 text-right">en caso de no existir el paciente puede cargarlo</div>
        </div>
      </div>

      <button type="button" className="w-full flex items-center justify-between text-lg font-semibold mb-4 cursor-pointer focus:outline-none" onClick={() => setOpen((v) => !v)}>
        <span className="flex items-center text-3xl gap-2"><MdSave /> Registrar nueva dosis</span>
        {open ? <MdKeyboardArrowUp className="text-2xl" /> : <MdKeyboardArrowDown className="text-2xl" />}
      </button>

      <div className={`transition-all duration-300 overflow-visible ${open ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"}`}>
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 w-full">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-700 font-medium">Fecha</label>
              <input type="date" name="fecha" value={form.fecha} onChange={(e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))} className="border rounded px-3 py-2" required />
            </div>

            <div className="flex flex-col gap-1 md:col-span-2">
              <label className="text-sm text-gray-700 font-medium">Vacuna</label>
              <select name="id_vacuna" value={form.id_vacuna} onChange={(e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))} className="border rounded px-3 py-2" required>
                <option value="">Seleccione una vacuna</option>
                {vacunas.map((v) => (<option key={v.id_vacuna ?? v.id} value={v.id_vacuna ?? v.id}>{v.vacunas ?? v.nombre ?? ""}</option>))}
              </select>
            </div>

            <div className="md:col-span-3">
              <label className="text-sm text-gray-700 font-medium">Paciente</label>
              <div className="relative">
                <input
                  name="_person_search"
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="Buscar por nombre, apellido o documento"
                  value={form._person_search ?? (form.id_paciente ? (pacientes.find(p => String(p.id_paciente) === String(form.id_paciente))?.persona ? `${pacientes.find(p => String(p.id_paciente) === String(form.id_paciente))?.persona.nombre} ${pacientes.find(p => String(p.id_paciente) === String(form.id_paciente))?.persona.apellido}` : `Paciente #${form.id_paciente}`) : (form.id_persona ? (personas.find(p => String(p.id_persona) === String(form.id_persona)) ? `${personas.find(p => String(p.id_persona) === String(form.id_persona))?.nombre} ${personas.find(p => String(p.id_persona) === String(form.id_persona))?.apellido}` : `Persona #${form.id_persona}`) : ''))}
                  onChange={(e) => {
                    const v = e.target.value;
                    setForm((f) => ({ ...f, _person_search: v, id_paciente: '', id_persona: '' }));
                    setPatientSearch(v);
                    setPersonaSearch(v);
                    setShowSuggestions(true);
                    setShowPersonaSuggestions(true);
                  }}
                  onFocus={() => { if (((form._person_search ?? '')).length >= PAT_MIN) { setShowSuggestions(true); setShowPersonaSuggestions(true); } }}
                  required
                />

                <input type="hidden" name="id_persona" value={form.id_persona ?? ''} />
                <input type="hidden" name="id_paciente" value={form.id_paciente ?? ''} />

                {autoSelectedBadge && (
                  <div className="absolute top-2 right-2 bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-xs font-medium shadow">
                    {autoSelectedBadge}
                  </div>
                )}

                {(showSuggestions || showPersonaSuggestions) && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow max-h-60 overflow-auto text-sm">
                    {patientLoading || personaLoading ? (
                      <div className="p-2 text-gray-500">Buscando...</div>
                    ) : (
                      <>
                        {/* Pacientes primero */}
                        {patientSuggestions.length > 0 && (
                          <div>
                            <div className="px-2 py-1 text-xs text-gray-500">Pacientes</div>
                            {patientSuggestions.map((p) => (
                              <div key={`p-${p.id_paciente}`} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => { setForm((f) => ({ ...f, id_paciente: String(p.id_paciente), id_persona: '', _person_search: p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${p.id_paciente}` })); setShowSuggestions(false); setShowPersonaSuggestions(false); }}>
                                {p.persona ? `${p.persona.nombre} ${p.persona.apellido} — ${p.persona.dni ?? ''}` : `Paciente #${p.id_paciente}`}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Personas sin paciente u otras personas */}
                        {personaSuggestions.length > 0 && (() => {
                          const patientPersonaIds = new Set();
                          (patientSuggestions || []).forEach((ps) => { if (ps.persona && ps.persona.id_persona) patientPersonaIds.add(String(ps.persona.id_persona)); });
                          // Also check against selected patient if any
                          if (form.id_paciente) {
                            const selectedP = pacientes.find(p => String(p.id_paciente) === String(form.id_paciente));
                            if (selectedP && selectedP.persona) patientPersonaIds.add(String(selectedP.persona.id_persona));
                          }

                          const filtered = (personaSuggestions || []).filter(per => !patientPersonaIds.has(String(per.id_persona)));
                          if (filtered.length === 0) return null;
                          return (
                            <div>
                              <div className="px-2 py-1 text-xs text-gray-500">Personas (General)</div>
                              {filtered.map(per => (
                                <div key={`per-${per.id_persona}`} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => { setForm((f) => ({ ...f, id_persona: String(per.id_persona), id_paciente: '', _person_search: `${per.nombre} ${per.apellido}` })); setShowSuggestions(false); setShowPersonaSuggestions(false); }}>
                                  {per.dni ? `${per.nombre} ${per.apellido} - ${per.dni}` : `${per.nombre} ${per.apellido}`}
                                </div>
                              ))}
                            </div>
                          );
                        })()}

                        {patientSuggestions.length === 0 && personaSuggestions.length === 0 && (
                          <div className="p-2 text-gray-500">No hay coincidencias. Se creará automáticamente al enviar.</div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal nuevo paciente (componente separado) */}
          <PersonaModal
            isOpen={showNewPersonModal}
            onClose={() => setShowNewPersonModal(false)}
            onCreated={(res) => {
              const persona = res?.persona;
              const paciente = res?.paciente;
              if (paciente && paciente.id_paciente) {
                setForm((f) => ({ ...f, id_paciente: String(paciente.id_paciente), id_persona: persona?.id_persona ? String(persona.id_persona) : f.id_persona, _person_search: `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}` }));
                const label = `Paciente seleccionado: ${persona?.nombre ?? ''} ${persona?.apellido ?? ''}`.trim();
                setAutoSelectedBadge(label);
                if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current);
                badgeTimerRef.current = setTimeout(() => { setAutoSelectedBadge(''); badgeTimerRef.current = null; }, AUTO_BADGE_MS);
              } else if (persona) {
                setForm((f) => ({ ...f, id_persona: persona?.id_persona ? String(persona.id_persona) : f.id_persona, id_paciente: '', _person_search: `${persona?.nombre ?? ''} ${persona?.apellido ?? ''}` }));
                setCrearNuevoPaciente(true);
              }
              setShowNewPersonModal(false);
            }}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-gray-700 font-medium">Número de dosis</label>
              {!form.refuerzo ? (
                <select name="dosis_numero" value={form.dosis_numero ?? ""} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, dosis_numero: v ? Number(v) : undefined })); }} className="border rounded px-3 py-2 w-full">
                  <option value="">No especificado</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              ) : (
                <select name="dosis_numero" value={form.dosis_numero ?? ""} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, dosis_numero: v ? Number(v) : undefined })); }} className="border rounded px-3 py-2 w-full">
                  <option value="">No especificado</option>
                  <option value="4">Primer refuerzo (1)</option>
                  <option value="5">Segundo refuerzo (2)</option>
                  <option value="6">Tercer refuerzo (3)</option>
                </select>
              )}

              <div className="text-xs text-gray-500 mt-1">1–3: serie primaria según calendario; 4+ se consideran refuerzos.</div>

              <div className="flex items-center gap-2 mt-2">
                <input id="refuerzo" type="checkbox" checked={!!form.refuerzo} onChange={() => setForm((f) => { const willBeRef = !f.refuerzo; if (willBeRef) { return { ...f, refuerzo: true, _prev_dosis: f.dosis_numero, dosis_numero: f.dosis_numero && f.dosis_numero >= 4 ? f.dosis_numero : 4 }; } const prev = f._prev_dosis; return { ...f, refuerzo: false, dosis_numero: prev && [1, 2, 3].includes(prev) ? prev : undefined, _prev_dosis: undefined }; })} className="h-4 w-4" />
                <label htmlFor="refuerzo" className="text-sm text-gray-700">Refuerzo</label>
              </div>
            </div>
          </div>

          <input type="hidden" name="external_source" value={form.external_source ?? ""} />
          <input type="hidden" name="external_id" value={form.external_id ?? ""} />

          {/* Lote siempre disponible, tanto para paciente existente como nuevo */}
          <div className="mt-2">
            <label className="text-sm text-gray-700 font-medium">Lote</label>
            <div className="relative">
              <input name="_lote_search" type="text" className="border rounded px-3 py-2 w-full" placeholder="Buscar o ingresar lote" value={form._lote_search ?? (form.id_lote ? lotesCache.find((l) => String(l.id_lote) === String(form.id_lote))?.lote ?? `Lote #${form.id_lote}` : "")} onChange={(e) => { const v = e.target.value; setForm((f) => ({ ...f, _lote_search: v, id_lote: "" })); setLoteSearch(v); setShowLoteSuggestions(true); }} onFocus={() => { if ((form._lote_search ?? "").length >= LOTE_MIN) setShowLoteSuggestions(true); }} />
              <input type="hidden" name="id_lote" value={form.id_lote ?? ""} />

              {showLoteSuggestions && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white border rounded shadow max-h-60 overflow-auto text-sm">
                  {loteLoading ? (
                    <div className="p-2 text-gray-500">Buscando...</div>
                  ) : (
                    <>
                      {loteSuggestions.length === 0 ? (
                        <div className="p-2 text-gray-500">No hay coincidencias</div>
                      ) : (
                        loteSuggestions.map((l) => (
                          <div key={l.id_lote} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => { setForm((f) => ({ ...f, id_lote: String(l.id_lote), _lote_search: l.lote })); setShowLoteSuggestions(false); }}>
                            {l.lote} {l.fecha_vencimiento ? `— ${new Date(l.fecha_vencimiento).toISOString().split('T')[0]}` : ''}
                          </div>
                        ))
                      )}

                      {!form.id_lote && (form._lote_search ?? "").trim().length > 0 && (
                        <div className="p-3 border-t bg-white shadow-sm rounded-b">
                          <div className="flex flex-col md:flex-row md:items-center gap-2">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-700">Fecha vencimiento</label>
                              <input type="date" value={newLoteDate} onChange={(e) => setNewLoteDate(e.target.value)} className="border rounded px-2 py-1" />
                            </div>
                            <div className="flex-1 text-sm text-gray-700">Crear nuevo lote: <strong className="break-words">{form._lote_search}</strong></div>
                            <div className="flex-shrink-0">
                              <button type="button" onClick={async () => {
                                if (!form._lote_search || form._lote_search.trim().length === 0) return;

                                const loteTexto = form._lote_search.trim();
                                const loteExistente = lotesCache.find(
                                  (l) => l.lote && l.lote.toLowerCase() === loteTexto.toLowerCase()
                                );

                                if (loteExistente) {
                                  notify.error(`El lote "${loteTexto}" ya existe`);
                                  return;
                                }

                                setCreatingLote(true);
                                try {
                                  const payload = { lote: loteTexto };
                                  if (newLoteDate) payload.fecha_vencimiento = newLoteDate;
                                  const { data: created } = await instance.post('/lotes', payload);

                                  if (created && created.id_lote) {
                                    setForm((f) => ({ ...f, id_lote: String(created.id_lote), _lote_search: created.lote }));
                                    setLotesCache((c) => [created, ...c]);
                                    setShowLoteSuggestions(false);
                                    setNewLoteDate('');
                                    notify.success('Lote creado exitosamente');
                                  }
                                } catch (err) {
                                  console.warn('Error creando lote', err);
                                  const errorMsg = err.response?.data?.message || 'Error al crear el lote. Intente nuevamente.';
                                  notify.error(errorMsg);
                                } finally {
                                  setCreatingLote(false);
                                }
                              }} className="px-3 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition-colors">{creatingLote ? 'Creando...' : 'Crear y asociar lote'}</button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button disabled={loading} type="submit" className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors"><MdSave /> Registrar dosis</button>
          </div>
        </form>
      </div>
    </div>
  );
}