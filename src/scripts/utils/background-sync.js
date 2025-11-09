import IDBHelper from "./idb-helper";
import StoryApi from "../data/api";

const SYNC_TAG = "sync-pending-stories";

class BackgroundSync {
  constructor() {
    this._syncInProgress = false;
  }

  /* Register background sync di Service Worker */
  async registerSync() {
    if ("serviceWorker" in navigator && "SyncManager" in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.sync.register(SYNC_TAG);
        console.log("✅ Background sync registered");
      } catch (error) {
        console.error("❌ Background sync registration failed:", error);
        this.syncPendingStories();
      }
    } else {
      console.warn("⚠️ Background Sync not supported, using fallback");
      this.syncPendingStories();
    }
  }

  /* Sync semua pending stories ke API */
  async syncPendingStories() {
    if (this._syncInProgress) {
      console.log("⏳ Sync already in progress...");
      return;
    }

    this._syncInProgress = true;

    try {
      const pendingStories = await IDBHelper.getAllPendingStories();

      if (pendingStories.length === 0) {
        console.log("✅ No pending stories to sync");
        this._syncInProgress = false;
        return;
      }

      console.log(`🔄 Syncing ${pendingStories.length} pending stories...`);

      let successCount = 0;
      let failCount = 0;

      for (const pendingStory of pendingStories) {
        try {
          // Update status ke syncing
          await IDBHelper.updatePendingStoryStatus(
            pendingStory.tempId,
            "syncing",
          );

          // Convert photo blob/base64 back to File object
          const photoFile = await this._convertToFile(
            pendingStory.photo,
            pendingStory.photoName || "photo.jpg",
          );

          // Kirim ke API
          const result = await StoryApi.addStory({
            description: pendingStory.description,
            photo: photoFile,
            lat: pendingStory.lat,
            lon: pendingStory.lon,
          });

          // Jika berhasil, hapus dari pending
          await IDBHelper.deletePendingStory(pendingStory.tempId);
          successCount++;

          console.log(`✅ Story synced successfully:`, result);
        } catch (error) {
          console.error(
            `❌ Failed to sync story ${pendingStory.tempId}:`,
            error,
          );

          // Update status ke failed
          await IDBHelper.updatePendingStoryStatus(
            pendingStory.tempId,
            "failed",
          );
          failCount++;
        }
      }

      console.log(
        `🎉 Sync complete: ${successCount} success, ${failCount} failed`,
      );

      // Notify user jika ada
      if (successCount > 0) {
        this._showSyncNotification(successCount);
      }
    } catch (error) {
      console.error("❌ Error during sync:", error);
    } finally {
      this._syncInProgress = false;
    }
  }

  /* Convert stored photo data (base64/blob) back to File */
  async _convertToFile(photoData, fileName) {
    if (photoData instanceof File) {
      return photoData;
    }

    // Jika base64 string
    if (typeof photoData === "string") {
      const response = await fetch(photoData);
      const blob = await response.blob();
      return new File([blob], fileName, { type: blob.type });
    }

    // Jika blob
    if (photoData instanceof Blob) {
      return new File([photoData], fileName, { type: photoData.type });
    }

    throw new Error("Invalid photo data format");
  }

  /* Show notification when sync completes */
  _showSyncNotification(count) {
    if ("Notification" in window && Notification.permission === "granted") {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification("Bloxtory - Stories Synced", {
          body: `${count} story/stories successfully synced to server!`,
          icon: "/images/bloxtory_logo.png",
          badge: "/images/bloxtory_logo.png",
          tag: "sync-complete",
        });
      });
    }
  }

  /* Check if online and trigger sync */
  setupOnlineListener() {
    window.addEventListener("online", () => {
      console.log("🌐 Device is online, triggering sync...");
      this.registerSync();
    });

    window.addEventListener("offline", () => {
      console.log("📴 Device is offline");
    });
  }

  /* Check connection status */
  isOnline() {
    return navigator.onLine;
  }
}

const backgroundSync = new BackgroundSync();
export default backgroundSync;
