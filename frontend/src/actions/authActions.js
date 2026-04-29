import { dispatchAction, ACTION_TYPES } from '../appDispatcher';
import { authAPI } from '../services/api';

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
      const response = await authAPI.login({ email, password });
      const data = response.data;
      loginSuccess(data.user, data.access_token);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  };
}
