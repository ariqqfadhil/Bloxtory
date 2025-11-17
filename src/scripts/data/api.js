const BASE_URL = "https://story-api.dicoding.dev/v1";
const TOKEN_KEY = "dicoding_token";

const StoryApi = {
  _getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  },

  _getHeaders() {
    const token = this._getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },

  async getStories({ location = 1 } = {}) {
    try {
      const response = await fetch(`${BASE_URL}/stories?location=${location}`, {
        headers: this._getHeaders(),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.message || `HTTP ${response.status}`);
      }

      const { listStory = [] } = await response.json();

      return listStory.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        photoUrl: item.photoUrl,
        lat: item.lat,
        lon: item.lon,
        createdAt: item.createdAt,
      }));
    } catch (error) {
      console.error("❌ Error fetching stories:", error);
      throw error;
    }
  },

  async addStory({ description, photo, lat, lon }) {
    const token = this._getToken();
    if (!token) {
      throw new Error("Authentication required. Please login first.");
    }

    if (!description?.trim()) {
      throw new Error("Description is required");
    }

    if (!photo) {
      throw new Error("Photo is required");
    }

    try {
      const formData = new FormData();
      formData.append("description", description.trim());
      formData.append("photo", photo);
      if (lat) formData.append("lat", lat);
      if (lon) formData.append("lon", lon);

      const response = await fetch(`${BASE_URL}/stories`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("❌ Error adding story:", error);
      throw error;
    }
  },
};

export default StoryApi;
