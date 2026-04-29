import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useIncidentStore } from '../stores/incidentStore';
import { fetchIncidents } from '../actions/incidentActions';
import appDispatcher, { ACTION_TYPES } from '../appDispatcher';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { incidents, total } = useIncidentStore();
  const [stats, setStats] = useState({
    total: 0,
    nueva: 0,
    asignada: 0,
    enProgreso: 0,
    resuelta: 0,
    cerrada: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchIncidents({ page: 1, limit: 10 })(appDispatcher.emit);
      if (result.success) {
        // Calculate stats from incidents
        const fetchedIncidents = result.data?.data || incidents;
        calculateStats(fetchedIncidents);
      }
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  }, [incidents]);

  const calculateStats = (incidentList) => {
    const newStats = {
      total: incidentList.length,
      nueva: 0,
      asignada: 0,
      enProgreso: 0,
      resuelta: 0,
      cerrada: 0,
    };

    incidentList.forEach((inc) => {
      const status = inc.status?.toLowerCase().replace(' ', '') || '';
      if (newStats[status] !== undefined) {
        newStats[status]++;
      }
    });

    setStats(newStats);
  };

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  useEffect(() => {
    if (incidents.length > 0) {
      calculateStats(incidents);
    }
  }, [incidents]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      'Nueva': 'bg-warning',
      'Asignada': 'bg-info',
      'En Progreso': 'bg-primary',
      'Resuelta': 'bg-success',
      'Cerrada': 'bg-secondary',
    };
    return classes[status] || 'bg-secondary';
  };

  return (
    <section aria-label="Panel de Control">
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
        {/* Stats Cards */}
        <section aria-label="Estadísticas" className="mb-4">
          <h2 className="h5 mb-3">Resumen de Incidencias</h2>
          <div className="row g-3">
            <div className="col-6 col-md-2">
              <article className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="card-title h2">{stats.total}</h3>
                  <p className="card-text">Total</p>
                </div>
              </article>
            </div>
            <div className="col-6 col-md-2">
              <article className="card bg-warning">
                <div className="card-body text-center">
                  <h3 className="card-title h2">{stats.nueva}</h3>
                  <p className="card-text">Nuevas</p>
                </div>
              </article>
            </div>
            <div className="col-6 col-md-2">
              <article className="card bg-info text-white">
                <div className="card-body text-center">
                  <h3 className="card-title h2">{stats.asignada}</h3>
                  <p className="card-text">Asignadas</p>
                </div>
              </article>
            </div>
            <div className="col-6 col-md-2">
              <article className="card bg-primary text-white">
                <div className="card-body text-center">
                  <h3 className="card-title h2">{stats.enProgreso}</h3>
                  <p className="card-text">En Progreso</p>
                </div>
              </article>
            </div>
            <div className="col-6 col-md-2">
              <article className="card bg-success text-white">
                <div className="card-body text-center">
                  <h3 className="card-title h2">{stats.resuelta}</h3>
                  <p className="card-text">Resueltas</p>
                </div>
              </article>
            </div>
            <div className="col-6 col-md-2">
              <article className="card bg-secondary text-white">
                <div className="card-body text-center">
                  <h3 className="card-title h2">{stats.cerrada}</h3>
                  <p className="card-text">Cerradas</p>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Recent Incidents */}
        <section aria-label="Incidencias Recientes">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 mb-0">Incidencias Recientes</h2>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/incidents')}
            >
              Ver Todas
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="alert alert-info" role="alert">
              No hay incidencias registradas.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-dark">
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Título</th>
                    <th scope="col">Estado</th>
                    <th scope="col">Prioridad</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {incidents.slice(0, 5).map((incident) => (
                    <tr key={incident.id}>
                      <th scope="row">{incident.id}</th>
                      <td>{incident.title}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(incident.status)}`}>
                          {incident.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge bg-${incident.priority === 'High' || incident.priority === 'Critical' ? 'danger' : incident.priority === 'Normal' ? 'warning' : 'success'}`}>
                          {incident.priority}
                        </span>
                      </td>
                      <td>
                        {new Date(incident.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => navigate(`/incidents/${incident.id}`)}
                        >
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
