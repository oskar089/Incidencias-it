import appDispatcher, { ACTION_TYPES } from '../appDispatcher';
import { useSyncExternalStore } from 'react';

// Incident store state
let incidentState = {
  incidents: [],
  filters: {
    status: '',
    priority: '',
    page: 1,
    limit: 10,
  },
  total: 0,
  loading: false,
};

const listeners = new Set();

function updateIncidentState(newState) {
  incidentState = { ...incidentState, ...newState };
  listeners.forEach(listener => listener());
}

// Handle dispatched actions
appDispatcher.on(ACTION_TYPES.CREATE_INCIDENT, ({ incident }) => {
  updateIncidentState({
    incidents: [...incidentState.incidents, incident],
  });
});

appDispatcher.on(ACTION_TYPES.UPDATE_INCIDENT, ({ id, changes }) => {
  const updatedIncidents = incidentState.incidents.map(incident =>
    incident.id === id ? { ...incident, ...changes } : incident
  );
  updateIncidentState({ incidents: updatedIncidents });
});

appDispatcher.on(ACTION_TYPES.SET_INCIDENTS, ({ incidents }) => {
  updateIncidentState({ incidents });
});

appDispatcher.on(ACTION_TYPES.SET_FILTERS, ({ filters }) => {
  updateIncidentState({
    filters: { ...incidentState.filters, ...filters },
  });
});

// Subscribe function for useSyncExternalStore
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Get current state
function getSnapshot() {
  return incidentState;
}

// React hook for using incident store
export function useIncidentStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return state;
}

// Get incidents as array (for components that need the list)
export function getIncidents() {
  return incidentState.incidents;
}

// Get current filters
export function getFilters() {
  return incidentState.filters;
}

export default { useIncidentStore, getSnapshot, subscribe, getIncidents, getFilters };
