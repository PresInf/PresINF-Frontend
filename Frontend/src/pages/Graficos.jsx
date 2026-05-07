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
import { FaPlus } from "react-icons/fa";
import PoblacionList from "../components/PoblacionList";
import PoblacionForm from "../components/PoblacionForm";

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

// Mapeo específico entre nombres de grupos etarios del backend y rangos_edades
const obtenerIdEdadesParaGrupo = (grupoEtario, rangosEdades) => {
  if (!grupoEtario || !rangosEdades || rangosEdades.length === 0) {
    return null;
  }

  // Función para normalizar: minúsculas, sin acentos, guiones por espacios
  const normalizar = (texto) => {
    return texto
      .toLowerCase()
      .trim()
      .replace(/á/g, 'a')
      .replace(/é/g, 'e')
      .replace(/í/g, 'i')
      .replace(/ó/g, 'o')
      .replace(/ú/g, 'u')
      .replace(/[\-\s]+/g, ' '); // Normalizar guiones y espacios múltiples
  };

  const grupoNorm = normalizar(grupoEtario);
  
  // Buscar primero por normalización
  let rango = rangosEdades.find(r => 
    normalizar(r.titulo) === grupoNorm
  );

  if (rango) {
    return rango;
  }

  // Si no hay match exacto, buscar por similitud
  rango = rangosEdades.find(r => {
    const rangoNorm = normalizar(r.titulo);
    return (
      grupoNorm.includes(rangoNorm) ||
      rangoNorm.includes(grupoNorm)
    );
  });


  console.log(`❌ No se encontró mapeo para: "${grupoEtario}"`);
  return null;
};

