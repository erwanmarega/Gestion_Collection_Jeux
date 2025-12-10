import { ref, computed } from 'vue';
import api from '../services/api';

const user = ref(null);
const token = ref(localStorage.getItem('token'));

export function useAuth() {
  const isAuthenticated = computed(() => !!token.value);

  const register = async (userData) => {
    try {
      const response = await api.register(userData);
      user.value = response.user;
      token.value = response.token;
      return response;
    } catch (error) {
      throw error;
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.login(credentials);
      user.value = response.user;
      token.value = response.token;
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    api.logout();
    user.value = null;
    token.value = null;
  };

  return {
    user,
    token,
    isAuthenticated,
    register,
    login,
    logout,
  };
}
