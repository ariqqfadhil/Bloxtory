// src/scripts/pages/saved-stories/saved-stories-page.js
// ✅ NEW: Halaman khusus untuk menampilkan saved stories dari IndexedDB

import IDBHelper from "../../utils/idb-helper";

const SavedStoriesPage = {
  async render() {
    return `
      <section class="page fade saved-stories-page" id="savedStoriesPage">
        <div class="page-header">
          <h1>📦 Saved Stories</h1>
          <p>Stories saved in your browser for offline access</p>
        </div>

        <!-- Filter dan Search Controls -->
        <div class="story-controls">
          <div class="control-group">
            <label for="searchSavedStory">🔍 Search:</label>
            <input
              type="text"
              id="searchSavedStory"
              placeholder="Search saved stories..."
              aria-label="Search saved stories"
            />
          </div>

          <div class="control-group">
            <label for="sortSavedStories">📊 Sort:</label>
            <select id="sortSavedStories" aria-label="Sort saved stories">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <div class="control-group">
            <label>
              <input
                type="checkbox"
                id="filterSavedLocation"
                aria-label="Show only stories with location"
              />
              📍 With location only
            </label>
          </div>

          <div class="control-group">
            <button id="clearAllSaved" class="btn-danger" aria-label="Clear all saved stories">
              🗑️ Clear All
            </button>
          </div>
        </div>

        <!-- Info Area -->
        <div id="savedMessageArea" class="message-area" aria-live="polite"></div>

        <!-- Saved Stories List -->
        <div id="savedStoryList" class="story-list" aria-live="polite">
          <p class="loading">Loading saved stories...</p>
        </div>

        <!-- Pending Stories Section -->
        <div class="pending-section">
          <h2>⏳ Pending Sync</h2>
          <p class="info-text">Stories waiting to be uploaded when online</p>
          <div id="pendingStoryList" class="pending-list">
            <p class="loading">Checking pending stories...</p>
          </div>
        </div>
      </section>
    `;
  },

  async afterRender() {
    this._allStories = [];
    this._pendingStories = [];

    await this._loadSavedStories();
    await this._loadPendingStories();
    this._setupEventListeners();
  },

  async _loadSavedStories() {
    const listContainer = document.querySelector("#savedStoryList");
    const messageArea = document.querySelector("#savedMessageArea");

    try {
      const stories = await IDBHelper.getAllStories();
      this._allStories = stories;

      if (stories.length === 0) {
        listContainer.innerHTML = `
          <div class="empty-state">
            <p>📭 No saved stories yet</p>
            <p class="info-text">Stories you view will be saved here for offline access</p>
            <a href="#/home" class="btn-primary">Browse Stories</a>
          </div>
        `;
        return;
      }

      this._renderStories(stories);

      messageArea.innerHTML = `<p class="success-message">✅ Loaded ${stories.length} saved story/stories</p>`;
      setTimeout(() => (messageArea.innerHTML = ""), 3000);
    } catch (error) {
      console.error("Error loading saved stories:", error);
      listContainer.innerHTML = `<p class="error">Failed to load saved stories</p>`;
    }
  },

  async _loadPendingStories() {
    const pendingContainer = document.querySelector("#pendingStoryList");

    try {
      const pendingStories = await IDBHelper.getAllPendingStories();
      this._pendingStories = pendingStories;

      if (pendingStories.length === 0) {
        pendingContainer.innerHTML = `<p class="info-text">No pending stories</p>`;
        return;
      }

      const html = pendingStories
        .map(
          (story) => `
        <div class="pending-card" data-temp-id="${story.tempId}">
          <div class="pending-content">
            <p><strong>Description:</strong> ${story.description.substring(0, 50)}...</p>
            <small>Status: ${story.status || "pending"}</small>
            <small>Created: ${new Date(story.timestamp).toLocaleString("id-ID")}</small>
          </div>
          <button class="delete-pending-btn" data-temp-id="${story.tempId}">
            🗑️ Delete
          </button>
        </div>
      `,
        )
        .join("");

      pendingContainer.innerHTML = html;
    } catch (error) {
      console.error("Error loading pending stories:", error);
      pendingContainer.innerHTML = `<p class="error">Failed to load pending stories</p>`;
    }
  },

  _renderStories(stories) {
    const listContainer = document.querySelector("#savedStoryList");

    const html = stories
      .map(
        (story) => `
      <article class="story-card saved-card" data-story-id="${story.id}">
        <img 
          src="${story.photoUrl}" 
          alt="Photo by ${story.name}" 
          class="story-photo"
          loading="lazy"
          onerror="this.onerror=null; this.src='/images/bloxtory_logo.png';"
        />
        <div class="story-content">
          <h2>${story.name}</h2>
          <p class="story-desc">${story.description}</p>
          <small class="story-date">
            ${new Date(story.createdAt).toLocaleString("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </small>
          <div class="story-actions">
            ${
              story.lat && story.lon
                ? `
              <button class="view-on-map-btn" data-lat="${story.lat}" data-lon="${story.lon}">
                📍 View on Map
              </button>
            `
                : ""
            }
            <button class="delete-saved-btn" data-id="${story.id}">
              🗑️ Remove from Saved
            </button>
          </div>
        </div>
      </article>
    `,
      )
      .join("");

    listContainer.innerHTML = html;
  },

  _setupEventListeners() {
    const listContainer = document.querySelector("#savedStoryList");
    const pendingContainer = document.querySelector("#pendingStoryList");
    const searchInput = document.querySelector("#searchSavedStory");
    const sortSelect = document.querySelector("#sortSavedStories");
    const filterLocation = document.querySelector("#filterSavedLocation");
    const clearAllBtn = document.querySelector("#clearAllSaved");
    const messageArea = document.querySelector("#savedMessageArea");

    // Delete saved story
    listContainer.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest(".delete-saved-btn");
      const mapBtn = e.target.closest(".view-on-map-btn");

      if (deleteBtn) {
        const storyId = deleteBtn.dataset.id;
        await this._handleDeleteStory(storyId);
      }

      if (mapBtn) {
        const lat = mapBtn.dataset.lat;
        const lon = mapBtn.dataset.lon;
        window.location.hash = `#/map?lat=${lat}&lon=${lon}`;
      }
    });

    // Delete pending story
    pendingContainer.addEventListener("click", async (e) => {
      const deleteBtn = e.target.closest(".delete-pending-btn");
      if (deleteBtn) {
        const tempId = parseInt(deleteBtn.dataset.tempId);
        await this._handleDeletePending(tempId);
      }
    });

    // Search
    searchInput.addEventListener("input", async (e) => {
      const query = e.target.value;
      if (!query.trim()) {
        this._renderStories(this._allStories);
        return;
      }

      const results = await IDBHelper.searchStories(query);
      this._renderStories(results);

      messageArea.innerHTML = `<p class="info-message">Found ${results.length} story/stories</p>`;
      setTimeout(() => (messageArea.innerHTML = ""), 3000);
    });

    // Sort
    sortSelect.addEventListener("change", async (e) => {
      const sortedStories = await IDBHelper.sortStoriesByDate(e.target.value);
      this._allStories = sortedStories;
      this._renderStories(sortedStories);
    });

    // Filter by location
    filterLocation.addEventListener("change", async (e) => {
      if (e.target.checked) {
        const storiesWithLocation = await IDBHelper.getStoriesWithLocation();
        this._renderStories(storiesWithLocation);
      } else {
        this._renderStories(this._allStories);
      }
    });

    // Clear all saved stories
    clearAllBtn.addEventListener("click", async () => {
      const confirmed = confirm(
        "Are you sure you want to clear ALL saved stories? This cannot be undone!",
      );
      if (!confirmed) return;

      try {
        await IDBHelper.clearAllStories();
        this._allStories = [];
        await this._loadSavedStories();

        messageArea.innerHTML = `<p class="success-message">✅ All saved stories cleared</p>`;
        setTimeout(() => (messageArea.innerHTML = ""), 3000);
      } catch (error) {
        console.error("Error clearing stories:", error);
        messageArea.innerHTML = `<p class="error">Failed to clear stories</p>`;
      }
    });
  },

  async _handleDeleteStory(storyId) {
    const confirmed = confirm("Remove this story from saved list?");
    if (!confirmed) return;

    try {
      await IDBHelper.deleteStory(storyId);
      this._allStories = this._allStories.filter((s) => s.id !== storyId);
      this._renderStories(this._allStories);

      const messageArea = document.querySelector("#savedMessageArea");
      messageArea.innerHTML = `<p class="success-message">✅ Story removed from saved list</p>`;
      setTimeout(() => (messageArea.innerHTML = ""), 3000);
    } catch (error) {
      console.error("Error deleting story:", error);
      alert("Failed to delete story");
    }
  },

  async _handleDeletePending(tempId) {
    const confirmed = confirm("Delete this pending story?");
    if (!confirmed) return;

    try {
      await IDBHelper.deletePendingStory(tempId);
      this._pendingStories = this._pendingStories.filter(
        (s) => s.tempId !== tempId,
      );
      await this._loadPendingStories();

      const messageArea = document.querySelector("#savedMessageArea");
      messageArea.innerHTML = `<p class="success-message">✅ Pending story deleted</p>`;
      setTimeout(() => (messageArea.innerHTML = ""), 3000);
    } catch (error) {
      console.error("Error deleting pending story:", error);
      alert("Failed to delete pending story");
    }
  },
};

export default SavedStoriesPage;
