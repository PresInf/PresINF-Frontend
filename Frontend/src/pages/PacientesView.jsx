import React, { useState, useEffect } from "react";
import { MdDelete, MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import instance from "../api/axios";
import { useNotify } from "../context/notificationContext";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import EditarPaciente from './EditarPaciente';

const getIsoDate = (value) => {
  if (!value && value !== 0) return "";
  const s = String(value);
  const iso = s.split('T')[0];
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return "";
};

const formatDateDisplay = (value) => {
  const iso = getIsoDate(value);
  if (!iso) return "—";
  const [y, m, d] = iso.split('-');
  return `${d}-${m}-${y}`;
};

function PacientesLista() {
  const [items, setItems] = useState([]); // lista normalizada
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toDelete, setToDelete] = useState(null); // id_persona
  const [editingPacienteId, setEditingPacienteId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [genMap, setGenMap] = useState({});
  const [locMap, setLocMap] = useState({});
  const [provMap, setProvMap] = useState({});
  const [tipoMap, setTipoMap] = useState({});
  const navigate = useNavigate();
  const notify = useNotify();
  const pageSize = 6; // items por página

  const normalizeFromPacientes = (arr = []) => {
    return arr.map((row) => {
      const per = row?.persona || {};
      return {
        id_persona: per.id_persona ?? row.id_persona ?? row.p_id_persona,
        nombre: per.nombre ?? row.p_nombre ?? row.nombre ?? "",
        apellido: per.apellido ?? row.p_apellido ?? row.apellido ?? "",
        dni: per.dni ?? row.p_dni ?? row.dni ?? "",
        fecha_nacimiento: per.fecha_nacimiento ?? row.p_fecha_nacimiento ?? row.fecha_nacimiento ?? "",
        genero: per.genero?.genero ?? row.g_genero ?? row.genero ?? "",
        generoId: per.generoId ?? row.id_genero ?? row.generoId ?? null,
        localidad: per.localidad?.localidad ?? row.l_localidad ?? row.localidad ?? "",
        localidadId: per.localidadId ?? row.id_localidad ?? row.localidadId ?? null,
        provincia: per.provincia?.provincia ?? row.pr_provincia ?? row.provincia ?? "",
        provinciaId: per.provinciaId ?? row.id_provincia ?? row.provinciaId ?? null,
        num_telefono: per.num_telefono ?? row.p_num_telefono ?? row.num_telefono ?? "",
        // tipo como texto si viene, y tipoId separado para mapear por catálogo
        tipo: per.tipo?.tipo ?? row.t_tipo ?? row.tipo_persona ?? "",
        tipoId: per.tipo_personaId ?? row.id_persona_tipo ?? row.tipo_personaId ?? null,
      };
    });
  };

  const normalizeFromPersonas = (arr = []) => {
    return arr.map((row) => ({
      id_persona: row.id_persona ?? row.p_id_persona ?? row.id,
      nombre: row.p_nombre ?? row.nombre ?? "",
      apellido: row.p_apellido ?? row.apellido ?? "",
      dni: row.p_dni ?? row.dni ?? "",
      fecha_nacimiento: row.p_fecha_nacimiento ?? row.fecha_nacimiento ?? "",
      genero: row.g_genero ?? row.genero ?? "",
      generoId: row.id_genero ?? row.generoId ?? null,
      localidad: row.l_localidad ?? row.localidad ?? "",
      localidadId: row.id_localidad ?? row.localidadId ?? null,
      provincia: row.pr_provincia ?? row.provincia ?? "",
      provinciaId: row.id_provincia ?? row.provinciaId ?? null,
      num_telefono: row.p_num_telefono ?? row.num_telefono ?? "",
      tipo: row.t_tipo ?? row.tipo_persona ?? "",
      tipoId: row.id_persona_tipo ?? row.tipo_personaId ?? null,
    }));
  };

  const enrichPersonas = async (items) => {
    const needs = items.some((i) => !i.dni || !i.fecha_nacimiento || (!i.genero && !i.generoId) || (!i.localidad && !i.localidadId) || (!i.provincia && !i.provinciaId) || (!i.tipo && !i.tipoId));
    if (!needs) return items;
    const detailed = await Promise.all(
      items.map(async (p) => {
        try {
          const { data } = await instance.get(`/persona/${p.id_persona}`);
          return {
            ...p,
            dni: data?.dni ?? p.dni,
            fecha_nacimiento: data?.fecha_nacimiento ?? p.fecha_nacimiento,
            genero: data?.genero?.genero ?? p.genero,
            generoId: data?.generoId ?? p.generoId,
            localidad: data?.localidad?.localidad ?? p.localidad,
            localidadId: data?.localidadId ?? p.localidadId,
            provincia: data?.provincia?.provincia ?? p.provincia,
            provinciaId: data?.provinciaId ?? p.provinciaId,
            num_telefono: data?.num_telefono ?? p.num_telefono,
            tipo: data?.tipo?.tipo ?? p.tipo,
            tipoId: data?.tipo_personaId ?? p.tipoId,
          };
        } catch {
          return p;
        }
      })
    );
    return detailed;
  };

  const loadCatalogs = async () => {
    try {
      const [genRes, locRes, provRes, tipoRes] = await Promise.allSettled([
        instance.get('/generos'),
        instance.get('/localidades'),
        instance.get('/provincia'),
        instance.get('/tipoPersona'),
      ]);
      const toMap = (arr, idKey, nameKey) => Array.isArray(arr) ? Object.fromEntries(arr.map(i => [i[idKey], i[nameKey]])) : {};
      if (genRes.status === 'fulfilled') setGenMap(toMap(genRes.value.data, 'id_genero', 'genero'));
      if (locRes.status === 'fulfilled') setLocMap(toMap(locRes.value.data, 'id_localidad', 'localidad'));
      if (provRes.status === 'fulfilled') setProvMap(toMap(provRes.value.data, 'id_provincia', 'provincia'));
      if (tipoRes.status === 'fulfilled') setTipoMap(toMap(tipoRes.value.data, 'id_persona_tipo', 'tipo'));
    } catch { /* silencioso */ }
  };

  const load = async () => {
    try {
      setCargando(true);
      await loadCatalogs();
      const { data: dataPac } = await instance.get('/pacientes');
      let normalized = Array.isArray(dataPac) ? normalizeFromPacientes(dataPac) : [];
      const lacksPersona = normalized.length > 0 && normalized.every((r) => !r.nombre && !r.apellido);
      if (!normalized.length || lacksPersona) {
        const { data: dataPer } = await instance.get('/persona');
        normalized = Array.isArray(dataPer) ? normalizeFromPersonas(dataPer) : [];
        normalized = await enrichPersonas(normalized);
      }
      const seen = new Set();
      const unique = [];
      for (const p of normalized) {
        const key = p.id_persona ?? `${p.nombre || ''}|${p.apellido || ''}|${p.dni || ''}`;
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(p);
        }
      }
      setItems(unique);
      // reset page to 1 when loading new data
      setCurrentPage(1);
    } catch (e) {
      const msg = e?.response?.data?.message || e.message;
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ensure currentPage stays within range when items change
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
    if (currentPage > totalPages) setCurrentPage(1);
  }, [items]);

  // paged items for current page
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const pagedItems = items.slice(startIndex, startIndex + pageSize);

  const handleEditClick = (personaId) => {
    // Abrir modal de edición en vez de navegar
    setEditingPacienteId(personaId);
  };

  const openDelete = (personaId) => {
    setToDelete(personaId);
    setConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await instance.delete(`/persona/${toDelete}`);
      setItems((prev) => prev.filter((p) => p.id_persona !== toDelete));
      notify.success("Paciente eliminado correctamente");
    } catch (e) {
      notify.error(e?.response?.data?.message || "Error al eliminar paciente");
    } finally {
      setConfirmOpen(false);
      setToDelete(null);
    }
  };

  if (cargando) return <p className="text-gray-500">Cargando pacientes...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-4  ">
      {/* Encabezado con título y botón */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 ">
        <h2 className="text-xl font-bold">Listado de Pacientes</h2>
        <button
          type="button"
          className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 rounded-lg"
          onClick={() => navigate("/pacientes")}
        >
          Agregar paciente
        </button>
      </div>

      {items.length === 0 ? (
        <p>No hay pacientes registrados.</p>
      ) : (
        <div className="w-full overflow-x-hidden">
          <table className="table-auto w-full bg-white border border-gray-300">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Nombre</th>
                <th className="py-2 px-4 border-b">Apellido</th>
                <th className="py-2 px-4 border-b">DNI</th>
                <th className="py-2 px-4 border-b">Fecha de Nacimiento</th>
                <th className="py-2 px-4 border-b">Género</th>
                <th className="py-2 px-4 border-b">Localidad</th>
                <th className="py-2 px-4 border-b">Provincia</th>
                <th className="py-2 px-4 border-b">Número de contacto</th>
                <th className="py-2 px-4 border-b">Tipo de persona</th>
                <th className="py-2 px-4 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pagedItems.map((pac) => {
                const generoText = pac.genero || (pac.generoId ? genMap[pac.generoId] : '') || 'N/A';
                const localidadText = pac.localidad || (pac.localidadId ? locMap[pac.localidadId] : '') || 'N/A';
                const provinciaText = pac.provincia || (pac.provinciaId ? provMap[pac.provinciaId] : '') || 'N/A';
                const tipoText = pac.tipo || (pac.tipoId ? tipoMap[pac.tipoId] : '') || 'Sin Asignar';
                return (
                  <tr key={pac.id_persona} className="hover:bg-gray-100">
                    <td className="py-2 px-4 border-b">{pac.nombre || "—"}</td>
                    <td className="py-2 px-4 border-b">{pac.apellido || "—"}</td>
                    <td className="py-2 px-4 border-b break-words whitespace-normal">{pac.dni || "—"}</td>
                    <td className="py-2 px-4 border-b break-words whitespace-normal">{pac.fecha_nacimiento ? formatDateDisplay(pac.fecha_nacimiento) : "—"}</td>
                    <td className="py-2 px-4 border-b break-words whitespace-normal">{generoText}</td>
                    <td className="py-2 px-4 border-b break-words whitespace-normal">{localidadText}</td>
                    <td className="py-2 px-4 border-b break-words whitespace-normal">{provinciaText}</td>
                    <td className="py-2 px-4 border-b break-words whitespace-normal">{pac.num_telefono || "—"}</td>
                    <td className="py-2 px-4 border-b break-words whitespace-normal">{tipoText}</td>
                    <td className="py-2 px-4 border-b flex gap-2">
                      <button className="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded" onClick={() => handleEditClick(pac.id_persona)} disabled={!pac.id_persona}>
                        <MdEdit />
                      </button>
                      <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded" onClick={() => openDelete(pac.id_persona)} disabled={!pac.id_persona}>
                        <MdDelete />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* pagination controls */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Mostrando
              {' '}
              <strong>{Math.min((currentPage - 1) * pageSize + 1, items.length)}</strong>
              {' - '}
              <strong>{Math.min(currentPage * pageSize, items.length)}</strong>
              {' de '}
              <strong>{items.length}</strong>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </button>

              {/* page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.max(1, Math.ceil(items.length / pageSize)) }).map((_, idx) => {
                  const page = idx + 1;
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      className={`px-2 py-1 rounded ${page === currentPage ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                onClick={() => setCurrentPage((p) => Math.min(Math.ceil(items.length / pageSize), p + 1))}
                disabled={currentPage >= Math.ceil(items.length / pageSize)}
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Eliminar paciente"
        message="Esta acción no se puede deshacer."
        confirmText="Eliminar"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmOpen(false)}
      />
      <EditarPaciente
        isOpen={editingPacienteId !== null}
        onClose={(wasUpdated) => {
          setEditingPacienteId(null);
          if (wasUpdated) load();
        }}
        pacienteId={editingPacienteId}
      />
    </div>
  );
}

export default PacientesLista;
