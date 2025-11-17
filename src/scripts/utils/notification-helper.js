const BASE_URL = "https://story-api.dicoding.dev/v1";

const VAPID_PUBLIC_KEY =
  "BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk";

const NotificationHelper = {
  urlBase64ToUint8Array(base64String) {
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

  /* Request notification permission */
  async requestPermission() {
    if (!("Notification" in window)) {
      console.error("Browser tidak mendukung notifikasi");
      return false;
    }

    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      console.log("✅ Notification permission granted");
      return true;
    } else {
      console.warn("❌ Notification permission denied");
      return false;
    }
  },

  async subscribeUserToPush(registration) {
    try {
      console.log("🔔 Subscribing to push notification...");

      // Get auth token
      const token = localStorage.getItem("dicoding_token");
      if (!token) {
        throw new Error(
          "Token tidak ditemukan. Silakan login terlebih dahulu.",
        );
      }

      // Subscribe to push manager
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      console.log("📦 Subscription object:", subscription);

      const subscriptionJSON = subscription.toJSON();

      const payload = {
        endpoint: subscriptionJSON.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys.p256dh,
          auth: subscriptionJSON.keys.auth,
        },
      };

      console.log("📤 Sending subscription to server:", payload);

      const response = await this._fetchWithRetry(
        `${BASE_URL}/notifications/subscribe`,
        {
          method: "POST",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ Error response from server:", result);

        if (response.status === 0 || result.message?.includes("CORS")) {
          console.warn("⚠️ CORS error detected, saving subscription locally");
          this._saveSubscriptionLocally(subscription);
          return subscription;
        }

        throw new Error(
          result.message || "Gagal subscribe ke push notification",
        );
      }

      console.log("✅ Subscribe berhasil:", result);

      localStorage.setItem("push_subscription_status", "subscribed");
      this._saveSubscriptionLocally(subscription);

      return subscription;
    } catch (error) {
      console.error("❌ Error subscribe push notification:", error);

      if (
        error.message.includes("Failed to fetch") ||
        error.message.includes("NetworkError")
      ) {
        console.warn(
          "⚠️ Network/CORS error, saving subscription locally as fallback",
        );

        try {
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            this._saveSubscriptionLocally(subscription);
            localStorage.setItem("push_subscription_status", "subscribed");
            localStorage.setItem("push_subscription_pending", "true");

            return subscription;
          }
        } catch (e) {
          console.error("Failed to get subscription:", e);
        }
      }

      throw error;
    }
  },

  async _fetchWithRetry(url, options, retries = 2) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        return response;
      } catch (error) {
        if (i === retries) throw error;
        console.log(`Retry ${i + 1}/${retries}...`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  },

  _saveSubscriptionLocally(subscription) {
    try {
      const subscriptionJSON = subscription.toJSON();
      localStorage.setItem(
        "push_subscription_data",
        JSON.stringify(subscriptionJSON),
      );
      console.log("💾 Subscription saved locally");
    } catch (error) {
      console.error("Failed to save subscription locally:", error);
    }
  },

  async retryPendingSubscription() {
    const isPending = localStorage.getItem("push_subscription_pending");
    if (isPending !== "true") return;

    const token = localStorage.getItem("dicoding_token");
    if (!token) return;

    const subscriptionData = localStorage.getItem("push_subscription_data");
    if (!subscriptionData) return;

    try {
      console.log("🔄 Retrying pending subscription...");

      const subscription = JSON.parse(subscriptionData);
      const payload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
      };

      const response = await fetch(`${BASE_URL}/notifications/subscribe`, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log("✅ Pending subscription sent successfully");
        localStorage.removeItem("push_subscription_pending");
      }
    } catch (error) {
      console.log("⚠️ Will retry pending subscription later");
    }
  },

  async unsubscribeUserFromPush(registration) {
    try {
      console.log("🔕 Unsubscribing from push notification...");

      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        console.log("⚠️ No active subscription found");
        return false;
      }

      const successful = await subscription.unsubscribe();

      if (successful) {
        console.log("✅ Unsubscribe berhasil");
        localStorage.setItem("push_subscription_status", "unsubscribed");
        localStorage.removeItem("push_subscription_data");
        localStorage.removeItem("push_subscription_pending");
      }

      return successful;
    } catch (error) {
      console.error("❌ Error unsubscribe push notification:", error);
      throw error;
    }
  },

  async isSubscribed(registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error("Error checking subscription:", error);
      return false;
    }
  },

  getSubscriptionStatus() {
    return localStorage.getItem("push_subscription_status") || "unsubscribed";
  },

  async showTestNotification(registration) {
    try {
      await registration.showNotification("Bloxtory Test", {
        body: "Push notifications are working! 🎉",
        icon: "/images/bloxtory_logo.png",
        badge: "/images/bloxtory_logo.png",
        vibrate: [200, 100, 200],
        data: { url: "/#/home" },
        tag: "test-notification",
      });
      console.log("✅ Test notification shown");
    } catch (error) {
      console.error("❌ Error showing test notification:", error);
      throw error;
    }
  },
};

export default NotificationHelper;
