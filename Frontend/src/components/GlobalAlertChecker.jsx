//globalalertchecker.jsx
import React, { useEffect } from 'react';
import instance from '../api/axios';
import { useNotify } from '../context/notificationContext';

// Componente global que, al montarse, busca la cita más próxima dentro de un umbral
// y muestra una notificación usando el NotificationContext UNA SOLA VEZ por sesión.
const GlobalAlertChecker = ({ thresholdDays = 3 }) => {
  const notify = useNotify();

  useEffect(() => {
    let mounted = true;

    const loadAndNotify = async () => {
      try {
        const { data: pacientes } = await instance.get('/pacientes');
        const requests = (Array.isArray(pacientes) ? pacientes : []).map((p) => {
          const idPaciente = p.id_paciente ?? p.id ?? null;
          if (!idPaciente) return Promise.resolve({ status: 'skipped', value: [] });
          return instance.get(`/citas/paciente/${idPaciente}`);
        });

        const results = await Promise.allSettled(requests);
        const allCitas = [];
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            const d = r.value?.data;
            if (Array.isArray(d)) allCitas.push(...d);
          }
        });

        if (!mounted || allCitas.length === 0) return;

        const toDateOnly = (dt) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
        const msPerDay = 24 * 60 * 60 * 1000;
        const todayOnly = toDateOnly(new Date()).getTime();
        const candidates = allCitas
          .map((c) => ({ cita: c, fecha: c.fecha_cita ? toDateOnly(new Date(c.fecha_cita.replace(/-/g, '/'))).getTime() : null }))
          .filter((x) => x.fecha !== null)
          .map((x) => ({ ...x, daysLeft: Math.floor((x.fecha - todayOnly) / msPerDay) }))
          .filter((x) => x.daysLeft >= 0 && x.daysLeft <= thresholdDays)
          .sort((a, b) => a.daysLeft - b.b.daysLeft);

        if (candidates.length === 0) return;
        const nearest = candidates[0];
        const cita = nearest.cita;

        const shownKey = 'pushAlertShownId';
        const prev = sessionStorage.getItem(shownKey);
        const id = cita?.id_cita ?? `${cita?.id_paciente}_${cita?.fecha_cita}`;
        if (prev === String(id)) return;

        const pacienteName = `${cita.paciente.persona.nombre} ${cita.paciente.persona.apellido}`;
        const vacunaName = cita?.vacuna?.nombre;
        const fecha = cita?.fecha_cita ?
          new Date(cita.fecha_cita.replace(/-/g, '/')).toLocaleDateString() : '—';
        const daysLeft = nearest.daysLeft;
        const diasStr = `(en ${daysLeft} día${daysLeft ? '' : 's'})`;


        // Mensaje corto para el Toast
        const msg = `${vacunaName} para ${pacienteName} — ${fecha} (en ${daysLeft} día${daysLeft === 1 ? '' : 's'})`;

        notify.vacuna(msg, { duration: 10000 });
        sessionStorage.setItem(shownKey, String(id));
      } catch (err) {
      }
    };

    loadAndNotify();
    return () => { mounted = false; };
  }, [notify, thresholdDays]);

  return null;
};

export default GlobalAlertChecker;
