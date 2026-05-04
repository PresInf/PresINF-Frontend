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