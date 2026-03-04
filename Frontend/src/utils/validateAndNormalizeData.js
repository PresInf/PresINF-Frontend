export function validateAndNormalizeData(data) {
  const errors = [];
  const rows = [];

  data.forEach((row, index) => {
    const documento = (row.documento || row.dni || '').toString().trim();
    const nombre = (row.nombre || row.nombre_persona || '').toString().trim();
    const apellido = (row.apellido || row.apellido_persona || '').toString().trim();
    const fecha_nacimiento = row.fecha_nacimiento || row.fecha_persona || '';
    const id_area_programatica = row.id_area_programatica ? Number(row.id_area_programatica) : null;
    const nombre_vacuna = (row.nombre_vacuna || row.vacuna || '').toString().trim();
    const fecha_dosis = row.fecha_dosis || row.fecha || '';
    const id_vacunador = row.id_vacunador ? Number(row.id_vacunador) : null;
  const vacunador_nombre = (row.vacunador || row.vacunador_nombre || row.vacunador_name || row.usuario || row.usuario_nombre || '').toString().trim();
  const vacunador_email = (row.vacunador_email || row.email || row.vacunador_mail || '').toString().trim().toLowerCase();
    const external_source = (row.external_source || row.origen || row.source || '').toString().trim();
    const external_id = (row.external_id || row.externalId || row.id_externo || '').toString().trim();
    const dosis_numero = row.dosis_numero ? Number(row.dosis_numero) : (row.dosis ? Number(row.dosis) : null);

    if (!nombre_vacuna) {
      errors.push(`Fila ${index + 1}: falta nombre_vacuna`);
      return;
    }
    if (!fecha_dosis) {
      errors.push(`Fila ${index + 1}: falta fecha_dosis`);
      return;
    }

    rows.push({
      documento,
      nombre,
      apellido,
      fecha_nacimiento,
      id_area_programatica,
      nombre_vacuna,
      fecha_dosis,
      id_vacunador,
      vacunador_nombre,
      vacunador_email,
      external_source,
      external_id,
      dosis_numero,
    });
  });

  return { validData: rows, errors };
}