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

  // Initialize IndexedDB
  try {
    await IDBHelper.openDB();
    console.log("✅ IndexedDB initialized");
  } catch (error) {
    console.error("❌ Failed to initialize IndexedDB:", error);
  }

  // Register Service Worker
  const registration = await ServiceWorkerRegister.register();
  console.log("✅ App Initialized");

  // Setup Background Sync
  if (registration) {
    BackgroundSync.setupOnlineListener();

    if (navigator.onLine) {
      console.log("🌐 Online - checking for pending stories...");
      BackgroundSync.syncPendingStories();
      NotificationHelper.retryPendingSubscription();
    }
  }

  // Setup Service Worker Message Handler
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data.type === "GET_TOKEN") {
        const token = localStorage.getItem("dicoding_token");
        event.ports[0].postMessage({ token });
      }
    });
  }
});

window.addEventListener("hashchange", () => {
  app.renderPage();
});

window.addEventListener("load", async () => {
  AuthPresenter._updateNavbarStatic();
  app.renderPage();

  await setupPushNotification();
  await showPendingStoriesInfo();
});

async function setupPushNotification() {
  const registration = await ServiceWorkerRegister.register();
  if (!registration) {
    console.warn("⚠️ Service Worker tidak tersedia");
    return;
  }

  const pushToggle = document.getElementById("pushToggle");
  if (!pushToggle) {
    console.warn("⚠️ Push toggle button tidak ditemukan");
    return;
  }

  // Check browser support
  if (!("PushManager" in window)) {
    pushToggle.disabled = true;
    pushToggle.textContent = "🚫 Not Supported";
    pushToggle.title = "Push notifications not supported in this browser";
    return;
  }

  // Check permission
  const permission = Notification.permission;
  if (permission === "denied") {
    pushToggle.disabled = true;
    pushToggle.textContent = "🚫 Notifications Blocked";
    pushToggle.title = "Please enable notifications in browser settings";
    return;
  }

  // Update UI based on current subscription
  const isSubscribed = await NotificationHelper.isSubscribed(registration);
  updateToggleButton(pushToggle, isSubscribed);

  // Event listener untuk toggle
  pushToggle.addEventListener("click", async () => {
    await handlePushToggle(registration, pushToggle);
  });

  console.log("✅ Push Notification setup complete 🚀");
}

async function handlePushToggle(registration, pushToggle) {
  const token = localStorage.getItem("dicoding_token");

  if (!token) {
    showMessage("⚠️ Please login first to enable notifications!", "warning");
    setTimeout(() => {
      window.location.hash = "#/login";
    }, 1500);
    return;
  }

  try {
    pushToggle.disabled = true;
    pushToggle.textContent = "⏳ Processing...";

    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Unsubscribe
      console.log("🔕 Unsubscribing...");
      await NotificationHelper.unsubscribeUserFromPush(registration);
      updateToggleButton(pushToggle, false);
      showMessage("✅ Push notifications disabled", "success");
    } else {
      // Subscribe
      console.log("🔔 Subscribing...");

      const permissionGranted = await NotificationHelper.requestPermission();
      if (!permissionGranted) {
        updateToggleButton(pushToggle, false);
        showMessage("❌ Notification permission denied", "error");
        return;
      }

      const result = await NotificationHelper.subscribeUserToPush(registration);
      updateToggleButton(pushToggle, true);

      // Show test notification
      await NotificationHelper.showTestNotification(registration);

      if (result.synced) {
        showMessage(
          "✅ Push notifications enabled! You'll receive updates from the server.",
          "success",
          4000,
        );
      } else if (result.pending) {
        // ✅ CORS error - but local notifications will work
        showMessage(
          "⚠️ Notifications enabled locally! Test notification shown above.\n\n" +
            "Note: Server-triggered notifications may not work due to API restrictions, " +
            "but browser notifications are fully functional. 🎉",
          "warning",
          6000,
        );

        console.log(`
          ℹ️  IMPORTANT: Push Notification Status
          ✅ Browser push notifications: ENABLED
          ⚠️  Server sync: PENDING (CORS restriction)
        `);
      }
    }
  } catch (error) {
    console.error("❌ Error toggling push notification:", error);

    const currentSub = await registration.pushManager.getSubscription();
    updateToggleButton(pushToggle, !!currentSub);

    showMessage(`❌ Error: ${error.message}`, "error");
  } finally {
    pushToggle.disabled = false;
  }
}

function updateToggleButton(button, isSubscribed) {
  if (isSubscribed) {
    button.textContent = "🔔 Notification: ON";
    button.setAttribute("aria-pressed", "true");
    button.classList.add("subscribed");
  } else {
    button.textContent = "🔕 Notification: OFF";
    button.setAttribute("aria-pressed", "false");
    button.classList.remove("subscribed");
  }
}

function showMessage(message, type = "info", duration = 3000) {
  const existingMsg = document.querySelector(".notification-message");
  if (existingMsg) existingMsg.remove();

  const msgDiv = document.createElement("div");
  msgDiv.className = `notification-message ${type}`;
  msgDiv.textContent = message;

  const colors = {
    success: "#4caf50",
    error: "#f44336",
    warning: "#ff9800",
    info: "#2196f3",
  };

  msgDiv.style.cssText = `
    position: fixed;
    top: 80px;
    right: 20px;
    padding: 16px 24px;
    background: ${colors[type] || colors.info};
    color: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    z-index: 10000;
    max-width: 420px;
    animation: slideIn 0.3s ease;
    font-size: 14px;
    line-height: 1.6;
    white-space: pre-line;
  `;

  document.body.appendChild(msgDiv);

  setTimeout(() => {
    msgDiv.style.animation = "slideOut 0.3s ease";
    setTimeout(() => msgDiv.remove(), 300);
  }, duration);
}

async function showPendingStoriesInfo() {
  try {
    const pendingStories = await IDBHelper.getAllPendingStories();
    if (pendingStories.length === 0) return;

    console.log(`📦 Found ${pendingStories.length} pending stories`);

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
  } catch (error) {
    console.error("Error checking pending stories:", error);
  }
}

// Connection Status Monitoring
window.addEventListener("online", () => {
  console.log("🌐 Connection restored");
  showConnectionStatus("online");
  NotificationHelper.retryPendingSubscription();
});

window.addEventListener("offline", () => {
  console.log("📴 Connection lost");
  showConnectionStatus("offline");
});

function showConnectionStatus(status) {
  const existingBanner = document.querySelector(".connection-banner");
  if (existingBanner) existingBanner.remove();

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

// Add CSS animations
const style = document.createElement("style");
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
