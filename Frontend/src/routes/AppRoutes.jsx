import { Route, Routes } from "react-router-dom";
import React, { Suspense } from "react";
import Dashboard from '../pages/Dashboard';
import Pacientes from '../pages/Pacientes';
import Calendario from '../pages/Calendario';
import CalendarioPaciente from '../pages/CalendarioPaciente';
import Alertas from '../pages/Alertas';
import Graficos from '../pages/Graficos';
import AgregarUsuario from "../pages/AgregarUsuario";
import PacientesLista from '../pages/PacientesView';
import LoginPage from '../pages/LoginPage';
import EditarUsuario from "../pages/EditarUsuario";
import EditarPaciente from "../pages/EditarPaciente";
import UsuariosGestion from "../pages/UsuariosGestion";
import RegisterPage from '../pages/RegisterPage';
import LogsPage from '../pages/LogsPage';
import LogDetailPage from '../pages/LogDetailPage';
import { PublicRoutes } from "./PublicRoutes";
import { PrivateRoutes } from "./PrivateRoutes";
import ProtectedRoute from "../components/ProtectedRoute";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import Vacunas from "../pages/Vacunas";

export const AppRouter = () => {
  return (
    <Suspense fallback={<div className="p-4">Cargando...</div>}>
      <Routes>
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        </Route>

        <Route element={<PrivateRoutes />}>
          <Route path="/usuarios" element={
            <ProtectedRoute roles={["Directora", "Coordinador"]}>
              <UsuariosGestion />
            </ProtectedRoute>
          } />
          <Route path="/pacientes/editar/:id" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <EditarPaciente />
            </ProtectedRoute>
          } />
          <Route path="/usuarios/agregar" element={
            <ProtectedRoute roles={["Directora", "Coordinador"]}>
              <AgregarUsuario />
            </ProtectedRoute>
          } />
          <Route path="/dosis-aplicada" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <Vacunas />
            </ProtectedRoute>
          } />
          <Route path="/usuarios/editar/:id" element={
            <ProtectedRoute roles={["Directora", "Coordinador"]}>
              <EditarUsuario />
            </ProtectedRoute>
          } />
          <Route path="/" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/pacientes" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <Pacientes />
            </ProtectedRoute>
          } />
          <Route path="/calendario" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <Calendario />
            </ProtectedRoute>
          } />
          <Route path="/calendario/:id" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <CalendarioPaciente />
            </ProtectedRoute>
          } />
          <Route path="/alertas" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <Alertas />
            </ProtectedRoute>
          } />
          <Route path="/graficos" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <Graficos />
            </ProtectedRoute>
          } />
          <Route path="/viewPacientes" element={
            <ProtectedRoute roles={["Directora", "Coordinador", "Enfermero", "Enfermero"]}>
              <PacientesLista />
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute roles={["Directora", "Coordinador"]}>
              <LogsPage />
            </ProtectedRoute>
          } />
          <Route path="/logs/:id" element={
            <ProtectedRoute roles={["Directora", "Coordinador"]}>
              <LogDetailPage />
            </ProtectedRoute>
          } />
        </Route>
      </Routes>
    </Suspense>
  );
};

