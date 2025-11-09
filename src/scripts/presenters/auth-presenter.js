import AuthApi from "../data/auth-api";

const TOKEN_KEY = "dicoding_token";
const USER_NAME_KEY = "dicoding_user_name";

class AuthPresenter {
  constructor({ mode = "login", formSelector, msgSelector } = {}) {
    this._mode = mode;
    this._form = document.querySelector(formSelector);
    this._msgEl = document.querySelector(msgSelector);

    // Spinner Overlay Global
    if (!document.querySelector(".global-spinner")) {
      const spinner = document.createElement("div");
      spinner.className = "global-spinner";
      spinner.innerHTML = `
        <div class="spinner-overlay">
          <div class="spinner-circle"></div>
        </div>
      `;
      document.body.appendChild(spinner);
    }
    this._spinner = document.querySelector(".global-spinner");

    if (this._form) {
      this._form.addEventListener("submit", (e) => this._onSubmit(e));
    }
  }

  async _onSubmit(event) {
    event.preventDefault();
    this._setMessage("Processing...", "info");
    this._toggleSpinner(true);

    try {
      const formData = new FormData(this._form);
      const payload = Object.fromEntries(formData.entries());

      if (this._mode === "register") {
        await AuthApi.register(payload);
        this._setMessage("Registration successful. Please login.", "success");

        setTimeout(() => {
          this._toggleSpinner(false);
          window.location.hash = "#/login";
        }, 900);
      } else {
        const data = await AuthApi.login(payload);
        const loginResult = data.loginResult || data;
        const token =
          loginResult.token || loginResult.accessToken || loginResult.authToken;
        const name = loginResult.name || loginResult.userId || "";

        if (!token) throw new Error("Token not found in login response");

        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_NAME_KEY, name);

        this._setMessage("Login successful. Redirecting...", "success");
        this._updateNavbar();

        const redirectPage =
          sessionStorage.getItem("redirectAfterLogin") || "/home";
        sessionStorage.removeItem("redirectAfterLogin");

        setTimeout(() => {
          this._toggleSpinner(false);
          window.location.hash = `#${redirectPage}`;
        }, 800);
      }
    } catch (err) {
      console.error(err);
      this._setMessage(err.message || "Authentication failed", "error");
      this._toggleSpinner(false);
    } finally {
      this._toggleSpinner(false);
    }
  }

  _toggleSpinner(show) {
    if (this._spinner) {
      this._spinner.style.display = show ? "flex" : "none";
    }
  }

  _setMessage(text, type = "info") {
    if (!this._msgEl) return;
    this._msgEl.textContent = text;
    this._msgEl.setAttribute("aria-busy", type === "info");
    this._msgEl.className = `auth-msg ${type}`;
  }

  static logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    AuthPresenter._updateNavbarStatic();
    window.location.hash = "#/home";
    location.reload();
  }

  _updateNavbar() {
    AuthPresenter._updateNavbarStatic();
  }

  static _updateNavbarStatic() {
    const token = localStorage.getItem(TOKEN_KEY);
    const navRight = document.querySelector(".nav-right");
    if (!navRight) return;

    // Cek apakah tombol push toggle sudah ada
    let pushToggle = navRight.querySelector("#pushToggle");

    // Jika belum ada (misal user baru login/logout), buat ulang tombolnya
    if (!pushToggle) {
      pushToggle = document.createElement("button");
      pushToggle.id = "pushToggle";
      pushToggle.className = "push-toggle";
      pushToggle.setAttribute("aria-pressed", "false");
      pushToggle.textContent = "🔕 Notification: OFF";
      navRight.prepend(pushToggle); // tambahkan di awal elemen kanan
    }

    // Hapus elemen login/logout sebelumnya tapi biarkan tombol toggle tetap ada
    const existingLinks = navRight.querySelectorAll(
      "a, span.nav-user, button.btn-ghost",
    );
    existingLinks.forEach((el) => el.remove());

    // Tambahkan elemen login/logout sesuai status login
    if (token) {
      const name = localStorage.getItem(USER_NAME_KEY) || "User";

      const userSpan = document.createElement("span");
      userSpan.className = "nav-user";
      userSpan.textContent = `Hi, ${escapeHtml(name)}`;

      const logoutBtn = document.createElement("button");
      logoutBtn.id = "logoutBtn";
      logoutBtn.className = "btn-ghost";
      logoutBtn.textContent = "Logout";
      logoutBtn.addEventListener("click", () => AuthPresenter.logout());

      navRight.append(userSpan, logoutBtn);
    } else {
      const loginLink = document.createElement("a");
      loginLink.href = "#/login";
      loginLink.textContent = "Login";

      const registerLink = document.createElement("a");
      registerLink.href = "#/register";
      registerLink.textContent = "Register";

      navRight.append(loginLink, registerLink);
    }
  }

  static isLoggedIn() {
    return !!localStorage.getItem(TOKEN_KEY);
  }
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default AuthPresenter;
