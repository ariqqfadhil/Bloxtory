import PushConfig from "./push-config";

const API_BASE_URL = "https://story-api.dicoding.dev/v1";

const NotificationHelper = {
  async requestPermission() {
    if (!("Notification" in window)) {
      console.error("Browser tidak mendukung Notification API.");
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  },

  async subscribeUserToPush(registration) {
    if (!("PushManager" in window)) {
      console.error("Browser tidak mendukung PushManager.");
      return;
    }

    try {
      // Langganan push di browser
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this._urlBase64ToUint8Array(
          PushConfig.VAPID_PUBLIC_KEY,
        ),
      });

      console.log("✅ Push subscription berhasil:", subscription);

      // Kirim subscription ke server Dicoding
      //await this._sendSubscriptionToServer(subscription);
      return subscription;
    } catch (err) {
      console.error("❌ Gagal subscribe:", err);
    }
  },

  async unsubscribeUserFromPush(registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        console.log("Tidak ada subscription aktif.");
        return;
      }

      // Kirim permintaan unsubscribe ke server Dicoding
      await this._sendUnsubscribeToServer(subscription);

      // Hapus subscription di browser
      await subscription.unsubscribe();
      console.log("❌ Berhasil unsubscribe dari push notification");
    } catch (err) {
      console.error("Gagal unsubscribe:", err);
    }
  },

  async _sendSubscriptionToServer(subscription) {
    try {
      // Cegah error CORS di localhost
      if (location.origin.includes("localhost")) {
        console.warn("⚠️ Skip kirim subscription ke server (localhost).");
        console.log("Subscription data:", subscription);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/push-subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) throw new Error("Gagal kirim ke server Dicoding");
      console.log("✅ Subscription dikirim ke server Dicoding");
    } catch (err) {
      console.error("❌ Error kirim subscription:", err);
    }
  },

  async _sendUnsubscribeToServer(subscription) {
    try {
      // Cegah error CORS di localhost
      if (location.origin.includes("localhost")) {
        console.warn("⚠️ Skip kirim unsubscribe ke server (localhost).");
        console.log("Unsubscribe data:", subscription);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/push-unsubscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription),
      });

      if (!response.ok)
        throw new Error("Gagal kirim unsubscribe ke server Dicoding");
      console.log("✅ Unsubscribe dikirim ke server Dicoding");
    } catch (err) {
      console.error("❌ Error kirim unsubscribe:", err);
    }
  },

  _urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const rawData = window.atob(base64);
    return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
  },
};

export default NotificationHelper;
