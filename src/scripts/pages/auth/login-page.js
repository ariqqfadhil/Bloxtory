import AuthPresenter from "../../presenters/auth-presenter";

const LoginPage = {
  async render() {
    return `
      <section class="page fade" id="loginPage" aria-labelledby="loginTitle">
        <h1 id="loginTitle">Log in to your account</h1>

        <form id="loginForm" class="auth-form" aria-describedby="loginInstructions">
          <p id="loginInstructions">
            Please enter your email and password to access your account.
          </p>

          <div class="form-group">
            <label for="loginEmail">Email</label>
            <input
              type="email"
              id="loginEmail"
              name="email"
              required
              autocomplete="username"
              placeholder="example@email.com"
            />
          </div>

          <div class="form-group">
            <label for="loginPassword">Kata Sandi</label>
            <input
              type="password"
              id="loginPassword"
              name="password"
              required
              autocomplete="current-password"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" aria-label="Log in to your account">Login</button>
        </form>

        <div
          id="loginMsg"
          class="auth-msg"
          role="status"
          aria-live="polite"
        ></div>

        <p class="auth-alt">
          Don't have an account yet?
          <a href="#/register" aria-label="Go to the registration page">Register here</a>.
        </p>
      </section>
    `;
  },

  async afterRender() {
    new AuthPresenter({
      mode: "login",
      formSelector: "#loginForm",
      msgSelector: "#loginMsg",
    });
  },
};

export default LoginPage;
