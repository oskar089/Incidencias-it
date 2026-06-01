import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  admin: 'Administrador',
  tecnico: 'Técnico',
  visor: 'Usuario',
};

const ROLE_BADGES = {
  admin: 'bg-danger',
  tecnico: 'bg-primary',
  visor: 'bg-secondary',
};

export default function AdminUsers() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    role: 'tecnico',
  });
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await adminAPI.listUsers();
      setUsers(response.data.users);
    } catch (err) {
      setError('Error al cargar usuarios');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return;
    }
    if (!formData.email.trim()) {
      setError('El correo es requerido');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Ingrese un correo válido');
      return;
    }
    if (formData.password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSubmitting(true);
    try {
      await adminAPI.createUser(formData);
      setSuccess(`Usuario ${formData.email} creado correctamente`);
      setFormData({ nombre: '', email: '', password: '', role: 'tecnico' });
      setShowForm(false);
      loadUsers();
    } catch (err) {
      if (err.response?.status === 409) {
        setError('El correo ya está registrado');
      } else {
        setError(err.response?.data?.error || 'Error al crear usuario');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (targetUser) => {
    if (!window.confirm(`¿Estás seguro de eliminar al usuario ${targetUser.username}?`)) {
      return;
    }

    setError('');
    setSuccess('');
    setDeletingId(targetUser.id);

    try {
      await adminAPI.deleteUser(targetUser.id);
      setSuccess(`Usuario ${targetUser.username} eliminado correctamente`);
      loadUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al eliminar usuario');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <section aria-label="Administración de Usuarios">
      {/* Navigation Header */}
      <nav className="navbar navbar-expand navbar-dark bg-dark mb-4" role="navigation">
        <div className="container-fluid">
          <a className="navbar-brand" href="/dashboard">Incidencias IT</a>
          <div className="navbar-nav me-auto">
            <button
              className="nav-link btn btn-link"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </button>
            <button
              className="nav-link btn btn-link"
              onClick={() => navigate('/incidents')}
            >
              Incidencias
            </button>
            {user?.role === 'admin' && (
              <button
                className="nav-link btn btn-link active"
                onClick={() => navigate('/admin/users')}
              >
                Usuarios
              </button>
            )}
          </div>
          <div className="navbar-nav">
            <span className="navbar-text me-3">
              {user?.nombre || user?.email}
              {user?.role && (
                <span className="badge bg-info ms-2">{user.role}</span>
              )}
            </span>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={handleLogout}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="h4 mb-0">Gestión de Usuarios</h2>
        <button
          className="btn btn-success"
          onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {/* Create user form */}
      {showForm && (
        <article className="card shadow-sm mb-4 border-success">
          <header className="card-header bg-success text-white">
            <h3 className="h6 mb-0">Crear Nuevo Usuario</h3>
          </header>
          <div className="card-body">
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-md-4">
                  <label htmlFor="nombre" className="form-label">Nombre Completo</label>
                  <input
                    type="text"
                    className="form-control"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
                <div className="col-md-4">
                  <label htmlFor="email" className="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="password" className="form-label">Contraseña</label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    required
                    minLength={8}
                  />
                </div>
                <div className="col-md-2">
                  <label htmlFor="role" className="form-label">Rol</label>
                  <select
                    className="form-select"
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="tecnico">Técnico</option>
                    <option value="visor">Usuario</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                <button type="submit" className="btn btn-success" disabled={submitting}>
                  {submitting ? 'Creando...' : 'Crear Usuario'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowForm(false)}>
                  Salir
                </button>
              </div>
            </form>
          </div>
        </article>
      )}

      {/* User list */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="alert alert-info">No hay usuarios registrados.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover">
            <thead className="table-dark">
              <tr>
                <th scope="col">#</th>
                <th scope="col">Email</th>
                <th scope="col">Rol</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className={u.username === user?.email ? 'table-active' : ''}>
                  <th scope="row">{u.id}</th>
                  <td>
                    {u.username}
                    {u.username === user?.email && (
                      <span className="badge bg-info ms-2">Tú</span>
                    )}
                  </td>
                  <td>
                    <span className={`badge ${ROLE_BADGES[u.role] || 'bg-secondary'}`}>
                      {ROLE_LABELS[u.role] || u.role}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(u)}
                      disabled={u.username === user?.email || deletingId === u.id}
                    >
                      {deletingId === u.id ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                          Eliminando...
                        </>
                      ) : (
                        'Eliminar'
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </section>
  );
}
