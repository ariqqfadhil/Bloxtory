import StoryApi from "../data/api";
import IDBHelper from "../utils/idb-helper";
import BackgroundSync from "../utils/background-sync";

class HomePresenter {
  constructor({ view, model = StoryApi }) {
    this.view = view;
    this.model = model;
    this._allStories = [];

    this._init();
  }

  async _init() {
    this.view.showLoading();

    try {
      const stories = await this._fetchStoriesWithFallback();

      // 2. Simpan ke IndexedDB
      if (stories.length > 0) {
        await IDBHelper.saveStories(stories);
      }

      // 3. Render stories
      this._allStories = stories;
      this.view.renderStories(stories);

      // 4. Setup event listeners
      this._setupEventListeners();

      // 5. Trigger background sync jika ada pending stories
      if (navigator.onLine) {
        BackgroundSync.syncPendingStories();
      }
    } catch (error) {
      console.error(error);
      this.view.showError(
        "An error occurred while loading the story. Please try again later.",
      );
    }
  }

  /* Fetch stories dengan fallback ke IndexedDB jika offline */
  async _fetchStoriesWithFallback() {
    try {
      // Coba ambil dari API
      const apiStories = await this.model.getStories({ location: 1 });

      if (apiStories.length > 0) {
        console.log("✅ Stories loaded from API");
        return apiStories;
      }

      // Jika API tidak return data, fallback ke IndexedDB
      throw new Error("No data from API");
    } catch (error) {
      console.warn("⚠️ Failed to fetch from API, using IndexedDB:", error);

      // Fallback: ambil dari IndexedDB
      const cachedStories = await IDBHelper.getAllStories();

      if (cachedStories.length > 0) {
        console.log("✅ Stories loaded from IndexedDB (offline mode)");
        this.view.showOfflineIndicator?.(); // Optional method
        return cachedStories;
      }

      return [];
    }
  }

  /* Setup all event listeners */
  _setupEventListeners() {
    // Event listener untuk klik story card
    this.view.onStoryClick((event) => {
      const mapBtn = event.target.closest(".view-on-map-btn");
      const img = event.target.closest(".story-photo");
      const deleteBtn = event.target.closest(".delete-story-btn");

      if (mapBtn) {
        const lat = mapBtn.dataset.lat;
        const lon = mapBtn.dataset.lon;
        window.location.hash = `#/map?lat=${lat}&lon=${lon}`;
        return;
      }

      if (img) {
        this.view.showImageOverlay(img.src, img.alt);
        return;
      }

      // Delete story
      if (deleteBtn) {
        const storyId = deleteBtn.dataset.id;
        this._handleDeleteStory(storyId);
        return;
      }
    });

    // Setup filter, sort, search listeners
    this._setupFilterListeners();
  }

  /* Setup filter, sort, dan search */
  _setupFilterListeners() {
    const searchInput = document.querySelector("#searchStory");
    const sortSelect = document.querySelector("#sortStories");
    const filterLocation = document.querySelector("#filterLocation");
    const refreshBtn = document.querySelector("#refreshStories");

    // Search
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this._handleSearch(e.target.value);
      });
    }

    // Sort
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        this._handleSort(e.target.value);
      });
    }

    // Filter by location
    if (filterLocation) {
      filterLocation.addEventListener("change", (e) => {
        this._handleFilterLocation(e.target.checked);
      });
    }

    // Refresh from API
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => {
        this._handleRefresh();
      });
    }
  }

  /* Handle search stories */
  async _handleSearch(query) {
    if (!query.trim()) {
      // Jika kosong, tampilkan semua
      this.view.renderStories(this._allStories);
      return;
    }

    const results = await IDBHelper.searchStories(query);
    this.view.renderStories(results);
    this.view.showSearchInfo?.(query, results.length);
  }

  /* Handle sort stories */
  async _handleSort(order) {
    const sortedStories = await IDBHelper.sortStoriesByDate(order);
    this._allStories = sortedStories;
    this.view.renderStories(sortedStories);
  }

  /* Handle filter by location */
  async _handleFilterLocation(showOnlyWithLocation) {
    if (showOnlyWithLocation) {
      const storiesWithLocation = await IDBHelper.getStoriesWithLocation();
      this.view.renderStories(storiesWithLocation);
    } else {
      this.view.renderStories(this._allStories);
    }
  }

  /* Handle refresh data dari API */
  async _handleRefresh() {
    this.view.showLoading();

    try {
      const stories = await this.model.getStories({ location: 1 });

      if (stories.length > 0) {
        // Clear IndexedDB dan simpan data baru
        await IDBHelper.clearAllStories();
        await IDBHelper.saveStories(stories);
        this._allStories = stories;
        this.view.renderStories(stories);
        this.view.showSuccessMessage?.("✅ Data refreshed successfully!");
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      console.error("Refresh failed:", error);
      this.view.showError("Failed to refresh data. Using cached data.");

      // Tampilkan data dari IndexedDB
      const cachedStories = await IDBHelper.getAllStories();
      this._allStories = cachedStories;
      this.view.renderStories(cachedStories);
    }
  }

  /* Handle delete story */
  async _handleDeleteStory(storyId) {
    const confirmed = confirm("Are you sure you want to delete this story?");
    if (!confirmed) return;

    try {
      // Hapus dari IndexedDB
      await IDBHelper.deleteStory(storyId);

      // Update tampilan
      this._allStories = this._allStories.filter(
        (story) => story.id !== storyId,
      );
      this.view.renderStories(this._allStories);

      this.view.showSuccessMessage?.("✅ Story deleted successfully!");
    } catch (error) {
      console.error("Delete failed:", error);
      this.view.showError("Failed to delete story. Please try again.");
    }
  }
}

export default HomePresenter;
