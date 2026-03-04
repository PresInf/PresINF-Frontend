import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/authContext";
import Sidebar from "../components/Sidebar";

export const PrivateRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );

  if (!isAuthenticated) return <Navigate to="/login" />;

  return (
    <div className="min-h-screen w-full flex bg-[#f0f7fc]">
      <Sidebar />
      <main className="flex-1 p-4 lg:ml-72">
        <div className="max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
