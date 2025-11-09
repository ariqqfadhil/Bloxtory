const BASE_URL = "https://story-api.dicoding.dev/v1";

// VAPID Public Key dari API Dicoding
const VAPID_PUBLIC_KEY =
  "BN7-r0Svv7CsTi18-OPYtJLVW0bfuZ1x1UgarKOAJR0HjZEhRUxqMJUiqbijaqM2BvMvr8E7pT9vNYUt-PIcsHs";

const PushNotification = {
  // Cek apakah browser support push notification
  isSupported() {
    return "serviceWorker" in navigator && "PushManager" in window;
  },

  // Konversi VAPID key dari base64 ke Uint8Array
  _urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  },

  // Request permission untuk notifikasi
  async requestPermission() {
    if (!this.isSupported()) {
      throw new Error("Push notification tidak didukung di browser ini");
    }

    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      throw new Error("Push notification ditolak oleh user");
    }

    return permission;
  },

  // Subscribe ke push notification
  async subscribe(token) {
    try {
      // Request permission dulu
      await this.requestPermission();

      // Dapatkan service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe ke push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Kirim subscription ke server
      await this._sendSubscriptionToServer(subscription, token);

      // Simpan status subscription di localStorage
      localStorage.setItem("push_subscription_status", "subscribed");

      return subscription;
    } catch (error) {
      console.error("Error saat subscribe push notification:", error);
      throw error;
    }
  },

  // Unsubscribe dari push notification
  async unsubscribe() {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();
        localStorage.setItem("push_subscription_status", "unsubscribed");
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error saat unsubscribe push notification:", error);
      throw error;
    }
  },

  // Cek apakah sudah subscribe
  async isSubscribed() {
    try {
      if (!this.isSupported()) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      return subscription !== null;
    } catch (error) {
      console.error("Error saat cek subscription:", error);
      return false;
    }
  },

  // Get subscription status dari localStorage
  getSubscriptionStatus() {
    return localStorage.getItem("push_subscription_status") || "unsubscribed";
  },

  // Kirim subscription ke server
  async _sendSubscriptionToServer(subscription, token) {
    try {
      const response = await fetch(`${BASE_URL}/push/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscription),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || "Gagal mengirim subscription ke server",
        );
      }

      return result;
    } catch (error) {
      console.error("Error saat kirim subscription ke server:", error);
      throw error;
    }
  },

  // Test push notification (untuk testing)
  async testPushNotification() {
    try {
      const registration = await navigator.serviceWorker.ready;

      await registration.showNotification("Test Push Notification", {
        body: "Ini adalah test push notification dari Bloxtory!",
        icon: "/favicon.png",
        badge: "/favicon.png",
        vibrate: [200, 100, 200],
        data: {
          url: "/#/home",
        },
        actions: [
          {
            action: "open",
            title: "Open Story",
            icon: "/favicon.png",
          },
          {
            action: "close",
            title: "Close",
            icon: "/favicon.png",
          },
        ],
      });
    } catch (error) {
      console.error("Error saat test push notification:", error);
      throw error;
    }
  },
};

export default PushNotification;
