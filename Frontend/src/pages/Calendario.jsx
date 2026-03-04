import React from 'react';
import './calendar.css'; // Asegúrate de tener un archivo CSS para estilos

const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const fechas = Array.from({ length: 31 }, (_, i) => i + 1); // 35 celdas (5 semanas)

const Calendario = () => {
  return (
    <div className="calendario-container">
      <h2 className="calendario-titulo">Calendario de hoy</h2>
      <div className="calendario-grid">
        {dias.map((dia, index) => (
          <div key={index} className="calendario-dia">{dia}</div>
        ))}
        {fechas.map((fecha, index) => (
          <div key={index} className="calendario-fecha">{fecha}</div>
        ))}
      </div>
    </div>
  );
};

export default Calendario;
