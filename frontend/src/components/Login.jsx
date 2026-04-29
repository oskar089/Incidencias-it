import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { performLogin } from '../actions/authActions';
import appDispatcher, { ACTION_TYPES } from '../appDispatcher';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validateForm = () => {
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
      const result = await performLogin(email, password)(appDispatcher.emit);
      
      if (result.success) {
        // Update AuthContext
        login(result.data.user, result.data.access_token);
        
        // Dispatch action to update stores
        appDispatcher.emit(ACTION_TYPES.LOGIN_SUCCESS, {
          user: result.data.user,
          token: result.data.access_token,
        });

        // Redirect to dashboard
        navigate('/dashboard');
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="container mt-5" aria-label="Formulario de inicio de sesión">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-4">
          <article className="card shadow">
            <header className="card-header bg-dark text-white text-center">
              <h1 className="h4 mb-0">Iniciar Sesión</h1>
            </header>
            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ejemplo.com"
                    required
                    autoFocus
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <small className="form-text text-muted">
                    Mínimo 8 caracteres
                  </small>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Iniciando...
                    </>
                  ) : (
                    'Iniciar Sesión'
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
