import HomePresenter from "../../presenters/home-presenter";
import StoryApi from "../../data/api";

const USER_TOKEN_KEY = "dicoding_token";

const HomePage = {
  async render() {
    return `
      <section class="page fade" id="homePage">
        <div class="home-hero">
          <h1 class="visually-hidden">Bloxtory — Share Your Stories and Inspiration</h1>
          <img
            src="/images/bloxtory_logo.png"
            alt="Logo Bloxtory"
            class="home-logo"
          />
        </div>
        
        <div class="home-actions">
          <button id="addStoryBtn" aria-label="Tambah cerita baru">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              fill="white"
              viewBox="0 0 24 24"
              class="plus-icon"
            >
              <path d="M12 5v14m-7-7h14" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Add New Story
          </button>
        </div>

        <div class="story-controls">
          <!-- Search -->
          <div class="control-group">
            <label for="searchStory">🔍 Search:</label>
            <input
              type="text"
              id="searchStory"
              placeholder="Search by name or description..."
              aria-label="Search stories"
            />
          </div>

          <!-- Sort -->
          <div class="control-group">
            <label for="sortStories">📊 Sort:</label>
            <select id="sortStories" aria-label="Sort stories by date">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>

          <!-- Filter -->
          <div class="control-group">
            <label>
              <input
                type="checkbox"
                id="filterLocation"
                aria-label="Show only stories with location"
              />
              📍 Show only with location
            </label>
          </div>

          <!-- Refresh Button -->
          <div class="control-group">
            <button id="refreshStories" aria-label="Refresh stories from server">
              🔄 Refresh
            </button>
          </div>
        </div>

        <!-- Message area for notifications -->
        <div id="messageArea" class="message-area" aria-live="polite"></div>

        <div id="storyList" class="story-list" aria-live="polite">
          <p class="loading">Loading Stories...</p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const listContainer = document.querySelector("#storyList");
    const addStoryBtn = document.querySelector("#addStoryBtn");
    const messageArea = document.querySelector("#messageArea");

    // Check connection status
    const isOnline = navigator.onLine;

    // View Layer
    const view = {
      showLoading() {
        listContainer.classList.add("fade-out");
        listContainer.innerHTML = `<p class="loading">Loading Stories from server...</p>`;
      },

      showError(message) {
        listContainer.innerHTML = `<p class="error">${message}</p>`;
        this.applyFadeIn();
      },

      showSuccessMessage(message) {
        messageArea.innerHTML = `<p class="success-message">${message}</p>`;
        messageArea.style.display = "block";

        setTimeout(() => {
          messageArea.style.display = "none";
        }, 3000);
      },

      showOfflineIndicator() {
        messageArea.innerHTML = `<p class="info-message">📴 You are offline. Showing cached stories.</p>`;
        messageArea.style.display = "block";
      },

      showSearchInfo(query, count) {
        messageArea.innerHTML = `<p class="info-message">Found ${count} story/stories for "${query}"</p>`;
        messageArea.style.display = "block";
      },

      renderStories(stories) {
        if (!stories.length) {
          listContainer.innerHTML = `
            <p class="empty">Unable to display timeline, please <a href="#/login">login</a> first</p>
          `;
          this.applyFadeIn();
          return;
        }

        const offlineClass = !isOnline ? "offline-mode" : "";

        const html = stories
          .map(
            (story) => `
          <article class="story-card ${offlineClass}" data-story-id="${story.id}">
            <img 
              src="${story.photoUrl}" 
              alt="Photo by ${story.name}" 
              class="story-photo"
              loading="${isOnline ? "eager" : "lazy"}"
              decoding="${isOnline ? "sync" : "async"}"
              fetchpriority="${isOnline ? "high" : "low"}"
              onerror="this.onerror=null; this.src='/images/bloxtory_logo.png'; this.classList.add('fallback-img');"
            />
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
              <div class="story-actions">
                ${
                  story.lat && story.lon
                    ? `<button
                        class="view-on-map-btn"
                        data-lat="${story.lat}"
                        data-lon="${story.lon}">
                        📍 See on the Map
                      </button>`
                    : ""
                }
                <!-- ✅ NEW: Tombol Save untuk IndexedDB -->
                <button
                  class="save-story-btn"
                  data-story='${JSON.stringify(story).replace(/'/g, "&apos;")}'
                  aria-label="Save this story for offline access">
                  💾 Save
                </button>
              </div>
            </div>
          </article>
        `,
          )
          .join("");

        listContainer.innerHTML = html;
        this.applyFadeIn();

        if (isOnline) {
          this._forceImageLoad();
        }
      },

      _forceImageLoad() {
        const images = listContainer.querySelectorAll(".story-photo");
        images.forEach((img) => {
          if (img.complete) {
            img.classList.add("loaded");
          } else {
            img.addEventListener(
              "load",
              () => {
                img.classList.add("loaded");
              },
              { once: true },
            );
          }
        });
      },

      onStoryClick(handler) {
        listContainer.addEventListener("click", handler);
      },

      applyFadeIn() {
        listContainer.classList.remove("fade-out");
        listContainer.classList.add("fade-in");
        setTimeout(() => listContainer.classList.remove("fade-in"), 400);
      },

      showImageOverlay(imgSrc, altText) {
        const overlay = document.createElement("div");
        overlay.classList.add("image-overlay");
        overlay.innerHTML = `
          <div class="overlay-content">
            <img src="${imgSrc}" alt="${altText}" class="overlay-image" loading="eager" />
            <button class="overlay-close" aria-label="Close image">✕</button>
          </div>
        `;
        document.body.appendChild(overlay);

        overlay.addEventListener("click", (e) => {
          if (
            e.target.classList.contains("overlay-close") ||
            e.target === overlay
          ) {
            overlay.classList.add("fade-out");
            setTimeout(() => overlay.remove(), 300);
          }
        });
      },
    };

    // Tombol Add Story
    addStoryBtn.addEventListener("click", () => {
      const token = localStorage.getItem(USER_TOKEN_KEY);
      if (!token) {
        alert("Please log in first to add or view stories.");
        window.location.hash = "#/login";
        return;
      }
      window.location.hash = "#/add-story";
    });

    // Inisialisasi Presenter
    new HomePresenter({ view, model: StoryApi });
  },
};

export default HomePage;
