import React from "react";
import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { resetPasswordRequest } from "../api/auth";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token") || "";

    const [newPassword, setNewPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [msg, setMsg] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMsg("");
        setError("");

        if (!token) {
            setError("Token inválido o faltante.");
            return;
        }

        if (newPassword !== confirm) {
            setError("Las contraseñas no coinciden.");
            return;
        }

        try {
            setLoading(true);
            const { data } = await resetPasswordRequest({ token, newPassword });

            setMsg(data?.message || "Contraseña actualizada correctamente. Ya puedes iniciar sesión.");
            setTimeout(() => navigate("/login"), 1200);
        } catch (err) {
            const message = err?.response?.data?.message || err?.message || "Error inesperado.";
            setError(Array.isArray(message) ? message.join("\n") : message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
            <div className="card shadow p-4" style={{ maxWidth: "400px", width: "100%" }}>
                <h1 className="text-primary fw-bold text-center mb-3">PresInf</h1>
                <h5 className="text-center mb-4">Restablecer contraseña</h5>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Nueva contraseña"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Confirmar contraseña"
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" disabled={loading} className="btn btn-primary w-100 mb-3">
                        {loading ? "Actualizando..." : "Guardar nueva contraseña"}
                    </button>
                </form>

                {msg && <div className="alert alert-success mt-2 mb-0">{msg}</div>}
                {error && <div className="alert alert-danger mt-2 mb-0">{error}</div>}

                <p className="text-center mt-3 mb-0">
                    <Link className="text-primary" to="/login">Volver al inicio de sesión</Link>
                </p>
            </div>
        </div>
    );
}