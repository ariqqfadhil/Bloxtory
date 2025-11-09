const ServiceWorkerRegister = {
  deferredPrompt: null,

  async register() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("✅ Service Worker registered:", registration);

        // Setup install prompt handler
        this._setupInstallPrompt();

        return registration;
      } catch (error) {
        console.error("❌ Service Worker registration failed:", error);
      }
    } else {
      console.warn("⚠️ Service Worker not supported in this browser.");
    }
  },

  _setupInstallPrompt() {
    const installBanner = document.getElementById("installBanner");
    const installButton = document.getElementById("installButton");
    const dismissButton = document.getElementById("dismissButton");

    // Listen for beforeinstallprompt event
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("🔔 Install prompt available");

      // Prevent the default prompt
      e.preventDefault();

      // Store the event for later use
      this.deferredPrompt = e;

      // Show custom install banner
      if (installBanner) {
        installBanner.style.display = "flex";
      }
    });

    // Handle install button click
    if (installButton) {
      installButton.addEventListener("click", async () => {
        if (!this.deferredPrompt) {
          console.warn("Install prompt not available");
          return;
        }

        // Show the install prompt
        this.deferredPrompt.prompt();

        // Wait for user response
        const { outcome } = await this.deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);

        // Clear the deferred prompt
        this.deferredPrompt = null;

        // Hide banner
        if (installBanner) {
          installBanner.style.display = "none";
        }
      });
    }

    // Handle dismiss button click
    if (dismissButton) {
      dismissButton.addEventListener("click", () => {
        if (installBanner) {
          installBanner.style.display = "none";
        }

        // Save dismissal to localStorage (optional)
        localStorage.setItem("installPromptDismissed", "true");

        // Show again after 7 days
        setTimeout(
          () => {
            localStorage.removeItem("installPromptDismissed");
          },
          7 * 24 * 60 * 60 * 1000,
        );
      });
    }

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      console.log("✅ PWA installed successfully!");

      // Hide banner if still visible
      if (installBanner) {
        installBanner.style.display = "none";
      }

      // Clear deferred prompt
      this.deferredPrompt = null;

      // Optional: Show thank you message
      alert("Terima kasih telah menginstall Bloxtory! 🎉");
    });

    // Check if already dismissed recently
    const dismissed = localStorage.getItem("installPromptDismissed");
    if (dismissed && installBanner) {
      installBanner.style.display = "none";
    }
  },
};

export default ServiceWorkerRegister;
