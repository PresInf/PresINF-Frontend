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
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

export default function Graficos() {
  const yearActual = new Date().getFullYear();

  const [data, setData] = useState({});
  const [anio, setAnio] = useState(yearActual);
  const [semestre, setSemestre] = useState(1);
  const [loading, setLoading] = useState(true);

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
        setLoading(true);
        const res = await instance.get(`/estadisticas/${anio}/${semestre}`);
        console.log(`Datos para ${anio} - Semestre ${semestre}:`, res.data);
        setData(res.data || {});
      } catch (error) {
        console.error("Error al obtener datos:", error.response?.data || error.message);
        setData({});
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, [anio, semestre]);

  if (loading) {
    return <p className="p-6">Cargando estadísticas...</p>;
  }

  if (!data || Object.keys(data).length === 0) {
    return <p className="p-6">No hay datos para el año {anio}, Semestre {semestre}</p>;
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

  return (
    <div className="p-6">
      <div className="mb-6 flex gap-4">
        <div>
          <label className="mr-2 font-semibold">Año:</label>
          <select
            value={anio}
            onChange={(e) => setAnio(Number(e.target.value))}
            className="border rounded-lg px-4 py-2 shadow"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        <div>
          <label className="mr-2 font-semibold">Semestre:</label>
          <select
            value={semestre}
            onChange={(e) => setSemestre(Number(e.target.value))}
            className="border rounded-lg px-4 py-2 shadow"
          >
            <option value={1}>Semestre 1 (Enero - Junio)</option>
            <option value={2}>Semestre 2 (Julio - Diciembre)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(data).map((grupoEtario) => {
          const vacunas = data[grupoEtario];

          const labels = Object.keys(vacunas || {});
          const datosVacunas = Object.values(vacunas || {});

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
                        label: "Dosis Aplicadas",
                        data: datosVacunas,
                        backgroundColor: colors.map((_, idx) => colors[idx % colors.length]),
                        borderColor: colors.map((_, idx) => colors[idx % colors.length].replace("0.8", "1")),
                        borderWidth: 1,
                      },
                      {
                        type: "line",
                        label: "Meta 75%",
                        data: labels.map(() => 75),
                        borderColor: "red",
                        backgroundColor: "red",
                        borderWidth: 2,
                        pointRadius: 0,
                        fill: false,
                      },
                    ],
                  }}
                  options={chartOptions}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}