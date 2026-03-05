import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import instance from '../api/axios';
import { useNotify } from '../context/notificationContext';
import { getErrorMessage } from '../utils/errorHandler';

const LogDetailPage = () => {
  const { id } = useParams();
  const [log, setLog] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const notify = useNotify();

  useEffect(() => {
    const fetchLog = async () => {
      try {
        const response = await instance.get(`/logs/${id}`);
        setLog(response.data);
      } catch (error) {
        const message = getErrorMessage(error);
        notify.error(`❌ ${message}`);
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLog();
  }, [id, notify]);

  // Mapeo para etiquetas y plantillas de mensaje según el campo_modificado
  const getEntityDisplay = (log) => {
    if (!log) return { moduleLabel: log?.campo_modificado || '', affectedLabel: 'Elemento afectado' };

    const map = {
      // Quitamos 'templates' y 'singular' que no se usan para esto
      usuarios: { moduleLabel: 'Usuarios', affectedLabel: 'Usuario afectado' },
      auth: { moduleLabel: 'Autenticación', affectedLabel: 'Usuario' },
      pacientes: { moduleLabel: 'Pacientes', affectedLabel: 'Paciente afectado' },
      persona: { moduleLabel: 'Personas', affectedLabel: 'Persona afectada' },
      'dosis-aplicada': { moduleLabel: 'Dosis Aplicada', affectedLabel: 'Paciente afectado' },
      vacunas: { moduleLabel: 'Vacunas', affectedLabel: 'Vacuna afectada' },
    };

    const key = log.campo_modificado || '';
    const cfg = map[key] || { moduleLabel: log.campo_modificado || 'Módulo', affectedLabel: 'Elemento afectado' };
    return { moduleLabel: cfg.moduleLabel, affectedLabel: cfg.affectedLabel };
  };
  if (loading) {
    return <div className="container my-5">Cargando...</div>;
  }

  if (!log) {
    return <div className="container my-5">Registro no encontrado</div>;
  }

  const { moduleLabel, affectedLabel, headerMessage } = getEntityDisplay(log);

  return (
    <div className="container my-5">
      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h3 className="mb-0">Detalle de Movimientos</h3>
          <button
            onClick={() => navigate('/logs')}
            className="btn btn-light"
          >
            Volver
          </button>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-6">
              <h5>Información General</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <th>Registro N°:</th>
                    <td>{log.id_log}</td>
                  </tr>
                  <tr>
                    <th>Fecha:</th>
                    <td>{format(new Date(log.creado_en), 'dd/MM/yyyy HH:mm:ss')}</td>
                  </tr>
                  <tr>
                    <th>Usuario:</th>
                    <td>{log.usuario?.nombre || 'Sistema'}</td>
                  </tr>
                  <tr>
                    <th>Acción:</th>
                    <td>
                      <span className={`badge ${log.accion === 'GUARDADO' ? 'bg-green-500' :
                        log.accion === 'ACTUALIZACIÓN' ? 'bg-orange-500' :
                          log.accion === 'ELIMINAR' ? 'bg-danger' :
                            'bg-info'
                        }`}>
                        {log.accion}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="col-md-6">
              <h5>Detalles de la Operación</h5>
              <table className="table">
                <tbody>
                  <tr>
                    <th>Módulo:</th>
                    <td>{moduleLabel}</td>
                  </tr>
                  <tr>
                    <th>{affectedLabel}:</th>
                    <td>{log.campo_modificadoid || 'N/D'}</td>
                  </tr>
                  <tr>
                    <th>Descripción:</th>
                    <td>{log.descripcion}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6">
              <h5>Valor Anterior</h5>
              <pre className="bg-light p-3 rounded">
                {log.valor_antiguo}
              </pre>
            </div>
            <div className="col-md-6">
              <h5>Valor Nuevo</h5>
              <pre className="bg-light p-3 rounded">
                {log.valor_nuevo}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogDetailPage;