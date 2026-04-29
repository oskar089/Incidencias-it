import mitt from 'mitt';

// Create the event emitter instance for Flux dispatcher
const appDispatcher = mitt();

// Dispatch action helper - wraps the emit to provide consistent action dispatching
export function dispatchAction(type, payload = {}) {
  appDispatcher.emit(type, payload);
}

// Subscribe to action helper - wraps the on listener
export function subscribeToAction(type, handler) {
  appDispatcher.on(type, handler);
  // Return unsubscribe function
  return () => appDispatcher.off(type, handler);
}

// Dispatcher constants for action types (from design document)
export const ACTION_TYPES = {
  // Auth Actions
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGOUT: 'LOGOUT',
  
  // Incident Actions
  CREATE_INCIDENT: 'CREATE_INCIDENT',
  UPDATE_INCIDENT: 'UPDATE_INCIDENT',
  SET_INCIDENTS: 'SET_INCIDENTS',
  SET_FILTERS: 'SET_FILTERS',
};

export default appDispatcher;
