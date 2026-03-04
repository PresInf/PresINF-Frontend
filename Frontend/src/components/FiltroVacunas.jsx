import React, { useEffect, useState, useMemo } from 'react';
import socket from '../api/socket';

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

function Row({ d, vacunaMap }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="py-2 px-3 border-b break-words whitespace-normal">{formatDateDisplay(d.fecha)}</td>
      <td className="py-2 px-3 border-b break-words whitespace-normal">{d.vacuna?.nombre ?? vacunaMap[d.id_vacuna] ?? d.id_vacuna}</td>
      <td className="py-2 px-3 border-b break-words whitespace-normal">{d.paciente?.persona ? `${d.paciente.persona.nombre} ${d.paciente.persona.apellido}${d.paciente.persona.dni ? ` — ${d.paciente.persona.dni}` : ''}` : (d.id_paciente ? `Paciente #${d.id_paciente}` : '—')}</td>
      <td className="py-2 px-3 border-b break-words whitespace-normal">{d.vacunador?.nombre ?? `Usuario #${d.id_vacunador ?? '—'}`}</td>
    </tr>
  );
}

export default function FiltroVacunas({ onSelect }) {
  const [vacunas, setVacunas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [dosis, setDosis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({ id_vacuna: '', id_paciente: '', fecha_desde: '', fecha_hasta: '' });

  // Notificar al padre cuando cambian los filtros
  useEffect(() => {
    if (typeof onSelect === 'function') {
      onSelect(filters);
    }
  }, [filters, onSelect]);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [{ data: rDosis }, { data: rVacunas }, { data: rPacientes }] = await Promise.all([
          import('../api/axios').then(m => m.default.get('/dosis-aplicada')),
          import('../api/axios').then(m => m.default.get('/vacunas')),
          import('../api/axios').then(m => m.default.get('/pacientes')),
        ]);
        if (!mounted) return;
        setDosis(Array.isArray(rDosis) ? rDosis : []);
        setVacunas(Array.isArray(rVacunas) ? rVacunas : []);
        setPacientes(Array.isArray(rPacientes) ? rPacientes : []);
        setError(null);
      } catch (err) {
        console.error('Error cargando datos filtro', err);
        setError('No se pudieron cargar los datos');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    // socket live updates
    const onVacuna = () => { fetchAll(); };
    const onDosis = () => { fetchAll(); };
    socket.on('vacuna:changed', onVacuna);
    socket.on('dosis:changed', onDosis);
    return () => { mounted = false; socket.off('vacuna:changed', onVacuna); socket.off('dosis:changed', onDosis); };
  }, []);

  const filtered = useMemo(() => {
    return dosis.filter(d => {
      if (filters.id_vacuna) {
        const vid = String(d.id_vacuna ?? d.vacuna?.id_vacuna ?? '');
        if (String(filters.id_vacuna) !== vid) return false;
      }
      if (filters.id_paciente) {
        const val = String(filters.id_paciente);
        if (val.startsWith('patient:')) {
          const expected = val.split(':')[1];
          const actual = String(d.id_paciente ?? d.paciente?.id_paciente ?? '');
          if (expected !== actual) return false;
        } else if (val.startsWith('persona:')) {
          const expected = val.split(':')[1];
          const actual = String(d.paciente?.persona?.id_persona ?? d.paciente?.id_persona ?? '');
          if (expected !== actual) return false;
        } else if (val.startsWith('dni:')) {
          const expected = val.split(':')[1];
          const actual = String(d.paciente?.persona?.dni ?? '').trim();
          if (expected !== actual) return false;
        } else {
          // fallback: compare numeric ids
          if (Number(val) !== Number(d.id_paciente ?? d.paciente?.id_paciente)) return false;
        }
      }
      if (filters.fecha_desde) {
        const fIso = getIsoDate(d.fecha);
        if (!fIso || fIso < filters.fecha_desde) return false;
      }
      if (filters.fecha_hasta) {
        const fIso = getIsoDate(d.fecha);
        if (!fIso || fIso > filters.fecha_hasta) return false;
      }
      return true;
    }).sort((a, b) => {
      const aIso = getIsoDate(a.fecha) || '';
      const bIso = getIsoDate(b.fecha) || '';
      return bIso.localeCompare(aIso);
    });
  }, [dosis, filters]);

  const vacunaMap = useMemo(() => {
    const map = {};
    const seen = new Set();
    (vacunas || []).forEach(v => {
      const id = v.id_vacuna ?? v.id ?? null;
      if (id == null) return;
      if (seen.has(String(id))) return;
      seen.add(String(id));
      const nombre = v.nombre ?? v.vacunas ?? `Vacuna #${id}`;
      map[id] = nombre;
    });
    return map;
  }, [vacunas]);

  // listas deduplicadas para selects
  const uniqueVacunas = useMemo(() => {
    const m = new Map();
    (vacunas || []).forEach((v, idx) => {
      const id = v.id_vacuna ?? v.id ?? `__missing_${idx}`;
      if (!m.has(String(id))) m.set(String(id), v);
    });
    return Array.from(m.values());
  }, [vacunas]);

  const uniquePacientes = useMemo(() => {
    const m = new Map();
    (pacientes || []).forEach((p, idx) => {
      const pid = p.id_paciente ?? null;
      const personId = p.persona?.id_persona ?? null;
      const dni = p.persona && (p.persona.dni || p.persona.dni === 0) ? String(p.persona.dni).trim() : null;
      const key = pid ? `patient:${pid}` : (personId ? `persona:${personId}` : (dni ? `dni:${dni}` : `unknown:${idx}`));
      if (!m.has(key)) {
        m.set(key, { raw: p, key, pid, personId, dni });
      }
    });
    return Array.from(m.values());
  }, [pacientes]);

  if (loading) return <div className="p-4">Cargando filtro...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold mb-3">Filtro de dosis aplicadas</h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
        <select className="border rounded px-3 py-2" value={filters.id_vacuna} onChange={(e) => setFilters(f => ({ ...f, id_vacuna: e.target.value }))}>
          <option value="">Todas las vacunas</option>
          {uniqueVacunas.map((v, i) => {
            const id = v.id_vacuna ?? v.id ?? `__missing_${i}`;
            const label = v.nombre ?? v.vacunas ?? `Vacuna #${id}`;
            return <option key={String(id)} value={String(id)}>{label}</option>;
          })}
        </select>

        <select className="border rounded px-3 py-2" value={filters.id_paciente} onChange={(e) => setFilters(f => ({ ...f, id_paciente: e.target.value }))}>
          <option value="">Todos los pacientes</option>
          {uniquePacientes.map((entry, i) => {
            const p = entry.raw;
            const value = entry.pid ? `patient:${entry.pid}` : (entry.personId ? `persona:${entry.personId}` : (entry.dni ? `dni:${entry.dni}` : `unknown:${i}`));
            const nombre = p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : null;
            const dni = entry.dni || '';
            const label = nombre ? (dni ? `${nombre} — ${dni}` : nombre) : (entry.pid ? `Paciente #${entry.pid}` : `Paciente`);
            return <option key={value} value={value}>{label}</option>;
          })}
        </select>


        <input type="date" className="border rounded px-3 py-2" value={filters.fecha_desde} onChange={(e) => setFilters(f => ({ ...f, fecha_desde: e.target.value }))} placeholder="Desde" />
        <input type="date" className="border rounded px-3 py-2" value={filters.fecha_hasta} onChange={(e) => setFilters(f => ({ ...f, fecha_hasta: e.target.value }))} placeholder="Hasta" />
      </div>

      <div className="w-full overflow-x-auto">
        <table className="table-auto w-full bg-white border border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-2 px-3 text-left">Fecha</th>
              <th className="py-2 px-3 text-left">Vacuna</th>
              <th className="py-2 px-3 text-left">Paciente</th>
              <th className="py-2 px-3 text-left">Vacunador</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={4} className="py-4 text-center text-gray-500">No se encontraron dosis con esos filtros</td></tr>
            ) : (
              filtered.map(d => <Row key={d.id_dosis_aplicada} d={d} vacunaMap={vacunaMap} />)
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