export default function Graficos() {
  const yearActual = new Date().getFullYear();

  const [data, setData] = useState({});
  const [anio, setAnio] = useState(yearActual);
  const [trimestre, setTrimestre] = useState(1);
  const [loadingData, setLoadingData] = useState(false);
  const [showPoblacionList, setShowPoblacionList] = useState(false);
  const [poblacionesPorEdad, setPoblacionesPorEdad] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [showFormulario, setShowFormulario] = useState(false);
  const [preselectedIdEdades, setPreselectedIdEdades] = useState(null);
  const [preselectedRangoTitulo, setPreselectedRangoTitulo] = useState(null);
  const [rangosEdades, setRangosEdades] = useState([]);
  const [editingData, setEditingData] = useState(null);

  const metaTrimestral = Math.min(Math.max(trimestre, 1), 4) * 25;

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
  };

  // Cargar rangos de edad al montar
  useEffect(() => {
    const cargarRangos = async () => {
      try {
        const res = await instance.get('/estadisticas/rango-edades');
        setRangosEdades(res.data || []);
      } catch (err) {
        console.error('Error al cargar rangos de edad:', err);
      }
    };
    cargarRangos();
  }, []);

  const obtenerDatos = async () => {
    try {
      setLoadingData(true);
      
      // Obtener datos de dosis aplicadas por grupo etario
      const res = await instance.get(`/estadisticas/${anio}/${trimestre}`);
      setData(res.data || {});

      // Obtener poblaciones específicas por rango de edad y año
      try {
        const poblaciones = await instance.get(
          `/estadisticas/poblacion-por-edad/${anio}`
        );
        const mapPoblaciones = {};
        
        if (Array.isArray(poblaciones.data)) {
          poblaciones.data.forEach((p) => {
            mapPoblaciones[p.id_edades] = {
              poblacion: p.poblacion,
              id_poblacion_anual: p.id_poblacion_anual,
              anio: p.anio,
              id_edades: p.id_edades
            };
          });
        }
        
        setPoblacionesPorEdad(mapPoblaciones);
      } catch (err) {
        console.error("Error al obtener poblaciones por edad:", err);
        setPoblacionesPorEdad({});
      }
    } catch (error) {
      console.error("Error al obtener datos:", error.response?.data || error.message);
      setData({});
      setPoblacionesPorEdad({});
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    obtenerDatos();
  }, [anio, trimestre, refreshKey]);



  const handleRefreshPoblaciones = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleAbrirFormulario = (idEdades, rangoTitulo) => {
    setPreselectedIdEdades(idEdades);
    setPreselectedRangoTitulo(rangoTitulo);
    
    // Si ya existe población para este rango, pasar los datos para editar
    const datosPoblacion = poblacionesPorEdad[idEdades];
    if (datosPoblacion && typeof datosPoblacion === 'object') {
      setEditingData(datosPoblacion);
    } else {
      setEditingData(null);
    }
    
    setShowFormulario(true);
  };

  const handleCerrarFormulario = () => {
    setShowFormulario(false);
    setPreselectedIdEdades(null);
    setPreselectedRangoTitulo(null);
    setEditingData(null);
  };

  const handleSuccessFormulario = () => {
    handleRefreshPoblaciones();
    handleCerrarFormulario();
  };

  if (loadingData) {
    return <p className="p-6">Cargando estadísticas...</p>;
  }

  if (!data || Object.keys(data).length === 0) {
    return <p className="p-6">No hay datos para el año {anio}, Trimestre {trimestre}</p>;
  }

  const colors = [
    "rgba(37, 99, 235, 0.8)",
    "rgba(16, 185, 129, 0.8)",
    "rgba(249, 115, 22, 0.8)",
    "rgba(139, 92, 246, 0.8)",
    "rgba(236, 72, 153, 0.8)",
    "rgba(59, 130, 246, 0.8)",
    "rgba(251, 191, 36, 0.8)",
    "rgba(20, 184, 166, 0.8)",
  ];

  const calcularPercent = (valor, idEdades = null) => {
    let poblacionBase = null;
    
    // Si se proporciona id_edades, usar población específica de ese rango
    if (idEdades !== null && poblacionesPorEdad[idEdades]) {
      const datoPoblacion = poblacionesPorEdad[idEdades];
      poblacionBase = typeof datoPoblacion === 'object' ? datoPoblacion.poblacion : datoPoblacion;
    }

    if (!poblacionBase || poblacionBase === 0) {
      return 0;
    }
    
    return Math.round((Number(valor) * 100) / Number(poblacionBase));
  };

  return (
    <div className="p-6">
      {showPoblacionList && (
        <div className="mb-6 bg-white rounded-lg shadow-lg p-4">
          <PoblacionList
            anio={anio}
            onDataChanged={handleRefreshPoblaciones}
          />
        </div>
      )}

      <div className="mb-6 flex gap-4 items-center justify-between">
        <div className="flex gap-4">
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

        <button
          onClick={() => setShowPoblacionList(!showPoblacionList)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {showPoblacionList ? "Ocultar Poblaciones" : "Gestionar Poblaciones"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.keys(data).map((grupoEtario) => {
          const vacunas = data[grupoEtario];
          const labels = Object.keys(vacunas || {});
          const datosVacunas = Object.values(vacunas || {});
          
          // Buscar el rango de edad correspondiente a este grupo PRIMERO
          const rangoCorrespondiente = obtenerIdEdadesParaGrupo(grupoEtario, rangosEdades);
          
          // Ahora calcular porcentajes usando el id_edades correcto
          const datosPorcentuales = datosVacunas.map((v) =>
            calcularPercent(v, rangoCorrespondiente?.id_edades)
          );

          const datosPoblacion = rangoCorrespondiente ? poblacionesPorEdad[rangoCorrespondiente.id_edades] : null;
          const tienePopulacion = datosPoblacion && (typeof datosPoblacion === 'object' ? datosPoblacion.poblacion : datosPoblacion);
          const poblacionInfo = tienePopulacion
            ? `${typeof datosPoblacion === 'object' ? datosPoblacion.poblacion : datosPoblacion} personas`
            : 'Sin población cargada';

          return (
            <div key={grupoEtario} className="bg-white shadow-lg rounded-xl p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold">{grupoEtario}</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Población: <span className={tienePopulacion ? 'font-semibold text-green-600' : 'text-orange-600'}>
                      {poblacionInfo}
                    </span>
                  </p>
                </div>
                {rangoCorrespondiente && (
                  <button
                    onClick={() =>
                      handleAbrirFormulario(
                        rangoCorrespondiente.id_edades,
                        rangoCorrespondiente.titulo
                      )
                    }
                    className="flex items-center gap-2 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-sm whitespace-nowrap"
                    title={tienePopulacion ? 'Editar población' : 'Cargar población'}
                  >
                    <FaPlus size={14} />
                    {tienePopulacion ? 'Editar' : 'Cargar'}
                  </button>
                )}
              </div>

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
                        backgroundColor: colors.map(
                          (_, idx) => colors[idx % colors.length]
                        ),
                        borderColor: colors.map((_, idx) =>
                          colors[idx % colors.length].replace("0.8", "1")
                        ),
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
                          label: function (context) {
                            const idx = context.dataIndex;
                            const abs = datosVacunas[idx];
                            const pct = datosPorcentuales[idx];
                            return `${abs} dosis — ${pct}% del objetivo`;
                          },
                        },
                      },
                    },
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      <PoblacionForm
        isOpen={showFormulario}
        onClose={handleCerrarFormulario}
        onSuccess={handleSuccessFormulario}
        anio={anio}
        rangosEdades={rangosEdades}
        preselectedIdEdades={preselectedIdEdades}
        preselectedRangoTitulo={preselectedRangoTitulo}
        editingData={editingData}
      />
    </div>
  );
}