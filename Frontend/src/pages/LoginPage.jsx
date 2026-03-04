import { useForm } from 'react-hook-form';
import { useAuth } from '../context/authContext';
import { Link } from 'react-router-dom';
import React from 'react';
import { useNavigate } from 'react-router-dom';

function LoginPage() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { signIn, errors: signinErrors } = useAuth();
  const navigate = useNavigate();

  const onSubmit = handleSubmit(async data => {
    try {
      await signIn(data, navigate);
      // La redirección ya se maneja en signIn según el rol
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card shadow p-4" style={{ maxWidth: '400px', width: '100%' }}>
        {signinErrors.map((error, i) => (
          <div className="alert alert-danger text-center p-2 mb-3" key={i}>
            {error}
          </div>
        ))}

        <h1 className="text-primary fw-bold text-center mb-3">PresInf</h1>
        <h5 className="text-center mb-4">Inicia sesión en tu cuenta</h5>

        <form onSubmit={onSubmit}>
          <div className="mb-3">
            <input
              type="email"
              autoComplete='email'
              placeholder="Correo electrónico"
              {...register('email', { required: true })}
              className="form-control"
            />
            {errors.email && <div className="text-danger small">El email es obligatorio</div>}
          </div>

          <div className="mb-3">
            <input
              type="password"
              autoComplete='one-time-code'
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
          ¿No tienes cuenta?{' '}
          <Link className="text-primary" to="/Register">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
