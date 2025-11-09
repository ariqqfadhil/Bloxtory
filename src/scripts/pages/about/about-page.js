const AboutPage = {
  async render() {
    return `
      <main class="page fade about-page" id="aboutPage" aria-labelledby="aboutTitle">
        <section class="about-container">
          <div class="about-hero">
            <img src="/images/bloxtory_logo.png" alt="Logo Bloxtory" class="about-logo" />
            <h1 id="aboutTitle">About <span>Bloxtory</span></h1>
          </div>

          <article class="about-content">
            <p>
              <strong>Bloxtory</strong> is a location-based story sharing platform, 
              where every user can share their experiences, moments, and stories from various places around the world.
            </p>
            <p>
              Bloxtory's goal is to connect stories from different corners of the world so that each location has meaning, 
              not just a point on the map.
            </p>
          </article>
        </section>
      </main>
    `;
  },

  async afterRender() {},
};

export default AboutPage;
