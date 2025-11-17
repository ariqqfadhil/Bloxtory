import UrlParser from "./routes/url-parser";
import routes from "./routes/routes";
import Transition from "./utils/transition";
import AuthPresenter from "./presenters/auth-presenter";

const App = {
  async init() {
    await this._registerServiceWorker();
  },

  async _registerServiceWorker() {
    if (!("serviceWorker" in navigator)) {
      console.log("Service Worker not supported");
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register("./sw.js", {
        scope: "/",
      });

      console.log("✅ Service Worker registered:", registration.scope);

      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        console.log("🔄 Service Worker update found!");

        newWorker?.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("✨ New version available, please refresh.");
          }
        });
      });

      return registration;
    } catch (error) {
      console.error("❌ Service Worker registration failed:", error);
      return null;
    }
  },

  async renderPage() {
    const url = UrlParser.parseActiveUrlWithCombiner();
    const page = routes[url];
    const mainContent = document.querySelector("#mainContent");

    if (!page) {
      console.error("Page not found:", url);
      window.location.hash = "#/home";
      return;
    }

    if (!mainContent) {
      console.error("Main content element not found");
      return;
    }

    if (url === "/map" && !AuthPresenter.isLoggedIn()) {
      sessionStorage.setItem("redirectAfterLogin", url);
      window.location.hash = "#/login";
      return;
    }

    try {
      await Transition.applyTransition(mainContent, async () => {
        return await page.render();
      });

      await page.afterRender();
      this._updateActiveNav(url);
    } catch (error) {
      console.error("❌ Error rendering page:", error);
      mainContent.innerHTML = `<p class="error">Failed to load page. Please try again.</p>`;
    }
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
