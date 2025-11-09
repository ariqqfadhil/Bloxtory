const DB_NAME = "bloxtory-db";
const DB_VERSION = 1;

// Object Stores
const STORES = {
  STORIES: "stories",
  PENDING_STORIES: "pending-stories",
};

class IDBHelper {
  constructor() {
    this._db = null;
  }

  /* Initialize dan buka koneksi database */
  async openDB() {
    if (this._db) return this._db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Error opening IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this._db = request.result;
        console.log("✅ IndexedDB opened successfully");
        resolve(this._db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store untuk stories yang sudah berhasil di-sync dari API
        if (!db.objectStoreNames.contains(STORES.STORIES)) {
          const storyStore = db.createObjectStore(STORES.STORIES, {
            keyPath: "id",
          });
          storyStore.createIndex("createdAt", "createdAt", { unique: false });
          storyStore.createIndex("name", "name", { unique: false });
          console.log("✅ Created 'stories' object store");
        }

        // Store untuk pending stories (belum ter-sync ke API)
        if (!db.objectStoreNames.contains(STORES.PENDING_STORIES)) {
          const pendingStore = db.createObjectStore(STORES.PENDING_STORIES, {
            keyPath: "tempId",
            autoIncrement: true,
          });
          pendingStore.createIndex("timestamp", "timestamp", { unique: false });
          console.log("✅ Created 'pending-stories' object store");
        }
      };
    });
  }

  // STORIES CRUD (Synced Stories)

  /* Simpan multiple stories ke IndexedDB (dari API) */
  async saveStories(stories) {
    const db = await this.openDB();
    const tx = db.transaction([STORES.STORIES], "readwrite");
    const store = tx.objectStore(STORES.STORIES);

    const promises = stories.map((story) => {
      return new Promise((resolve, reject) => {
        const request = store.put(story);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    });

    await Promise.all(promises);
    console.log(`✅ Saved ${stories.length} stories to IndexedDB`);
  }

  /* Ambil semua stories dari IndexedDB */
  async getAllStories() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.STORIES], "readonly");
      const store = tx.objectStore(STORES.STORIES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /* Hapus story berdasarkan ID */
  async deleteStory(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.STORIES], "readwrite");
      const store = tx.objectStore(STORES.STORIES);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log(`✅ Story ${id} deleted from IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /* Clear semua stories */
  async clearAllStories() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.STORIES], "readwrite");
      const store = tx.objectStore(STORES.STORIES);
      const request = store.clear();

      request.onsuccess = () => {
        console.log("✅ All stories cleared from IndexedDB");
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // PENDING STORIES (Background Sync Queue)

  /* Simpan story yang belum ter-sync (offline mode) */
  async savePendingStory(storyData) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PENDING_STORIES], "readwrite");
      const store = tx.objectStore(STORES.PENDING_STORIES);

      const pendingStory = {
        ...storyData,
        timestamp: Date.now(),
        status: "pending",
      };

      const request = store.add(pendingStory);

      request.onsuccess = () => {
        console.log("✅ Pending story saved to IndexedDB");
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /* Ambil semua pending stories */
  async getAllPendingStories() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PENDING_STORIES], "readonly");
      const store = tx.objectStore(STORES.PENDING_STORIES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /* Hapus pending story setelah berhasil di-sync */
  async deletePendingStory(tempId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PENDING_STORIES], "readwrite");
      const store = tx.objectStore(STORES.PENDING_STORIES);
      const request = store.delete(tempId);

      request.onsuccess = () => {
        console.log(`✅ Pending story ${tempId} deleted from IndexedDB`);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /* Update status pending story */
  async updatePendingStoryStatus(tempId, status) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORES.PENDING_STORIES], "readwrite");
      const store = tx.objectStore(STORES.PENDING_STORIES);
      const getRequest = store.get(tempId);

      getRequest.onsuccess = () => {
        const story = getRequest.result;
        if (story) {
          story.status = status;
          const updateRequest = store.put(story);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          reject(new Error("Story not found"));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // SEARCH, FILTER, SORT

  /* Search stories by name or description */
  async searchStories(query) {
    const allStories = await this.getAllStories();
    const lowerQuery = query.toLowerCase();

    return allStories.filter(
      (story) =>
        story.name.toLowerCase().includes(lowerQuery) ||
        story.description.toLowerCase().includes(lowerQuery),
    );
  }

  /**
   * Sort stories by date
   * @param {string} order - 'newest' atau 'oldest'*/
  async sortStoriesByDate(order = "newest") {
    const allStories = await this.getAllStories();

    return allStories.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();

      return order === "newest" ? dateB - dateA : dateA - dateB;
    });
  }

  /* Filter stories by date range */
  async filterStoriesByDateRange(startDate, endDate) {
    const allStories = await this.getAllStories();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return allStories.filter((story) => {
      const storyDate = new Date(story.createdAt).getTime();
      return storyDate >= start && storyDate <= end;
    });
  }

  /* Filter stories with location */
  async getStoriesWithLocation() {
    const allStories = await this.getAllStories();
    return allStories.filter((story) => story.lat && story.lon);
  }
}

const idbHelper = new IDBHelper();
export default idbHelper;
