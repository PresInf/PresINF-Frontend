import React, { useEffect, useState } from 'react';
import { getLogs } from '../api/logs';
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
  const logsPerPage = 13;
  const notify = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await getLogs();
        setLogs(response.data);
        setFilteredLogs(response.data);
      } catch (err) {
        const errorMsg = 'Error al cargar los logs';
        setError(errorMsg);
        notify.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [notify]);

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
      <h2 className="mb-4 text-primary">Registro de Actividades</h2>

      <div className="card mb-4">
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <div className="form-group">
                <label className="form-label">Filtrar por Acción:</label>
                <select
                  className="form-select"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
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
                <label className="form-label">Filtrar por Usuario:</label>
                <select
                  className="form-select"
                  value={filters.user}
                  onChange={(e) => handleFilterChange('user', e.target.value)}
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

      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped mb-0">
              <thead className="bg-primary text-white">
                <tr>
                  <th className="py-3">Fecha</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Descripción</th>
                  <th>Sección</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentLogs.map((log) => (
                  <tr key={log.id_log}>
                    <td className="py-2">
                      {format(new Date(log.creado_en), 'dd/MM/yyyy HH:mm:ss')}
                    </td>
                    <td>{log.usuario?.nombre || 'Sistema'}</td>
                    <td>
                      <span className={`badge ${log.accion === 'GUARDADO' ? 'bg-green-500 ' :
                          log.accion === 'ACTUALIZACIÓN' ? 'bg-orange-500 ' :
                            log.accion === 'ELIMINAR' ? 'bg-danger' :
                              'bg-info'
                        }`}>
                        {log.accion}
                      </span>
                    </td>
                    <td>{log.descripcion}</td>
                    <td>{log.campo_modificado}</td>
                    <td>
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

      <div className="d-flex justify-content-between align-items-center mt-3">
        <div>
          <span className="me-3">
            Página {currentPage} de {totalPages}
          </span>
          <span>
            Registros: {filteredLogs.length} de {logs.length}
          </span>
        </div>
        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            &laquo; Anterior
          </button>
          <button
            className="btn btn-primary"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Siguiente &raquo;
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;