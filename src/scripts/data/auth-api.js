const BASE_URL = "https://story-api.dicoding.dev/v1";

const AuthApi = {
  async register({ name, email, password }) {
    try {
      const response = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      // API mungkin mengembalikan status error
      if (!response.ok) {
        throw new Error(data.message || "Register failed");
      }

      return data;
    } catch (error) {
      throw error;
    }
  },

  async login({ email, password }) {
    try {
      const response = await fetch(`${BASE_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Login failed");
      }

      // Data tipikal: { loginResult: { userId, name, token } }
      return data;
    } catch (error) {
      throw error;
    }
  },
};

export default AuthApi;
