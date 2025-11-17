// src\scripts\pages\add-story\add-story-page.js

import AddStoryPresenter from "../../presenters/add-story-presenter";
import LeafletConfig from "../../utils/leaflet-config";

const AddStoryPage = {
  async render() {
    return `
      <section class="add-story page fade" aria-labelledby="addStoryTitle">
        <h1 id="addStoryTitle">Add New Story</h1>

        <form
          id="addStoryForm"
          enctype="multipart/form-data"
          aria-describedby="addStoryInstructions">

          <p id="addStoryInstructions">
            Fill in the description, select or take a photo, and specify the location of your story on the map.
          </p>

          <!-- Informasi Cerita -->
          <fieldset>
            <legend>Story Information</legend>

            <div class="form-group">
              <label for="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Tell us something..."
                aria-required="true"
                required></textarea>
            </div>

            <div class="form-group">
              <label for="photo">Upload Image</label>
              <input
                id="photo"
                name="photo"
                type="file"
                accept="image/*"
                aria-label="Choose Image from your Device"
                aria-required="true"
                required
              />

              <fieldset>
                <legend>Take Pictures Using a Camera</legend>

                <button
                  type="button"
                  id="openCameraBtn"
                  aria-label="Activate your camera to take a photo">
                  Take from Camera
                </button>

                <button
                  type="button"
                  id="closeCameraBtn"
                  style="display:none;"
                  aria-label="Turn off camera without taking a photo">
                  Close Camera
                </button>

                <video
                  id="cameraStream"
                  autoplay
                  playsinline
                  style="width:100%; display:none; margin-top:10px;"
                  aria-label="Display Camera">
                </video>

                <button
                  type="button"
                  id="capturePhotoBtn"
                  style="display:none;"
                  aria-label="Take Photo from Camera">
                  Take Photo
                </button>

                <canvas
                  id="photoCanvas"
                  style="display:none;"
                  aria-hidden="true">
                </canvas>

                <output id="cameraStatus" class="visually-hidden" aria-live="polite"></output>
                <output id="photoSource" aria-live="polite" style="margin-top:8px;"></output>

                <figure id="photoPreviewWrapper" style="display:none; margin-top:10px;">
                  <img
                    id="photoPreview"
                    src=""
                    alt="Preview selected or captured photos"
                    style="width:100%; border-radius:8px;" />
                </figure>

                <div id="photoActions" role="group" aria-label="Photo Action" style="display:none; margin-top:8px;">
                  <button
                    type="button"
                    id="removePhotoBtn"
                    aria-label="Delete selected images">
                    ❌ Delete Image
                  </button>

                  <button
                    type="button"
                    id="retakePhotoBtn"
                    aria-label="Take another photo from the camera">
                    🔁 Retake Photo
                  </button>
                </div>
              </fieldset>
            </div>
          </fieldset>

          <!-- Lokasi Cerita -->
          <fieldset>
            <legend>Story Location</legend>

            <p>Click on the map to select location:</p>

            <div
              id="mapAddStory"
              style="height: 300px; margin-bottom: 8px;"
              role="region"
              aria-label="Story Map Location"
              tabindex="0">
            </div>

            <div class="coordinate-inputs">
              <label for="lat">Latitude</label>
              <input
                id="lat"
                name="lat"
                type="text"
                placeholder="Latitude"
                readonly
                aria-readonly="true" />

              <label for="lon">Longitude</label>
              <input
                id="lon"
                name="lon"
                type="text"
                placeholder="Longitude"
                readonly
                aria-readonly="true" />
            </div>
          </fieldset>

          <button id="addStoryBtn" class="add-story-button" type="submit" aria-label="Send New Story">Add New Story</button>
        </form>
      </section>
    `;
  },

  async afterRender() {
    // Inisialisasi peta
    LeafletConfig.initAddStoryMap("mapAddStory", (lat, lon) => {
      document.querySelector("#lat").value = lat;
      document.querySelector("#lon").value = lon;
    });

    // Kumpulkan semua elemen DOM yang presenter perlukan
    const cameraElements = {
      openBtn: document.querySelector("#openCameraBtn"),
      closeBtn: document.querySelector("#closeCameraBtn"),
      video: document.querySelector("#cameraStream"),
      captureBtn: document.querySelector("#capturePhotoBtn"),
      canvas: document.querySelector("#photoCanvas"),
      photoInput: document.querySelector("#photo"),
      cameraStatus: document.querySelector("#cameraStatus"),
      preview: document.querySelector("#photoPreview"),
      photoWrapper: document.querySelector("#photoPreviewWrapper"),
      photoSource: document.querySelector("#photoSource"),
      photoActions: document.querySelector("#photoActions"),
      removeBtn: document.querySelector("#removePhotoBtn"),
      retakeBtn: document.querySelector("#retakePhotoBtn"),
    };

    // Hubungkan presenter (pass form + cameraElements)
    new AddStoryPresenter({
      form: document.querySelector("#addStoryForm"),
      cameraElements,
    });
  },
};

export default AddStoryPage;
