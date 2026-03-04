

import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContext";

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuth();
  const location = useLocation();

  // Si no hay usuario logeado
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Si la ruta requiere ciertos roles y el rol del usuario no está incluido
  if (roles && user.rol && !roles.includes(user.rol.nombre)) {
    // Redirige a la página anterior si existe, si no al home
    const prevPath = location.state?.from?.pathname || "/";
    return <Navigate to={prevPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
