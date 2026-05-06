import React, { useEffect, useState } from "react";
import instance from "../api/axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { FaEdit, FaTrash } from "react-icons/fa";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  LineController,
  BarController
);

export default function Graficos() {
  const yearActual = new Date().getFullYear();

  const [data, setData] = useState({});
  const [anio, setAnio] = useState(yearActual);
  const [trimestre, setTrimestre] = useState(1);
  const [loadingData, setLoadingData] = useState(false);
  const metaTrimestral = Math.min(Math.max(trimestre, 1), 4) * 25;
  const [poblacion, setPoblacion] = useState(null);
  const [editingPoblacion, setEditingPoblacion] = useState(false);
  const [poblacionInput, setPoblacionInput] = useState('');

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          stepSize: 10,
          autoskip: false,
          maxTicksLimit: 11,
          callback: (value) => value + "%",
        },
      },
    },
  }

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        setLoadingData(true);
        const res = await instance.get(`/estadisticas/${anio}/${trimestre}`);
        setData(res.data || {});
        // obtener poblacion para el año
        try {
          const p = await instance.get(`/estadisticas/poblacion/${anio}`);
          if (p?.data) {
            setPoblacion(p.data.poblacion ?? null);
            setPoblacionInput(String(p.data.poblacion ?? ''));
          } else {
            // fallback: pedir conteo de pacientes
            const pc = await instance.get('/pacientes/count');
            const val = pc?.data?.count ?? pc?.data ?? null;
            setPoblacion(val);
            setPoblacionInput(String(val ?? ''));
          }
        } catch (err) {
          const pc = await instance.get('/pacientes/count');
          const val = pc?.data?.count ?? pc?.data ?? null;
          setPoblacion(val);
          setPoblacionInput(String(val ?? ''));
        }
      } catch (error) {
        console.error("Error al obtener datos:", error.response?.data || error.message);
        setData({});
      } finally {
        setLoadingData(false);
      }
    };

    obtenerDatos();
  }, [anio, trimestre]);

  if (loadingData) {
    return <p className="p-6">Cargando estadísticas...</p>;
  }

  if (!data || Object.keys(data).length === 0) {
    return <p className="p-6">No hay datos para el año {anio}, Trimestre {trimestre}</p>;
  }

  const colors = [
    "rgba(37, 99, 235, 0.8)",    // Azul
    "rgba(16, 185, 129, 0.8)",   // Verde
    "rgba(249, 115, 22, 0.8)",   // Naranja
    "rgba(139, 92, 246, 0.8)",   // Púrpura
    "rgba(236, 72, 153, 0.8)",   // Rosado
    "rgba(59, 130, 246, 0.8)",   // Azul claro
    "rgba(251, 191, 36, 0.8)",   // Amarillo
    "rgba(20, 184, 166, 0.8)",   // Teal
  ];

  // helpers para calcular porcentaje y tooltip
  const calcularPercent = (valor) => {
    if (!poblacion || poblacion === 0) return 0;
    return Math.round((Number(valor) * 100) / Number(poblacion));
  };

  const handleSavePoblacion = async () => {
    const val = Number(poblacionInput || 0);
    try {
      await instance.post('/estadisticas/poblacion', { anio: Number(anio), poblacion: val });
      setPoblacion(val);
      setEditingPoblacion(false);
    } catch (err) {
      console.error('Error guardando población', err?.response?.data || err.message);
    }
  };

  const handleDeletePoblacion = async () => {
    try {
      await instance.delete(`/estadisticas/poblacion/${anio}`);
      const pc = await instance.get('/pacientes/count');
      const val = pc?.data?.count ?? pc?.data ?? null;
      setPoblacion(val);
      setPoblacionInput(String(val ?? ''));
      setEditingPoblacion(false);
    } catch (err) {
      console.error('Error borrando población', err?.response?.data || err.message);
    }
  };

  return (
    <div className="p-6 relative">
      <div className="absolute right-6 top-6 flex items-center gap-2">
        <div className="bg-white/90 border rounded px-3 py-2 text-sm shadow">
          <span className="font-semibold">Población año {anio}:</span>{" "}
          <span>{poblacion ?? "Sin definir"}</span>
        </div>
        <button
          className="w-10 h-10 rounded border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 flex items-center justify-center"
          onClick={() => setEditingPoblacion(true)}
          title="Editar población"
          aria-label="Editar población"
        >
          <FaEdit />
        </button>
        <button
          className="w-10 h-10 rounded border border-red-300 text-red-600 bg-white hover:bg-red-50 flex items-center justify-center"
          onClick={handleDeletePoblacion}
          title="Eliminar población"
          aria-label="Eliminar población"
        >
          <FaTrash />
        </button>
        <button className="bg-blue-600 text-white px-4 py-2 rounded" onClick={() => setEditingPoblacion(true)}>
          Gestionar población
        </button>
      </div>
      <div className="mb-6 flex gap-4">
        <div>
          <label className="mr-2 font-semibold">Año:</label>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="border rounded-lg px-4 py-2 shadow"
          >
            {[yearActual, yearActual - 1].map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mr-2 font-semibold">Trimestre:</label>
          <select
            value={trimestre}
            onChange={(e) => setTrimestre(Number(e.target.value))}
            className="border rounded-lg px-4 py-2 shadow"
          >
            <option value={1}>Trimestre 1 (Enero - Marzo)</option>
            <option value={2}>Trimestre 2 (Abril - Junio)</option>
            <option value={3}>Trimestre 3 (Julio - Septiembre)</option>
            <option value={4}>Trimestre 4 (Octubre - Diciembre)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(data).map((grupoEtario) => {
          const vacunas = data[grupoEtario];

          const labels = Object.keys(vacunas || {});
          const datosVacunas = Object.values(vacunas || {});
          const datosPorcentuales = datosVacunas.map(v => calcularPercent(v));

          return (
            <div key={grupoEtario} className="bg-white shadow-lg rounded-xl p-4">
              <h2 className="text-xl font-bold mb-4">{grupoEtario}</h2>
              {labels.length === 0 ? (
                <p className="text-gray-500">Sin datos</p>
              ) : (
                <Bar
                  data={{
                    labels: labels,
                    datasets: [
                      {
                        label: "Dosis Aplicadas (% del objetivo)",
                        data: datosPorcentuales,
                        backgroundColor: colors.map((_, idx) => colors[idx % colors.length]),
                        borderColor: colors.map((_, idx) => colors[idx % colors.length].replace("0.8", "1")),
                        borderWidth: 1,
                      },
                      {
                        type: "line",
                        label: `Meta ${metaTrimestral}%`,
                        data: labels.map(() => metaTrimestral),
                        borderColor: "red",
                        backgroundColor: "red",
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                      },
                    ],
                  }}
                  options={{
                    ...chartOptions,
                    plugins: {
                      ...chartOptions.plugins,
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            const idx = context.dataIndex;
                            const abs = datosVacunas[idx];
                            const pct = datosPorcentuales[idx];
                            return `${abs} dosis — ${pct}% del objetivo`;
                          }
                        }
                      }
                    }
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      {editingPoblacion && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4">Población objetivo — {anio}</h3>
            <input type="number" className="w-full border rounded p-2 mb-4" value={poblacionInput} onChange={(e) => setPoblacionInput(e.target.value)} />
            <div className="flex justify-end gap-2">
              <button className="px-4 py-2 rounded border" onClick={() => setEditingPoblacion(false)}>Cancelar</button>
              <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={handleDeletePoblacion}>Eliminar</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={handleSavePoblacion}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}