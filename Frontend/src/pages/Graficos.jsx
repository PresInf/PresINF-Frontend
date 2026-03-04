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
  Legend
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

const meses = [
  "Junio", "Julio", "Agosto",
  "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

export default function Graficos() {
  const yearActual = new Date().getFullYear();

  const [data, setData] = useState({});
  const [anio, setAnio] = useState(yearActual);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const obtenerDatos = async () => {
      try {
        setLoading(true);

        const res = await instance.get(`/estadisticas/${anio}`);
        setData(res.data || {});
      } catch (error) {
        console.error(
          "Error al obtener datos:",
          error.response?.data || error.message
        );
      } finally {
        setLoading(false);
      }
    };

    obtenerDatos();
  }, [anio]);

  if (loading) {
    return <p className="p-6">Cargando estadísticas...</p>;
  }

  if (!data || Object.keys(data).length === 0) {
    return <p className="p-6">No hay datos para el año {anio}</p>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
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

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(data)
        .map((rango) => (
          <div
            key={rango}
            className="bg-white shadow-lg rounded-xl p-4"
          >
            <h2 className="text-xl font-bold mb-4">{rango}</h2>

            <Bar
              data={{
                labels: meses,
                datasets: [
                  {
                    label: "Cobertura %",
                    data: data[rango]?.slice(5, 12) || [],
                    backgroundColor: "rgba(37, 99, 235, 0.8)", 
                    borderColor: "rgba(37, 99, 235, 1)",
                    borderWidth: 1,
                  },
                  {
                    type: "line",
                    label: "Meta 75%",
                    data: meses.map(() => 75),
                    borderColor: "red", 
                    backgroundColor: "red",
                    borderWidth: 2,
                    pointRadius: 0,
                  }
                ],
              }}
              options={{
                responsive: true,
                plugins: {
                  legend: {
                    position: "top",
                  },
                },
                scales: {
                  y: {
                    min: 0,
                    max: 100,
                    ticks: {
                      callback: (value) => value + "%",
                    },
                  },
                },
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}