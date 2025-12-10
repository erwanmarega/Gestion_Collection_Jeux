const API_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  getToken() {
    return this.token || localStorage.getItem('token');
  }

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    this.setToken(data.token);
    return data;
  }

  logout() {
    this.setToken(null);
  }

  // Games
  async getGames(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/games?${queryParams}` : '/games';
    return this.request(endpoint);
  }

  async getGame(id) {
    return this.request(`/games/${id}`);
  }

  async createGame(gameData) {
    return this.request('/games', {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  async updateGame(id, gameData) {
    return this.request(`/games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    });
  }

  async deleteGame(id) {
    return this.request(`/games/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleFavorite(id) {
    return this.request(`/games/${id}/favorite`, {
      method: 'POST',
    });
  }

  async getStats() {
    return this.request('/stats');
  }
}

export default new ApiService();
