import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIncidentStore } from '../stores/incidentStore';
import { updateIncidentStatus } from '../actions/incidentActions';
import { fetchIncidents } from '../actions/incidentActions';
import appDispatcher, { ACTION_TYPES } from '../appDispatcher';

const STATUS_OPTIONS = ['Nueva', 'Asignada', 'En Progreso', 'Resuelta', 'Cerrada'];

export default function IncidentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { incidents } = useIncidentStore();
  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Find incident from store or fetch
  useEffect(() => {
    const found = incidents.find((inc) => inc.id === Number(id));
    if (found) {
      setIncident(found);
      setLoading(false);
    } else {
      // Fetch incidents if not in store
      loadIncident();
    }
  }, [id, incidents]);

  const loadIncident = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchIncidents({})(appDispatcher.emit);
      if (result.success) {
        const found = result.data?.data?.find((inc) => inc.id === Number(id));
        if (found) {
          setIncident(found);
        } else {
          setError('Incidencia no encontrada');
        }
      }
    } catch (err) {
      setError('Error al cargar la incidencia');
      console.error('Load incident error:', err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const result = await updateIncidentStatus(Number(id), { status: newStatus })(appDispatcher.emit);

      if (result.success) {
        // Update local state
        setIncident((prev) => ({ ...prev, status: newStatus }));
        setSuccess(`Estado actualizado a "${newStatus}"`);

        // Dispatch action to update store
        appDispatcher.emit(ACTION_TYPES.UPDATE_INCIDENT, {
          id: Number(id),
          changes: { status: newStatus },
        });

        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.error || 'Error al actualizar el estado');
      }
    } catch (err) {
      setError('Error de conexión. Intente nuevamente.');
      console.error('Update status error:', err);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddComment = () => {
    if (!newComment.trim()) {
      return;
    }

    const comment = {
      id: Date.now(), // Temporary ID
      content: newComment,
      created_at: new Date().toISOString(),
      user_id: JSON.parse(localStorage.getItem('user') || '{}').id,
    };

    setComments((prev) => [...prev, comment]);
    setNewComment('');

    // TODO: Implement API call to save comment
    // For now, just update locally
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

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
      </div>
    );
  }

  if (error && !incident) {
    return (
      <section aria-label="Error" className="container mt-5">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => navigate('/incidents')}
        >
          Volver a la lista
        </button>
      </section>
    );
  }

  if (!incident) {
    return null;
  }

  return (
    <section aria-label="Detalle de Incidencia">
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
        </div>
      </nav>

      <div className="container-fluid">
        {/* Success/Error Messages */}
        {success && (
          <div className="alert alert-success alert-dismissible fade show" role="alert">
            {success}
            <button
              type="button"
              className="btn-close"
              onClick={() => setSuccess('')}
            ></button>
          </div>
        )}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
            {error}
            <button
              type="button"
              className="btn-close"
              onClick={() => setError('')}
            ></button>
          </div>
        )}

        <div className="row">
          {/* Incident Details */}
          <div className="col-md-8">
            <article className="card shadow mb-4">
              <header className="card-header d-flex justify-content-between align-items-center">
                <h1 className="h4 mb-0">Incidencia #{incident.id}</h1>
                <span className={`badge ${getStatusBadgeClass(incident.status)} fs-6`}>
                  {incident.status}
                </span>
              </header>
              <div className="card-body">
                <h2 className="h5 mb-3">{incident.title}</h2>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Tipo:</strong> {incident.type}
                  </div>
                  <div className="col-md-6">
                    <strong>Prioridad:</strong>{' '}
                    <span className={`badge ${getPriorityBadgeClass(incident.priority)}`}>
                      {incident.priority}
                    </span>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <strong>Departamento:</strong> {incident.department}
                  </div>
                  <div className="col-md-6">
                    <strong>Equipo:</strong> {incident.equipo || 'N/A'}
                  </div>
                </div>

                <div className="mb-3">
                  <strong>Descripción:</strong>
                  <p className="mt-2">{incident.description}</p>
                </div>

                <div className="row text-muted small">
                  <div className="col-md-6">
                    <strong>Creado:</strong>{' '}
                    {new Date(incident.created_at).toLocaleString('es-ES')}
                  </div>
                  <div className="col-md-6">
                    <strong>Actualizado:</strong>{' '}
                    {new Date(incident.updated_at || incident.created_at).toLocaleString('es-ES')}
                  </div>
                </div>
              </div>
            </article>

            {/* Comments Section */}
            <section aria-label="Comentarios" className="card shadow">
              <header className="card-header">
                <h3 className="h5 mb-0">Comentarios</h3>
              </header>
              <div className="card-body">
                {/* Add Comment */}
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Agregar un comentario..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  ></textarea>
                  <button
                    className="btn btn-primary btn-sm mt-2"
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                  >
                    Agregar Comentario
                  </button>
                </div>

                {/* Comments List */}
                {comments.length === 0 ? (
                  <p className="text-muted">No hay comentarios aún.</p>
                ) : (
                  <div className="list-group">
                    {comments.map((comment) => (
                      <article key={comment.id} className="list-group-item">
                        <div className="d-flex justify-content-between">
                          <strong>Usuario #{comment.user_id}</strong>
                          <small className="text-muted">
                            {new Date(comment.created_at).toLocaleString('es-ES')}
                          </small>
                        </div>
                        <p className="mb-0 mt-2">{comment.content}</p>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar - Update Status */}
          <div className="col-md-4">
            <article className="card shadow">
              <header className="card-header">
                <h3 className="h5 mb-0">Actualizar Estado</h3>
              </header>
              <div className="card-body">
                <div className="mb-3">
                  <label htmlFor="status-select" className="form-label">
                    Cambiar estado a:
                  </label>
                  <select
                    className="form-select"
                    id="status-select"
                    value={incident.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updating}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                {updating && (
                  <div className="text-center">
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                    <span className="ms-2">Actualizando...</span>
                  </div>
                )}

                <div className="mt-3">
                  <h4 className="h6">Información:</h4>
                  <ul className="small text-muted">
                    <li>Cambiar a "Asignada" notificará al técnico vía SMS</li>
                    <li>Una vez "Resuelta", puede cambiar a "Cerrada"</li>
                    <li>Los cambios se guardan automáticamente</li>
                  </ul>
                </div>
              </div>
            </article>

            <div className="mt-3">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => navigate('/incidents')}
              >
                ← Volver a la lista
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
