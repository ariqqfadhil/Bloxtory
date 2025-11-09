import AuthPresenter from "../../presenters/auth-presenter";

const RegisterPage = {
  async render() {
    return `
      <section class="page fade" id="registerPage" aria-labelledby="registerTitle">
        <h1 id="registerTitle">Create New Account</h1>

        <form id="registerForm" class="auth-form" aria-describedby="registerInstructions">
          <p id="registerInstructions">
            Enter your name, email, and password to create a new account.
          </p>

          <div class="form-group">
            <label for="registerName">Full Name</label>
            <input
              type="text"
              id="registerName"
              name="name"
              required
              autocomplete="name"
              placeholder="Your Name"
            />
          </div>

          <div class="form-group">
            <label for="registerEmail">Email</label>
            <input
              type="email"
              id="registerEmail"
              name="email"
              required
              autocomplete="email"
              placeholder="example@email.com"
            />
          </div>

          <div class="form-group">
            <label for="registerPassword">Password</label>
            <input
              type="password"
              id="registerPassword"
              name="password"
              required
              minlength="6"
              autocomplete="new-password"
              placeholder="Minimum 6 characters"
            />
          </div>

          <button type="submit" aria-label="Register a new account">Register</button>
        </form>

        <div
          id="registerMsg"
          class="auth-msg"
          role="status"
          aria-live="polite"
        ></div>

        <p class="auth-alt">
          Already have an account?
          <a href="#/login" aria-label="Go to the login page">Log in here</a>.
        </p>
      </section>
    `;
  },

  async afterRender() {
    new AuthPresenter({
      mode: "register",
      formSelector: "#registerForm",
      msgSelector: "#registerMsg",
    });
  },
};

export default RegisterPage;
