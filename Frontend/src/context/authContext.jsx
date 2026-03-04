import React, { createContext, useContext, useState, useEffect } from "react";
import { registerRequest, loginRequest, verifyTokenRequest } from "../api/auth";
import instance from "../api/axios";
import { useNotify } from "./notificationContext";
export const authContext = createContext();

export const useAuth = () => {
  const context = useContext(authContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  const normalizeError = (err) => {
    const msg = err?.response?.data?.message || err?.message || "Ocurrió un error";
    return Array.isArray(msg) ? msg.join("\n") : msg;
  };

  const signUp = async (user) => {
    try {
      const res = await registerRequest(user);
      setUser(res.data);
      setIsAuthenticated(true);
      notify.success("Registro exitoso");
    } catch (error) {
      const msg = normalizeError(error);
      setErrors([msg]);
      notify.error(msg);
    }
  };

  const signIn = async (userData) => {
    try {
      await loginRequest(userData);
      const res = await verifyTokenRequest();
      setUser(res.data);
      setIsAuthenticated(true);
      notify.success("Inicio de sesión exitoso");
    } catch (err) {
      const msg = normalizeError(err);
      setUser(null);
      setIsAuthenticated(false);
      setErrors([msg]);
      notify.error(msg);
    }
  };

  const logout = async () => {
    try {
      await instance.post("/auth/logout");
      localStorage.removeItem("user");
      sessionStorage.removeItem("pushAlertShownId");
      setUser(null);
      setIsAuthenticated(false);
      notify.info("Sesión cerrada");
    } catch (err) {
      const msg = normalizeError(err);
      localStorage.removeItem("user");
      sessionStorage.removeItem("pushAlertShownId");
      setUser(null);
      setIsAuthenticated(false);
      notify.error(msg);
    }
  };

  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => {
        setErrors([]);
      }, 5000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [errors]);

  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await verifyTokenRequest();
        setIsAuthenticated(true);
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data));
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };
    checkLogin();
  }, []);

  return (
    <authContext.Provider
      value={{
        signUp,
        signIn,
        logout,
        loading,
        user,
        isAuthenticated,
        errors,
      }}
    >
      {children}
    </authContext.Provider>
  );
};
