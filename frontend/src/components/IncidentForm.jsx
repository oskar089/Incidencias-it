import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitIncident } from '../actions/incidentActions';
import appDispatcher, { ACTION_TYPES } from '../appDispatcher';

const INCIDENT_TYPES = [
  'Hardware',
  'Software',
  'Red',
  'Impresora',
  'Email',
  'Acceso',
  'Otro',
];

const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Critical'];

const DEPARTMENTS = [
  'IT',
  'Contabilidad',
  'Ventas',
  'RRHH',
  'Operaciones',
  'General',
];

export default function IncidentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    priority: 'Normal',
    department: '',
    equipo: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es requerido';
    } else if (formData.title.length < 5) {
      newErrors.title = 'El título debe tener al menos 5 caracteres';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!formData.type) {
      newErrors.type = 'Seleccione un tipo de incidencia';
    }

    if (!formData.department) {
      newErrors.department = 'Seleccione un departamento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await submitIncident(formData)(appDispatcher.emit);

      if (result.success) {
        // Dispatch action to update store
        appDispatcher.emit(ACTION_TYPES.CREATE_INCIDENT, {
          incident: result.data,
        });
        navigate('/incidents');
      } else {
        setSubmitError(result.error || 'Error al crear la incidencia');
      }
    } catch (error) {
      setSubmitError('Error de conexión. Intente nuevamente.');
      console.error('Submit incident error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section aria-label="Formulario de Incidencia">
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
        <article className="card shadow">
          <header className="card-header">
            <h1 className="h4 mb-0">Nueva Incidencia</h1>
          </header>
          <div className="card-body">
            {submitError && (
              <div className="alert alert-danger" role="alert">
                {submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="row">
                {/* Title */}
                <div className="col-md-8 mb-3">
                  <label htmlFor="title" className="form-label">
                    Título *
                  </label>
                  <input
                    type="text"
                    className={`form-control ${errors.title ? 'is-invalid' : ''}`}
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Describa brevemente el problema"
                    required
                    autoFocus
                  />
                  {errors.title && (
                    <div className="invalid-feedback">{errors.title}</div>
                  )}
                </div>

                {/* Priority */}
                <div className="col-md-4 mb-3">
                  <label htmlFor="priority" className="form-label">
                    Prioridad
                  </label>
                  <select
                    className="form-select"
                    id="priority"
                    name="priority"
                    value={formData.priority}
                    onChange={handleChange}
                  >
                    {PRIORITY_OPTIONS.map((priority) => (
                      <option key={priority} value={priority}>
                        {priority}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type and Department */}
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="type" className="form-label">
                    Tipo de Incidencia *
                  </label>
                  <select
                    className={`form-select ${errors.type ? 'is-invalid' : ''}`}
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione un tipo...</option>
                    {INCIDENT_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.type && (
                    <div className="invalid-feedback">{errors.type}</div>
                  )}
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="department" className="form-label">
                    Departamento *
                  </label>
                  <select
                    className={`form-select ${errors.department ? 'is-invalid' : ''}`}
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Seleccione un departamento...</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                  {errors.department && (
                    <div className="invalid-feedback">{errors.department}</div>
                  )}
                </div>
              </div>

              {/* Equipment */}
              <div className="mb-3">
                <label htmlFor="equipo" className="form-label">
                  Equipo (Opcional)
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="equipo"
                  name="equipo"
                  value={formData.equipo}
                  onChange={handleChange}
                  placeholder="Número de serie, nombre del equipo, etc."
                />
                <small className="form-text text-muted">
                  Identificación del equipo relacionado con la incidencia
                </small>
              </div>

              {/* Description */}
              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Descripción *
                </label>
                <textarea
                  className={`form-control ${errors.description ? 'is-invalid' : ''}`}
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Describa detalladamente el problema encontrado..."
                  required
                ></textarea>
                {errors.description && (
                  <div className="invalid-feedback">{errors.description}</div>
                )}
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/incidents')}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Guardando...
                    </>
                  ) : (
                    'Crear Incidencia'
                  )}
                </button>
              </div>
            </form>
          </div>
        </article>
      </div>
    </section>
  );
}
