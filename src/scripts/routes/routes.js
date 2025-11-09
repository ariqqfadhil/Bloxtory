import HomePage from "../pages/home/home-page";
import AboutPage from "../pages/about/about-page";
import MapPage from "../pages/map/map-page";
import LoginPage from "../pages/auth/login-page";
import RegisterPage from "../pages/auth/register-page";
import AddStoryPage from "../pages/add-story/add-story-page";

const routes = {
  "/": HomePage,
  "/home": HomePage,
  "/about": AboutPage,
  "/map": MapPage,
  "/login": LoginPage,
  "/register": RegisterPage,
  "/add-story": AddStoryPage,
};

export default routes;
