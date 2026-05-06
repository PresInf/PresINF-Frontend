import React, { useEffect, useState } from 'react';
import { getLogs } from '../api/logs';
import instance from '../api/axios';
import { format } from 'date-fns';
import { useNotify } from '../context/notificationContext';
import { useNavigate } from 'react-router-dom';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filters, setFilters] = useState({
    action: '',
    user: ''
  });
  
  // Tally state
  const [vacunas, setVacunas] = useState([]);
  const [tallyData, setTallyData] = useState([]);
  const [loadingTally, setLoadingTally] = useState(false);
  const [tallyFilters, setTallyFilters] = useState({
    fecha: '',
    id_vacuna: '',
    dosis_numero: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  const logsPerPage = 13;
  const notify = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogsAndVacunas = async () => {
      try {
        const [logsRes, vacunasRes] = await Promise.all([
          getLogs(),
          instance.get('/vacunas').catch(() => ({ data: [] }))
        ]);
        setLogs(logsRes.data);
        setFilteredLogs(logsRes.data);
        setVacunas(vacunasRes.data);
      } catch (err) {
        const errorMsg = 'Error al cargar los datos';
        setError(errorMsg);
        notify.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchLogsAndVacunas();
  }, [notify]);

  useEffect(() => {
    const fetchTally = async () => {
      const { fecha, id_vacuna, dosis_numero } = tallyFilters;
      // Only fetch if at least one filter is active
      if (!fecha && !id_vacuna && !dosis_numero) {
        setTallyData([]);
        return;
      }

      setLoadingTally(true);
      try {
        const params = new URLSearchParams();
        if (fecha) params.append('fecha', fecha);
        if (id_vacuna) params.append('id_vacuna', id_vacuna);
        if (dosis_numero) params.append('dosis_numero', dosis_numero);
        
        const { data } = await instance.get(`/dosis-aplicada/registro-diario?${params.toString()}`);
        setTallyData(data);
      } catch (err) {
        notify.error('Error al obtener el conteo de vacunas');
      } finally {
        setLoadingTally(false);
      }
    };

    fetchTally();
  }, [tallyFilters, notify]);

  useEffect(() => {
    const applyFilters = () => {
      let result = [...logs];

      if (filters.action) {
        result = result.filter(log => log.accion === filters.action);
      }

      if (filters.user) {
        result = result.filter(log =>
          log.usuario?.nombre?.toLowerCase().includes(filters.user.toLowerCase())
        );
      }

      setFilteredLogs(result);
      setCurrentPage(1);
    };

    applyFilters();
  }, [filters, logs]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTallyFilterChange = (field, value) => {
    setTallyFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isTallyMode = Boolean(tallyFilters.fecha || tallyFilters.id_vacuna || tallyFilters.dosis_numero);

  if (loading) return (
    <div className="container my-5">
      <div className="text-center">Cargando logs...</div>
    </div>
  );

  if (error) return (
    <div className="container my-5">
      <div className="alert alert-danger">{error}</div>
    </div>
  );

  // logs actuales
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  // usuario único por filtro
  const uniqueUsers = [...new Set(logs.map(log => log.usuario?.nombre).filter(Boolean))];

  // cambiar de página
  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="text-primary mb-0">Registro de Actividades</h2>
        <button 
          className="btn btn-secondary btn-sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
        </button>
      </div>

      {showFilters && (
        <div className="card mb-4 shadow-sm border-0">
        <div className="card-body">
          <h5 className="mb-3 text-secondary border-bottom pb-2">Filtros de Conteo de Vacunas</h5>
          <div className="row mb-4">
            <div className="col-md-4">
              <div className="form-group">
                <label className="form-label text-sm text-gray-600">Fecha Específica:</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={tallyFilters.fecha}
                  onChange={(e) => handleTallyFilterChange('fecha', e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label className="form-label text-sm text-gray-600">Vacuna:</label>
                <select
                  className="form-select"
                  value={tallyFilters.id_vacuna}
                  onChange={(e) => handleTallyFilterChange('id_vacuna', e.target.value)}
                >
                  <option value="">Todas las vacunas</option>
                  {vacunas.map((v, idx) => (
                    <option key={v.id_vacuna || idx} value={v.id_vacuna}>{v.nombre || v.vacunas}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-md-4">
              <div className="form-group">
                <label className="form-label text-sm text-gray-600">Dosis:</label>
                <select
                  className="form-select"
                  value={tallyFilters.dosis_numero}
                  onChange={(e) => handleTallyFilterChange('dosis_numero', e.target.value)}
                >
                  <option value="">Todas las dosis</option>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={String(num)}>
                      {num === 1 ? '1ª Dosis' : num === 2 ? '2ª Dosis' : num === 3 ? '3ª Dosis' : num === 4 ? '1er Refuerzo' : num === 5 ? '2do Refuerzo' : '3er Refuerzo'}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <div className="d-flex justify-content-end mb-3">
             <button className="btn btn-outline-secondary btn-sm" onClick={() => setTallyFilters({fecha: '', id_vacuna: '', dosis_numero: ''})}>Limpiar Filtros de Vacunas</button>
          </div>

          <h5 className="mb-3 text-secondary border-bottom pb-2 mt-2">Filtros de Logs del Sistema</h5>
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label text-sm text-gray-600">Filtrar por Acción:</label>
                <select
                  className="form-select"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  disabled={isTallyMode}
                >
                  <option value="">Todas las acciones</option>
                  <option value="GUARDADO">Guardado</option>
                  <option value="ACTUALIZACIÓN">Actualizado</option>
                  <option value="ELIMINAR">Eliminar</option>
                </select>
              </div>
            </div>
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label text-sm text-gray-600">Filtrar por Usuario:</label>
                <select
                  className="form-select"
                  value={filters.user}
                  onChange={(e) => handleFilterChange('user', e.target.value)}
                  disabled={isTallyMode}
                >
                  <option value="">Todos los usuarios</option>
                  {uniqueUsers.map((user, index) => (
                    <option key={index} value={user}>{user}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {isTallyMode ? (
        <div className="card shadow-sm border-0">
          <div className="card-body p-0">
            {loadingTally ? (
              <div className="text-center p-5">Cargando conteo...</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="py-3 px-4">Vacuna</th>
                      <th className="py-3 px-4">Dosis Aplicada</th>
                      <th className="py-3 px-4">Vacunador</th>
                      <th className="py-3 px-4 text-center">Cantidad de Pacientes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tallyData.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-gray-500">No se encontraron vacunas con estos filtros.</td>
                      </tr>
                    ) : (
                      tallyData.map((row, idx) => {
                        const [y, m, d] = row.fecha ? row.fecha.split('-') : ['', '', ''];
                        const displayDate = d && m && y ? `${d}/${m}/${y}` : 'Sin fecha';
                        return (
                          <tr key={idx}>
                            <td className="px-4 py-3">{displayDate}</td>
                            <td className="px-4 py-3">{row.vacuna_nombre}</td>
                            <td className="px-4 py-3">
                              {row.dosis_numero === 1 ? '1ª Dosis' : row.dosis_numero === 2 ? '2ª Dosis' : row.dosis_numero === 3 ? '3ª Dosis' : row.dosis_numero === 4 ? '1er Refuerzo' : row.dosis_numero === 5 ? '2do Refuerzo' : '3er Refuerzo'}
                            </td>
                            <td className="px-4 py-3">{row.vacunador_nombre}</td>
                            <td className="px-4 py-3 text-center font-bold text-lg">{row.cantidad_pacientes}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {tallyData.length > 0 && (
                    <tfoot className="bg-light font-weight-bold">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right">Total vacunas aplicadas:</td>
                        <td className="px-4 py-3 text-center fw-bold">
                          {tallyData.reduce((acc, curr) => acc + curr.cantidad_pacientes, 0)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <div className="card shadow-sm border-0">
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th className="py-3 px-4">Fecha</th>
                      <th className="px-4">Usuario</th>
                      <th className="px-4">Acción</th>
                      <th className="px-4">Descripción</th>
                      <th className="px-4">Sección</th>
                      <th className="px-4">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentLogs.map((log) => (
                      <tr key={log.id_log}>
                        <td className="py-3 px-4">
                          {format(new Date(log.creado_en), 'dd/MM/yyyy HH:mm:ss')}
                        </td>
                        <td className="px-4">{log.usuario?.nombre || 'Sistema'}</td>
                        <td className="px-4">
                          <span className={`badge ${log.accion === 'GUARDADO' ? 'bg-green-500 ' :
                              log.accion === 'ACTUALIZACIÓN' ? 'bg-orange-500 ' :
                                log.accion === 'ELIMINAR' ? 'bg-danger' :
                                  'bg-info'
                            }`}>
                            {log.accion}
                          </span>
                        </td>
                        <td className="px-4">{log.descripcion}</td>
                        <td className="px-4">{log.campo_modificado}</td>
                        <td className="px-4">
                          <button
                            className="btn btn-sm btn-info text-white"
                            onClick={() => navigate(`/logs/${log.id_log}`)}
                          >
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-4">
            <div>
              <span className="me-3 font-weight-medium">
                Página {currentPage} de {totalPages}
              </span>
              <span className="text-gray-500">
                Registros: {filteredLogs.length} de {logs.length}
              </span>
            </div>
            <div className="btn-group">
              <button
                className="btn btn-outline-primary"
                onClick={handlePrevPage}
                disabled={currentPage === 1}
              >
                &laquo; Anterior
              </button>
              <button
                className="btn btn-outline-primary"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
              >
                Siguiente &raquo;
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LogsPage;