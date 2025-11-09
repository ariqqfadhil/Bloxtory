import PushNotification from "../utils/push-notification";

const PushNotificationPresenter = {
  _toggleButton: null,
  _statusText: null,

  async init(toggleButtonId, statusTextId) {
    this._toggleButton = document.getElementById(toggleButtonId);
    this._statusText = document.getElementById(statusTextId);

    if (!this._toggleButton || !this._statusText) {
      console.error("Push notification elements not found");
      return;
    }

    await this._updateUI();
    this._attachEventListeners();
  },

  async _updateUI() {
    const isSubscribed = await PushNotification.isSubscribed();

    if (isSubscribed) {
      this._toggleButton.textContent = "🔔 Disable Notifications";
      this._toggleButton.classList.remove("btn-primary");
      this._toggleButton.classList.add("btn-secondary");
      this._statusText.textContent = "Push notifications are enabled";
      this._statusText.classList.remove("text-danger");
      this._statusText.classList.add("text-success");
    } else {
      this._toggleButton.textContent = "🔕 Enable Notifications";
      this._toggleButton.classList.remove("btn-secondary");
      this._toggleButton.classList.add("btn-primary");
      this._statusText.textContent = "Push notifications are disabled";
      this._statusText.classList.remove("text-success");
      this._statusText.classList.add("text-danger");
    }
  },

  _attachEventListeners() {
    this._toggleButton.addEventListener("click", async () => {
      await this._handleToggle();
    });
  },

  async _handleToggle() {
    try {
      this._toggleButton.disabled = true;
      this._statusText.textContent = "Processing...";

      const isSubscribed = await PushNotification.isSubscribed();

      if (isSubscribed) {
        await this._handleUnsubscribe();
      } else {
        await this._handleSubscribe();
      }

      await this._updateUI();
    } catch (error) {
      console.error("Error handling toggle:", error);
      this._showError(error.message);
    } finally {
      this._toggleButton.disabled = false;
    }
  },

  async _handleSubscribe() {
    // Cek apakah user sudah login
    const token = localStorage.getItem("dicoding_token");
    if (!token) {
      throw new Error(
        "Anda harus login terlebih dahulu untuk mengaktifkan notifikasi",
      );
    }

    await PushNotification.subscribe(token);
    this._showSuccess("Push notifications enabled successfully!");
  },

  async _handleUnsubscribe() {
    await PushNotification.unsubscribe();
    this._showSuccess("Push notifications disabled successfully!");
  },

  _showSuccess(message) {
    // Bisa diganti dengan implementasi toast/alert yang lebih baik
    alert(message);
  },

  _showError(message) {
    // Bisa diganti dengan implementasi toast/alert yang lebih baik
    alert("Error: " + message);
  },
};

export default PushNotificationPresenter;
