import { dispatchAction, ACTION_TYPES } from '../appDispatcher';

export function loginSuccess(user, token) {
  dispatchAction(ACTION_TYPES.LOGIN_SUCCESS, { user, token });
}

export function logout() {
  dispatchAction(ACTION_TYPES.LOGOUT);
}

// Async action for login API call
export function performLogin(email, password) {
  return async (dispatch) => {
    try {
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await response.json();
      loginSuccess(data.user, data.access_token);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };
}
