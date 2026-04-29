import { dispatchAction, ACTION_TYPES } from '../appDispatcher';

export function createIncident(incident) {
  dispatchAction(ACTION_TYPES.CREATE_INCIDENT, { incident });
}

export function updateIncident(id, changes) {
  dispatchAction(ACTION_TYPES.UPDATE_INCIDENT, { id, changes });
}

export function setIncidents(incidents) {
  dispatchAction(ACTION_TYPES.SET_INCIDENTS, { incidents });
}

export function setFilters(filters) {
  dispatchAction(ACTION_TYPES.SET_FILTERS, { filters });
}

// Async action to fetch incidents from API
export function fetchIncidents(filters = {}) {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const queryParams = new URLSearchParams();
      
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.priority) queryParams.append('priority', filters.priority);
      if (filters.page) queryParams.append('page', filters.page);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const response = await fetch(
        `${API_URL}/api/incidents?${queryParams.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch incidents');
      }

      const data = await response.json();
      setIncidents(data.data || data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
}

// Async action to create incident via API
export function submitIncident(incidentData) {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/incidents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });

      if (!response.ok) {
        throw new Error('Failed to create incident');
      }

      const data = await response.json();
      createIncident(data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
}

// Async action to update incident status via API
export function updateIncidentStatus(id, changes) {
  return async (dispatch) => {
    try {
      const token = localStorage.getItem('access_token');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/incidents/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changes),
      });

      if (!response.ok) {
        throw new Error('Failed to update incident');
      }

      const data = await response.json();
      updateIncident(id, changes);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
}
