import React from "react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPasswordRequest } from "../api/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        setError("");

        try {
            setLoading(true);
            const { data } = await forgotPasswordRequest({ email });

            setMessage(
                data?.message ||
                "Si el correo existe, se enviaron instrucciones para restablecer la contraseña."
            );
            setEmail("");
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
                <h5 className="text-center mb-4">Recuperar contraseña</h5>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <input
                            type="email"
                            className="form-control"
                            placeholder="Correo electrónico"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
                        {loading ? "Enviando..." : "Enviar enlace"}
                    </button>
                </form>

                {message && <div className="alert alert-success mt-3 mb-0">{message}</div>}
                {error && <div className="alert alert-danger mt-3 mb-0">{error}</div>}

                <p className="text-center mt-3 mb-0">
                    <Link className="text-primary" to="/login">
                        Volver al inicio de sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}