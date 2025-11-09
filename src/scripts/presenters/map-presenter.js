import L from "leaflet";

class MapPresenter {
  constructor({ view, model, mapConfig, mapContainer }) {
    this.view = view;
    this.model = model;
    this.mapConfig = mapConfig;
    this.mapContainer = mapContainer;

    this._map = this.mapConfig.initMap();
    this._markers = [];
    this._activeMarker = null;

    this._init();
  }

  async _init() {
    this.view.showLoading();

    try {
      const stories = await this.model.getStories({ location: 1 });
      this.view.renderStories(stories);

      const { latParam, lonParam } = this._getURLParams();
      this._renderMarkers(stories);

      // Jika ada koordinat dari URL → fokus ke lokasi tersebut
      if (!isNaN(latParam) && !isNaN(lonParam)) {
        this._focusToLocation(stories, latParam, lonParam);
      }

      // Event: Klik card di list → fokus ke marker
      this.view.onCardClick((event) => {
        const card = event.target.closest(".story-card");
        if (!card) return;
        const index = parseInt(card.dataset.index);
        this._focusToMarker(index);
      });
    } catch (error) {
      console.error(error);
      this.view.showError("Failed to load stories. Please try again later.");
    }
  }

  _getURLParams() {
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.split("?")[1]);
    const latParam = parseFloat(params.get("lat"));
    const lonParam = parseFloat(params.get("lon"));
    return { latParam, lonParam };
  }

  _renderMarkers(stories) {
    stories.forEach((story, index) => {
      if (!story.lat || !story.lon) return;

      const marker = L.marker([story.lat, story.lon]).addTo(this._map);
      marker.bindPopup(
        `<strong>${story.name}</strong><br>${story.description}`,
      );
      marker._storyIndex = index;

      marker.on("click", () => this._highlightStory(index));
      this._markers.push(marker);
    });
  }

  _focusToLocation(stories, lat, lon) {
    this._map.setView([lat, lon], 10);

    const foundIndex = stories.findIndex(
      (story) =>
        story.lat &&
        story.lon &&
        Math.abs(story.lat - lat) < 0.0001 &&
        Math.abs(story.lon - lon) < 0.0001,
    );

    if (foundIndex !== -1) {
      this._highlightStory(foundIndex);
      const marker = this._markers[foundIndex];
      if (marker) marker.openPopup();
    }
  }

  _focusToMarker(index) {
    const marker = this._markers[index];
    if (marker) {
      this._map.setView(marker.getLatLng(), 10);
      marker.openPopup();
      this._highlightStory(index);
    }
  }

  _highlightStory(index) {
    // Reset marker sebelumnya
    if (this._activeMarker) {
      this._activeMarker.setIcon(new L.Icon.Default());
    }

    const marker = this._markers[index];
    if (marker) {
      const activeIcon = L.icon({
        iconUrl: "https://cdn-icons-png.flaticon.com/512/535/535239.png",
        iconSize: [38, 38],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
      });
      marker.setIcon(activeIcon);
      this._activeMarker = marker;
    }

    // Beritahu View untuk highlight card
    this.view.highlightCard(index);
  }
}

export default MapPresenter;
