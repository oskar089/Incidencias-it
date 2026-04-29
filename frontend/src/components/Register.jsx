import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Register() {
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { nombre, email, password, confirmPassword, role } = formData;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    if (!nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    if (!email.trim()) {
      setError('El correo electrónico es requerido');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Ingrese un correo electrónico válido');
      return false;
    }
    if (!password) {
      setError('La contraseña es requerida');
      return false;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        nombre,
        email,
        password,
        role,
      });

      if (response.status === 201) {
        navigate('/login', {
          state: { message: 'Registro exitoso. Por favor inicia sesión.' },
        });
      }
    } catch (err) {
      if (err.response?.status === 409) {
        setError('El correo electrónico ya está registrado');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Error de conexión. Intente nuevamente.');
      }
      console.error('Register error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mt-5" aria-label="Formulario de registro">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <article className="card shadow">
            <header className="card-header bg-dark text-white text-center">
              <h1 className="h4 mb-0">Registrarse</h1>
            </header>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="nombre" className="form-label">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="nombre"
                    name="nombre"
                    value={nombre}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                    required
                    autoFocus
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={email}
                    onChange={handleChange}
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                  <small className="form-text text-muted">
                    Mínimo 8 caracteres
                  </small>
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="role" className="form-label">
                    Rol
                  </label>
                  <select
                    className="form-select"
                    id="role"
                    name="role"
                    value={role}
                    onChange={handleChange}
                    required
                  >
                    <option value="user">Usuario</option>
                    <option value="technician">Técnico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Registrando...
                    </>
                  ) : (
                    'Registrarse'
                  )}
                </button>
              </form>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
