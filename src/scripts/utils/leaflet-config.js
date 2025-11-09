// src/scripts/utils/leaflet-config.js
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const LeafletConfig = {
  initMap(containerId = "map") {
    const map = L.map(containerId).setView([-2.5489, 118.0149], 5); // posisi Indonesia

    // Base layer 1 (default)
    const street = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: "&copy; OpenStreetMap contributors",
      },
    ).addTo(map);

    // Base layer 2 (satelit)
    const satellite = L.tileLayer(
      "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      {
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: "Map data © Google",
      },
    );

    // Layer control
    const baseMaps = {
      Street: street,
      Satellite: satellite,
    };

    L.control.layers(baseMaps).addTo(map);

    return map;
  },

  // Tambahan fungsi untuk halaman tambah story
  initAddStoryMap(containerId = "mapAddStory", onLocationSelect) {
    const map = L.map(containerId).setView([-2.5489, 118.0149], 5);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    let marker = null;

    map.on("click", function (e) {
      const { lat, lng } = e.latlng;

      if (marker) {
        map.removeLayer(marker);
      }

      marker = L.marker([lat, lng]).addTo(map);
      marker
        .bindPopup(`Lat: ${lat.toFixed(4)}, Lon: ${lng.toFixed(4)}`)
        .openPopup();

      if (typeof onLocationSelect === "function") {
        onLocationSelect(lat.toFixed(6), lng.toFixed(6));
      }
    });

    return map;
  },
};

export default LeafletConfig;
