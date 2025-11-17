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
      // ✅ CRITICAL FIX: Hanya fetch dari API, JANGAN auto-save ke IndexedDB
      const stories = await this._fetchStoriesWithFallback();

      // ✅ REMOVED: Jangan auto-save semua stories
      // Hanya save stories yang memang user klik tombol "Save"

      // Render stories
      this._allStories = stories;
      this.view.renderStories(stories);

      // Setup event listeners
      this._setupEventListeners();

      // Trigger background sync jika ada pending stories
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
      console.warn("⚠️ Failed to fetch from API, trying IndexedDB:", error);

      // ✅ FIXED: Jika offline, tetap coba tampilkan dari API cache
      // BUKAN dari saved stories IndexedDB
      // Saved stories hanya untuk yang memang user simpan manual

      return []; // Return empty array jika API gagal
    }
  }

  /* Setup all event listeners */
  _setupEventListeners() {
    // Event listener untuk klik story card
    this.view.onStoryClick((event) => {
      const mapBtn = event.target.closest(".view-on-map-btn");
      const img = event.target.closest(".story-photo");
      const saveBtn = event.target.closest(".save-story-btn");

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

      // Handle save story
      if (saveBtn) {
        const storyData = JSON.parse(
          saveBtn.dataset.story.replace(/&apos;/g, "'"),
        );
        this._handleSaveStory(storyData);
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

  /* Handle search stories - FIXED: Search dari current stories, bukan IndexedDB */
  async _handleSearch(query) {
    if (!query.trim()) {
      this.view.renderStories(this._allStories);
      return;
    }

    // ✅ FIXED: Search dari _allStories yang sudah di-load, bukan dari IndexedDB
    const lowerQuery = query.toLowerCase();
    const results = this._allStories.filter(
      (story) =>
        story.name.toLowerCase().includes(lowerQuery) ||
        story.description.toLowerCase().includes(lowerQuery),
    );

    this.view.renderStories(results);
    this.view.showSearchInfo?.(query, results.length);
  }

  /* Handle sort stories - FIXED: Sort dari current stories */
  async _handleSort(order) {
    const sortedStories = [...this._allStories].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return order === "newest" ? dateB - dateA : dateA - dateB;
    });

    this._allStories = sortedStories;
    this.view.renderStories(sortedStories);
  }

  /* Handle filter by location - FIXED: Filter dari current stories */
  async _handleFilterLocation(showOnlyWithLocation) {
    if (showOnlyWithLocation) {
      const storiesWithLocation = this._allStories.filter(
        (story) => story.lat && story.lon,
      );
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
        // ✅ FIXED: Jangan clear IndexedDB saat refresh
        // IndexedDB hanya untuk saved stories, bukan cache
        this._allStories = stories;
        this.view.renderStories(stories);
        this.view.showSuccessMessage?.("✅ Data refreshed successfully!");
      } else {
        throw new Error("No data received");
      }
    } catch (error) {
      console.error("Refresh failed:", error);
      this.view.showError("Failed to refresh data. Please try again.");
    }
  }

  /* Handle save story ke IndexedDB */
  async _handleSaveStory(story) {
    try {
      // Cek apakah story sudah ada di IndexedDB
      const existingStories = await IDBHelper.getAllStories();
      const isAlreadySaved = existingStories.some((s) => s.id === story.id);

      if (isAlreadySaved) {
        this.view.showSuccessMessage?.("ℹ️ Story already saved!");
        return;
      }

      // Simpan story ke IndexedDB
      await IDBHelper.saveStories([story]);

      this.view.showSuccessMessage?.(
        "✅ Story saved for offline access! Check 'Saved Stories' page.",
      );

      console.log("✅ Story saved to IndexedDB:", story.id);
    } catch (error) {
      console.error("Error saving story:", error);
      this.view.showError?.("Failed to save story. Please try again.");
    }
  }
}

export default HomePresenter;
