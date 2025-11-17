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
      this._allStories = stories;
      this.view.renderStories(stories);
      this._setupEventListeners();

      if (navigator.onLine) {
        BackgroundSync.syncPendingStories();
      }
    } catch (error) {
      console.error("❌ Error loading stories:", error);
      this.view.showError(
        "Failed to load stories. Please check your connection and try again.",
      );
    }
  }

  async _fetchStoriesWithFallback() {
    try {
      const apiStories = await this.model.getStories({ location: 1 });
      console.log("✅ Stories loaded from API:", apiStories.length);
      return apiStories;
    } catch (error) {
      console.warn("⚠️ Failed to fetch from API:", error.message);
      return [];
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

  async _handleSearch(query) {
    const trimmedQuery = query.trim();
    
    if (!trimmedQuery) {
      this.view.renderStories(this._allStories);
      return;
    }

    const lowerQuery = trimmedQuery.toLowerCase();
    const results = this._allStories.filter(
      (story) =>
        story.name.toLowerCase().includes(lowerQuery) ||
        story.description.toLowerCase().includes(lowerQuery),
    );

    this.view.renderStories(results);
    this.view.showSearchInfo?.(trimmedQuery, results.length);
  }

  async _handleSort(order) {
    const sortedStories = [...this._allStories].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return order === "newest" ? dateB - dateA : dateA - dateB;
    });

    this._allStories = sortedStories;
    this.view.renderStories(sortedStories);
  }

  async _handleFilterLocation(showOnlyWithLocation) {
    const stories = showOnlyWithLocation
      ? this._allStories.filter((story) => story.lat && story.lon)
      : this._allStories;
    
    this.view.renderStories(stories);
  }

  async _handleRefresh() {
    this.view.showLoading();

    try {
      const stories = await this.model.getStories({ location: 1 });

      if (stories.length === 0) {
        throw new Error("No data received");
      }

      this._allStories = stories;
      this.view.renderStories(stories);
      this.view.showSuccessMessage?.("✅ Data refreshed successfully!");
    } catch (error) {
      console.error("❌ Refresh failed:", error);
      this.view.showError("Failed to refresh data. Please try again.");
    }
  }

  async _handleSaveStory(story) {
    try {
      const existingStories = await IDBHelper.getAllStories();
      const isAlreadySaved = existingStories.some((s) => s.id === story.id);

      if (isAlreadySaved) {
        this.view.showSuccessMessage?.("ℹ️ Story already saved!");
        return;
      }

      await IDBHelper.saveStories([story]);
      this.view.showSuccessMessage?.(
        "✅ Story saved for offline access! Check 'Saved Stories' page.",
      );
      console.log("✅ Story saved:", story.id);
    } catch (error) {
      console.error("❌ Error saving story:", error);
      this.view.showError?.("Failed to save story. Please try again.");
    }
  }
}

export default HomePresenter;
