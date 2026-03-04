import { useForm } from 'react-hook-form';
import { useAuth } from '../context/authContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import React from 'react';

function RegisterPage() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { signUp, isAuthenticated, errors: registerErrors } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) navigate("/tasks");
    }, [isAuthenticated]);

    const onSubmit = handleSubmit(async (values) => {
        signUp(values);
    });

    return (
        <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
            <div className="card shadow p-4" style={{ maxWidth: '400px', width: '100%' }}>
                {registerErrors.map((error, i) => (
                    <div className="alert alert-danger text-center p-2 mb-3" key={i}>
                        {error}
                    </div>
                ))}

                <h1 className="text-primary fw-bold text-center mb-3">PresInf</h1>
                <h5 className="text-center mb-4">Crea una cuenta nueva</h5>

                <form autoComplete="off" onSubmit={onSubmit}>
                    <div className="mb-3">
                        <input
                            type="email"
                            autoComplete="username"
                            placeholder="Correo electrónico"
                            {...register('email', { required: true })}
                            className="form-control"
                        />
                        {errors.email && <div className="text-danger small">El email es obligatorio</div>}
                    </div>

                    <div className="mb-3">
                        <input
                            type="password"
                            name='pass'
                            autoComplete="off"
                            placeholder="Contraseña"
                            {...register('password', { required: true })}
                            className="form-control"
                        />
                        {errors.password && <div className="text-danger small">La contraseña es obligatoria</div>}
                    </div>

                    <button type="submit" className="btn btn-primary w-100 mb-3">
                        Iniciar sesión
                    </button>
                </form>

                <p className="text-center">
                    ¿Ya tienes una cuenta?{' '}
                    <Link className="text-primary" to="/login">
                        Inicia sesión aquí
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterPage;
