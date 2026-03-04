import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authContext";

export const PublicRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // espera a que se verifique el token

  return !isAuthenticated ? <Outlet /> : <Navigate to="/" />;
};
