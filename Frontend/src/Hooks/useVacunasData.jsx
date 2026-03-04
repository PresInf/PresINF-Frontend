import { useEffect, useState, useCallback } from "react";
import instance from "../api/axios";
import socket from "../api/socket";

export function useVacunasData() {
  const [lista, setLista] = useState([]);
  const [vacunas, setVacunas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [personas, setPersonas] = useState([]);
  const [areas, setAreas] = useState([]);
  const [vacunadores, setVacunadores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(false);


  // Nuevo:
  const [resultados, setResultados] = useState([]);
  const [form, setForm] = useState({ id_vacuna: "" });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const get = async (url) => {
      try {
        const { data } = await instance.get(url);
        return data;
      } catch (e) {
        return { __error: true, detalle: e?.message || e };
      }
    };
    const [dosis, vacunasData, pacientesData, personasData, areasData, usuariosData] =
      await Promise.all([
        get("/dosis-aplicada"),
        get("/vacunas"),
        get("/pacientes"),
        get("/persona"),
        get("/areas-programaticas"),
        get("/usuarios"),
      ]);

    const errores = [];
    if (dosis?.__error) errores.push("dosis-aplicada");
    if (vacunasData?.__error) errores.push("vacunas");
    if (pacientesData?.__error) errores.push("pacientes");
    if (personasData?.__error) errores.push("persona");
    if (areasData?.__error) errores.push("areas-programaticas");
    if (usuariosData?.__error) errores.push("usuarios");
    if (errores.length > 0)
      setError(`No se pudieron cargar: ${errores.join(", ")}`);

    setLista(Array.isArray(dosis) ? dosis : []);
    setVacunas(Array.isArray(vacunasData) ? vacunasData : []);
    setPacientes(Array.isArray(pacientesData) ? pacientesData : []);
    setPersonas(Array.isArray(personasData) ? personasData : []);
    setAreas(Array.isArray(areasData) ? areasData : []);
    setVacunadores(Array.isArray(usuariosData) ? usuariosData : []);
    setResultados(Array.isArray(dosis) ? dosis : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll, refresh]);

  // Realtime: refrescar cuando backend emite cambios
  useEffect(() => {
    socket.on("vacuna:changed", fetchAll);
    socket.on("dosis:changed", fetchAll);
    return () => {
      socket.off("vacuna:changed", fetchAll);
      socket.off("dosis:changed", fetchAll);
    };
  }, [fetchAll]);

  // metodo para crear dosis
  const createDose = async (payload) => {
    const { data } = await instance.post("/dosis-aplicada", payload);
    setLista((l) => [data, ...l]);
    const { data: nuevos } = await instance.get("/pacientes");
    setPacientes(Array.isArray(nuevos) ? nuevos : []);
    return data;
  };
  //metodo para actualizar dosis
  const updateDose = async (id, payload) => {
    const { data } = await instance.patch(`/dosis-aplicada/${id}`, payload);
    setLista((l) => l.map((r) => (r.id_dosis_aplicada === id ? data : r)));
    return data;
  };
  // metodo para eliminar dosis
  const deleteDose = async (id) => {
    await instance.delete(`/dosis-aplicada/${id}`);
    setLista((l) => l.filter((r) => r.id_dosis_aplicada !== id));
  };
  //metodo para crear vacuna
  const createVacuna = async (body) => {
    const { data } = await instance.post("/vacunas", body);
    setVacunas((v) => [data, ...v]);
    return data;
  };
  //metodo para actualizar vacuna
  const updateVacuna = async (id, body) => {
    const { data } = await instance.patch(`/vacunas/${id}`, body);
    setVacunas((v) => v.map((x) => (x.id_vacuna === id ? data : x)));
    return data;
  };
  // metodo para eliminar vacuna
  const deleteVacuna = async (id) => {
    await instance.delete(`/vacunas/${id}`);
    setVacunas((v) => v.filter((x) => x.id_vacuna !== id));
  };

  // metodo para filtrar
  const filtrarPorVacuna = async (idVacuna) => {
    setForm({ id_vacuna: idVacuna });

    if (!idVacuna) {
      setResultados(lista);
      return;
    }

    try {
      const { data } = await instance.get(`/vacunas/filtrar/${idVacuna}`);
      setResultados(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error al filtrar:", e);
    }
  };

  return {
    lista,
    vacunas,
    pacientes,
    vacunadores,
    personas,
    areas,
    resultados,
    loading,
    error,
    form,
    setForm,
    fetchAll,
    createDose,
    updateDose,
    deleteDose,
    createVacuna,
    updateVacuna,
    deleteVacuna,
    filtrarPorVacuna,
  };
}
