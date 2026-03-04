import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import instance from '@/api/axios';
import { useNotify } from '@/context/notificationContext';
import 'bootstrap/dist/css/bootstrap.min.css';

const Alertas = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pacientes, setPacientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const notify = useNotify();

  const loadPacientes = async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ data: pacientesData }, { data: dosisData }] = await Promise.all([
        instance.get('/pacientes'),
        instance.get('/dosis-aplicada')
      ]);

      const allPacientes = Array.isArray(pacientesData) ? pacientesData : [];
      const allDosis = Array.isArray(dosisData) ? dosisData : [];

      const patientsWithDoses = new Set();
      allDosis.forEach(d => {
        if (d.id_paciente) patientsWithDoses.add(Number(d.id_paciente));
        if (d.paciente?.id_paciente) patientsWithDoses.add(Number(d.paciente.id_paciente));
      });

      const filtered = allPacientes.filter(p => patientsWithDoses.has(Number(p.id_paciente)));
      setPacientes(filtered);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Error al cargar datos');
      notify.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPacientes();
  }, []);

  const formatDate = (val) => {
    if (!val) return '—';
    const date = new Date(val);
    return isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  };

  const filteredPacientes = pacientes.filter(p => {
    const fullName = p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${p.id_paciente}`;
    const dni = p.persona?.dni || '';
    const search = searchTerm.toLowerCase();
    return fullName.toLowerCase().includes(search) || dni.includes(search);
  });

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-dark">Calendario de Vacunación por Paciente</h2>
        <div className="w-25">
          <input
            type="text"
            placeholder="Buscar paciente..."
            className="form-control"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="card shadow-sm">
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-striped table-hover mb-0">
                <thead className="table-primary">
                  <tr>
                    <th className="p-3">Paciente</th>
                    <th className="p-3">DNI</th>
                    <th className="p-3">Fecha de Nacimiento</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPacientes.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center p-4 text-muted">
                        No se encontraron pacientes
                      </td>
                    </tr>
                  ) : (
                    filteredPacientes.map((p) => (
                      <tr key={p.id_paciente}>
                        <td className="p-3 align-middle">
                          {p.persona ? `${p.persona.nombre} ${p.persona.apellido}` : `Paciente #${p.id_paciente}`}
                        </td>
                        <td className="p-3 align-middle">
                          {p.persona?.dni || '—'}
                        </td>
                        <td className="p-3 align-middle">
                          {formatDate(p.persona?.fecha_nacimiento)}
                        </td>
                        <td className="p-3 text-center align-middle">
                          <button
                            onClick={() => navigate(`/calendario/${p.id_paciente}`)}
                            className="btn btn-primary btn-sm d-inline-flex align-items-center gap-2"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-calendar-event" viewBox="0 0 16 16">
                              <path d="M11 6.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1z" />
                              <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z" />
                            </svg>
                            Ver Calendario
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="card-footer text-muted small">
            Total: {filteredPacientes.length} pacientes
          </div>
        </div>
      )}
    </div>
  );
};

export default Alertas;