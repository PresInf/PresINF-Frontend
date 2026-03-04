import React from 'react';

export default function PersonaForm({ form, setForm, localidades = [], provincias = [], tiposPersona = [], onSubmit, submitLabel = 'Registrar', submitting = false }) {
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  return (
    <form onSubmit={(e) => { e.preventDefault(); e.stopPropagation(); console.log('PersonaForm: submit (interceptado)'); if (typeof onSubmit === 'function') onSubmit(e); }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Nombre</label>
          <input type="text" className="border rounded px-3 py-2 w-full mt-1" name="nombre" value={form.nombre} onChange={handleChange} required />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Apellido</label>
          <input type="text" className="border rounded px-3 py-2 w-full mt-1" name="apellido" value={form.apellido} onChange={handleChange} required />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Fecha de nacimiento</label>
          <input type="date" className="border rounded px-3 py-2 w-full mt-1" name="fechaNacimiento" value={form.fechaNacimiento} onChange={handleChange} required />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">DNI</label>
          <input type="text" className="border rounded px-3 py-2 w-full mt-1" name="dni" value={form.dni} onChange={handleChange} required />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Sexo</label>
          <select className="border rounded px-3 py-2 w-full mt-1" name="sexo" value={form.sexo} onChange={handleChange} required>
            <option value="">Seleccione</option>
            <option value="1">Masculino</option>
            <option value="2">Femenino</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Domicilio</label>
          <input type="text" className="border rounded px-3 py-2 w-full mt-1" name="domicilio" value={form.domicilio} onChange={handleChange} />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Localidad</label>
          <select className="border rounded px-3 py-2 w-full mt-1" name="localidad" value={form.localidad} onChange={handleChange}>
            <option value="">Seleccione una localidad</option>
            {localidades.map((loc) => (
              <option key={loc.id_localidad} value={loc.id_localidad}>{loc.localidad}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Provincia</label>
          <select className="border rounded px-3 py-2 w-full mt-1" name="provincia" value={form.provincia} onChange={handleChange}>
            <option value="">Seleccione una provincia</option>
            {provincias.map((prov) => (
              <option key={prov.id_provincia} value={prov.id_provincia}>{prov.provincia}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Tipo de persona</label>
          <select className="border rounded px-3 py-2 w-full mt-1" name="tipoPersona" value={form.tipoPersona} onChange={handleChange}>
            <option value="">Seleccione el tipo de persona</option>
            {tiposPersona.map((pers) => (
              <option key={pers.id_persona_tipo} value={pers.id_persona_tipo}>{pers.tipo}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Teléfono</label>
          <input type="text" className="border rounded px-3 py-2 w-full mt-1" name="num_telefono" value={form.num_telefono} onChange={handleChange} placeholder="Ingrese un número de teléfono (opcional)" />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button type="submit" disabled={submitting} className={`bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow ${submitting ? 'opacity-60 cursor-not-allowed' : ''}`}>
          {submitting ? 'Enviando...' : submitLabel}
        </button>
      </div>
    </form>
  );
}
