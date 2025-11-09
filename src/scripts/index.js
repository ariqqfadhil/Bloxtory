// src/scripts/index.js

import "../styles/styles.css";
import App from "./app";
import AuthPresenter from "./presenters/auth-presenter";
import ServiceWorkerRegister from "./utils/service-worker-register";
import NotificationHelper from "./utils/notification-helper";
import IDBHelper from "./utils/idb-helper";
import BackgroundSync from "./utils/background-sync";

const app = App;

document.addEventListener("DOMContentLoaded", async () => {
  console.log("🚀 Bloxtory App Starting...");

  // ============================================
  // 1. Initialize IndexedDB
  // ============================================
  try {
    await IDBHelper.openDB();
    console.log("✅ IndexedDB initialized");
  } catch (error) {
    console.error("❌ Failed to initialize IndexedDB:", error);
  }

  // ============================================
  // 2. Register Service Worker
  // ============================================
  const registration = await ServiceWorkerRegister.register();

  console.log("✅ App Initialized");

  // ============================================
  // 3. Setup Background Sync
  // ============================================
  if (registration) {
    // Setup online/offline listeners
    BackgroundSync.setupOnlineListener();

    // Try to sync pending stories if online
    if (navigator.onLine) {
      console.log("🌐 Online - checking for pending stories...");
      BackgroundSync.syncPendingStories();
    }
  }

  // ============================================
  // 4. Setup Service Worker Message Handler
  // ============================================
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.type === "GET_TOKEN") {
        // Send token back to service worker
        const token = localStorage.getItem("dicoding_token");
        event.ports[0].postMessage({ token });
      }
    });
  }
});

// Render ulang halaman saat hash berubah
window.addEventListener("hashchange", () => {
  app.renderPage();
});

window.addEventListener("load", async () => {
  AuthPresenter._updateNavbarStatic();
  app.renderPage();

  // === SETUP PUSH NOTIFICATION ===
  const registration = await ServiceWorkerRegister.register();
  if (!registration) return;

  const pushToggle = document.getElementById("pushToggle");
  if (!pushToggle) {
    console.warn("Push toggle button tidak ditemukan di DOM.");
    return;
  }

  const permission = Notification.permission;
  if (permission === "denied") {
    pushToggle.disabled = true;
    pushToggle.textContent = "🚫 Notifications blocked";
    return;
  }

  const currentSub = await registration.pushManager.getSubscription();
  updateToggleButton(pushToggle, !!currentSub);

  pushToggle.addEventListener("click", async () => {
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await NotificationHelper.unsubscribeUserFromPush(registration);
      updateToggleButton(pushToggle, false);
    } else {
      const permissionGranted = await NotificationHelper.requestPermission();
      if (!permissionGranted) {
        console.warn("User menolak izin notifikasi.");
        return;
      }

      await NotificationHelper.subscribeUserToPush(registration);
      updateToggleButton(pushToggle, true);
    }
  });

  console.log("Push Notification siap digunakan 🚀");

  // ============================================
  // Show pending stories count if any
  // ============================================
  try {
    const pendingStories = await IDBHelper.getAllPendingStories();
    if (pendingStories.length > 0) {
      console.log(`📦 Found ${pendingStories.length} pending stories`);

      // Optionally show notification to user
      const banner = document.createElement("div");
      banner.className = "offline-banner";
      banner.innerHTML = `
        <p>
          📦 You have ${pendingStories.length} story/stories waiting to be synced.
          ${navigator.onLine ? "Syncing now..." : "Will sync when online."}
        </p>
      `;
      document.body.insertBefore(banner, document.body.firstChild);

      if (navigator.onLine) {
        setTimeout(() => banner.remove(), 5000);
      }
    }
  } catch (error) {
    console.error("Error checking pending stories:", error);
  }
});

/**
 * Helper function untuk update toggle button
 */
function updateToggleButton(button, isSubscribed) {
  if (isSubscribed) {
    button.textContent = "🔔 Notification: ON";
    button.setAttribute("aria-pressed", "true");
  } else {
    button.textContent = "🔕 Notification: OFF";
    button.setAttribute("aria-pressed", "false");
  }
}

// ============================================
// Connection Status Monitoring
// ============================================
window.addEventListener("online", () => {
  console.log("🌐 Connection restored");
  showConnectionStatus("online");
});

window.addEventListener("offline", () => {
  console.log("📴 Connection lost");
  showConnectionStatus("offline");
});

function showConnectionStatus(status) {
  const existingBanner = document.querySelector(".connection-banner");
  if (existingBanner) {
    existingBanner.remove();
  }

  const banner = document.createElement("div");
  banner.className = `connection-banner ${status}`;
  banner.innerHTML =
    status === "online"
      ? "🌐 You are back online! Syncing data..."
      : "📴 You are offline. Changes will be saved locally.";

  document.body.insertBefore(banner, document.body.firstChild);

  if (status === "online") {
    setTimeout(() => banner.remove(), 3000);
  }
}
