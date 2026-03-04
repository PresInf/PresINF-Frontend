import React, { useEffect, useState } from "react";
import { Bar, Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../context/authContext";
import instance from "../api/axios";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [barData, setBarData] = useState({ labels: [], datasets: [] });
  const [pieData, setPieData] = useState({ labels: [], datasets: [] });
  const [pacientes, setPacientes] = useState(0);
  const [vacunasAplicadas, setVacunasAplicadas] = useState(0);
  const [recent, setRecent] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [
          pacientesRes,
          vacunasRes,
          vacunasMesRes,
          coberturaRes,
          recentRes,
        ] = await Promise.all([
          instance.get("/pacientes/count"),
          instance.get("/dosis-aplicada/count"),
          instance.get("/estadisticas/vacunas_mes?months=6"),
          instance.get("/estadisticas/cobertura"),
          instance.get("/pacientes/recent?limit=5"),
        ]);

        setPacientes(pacientesRes.data.count ?? pacientesRes.data);
        setVacunasAplicadas(vacunasRes.data.count ?? vacunasRes.data);

        // transformar respuesta de vacunas por mes a formato Chart.js
        const vm = Array.isArray(vacunasMesRes.data) ? vacunasMesRes.data : [];
        const labels = vm.map((m) => m.month);
        const dataCounts = vm.map((m) => Number(m.count || 0));
        setBarData({
          labels,
          datasets: [
            {
              label: "Vacunas aplicadas",
              data: dataCounts,
              backgroundColor: "rgba(54,162,235,0.7)",
            },
          ],
        });

        // cobertura por edad -> pie
        const cob = Array.isArray(coberturaRes.data) ? coberturaRes.data : [];
        const pieLabels = cob.map((c) => c.rango || c.rango);
        const pieCounts = cob.map((c) => Number(c.count || c.percent || 0));
        setPieData({
          labels: pieLabels.length ? pieLabels : ["0-5", "6-12", "13-18", "19-50", "50+"],
          datasets: [
            {
              label: "Cobertura",
              data: pieCounts.length ? pieCounts : [25, 20, 15, 25, 15],
              backgroundColor: ["#007bff", "#28a745", "#ffc107", "#dc3545", "#17a2b8"],
              hoverOffset: 30,
            },
          ],
        });

        setRecent(Array.isArray(recentRes.data) ? recentRes.data : []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setPacientes((p) => p || 0);
        setVacunasAplicadas((v) => v || 0);
      }
    };

    loadAll();
  }, []);

  const barOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: { display: true, text: "Vacunas Aplicadas por Mes" },
    },
  };

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: "right" },
      title: { display: true, text: "Cobertura de Vacunas por Edad" },
    },
  };

  return (
    <div className="container-fluid">
      {/* Cartas resumen */}
      <div className="row my-4 g-3">
        <div className="col-md-3">
          <div className="card text-white bg-info h-100">
            <div className="card-body">
              <h5 className="card-title">Total Pacientes</h5>
              <h2>{pacientes}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-warning h-100">
            <div className="card-body">
              <h5 className="card-title">Vacunas Aplicadas</h5>
              <h2>{vacunasAplicadas}</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-danger h-100">
            <div className="card-body">
              <h5 className="card-title">Alertas</h5>
              <h2>27</h2>
            </div>
          </div>
        </div>

        <div className="col-md-3">
          <div className="card text-white bg-info h-100">
            <div className="card-body">
              <h5 className="card-title">Cobertura de Vacunas</h5>
              <h2>
                {pieData.datasets?.[0]?.data
                  ? `${pieData.datasets[0].data.reduce((a, b) => a + b, 0)}`
                  : "—"}
              </h2>
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="row my-4 g-3">
        <div className="col-md-7">
          <div className="card h-100">
            <div className="card-header">Gráfico de Vacunas Aplicadas</div>
            <div className="card-body">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
        </div>

        <div className="col-md-5">
          <div className="card h-100">
            <div className="card-header">Gráfico de Cobertura por Edad</div>
            <div className="card-body">
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>
        </div>
      </div>

      <div className="row my-4 g-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header text-xl">Alertas de Vacunas</div>
            <div className="card-body p-0">
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>Alerta</th>
                    <th>Paciente</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Vacuna Hepatitis B</td>
                    <td>Juan Pérez</td>
                    <td>2025-07-25</td>
                  </tr>
                  <tr>
                    <td>Refuerzo DTP</td>
                    <td>María López</td>
                    <td>2025-07-27</td>
                  </tr>
                  <tr>
                    <td>Vacuna SRP</td>
                    <td>Carlos Gómez</td>
                    <td>2025-08-01</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-header text-xl">Pacientes Recientes</div>
            <div className="card-body p-0">
              <table className="table table-striped mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Apellido</th>
                    <th>DNI</th>
                    <th>Domicilio</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.length
                    ? recent.map((r) => (
                      <tr key={r.id_paciente || r.id}>
                        <td>{r.persona?.nombre}</td>
                        <td>{r.persona?.apellido}</td>
                        <td>{r.persona?.dni}</td>
                        <td>{r.persona?.domicilio}</td>
                      </tr>
                    ))
                    : (
                      <tr>
                        <td colSpan="4" className="text-center">No hay pacientes recientes</td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;