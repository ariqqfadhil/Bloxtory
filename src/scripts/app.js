import UrlParser from "./routes/url-parser";
import routes from "./routes/routes";
import Transition from "./utils/transition";
import AuthPresenter from "./presenters/auth-presenter";

const App = {
  async init() {
    // Register service worker
    await this._registerServiceWorker();
  },

  async _registerServiceWorker() {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        });

        console.log("Service Worker registered successfully:", registration);

        // Cek update service worker
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          console.log("Service Worker update found!");

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("New Service Worker available, please refresh.");
            }
          });
        });
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    } else {
      console.log("Service Worker not supported in this browser");
    }
  },

  async renderPage() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const page = routes[url];
    const mainContent = document.querySelector("#mainContent");

    // Cek login sebelum buka halaman tertentu
    if (url === "/map" && !AuthPresenter.isLoggedIn()) {
      sessionStorage.setItem("redirectAfterLogin", url);
      window.location.hash = "#/login";
      return;
    }

    // Render halaman normal dengan transisi
    await Transition.applyTransition(mainContent, async () => {
      const html = await page.render();
      return html;
    });

    await page.afterRender();
    this._updateActiveNav(url);
  },

  _updateActiveNav(currentUrl) {
    const navLinks = document.querySelectorAll(".navbar a");
    navLinks.forEach((link) => {
      const linkHash = link.getAttribute("href").replace("#", "");

      if (linkHash === currentUrl) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  },
};

export default App;
