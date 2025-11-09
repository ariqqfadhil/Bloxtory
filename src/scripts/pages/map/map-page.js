import MapPresenter from "../../presenters/map-presenter";
import StoryApi from "../../data/api";
import LeafletConfig from "../../utils/leaflet-config";

const MapPage = {
  async render() {
    return `
      <section class="page fade" aria-labelledby="storyMapTitle">
        <h1 id="storyMapTitle">User Map Stories</h1>

        <div class="map-container">
          <!-- Area peta interaktif -->
          <div
            id="map"
            role="region"
            aria-label="Story Map Location"
            tabindex="0">
          </div>

          <!-- Daftar cerita -->
          <div class="map-story-list">
            <h2 id="storyListTitle">Stories With Location</h2>
            <section
              id="storyList"
              class="story-list"
              aria-labelledby="storyListTitle"
              aria-live="polite">
              <p class="loading">Loading Stories from server...</p>
            </section>
          </div>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const mapContainer = document.querySelector("#map");
    const storyList = document.querySelector("#storyList");

    // ===== VIEW LAYER =====
    const view = {
      showLoading() {
        storyList.innerHTML = `<p class="loading">Loading Stories from server...</p>`;
      },

      renderStories(stories) {
        storyList.innerHTML = stories
          .map(
            (story, index) => `
            <article
              class="story-card"
              role="button"
              tabindex="0"
              data-index="${index}"
              data-lat="${story.lat}"
              data-lon="${story.lon}">
              <img
                src="${story.photoUrl}"
                alt="Story Photo Location: ${story.name}" />
              <div class="story-content">
                <h2>${story.name}</h2>
                <p class="story-desc">${story.description}</p>
                <small class="story-date">
                  ${new Date(story.createdAt)
                    .toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                    .replace("pukul", ",")
                    .replace(/\s+,/, ",")}
                </small>
              </div>
            </article>
          `,
          )
          .join("");
      },

      showError(message) {
        storyList.innerHTML = `<p class="error">${message}</p>`;
      },

      onCardClick(handler) {
        storyList.addEventListener("click", handler);
      },

      highlightCard(index) {
        const activeCard = storyList.querySelector(".story-card.active");
        if (activeCard) activeCard.classList.remove("active");

        const newCard = storyList.querySelector(
          `.story-card[data-index="${index}"]`,
        );
        if (newCard) {
          newCard.classList.add("active");
          newCard.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        }
      },
    };

    // ===== Inisialisasi Presenter =====
    new MapPresenter({
      view,
      model: StoryApi,
      mapConfig: LeafletConfig,
      mapContainer,
    });
  },
};

export default MapPage;
