import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../stores/incidentStore';
import { fetchIncidents, setFilters } from '../actions/incidentActions';
import appDispatcher, { ACTION_TYPES } from '../appDispatcher';

const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Critical'];
const STATUS_OPTIONS = ['Nueva', 'Asignada', 'En Progreso', 'Resuelta', 'Cerrada'];
const LIMIT_OPTIONS = [5, 10, 20, 50];

export default function IncidentList() {
  const { incidents, filters, total } = useIncidentStore();
  const [loading, setLoading] = useState(false);
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || '',
    priority: filters.priority || '',
    page: filters.page || 1,
    limit: filters.limit || 10,
  });
  const navigate = useNavigate();

  const loadIncidents = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams = {
        status: localFilters.status || undefined,
        priority: localFilters.priority || undefined,
        page: localFilters.page,
        limit: localFilters.limit,
      };
      await fetchIncidents(queryParams)(appDispatcher.emit);
    } catch (error) {
      console.error('Error loading incidents:', error);
    } finally {
      setLoading(false);
    }
  }, [localFilters]);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  const handleFilterChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value, page: field === 'page' ? value : 1 };
    setLocalFilters(newFilters);
    if (field !== 'page') {
      setFilters(newFilters);
    }
  };

  const handlePageChange = (newPage) => {
    handleFilterChange('page', newPage);
  };

  const handleSort = (field) => {
    // Simple client-side sorting for now
    const sorted = [...incidents].sort((a, b) => {
      if (field === 'created_at') {
        return new Date(b[field]) - new Date(a[field]);
      }
      return a[field]?.localeCompare(b[field] || '');
    });
    appDispatcher.emit(ACTION_TYPES.SET_INCIDENTS, { incidents: sorted });
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

  const getPriorityBadgeClass = (priority) => {
    const classes = {
      'Critical': 'bg-danger',
      'High': 'bg-warning',
      'Normal': 'bg-primary',
      'Low': 'bg-success',
    };
    return classes[priority] || 'bg-secondary';
  };

  const totalPages = Math.ceil(total / localFilters.limit) || 1;

  return (
    <section aria-label="Lista de Incidencias">
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
              className="nav-link btn btn-link active"
              onClick={() => navigate('/incidents')}
            >
              Incidencias
            </button>
          </div>
          <div className="navbar-nav">
            <button
              className="btn btn-primary btn-sm"
              onClick={() => navigate('/incidents/new')}
            >
              Nueva Incidencia
            </button>
          </div>
        </div>
      </nav>

      <div className="container-fluid">
        {/* Filters */}
        <section aria-label="Filtros" className="mb-4">
          <div className="card">
            <header className="card-header">
              <h2 className="h6 mb-0">Filtros</h2>
            </header>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3">
                  <label htmlFor="filter-status" className="form-label">
                    Estado
                  </label>
                  <select
                    id="filter-status"
                    className="form-select"
                    value={localFilters.status}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="">Todos</option>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="filter-priority" className="form-label">
                    Prioridad
                  </label>
                  <select
                    id="filter-priority"
                    className="form-select"
                    value={localFilters.priority}
                    onChange={(e) => handleFilterChange('priority', e.target.value)}
                  >
                    <option value="">Todas</option>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label htmlFor="filter-limit" className="form-label">
                    Por página
                  </label>
                  <select
                    id="filter-limit"
                    className="form-select"
                    value={localFilters.limit}
                    onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
                  >
                    {LIMIT_OPTIONS.map((limit) => (
                      <option key={limit} value={limit}>
                        {limit}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3 d-flex align-items-end">
                  <button
                    className="btn btn-secondary w-100"
                    onClick={() => {
                      setLocalFilters({ status: '', priority: '', page: 1, limit: 10 });
                      setFilters({ status: '', priority: '', page: 1, limit: 10 });
                    }}
                  >
                    Limpiar Filtros
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Incidents Table */}
        <section aria-label="Tabla de Incidencias">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Cargando...</span>
              </div>
            </div>
          ) : incidents.length === 0 ? (
            <div className="alert alert-info" role="alert">
              No se encontraron incidencias con los filtros seleccionados.
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-dark">
                    <tr>
                      <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('id')}>
                        # <i className="bi bi-arrow-down-up"></i>
                      </th>
                      <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('title')}>
                        Título <i className="bi bi-arrow-down-up"></i>
                      </th>
                      <th scope="col">Estado</th>
                      <th scope="col">Prioridad</th>
                      <th scope="col">Tipo</th>
                      <th scope="col" style={{ cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                        Fecha <i className="bi bi-arrow-down-up"></i>
                      </th>
                      <th scope="col">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {incidents.map((incident) => (
                      <tr key={incident.id}>
                        <th scope="row">{incident.id}</th>
                        <td>{incident.title}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(incident.status)}`}>
                            {incident.status}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getPriorityBadgeClass(incident.priority)}`}>
                            {incident.priority}
                          </span>
                        </td>
                        <td>{incident.type}</td>
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

              {/* Pagination */}
              <nav aria-label="Navegación de páginas">
                <ul className="pagination justify-content-center">
                  <li className={`page-item ${localFilters.page <= 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(localFilters.page - 1)}
                      disabled={localFilters.page <= 1}
                    >
                      Anterior
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li key={i + 1} className={`page-item ${localFilters.page === i + 1 ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${localFilters.page >= totalPages ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(localFilters.page + 1)}
                      disabled={localFilters.page >= totalPages}
                    >
                      Siguiente
                    </button>
                  </li>
                </ul>
              </nav>
              <p className="text-center text-muted">
                Mostrando {incidents.length} de {total} incidencias
              </p>
            </>
          )}
        </section>
      </div>
    </section>
  );
}
