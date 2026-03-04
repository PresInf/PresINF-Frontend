import React, { useState, useMemo, useEffect } from "react";
import Papa from 'papaparse';
import { validateAndNormalizeData } from "../utils/validateAndNormalizeData";
import instance from '../api/axios';
import { useAuth } from '../context/authContext';
import { MdEdit, MdDelete, MdSave, MdClose } from "react-icons/md";

const DosesTable = (props) => {
    const {
        lista = [],
        vacunas = [],
        pacientes = [],
        vacunadores = [],
        onStartEditDose = () => { },
        onConfirmDeleteDose = () => { },
        externalFilters = null,
        hideInternalFilter = false,
    } = props;
    const { user } = useAuth();
    const [showFilter, setShowFilter] = useState(false);
    const [filters, setFilters] = useState({ id_vacuna: '', id_paciente: '', fecha_desde: '', fecha_hasta: '', id_lote: '' });
    const [patientSearch, setPatientSearch] = useState('');
    const [patientSuggestions, setPatientSuggestions] = useState([]);
    const [patientLoading, setPatientLoading] = useState(false);
    const [showPatientSuggestions, setShowPatientSuggestions] = useState(false);
    const PATIENT_MIN_CHARS = 2;

    const handleFileUpload = (file) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const { data } = results;

                // Validar y normalizar los datos
                const { validData, errors } = validateAndNormalizeData(data);

                if (errors.length > 0) {
                    console.error("Errores encontrados:", errors);
                    alert(`Se encontraron errores:\n${errors.join("\n")}`);
                    return;
                }

                // If uploader (current user) exists, set as vacunador when missing
                const rowsToSend = validData.map(r => ({ ...r, id_vacunador: (r.id_vacunador ?? null) }));
                if (user && user.id) {
                    rowsToSend.forEach(r => {
                        if (!r.id_vacunador && !r.vacunador_nombre && !r.vacunador_email) {
                            r.id_vacunador = user.id;
                        }
                    });
                }

                // Enviar todas las filas normalizadas al endpoint de importación
                uploadDataToBackend(rowsToSend);
            },
            error: (error) => {
                console.error("Error al procesar el archivo:", error);
            },
        });
    };

    const [importWarnings, setImportWarnings] = useState([]);
    const [showWarningsModal, setShowWarningsModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    const uploadDataToBackend = async (data) => {
        try {
            const { data: resp } = await instance.post('/dosis-aplicada/import', data);
            if (resp?.warnings && resp.warnings.length) {
                setImportWarnings(resp.warnings);
                setShowWarningsModal(true);
            } else {
                setShowSuccessModal(true);
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            const msg = error?.response?.data || error.message || 'Error al conectar con el servidor.';
            alert(`Error al cargar los datos: ${JSON.stringify(msg)}`);
        }
    };
    const getIsoDate = (value) => {
        if (!value && value !== 0) return "";
        const s = String(value);
        // If already YYYY-MM-DD or similar, take first part before T
        const iso = s.split('T')[0];
        // basic validation
        if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
        return "";
    };

    const formatDateDisplay = (value) => {
        const iso = getIsoDate(value);
        if (!iso) return "—";
        const [y, m, d] = iso.split('-');
        return `${d}-${m}-${y}`;
    };

    const toDateInput = (value) => getIsoDate(value);

    const filteredList = useMemo(() => {
        const applied = externalFilters || filters;
        return lista.filter(d => {
            if (applied.id_vacuna && String(applied.id_vacuna) !== String(d.id_vacuna ?? d.vacuna?.id_vacuna ?? '')) return false;
            if (applied.id_paciente) {
                const val = String(applied.id_paciente);
                if (val.startsWith('patient:')) {
                    const expected = val.split(':')[1];
                    const actual = String(d.id_paciente ?? d.paciente?.id_paciente ?? '');
                    if (expected !== actual) return false;
                } else if (val.startsWith('persona:')) {
                    const expected = val.split(':')[1];
                    const actual = String(d.paciente?.persona?.id_persona ?? d.paciente?.id_paciente ?? '');
                    if (expected !== actual) return false;
                } else if (val.startsWith('dni:')) {
                    const expected = val.split(':')[1];
                    const actual = String(d.paciente?.persona?.dni ?? '').trim();
                    if (expected !== actual) return false;
                } else {
                    if (Number(val) !== Number(d.id_paciente ?? d.paciente?.id_paciente)) return false;
                }
            }
            if (applied.id_vacunador && Number(applied.id_vacunador) !== (d.id_vacunador ?? d.vacunador?.id)) return false;
            if (applied.id_lote && String(applied.id_lote) !== String(d.id_lote ?? d.lote?.id_lote ?? '')) return false;
            if (applied.fecha_desde) {
                const fIso = getIsoDate(d.fecha);
                if (!fIso || fIso < applied.fecha_desde) return false;
            }
            if (applied.fecha_hasta) {
                const fIso = getIsoDate(d.fecha);
                if (!fIso || fIso > applied.fecha_hasta) return false;
            }
            return true;
        }).sort((a, b) => {
            const aIso = getIsoDate(a.fecha) || '';
            const bIso = getIsoDate(b.fecha) || '';
            return bIso.localeCompare(aIso);
        });
    }, [lista, filters, externalFilters]);

    // deduplicate vacunas for selects
    const uniqueVacunas = useMemo(() => {
        const m = new Map();
        (vacunas || []).forEach((v, idx) => {
            const id = v.id_vacuna ?? v.id ?? `__missing_${idx}`;
            if (!m.has(String(id))) m.set(String(id), v);
        });
        return Array.from(m.values());
    }, [vacunas]);

    // load lotes for filter options
    const [lotes, setLotes] = useState([]);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const { data } = await instance.get('/lotes');
                if (mounted && Array.isArray(data)) setLotes(data);
            } catch (e) {
                // ignore
            }
        })();
        return () => { mounted = false; };
    }, []);

    // Filtrar usuarios por paginas
    const PAGE_SIZE = 8;
    const [page, setPage] = useState(1);

    const totalPages = useMemo(() => Math.max(1, Math.ceil((filteredList?.length || 0) / PAGE_SIZE)), [filteredList]);

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [totalPages, page]);

    const visible = useMemo(() => {
        const start = (page - 1) * PAGE_SIZE;
        return (filteredList || []).slice(start, start + PAGE_SIZE);
    }, [filteredList, page]);

    // Pacientes que tienen al menos una dosis en la lista (usar ids como strings)
    const patientsWithDoses = useMemo(() => {
        const s = new Set();
        (lista || []).forEach(d => {
            const pid = d.id_paciente ?? (d.paciente?.id_paciente ?? null);
            if (pid !== undefined && pid !== null) s.add(String(pid));
        });
        return s;
    }, [lista]);

    // Personas que tienen al menos una dosis (por id_persona)
    const personasWithDoses = useMemo(() => {
        const s = new Set();
        (lista || []).forEach(d => {
            const perId = d.paciente?.persona?.id_persona ?? null;
            if (perId !== undefined && perId !== null) s.add(String(perId));
        });
        return s;
    }, [lista]);

    const goTo = (n) => setPage(Math.min(Math.max(1, n), totalPages));

    // Debounced search for patients (server-side, fallback to local `pacientes` prop)
    useEffect(() => {
        let mounted = true;
        const handler = setTimeout(async () => {
            if (patientSearch && patientSearch.length >= PATIENT_MIN_CHARS) {
                setPatientLoading(true);
                try {
                    const q = `/pacientes?search=${encodeURIComponent(patientSearch)}&limit=20`;
                    const { data } = await instance.get(q);
                    if (!mounted) return;
                    const arr = Array.isArray(data) ? data : [];
                    // keep only patients that have doses and dedupe by id
                    const seen = new Set();
                    const filtered = [];
                    for (const p of arr) {
                        const personaId = p.persona?.id_persona ?? null;
                        const pacienteId = p.id_paciente ?? p.paciente?.id_paciente ?? null;
                        const key = personaId ? `persona:${personaId}` : (pacienteId ? `paciente:${pacienteId}` : null);
                        if (!key) continue;
                        // include if persona or paciente has doses
                        if (personaId) {
                            if (!personasWithDoses.has(String(personaId))) continue;
                        } else {
                            if (!patientsWithDoses.has(String(pacienteId))) continue;
                        }
                        if (seen.has(key)) continue;
                        seen.add(key);
                        filtered.push(p);
                        if (filtered.length >= 10) break;
                    }
                    setPatientSuggestions(filtered);
                } catch (err) {
                    // Fallback: filtrar localmente si backend falla
                    const s = patientSearch.toLowerCase();
                    const localRaw = (pacientes || []).filter(p => {
                        // sólo pacientes con dosis
                        if (!patientsWithDoses.has(String(p.id_paciente ?? ''))) return false;
                        const txt = `${p.persona?.nombre ?? ''} ${p.persona?.apellido ?? ''} ${p.persona?.dni ?? ''}`.toLowerCase();
                        return txt.includes(s);
                    });
                    const seen2 = new Set();
                    const local = [];
                    for (const p of localRaw) {
                        const personaId = p.persona?.id_persona ?? null;
                        const pacienteId = p.id_paciente ?? p.paciente?.id_paciente ?? null;
                        const key = personaId ? `persona:${personaId}` : (pacienteId ? `paciente:${pacienteId}` : null);
                        if (!key) continue;
                        if (seen2.has(key)) continue;
                        seen2.add(key);
                        local.push(p);
                        if (local.length >= 10) break;
                    }
                    if (mounted) setPatientSuggestions(local);
                } finally {
                    if (mounted) setPatientLoading(false);
                }
            } else {
                // If input cleared or too short, show nothing or some local samples
                if (!patientSearch) {
                    setPatientSuggestions([]);
                } else {
                    // show first unique pacientes that have doses
                    const seen = new Set();
                    const out = [];
                    for (const p of (pacientes || [])) {
                        const personaId = p.persona?.id_persona ?? null;
                        const pacienteId = p.id_paciente ?? p.paciente?.id_paciente ?? null;
                        const key = personaId ? `persona:${personaId}` : (pacienteId ? `paciente:${pacienteId}` : null);
                        if (!key) continue;
                        // include only those with doses (persona or paciente)
                        if (personaId) {
                            if (!personasWithDoses.has(String(personaId))) continue;
                        } else {
                            if (!patientsWithDoses.has(String(pacienteId))) continue;
                        }
                        if (seen.has(key)) continue;
                        seen.add(key);
                        out.push(p);
                        if (out.length >= 10) break;
                    }
                    setPatientSuggestions(out);
                }
            }
        }, 300);

        return () => { mounted = false; clearTimeout(handler); };
    }, [patientSearch, pacientes, patientsWithDoses, personasWithDoses]);

    return (
        <div className="bg-white rounded-xl shadow p-4">
            {/* Warnings modal */}
            {showWarningsModal && (
                <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg max-w-xl w-full p-4">
                        <h4 className="text-lg font-semibold mb-2">Advertencias en la importación</h4>
                        <div className="max-h-64 overflow-auto text-sm">
                            {importWarnings.map((w, i) => (
                                <div key={i} className="border-b py-2">
                                    <div><strong>Fila:</strong> {w.documento ?? '—'}</div>
                                    <div><strong>Issue:</strong> {w.issue}</div>
                                    {w.provided_vacunador_id && <div><strong>vacunador id:</strong> {w.provided_vacunador_id}</div>}
                                    {w.provided_vacunador_name && <div><strong>vacunador nombre:</strong> {w.provided_vacunador_name}</div>}
                                    {w.provided_vacunador_email && <div><strong>vacunador email:</strong> {w.provided_vacunador_email}</div>}
                                    {w.provided_area_id && <div><strong>area id:</strong> {w.provided_area_id}</div>}
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 text-right">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowWarningsModal(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
                        <h4 className="text-lg font-semibold mb-2">Importación exitosa</h4>
                        <p>Los datos se cargaron correctamente.</p>
                        <div className="mt-3 text-right">
                            <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={() => setShowSuccessModal(false)}>Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">Dosis aplicadas</h3>
                <div className="flex items-center gap-3">
                    {!hideInternalFilter && (<button className="bg-gray-200 text-gray-800 px-3 py-1 rounded" onClick={() => setShowFilter(s => !s)}>{showFilter ? 'Ocultar filtros' : 'Mostrar filtros'}</button>)}
                    <input
                        type="file"
                        accept=".csv, .xlsx"
                        className="hidden"
                        id="file-upload"
                        onChange={(e) => handleFileUpload(e.target.files[0])}
                    />
                    <label htmlFor="file-upload" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded cursor-pointer">
                        Subir archivo
                    </label>
                </div>
            </div>

            {/* Filtro estético fuera de la tabla */}
            {showFilter && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
                        <div>
                            <label className="text-sm text-gray-600">Vacuna</label>
                            <select className="w-full mt-1 border rounded px-3 py-2 bg-white" value={filters.id_vacuna} onChange={(e) => setFilters(f => ({ ...f, id_vacuna: e.target.value }))}>
                                <option value="">Todas las vacunas</option>
                                {uniqueVacunas.map((v, idx) => {
                                    const id = v.id_vacuna ?? v.id ?? `__missing_${idx}`;
                                    const label = v.nombre ?? v.vacunas ?? `Vacuna #${id}`;
                                    return <option key={String(id)} value={String(id)}>{label}</option>;
                                })}
                            </select>
                        </div>

                        <div className="relative">
                            <label className="text-sm text-gray-600">Paciente</label>
                            <input
                                type="text"
                                className="w-full mt-1 border rounded px-3 py-2 bg-white"
                                placeholder="Buscar paciente por nombre, apellido o documento"
                                value={patientSearch}
                                onChange={(e) => {
                                    const v = e.target.value;
                                    setPatientSearch(v);
                                    setShowPatientSuggestions(true);
                                    // reset id when typing new text
                                    setFilters(f => ({ ...f, id_paciente: '' }));
                                }}
                                onFocus={() => { if (patientSearch.length >= PATIENT_MIN_CHARS) setShowPatientSuggestions(true); }}
                            />
                            {filters.id_paciente && (
                                <button type="button" className="absolute right-2 top-8 text-sm text-gray-500" onClick={() => { setFilters(f => ({ ...f, id_paciente: '' })); setPatientSearch(''); setPatientSuggestions([]); setShowPatientSuggestions(false); }} aria-label="Limpiar paciente">✕</button>
                            )}

                            {/* Suggestions dropdown */}
                            {showPatientSuggestions && (
                                <div className="absolute z-40 left-0 right-0 mt-1 bg-white border rounded shadow max-h-48 overflow-auto text-sm">
                                    {patientLoading ? (
                                        <div className="p-2 text-gray-500">Buscando...</div>
                                    ) : (
                                        <>
                                            {patientSuggestions.length === 0 ? (
                                                <div className="p-2 text-gray-500">No hay coincidencias</div>
                                            ) : (
                                                patientSuggestions.map(p => {
                                                    const personaId = p.persona?.id_persona;
                                                    const pacienteId = p.id_paciente ?? p.paciente?.id_paciente;
                                                    const key = personaId ? `persona_${personaId}` : `paciente_${pacienteId}`;
                                                    return (
                                                        <div key={key} className="p-2 hover:bg-gray-100 cursor-pointer" onMouseDown={() => {
                                                            // use onMouseDown to avoid losing focus before click
                                                            if (personaId) {
                                                                setFilters(f => ({ ...f, id_paciente: `persona:${personaId}` }));
                                                                setPatientSearch(`${p.persona.nombre} ${p.persona.apellido}`);
                                                            } else if (pacienteId) {
                                                                setFilters(f => ({ ...f, id_paciente: String(pacienteId) }));
                                                                setPatientSearch(p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${pacienteId}`);
                                                            }
                                                            setShowPatientSuggestions(false);
                                                        }}>{p.persona ? `${p.persona.nombre} ${p.persona.apellido}${p.persona.dni ? ` — ${p.persona.dni}` : ''}` : `Paciente #${pacienteId}`}</div>
                                                    )
                                                })
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Vacunador</label>
                            <select className="w-full mt-1 border rounded px-3 py-2 bg-white" value={filters.id_vacunador || ''} onChange={(e) => setFilters(f => ({ ...f, id_vacunador: e.target.value }))}>
                                <option value="">Todos los vacunadores</option>
                                {vacunadores.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Lote</label>
                            <select className="w-full mt-1 border rounded px-3 py-2 bg-white" value={filters.id_lote || ''} onChange={(e) => setFilters(f => ({ ...f, id_lote: e.target.value }))}>
                                <option value="">Todos los lotes</option>
                                {lotes.map(l => <option key={l.id_lote} value={String(l.id_lote)}>{l.lote}{l.fecha_vencimiento ? ` — ${l.fecha_vencimiento}` : ''}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Desde</label>
                            <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={filters.fecha_desde} onChange={(e) => setFilters(f => ({ ...f, fecha_desde: e.target.value }))} />
                        </div>

                        <div>
                            <label className="text-sm text-gray-600">Hasta</label>
                            <input type="date" className="w-full mt-1 border rounded px-3 py-2" value={filters.fecha_hasta} onChange={(e) => setFilters(f => ({ ...f, fecha_hasta: e.target.value }))} />
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                        <button className="bg-blue-600 text-white px-4 py-1 rounded" onClick={() => {/* filtros aplican automáticamente */ }}>Aplicar</button>
                        <button className="bg-gray-200 text-gray-800 px-4 py-1 rounded" onClick={() => setFilters({ id_vacuna: '', id_paciente: '', fecha_desde: '', fecha_hasta: '', id_lote: '' })}>Limpiar</button>
                    </div>
                </div>
            )}

            {lista.length === 0 ? <p>No hay dosis registradas.</p> : (
                <div className="w-full overflow-x-auto">
                    <table className="table-auto w-full bg-white border border-gray-300">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b">Fecha</th>
                                <th className="py-2 px-4 border-b">Vacuna</th>
                                <th className="py-2 px-4 border-b">Paciente</th>
                                <th className="py-2 px-4 border-b">Vacunador</th>
                                <th className="py-2 px-4 border-b">Lote</th>
                                <th className="py-2 px-4 border-b">Acciones</th>
                            </tr>

                        </thead>
                        <tbody>
                            {(visible).map(d => (
                                <tr key={d.id_dosis_aplicada} className="hover:bg-gray-100">
                                    <td className="py-2 px-4 border-b">{formatDateDisplay(d.fecha)}</td>
                                    <td className="py-2 px-4 border-b">{d.vacuna?.nombre ?? d.vacuna?.vacunas}</td>
                                    <td className="py-2 px-4 border-b">{d.paciente?.persona ? `${d.paciente.persona.nombre} ${d.paciente.persona.apellido}${d.paciente.persona.dni ? ` — ${d.paciente.persona.dni}` : ''}` : (d.id_paciente ? `Paciente #${d.id_paciente}` : "—")}</td>
                                    <td className="py-2 px-4 border-b">{d.vacunador?.nombre ?? `Usuario #${d.id_vacunador ?? "?"}`}</td>
                                    <td className="py-2 px-4 border-b">{d.lote?.lote ?? (d.id_lote ? `Lote #${d.id_lote}` : '—')}</td>
                                    <td className="py-2 px-4 border-b">
                                        <div className="flex gap-2">
                                            <button className="bg-yellow-500 text-white px-3 py-1 rounded flex items-center gap-1" onClick={() => onStartEditDose(d)}><MdEdit /> Editar</button>
                                            <button className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1" onClick={() => onConfirmDeleteDose(d.id_dosis_aplicada)}><MdDelete /> Eliminar</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* pagination controls */}
                    <div className="flex items-center justify-between mt-3">
                        <div className="text-sm text-gray-600">Mostrando {(filteredList.length === 0) ? 0 : ((page - 1) * PAGE_SIZE + 1)} - {Math.min(page * PAGE_SIZE, filteredList.length)} de {filteredList.length}</div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => goTo(1)} disabled={page === 1} className="px-2 py-1 rounded border bg-white disabled:opacity-50">«</button>
                            <button onClick={() => goTo(page - 1)} disabled={page === 1} className="px-2 py-1 rounded border bg-white disabled:opacity-50">Anterior</button>
                            <span className="px-3 py-1 border rounded bg-gray-50">Página {page} / {totalPages}</span>
                            <button onClick={() => goTo(page + 1)} disabled={page === totalPages} className="px-2 py-1 rounded border bg-white disabled:opacity-50">Siguiente</button>
                            <button onClick={() => goTo(totalPages)} disabled={page === totalPages} className="px-2 py-1 rounded border bg-white disabled:opacity-50">»</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DosesTable;