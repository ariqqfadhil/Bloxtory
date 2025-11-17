const BASE_URL = "https://story-api.dicoding.dev/v1";
const TOKEN_KEY = "dicoding_token";

const StoryApi = {
  _getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  },

  async getStories({ location = 1 } = {}) {
    try {
      const token = this._getToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const response = await fetch(`${BASE_URL}/stories?location=${location}`, {
        headers,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message || "Fetch stories failed");
      }

      const { listStory = [] } = json;

      const stories = listStory.map((item) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        photoUrl: item.photoUrl,
        lat: item.lat,
        lon: item.lon,
        createdAt: item.createdAt,
      }));

      return stories;
    } catch (error) {
      console.error(error);
      return [];
    }
  },

  // Tambahan method untuk mengirim story baru (POST)
  async addStory({ description, photo, lat, lon }) {
    try {
      const token = this._getToken();
      if (!token)
        throw new Error(
          "Token tidak ditemukan. Silakan login terlebih dahulu.",
        );

      const formData = new FormData();
      formData.append("description", description);
      formData.append("photo", photo);
      formData.append("lat", lat);
      formData.append("lon", lon);

      const response = await fetch(`${BASE_URL}/stories`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Gagal menambahkan story");
      }

      return result;
    } catch (error) {
      console.error("Error saat menambahkan story:", error);
      throw error;
    }
  },
};

export default StoryApi;
