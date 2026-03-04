import React, { useState } from "react";
import { useAuth } from "../context/authContext";
import { useLocation, Link } from "react-router-dom";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(true);
  const [openSections, setOpenSections] = useState({
    users: false,
    vaccines: false,
    statistics: false, // Nueva sección
  });

  if (location.pathname === "/Login" || location.pathname === "/Register" || !user) return null;

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const showGestUsuario = ["Coordinador", "Directora"].includes(user?.rol?.nombre);
  const showPacientes = ["Coordinador", "Directora", "Enfermero"].includes(user?.rol?.nombre);
  const showStatistics = ["Coordinador", "Directora"].includes(user?.rol?.nombre);

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-300 text-gray-700 shadow-lg hover:bg-gray-400 transition-colors"
          aria-label="Abrir menú"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-100 to-gray-200 text-gray-900 w-72 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
      >
        {/* Header con botón de cerrar */}
        <div className="p-6 border-b border-gray-300 flex flex-col items-center relative bg-gray-100">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-200 transition-colors group"
            aria-label="Cerrar menú"
            title="Cerrar menú"
          >
            <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white font-semibold shadow-lg text-lg">
            {user?.nombre?.split(" ").map(w => w[0]).join("").slice(0, 2) || "US"}
          </div>
          <h1 className="text-2xl font-display font-bold tracking-tight mt-2">PresInF</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Gestión</p>
          <p className="font-bold text-gray-700 text-ss mt-2">{user?.nombre} | {user?.rol?.nombre}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar p-4 space-y-2">

          {/* Gestión de Usuario */}
          {showGestUsuario && (
            <div>
              <button
                onClick={() => toggleSection("users")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-200 transition-colors group focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <div className="flex items-center gap-3">
                  {/* Usuarios Icon */}
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span className="font-display font-semibold text-slate-700 text-base">Gestión de Usuario</span>
                </div>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${openSections.users ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openSections.users && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link to="/usuarios" onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }} style={{ textDecoration: 'none', color: 'inherit' }} className="flex items-center gap-3 p-3 pl-8 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 visited:text-slate-700 no-underline focus:outline-none focus:ring-2 focus:ring-slate-300">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="8" r="3" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16v-1a6 6 0 0112 0v1" />
                    </svg>
                    <span className="text-base">Gestión de Usuarios</span>
                  </Link>
                  <Link to="/logs" onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }} style={{ textDecoration: 'none', color: 'inherit' }} className="flex items-center gap-3 p-3 pl-8 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 visited:text-slate-700 no-underline focus:outline-none focus:ring-2 focus:ring-slate-300">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 9h16" />
                    </svg>
                    <span className="text-base">Registro de Actividades</span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Vacunas y Pacientes */}
          <div>
            <button
              onClick={() => toggleSection("vaccines")}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-200 transition-colors group focus:outline-none focus:ring-2 focus:ring-slate-300"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                <span className="font-display font-semibold text-slate-700 text-base">Vacunas/Pacientes</span>
              </div>
              <svg className={`w-4 h-4 text-slate-500 transition-transform ${openSections.vaccines ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openSections.vaccines && (
              <div className="ml-4 mt-1 space-y-1">
                {showPacientes && (
                  <>
                    <Link to="/viewPacientes" onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }} style={{ textDecoration: 'none', color: 'inherit' }} className="flex items-center gap-3 p-3 pl-8 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 visited:text-slate-700 no-underline focus:outline-none focus:ring-2 focus:ring-slate-300">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="8" r="3" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 16v-1a6 6 0 0112 0v1" />
                      </svg>
                      <span className="text-base">Ver Pacientes</span>
                    </Link>
                    <Link to="/dosis-aplicada" onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }} style={{ textDecoration: 'none', color: 'inherit' }} className="flex items-center gap-3 p-3 pl-8 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 visited:text-slate-700 no-underline focus:outline-none focus:ring-2 focus:ring-slate-300">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="9" y="13" width="6" height="8" rx="2" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v9" />
                      </svg>
                      <span className="text-base">Cargar Vacuna</span>
                    </Link>
                    <Link to="/alertas" onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }} style={{ textDecoration: 'none', color: 'inherit' }} className="flex items-center gap-3 p-3 pl-8 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 visited:text-slate-700 no-underline focus:outline-none focus:ring-2 focus:ring-slate-300">
                      <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 20H3a2 2 0 01-1.732-2.955l9-15.491a2 2 0 013.464 0l9 15.491A2 2 0 0121 20z" />
                      </svg>
                      <span className="text-base">Calendario de Vacunación</span>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Sección Estadísticas y Dashboard */}
          {showStatistics && (
            <div>
              <button
                onClick={() => toggleSection("statistics")}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-slate-200 transition-colors group focus:outline-none focus:ring-2 focus:ring-slate-300"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 17v-2a4 4 0 014-4h7" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17v-6a4 4 0 10-8 0v6" />
                  </svg>
                  <span className="font-display font-semibold text-slate-700 text-base">Estadísticas y Dashboard</span>
                </div>
                <svg className={`w-4 h-4 text-slate-500 transition-transform ${openSections.statistics ? "rotate-180" : ""}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openSections.statistics && (
                <div className="ml-4 mt-1 space-y-1">
                  <Link
                    to="/"
                    onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    className="flex items-center gap-3 p-3 pl-8 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 visited:text-slate-700 no-underline focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="13" width="4" height="8" rx="1" />
                      <rect x="10" y="7" width="4" height="14" rx="1" />
                      <rect x="17" y="4" width="4" height="17" rx="1" />
                    </svg>
                    <span className="text-base">Dashboard</span>
                  </Link>
                  <Link
                    to="/graficos"
                    onClick={() => { if (window.innerWidth < 1024) setIsOpen(false); }}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                    className="flex items-center gap-3 p-3 pl-8 rounded-lg hover:bg-slate-200 transition-colors text-slate-700 visited:text-slate-700 no-underline focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 14l5-5 2 2 5-6" />
                    </svg>
                    <span className="text-base">Gráficos Estadísticos</span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Botón cerrar sesión */}
        <button
          onClick={logout}
          className=""
          title="Cerrar sesión"
        >
          <div className="px-4 py-3 pt-20 mb-2 text-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition-colors mt-4 mx-4 text-lg focus:outline-none focus:ring-2 focus:ring-red-300">
            Cerrar sesión
          </div>
        </button>
      </aside>
    </>
  );
}
