import appDispatcher, { ACTION_TYPES } from '../appDispatcher';
import { useSyncExternalStore } from 'react';

// Auth store state
let authState = {
  user: null,
  isAuthenticated: false,
  role: null,
};

const listeners = new Set();

function updateAuthState(newState) {
  authState = { ...authState, ...newState };
  listeners.forEach(listener => listener());
}

// Handle dispatched actions
appDispatcher.on(ACTION_TYPES.LOGIN_SUCCESS, ({ user, token }) => {
  localStorage.setItem('access_token', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateAuthState({
    user,
    isAuthenticated: true,
    role: user.role,
  });
});

appDispatcher.on(ACTION_TYPES.LOGOUT, () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  updateAuthState({
    user: null,
    isAuthenticated: false,
    role: null,
  });
});

// Load initial state from localStorage
const token = localStorage.getItem('access_token');
const storedUser = localStorage.getItem('user');
if (token && storedUser) {
  try {
    const user = JSON.parse(storedUser);
    authState = {
      user,
      isAuthenticated: true,
      role: user.role,
    };
  } catch (e) {
    console.error('Failed to parse stored user:', e);
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
  }
}

// Subscribe function for useSyncExternalStore
function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Get current state
function getSnapshot() {
  return authState;
}

// React hook for using auth store
export function useAuthStore() {
  const state = useSyncExternalStore(subscribe, getSnapshot);
  return state;
}

export default { useAuthStore, getSnapshot, subscribe };
