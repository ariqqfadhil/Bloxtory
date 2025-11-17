// src/scripts/presenters/add-story-presenter.js

import StoryApi from "../data/api";
import IDBHelper from "../utils/idb-helper";
import BackgroundSync from "../utils/background-sync";
import Validator from "../utils/validator";
import ErrorHandler from "../utils/error-handler";

class AddStoryPresenter {
  constructor({ form, cameraElements }) {
    this._form = form;
    this._camera = cameraElements;
    this._stream = null;
    this._photoFile = null;

    this._photoSource = this._camera.photoSource;
    this._photoActions = this._camera.photoActions;
    this._removeBtn = this._camera.removeBtn;
    this._retakeBtn = this._camera.retakeBtn;

    this._initCameraFeature();
    this._initPhotoActions();

    this._form.addEventListener("submit", (e) => this._onSubmit(e));
  }

  _initCameraFeature() {
    const { openBtn, video, captureBtn, canvas, photoInput, closeBtn } =
      this._camera;

    if (
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      console.warn("The camera is not available in this environment.");
      openBtn.disabled = true;
      openBtn.textContent = "Camera not supported";
      return;
    }

    openBtn.addEventListener("click", async () => {
      try {
        openBtn.disabled = true;
        openBtn.textContent = "Activating camera...";

        this._stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        video.style.display = "block";
        captureBtn.style.display = "inline-block";
        video.srcObject = this._stream;

        openBtn.textContent = "Camera Active";
        if (closeBtn) closeBtn.style.display = "inline-block";
      } catch (err) {
        alert(
          "Unable to access the camera. Ensure permissions are granted in the browser.",
        );
        console.error("getUserMedia error:", err);
        openBtn.disabled = false;
        openBtn.textContent = "Take from Camera";
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        this._stopCamera();
        closeBtn.style.display = "none";
        openBtn.disabled = false;
        openBtn.textContent = "Take from Camera";
        alert("Camera has been turned off.");
      });
    }

    captureBtn.addEventListener("click", () => {
      try {
        const context = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) {
            alert("Failed to take a photo from the camera.");
            return;
          }

          this._photoFile = new File([blob], "camera-photo.jpg", {
            type: "image/jpeg",
          });
          const preview = this._camera.preview;
          const imageUrl = URL.createObjectURL(blob);

          preview.src = imageUrl;
          preview.style.display = "block";
          if (this._camera.photoWrapper)
            this._camera.photoWrapper.style.display = "block";
          this._photoSource.textContent = "Image taken from camera";

          if (this._camera.photoInput)
            this._camera.photoInput.removeAttribute("required");

          if (this._photoActions) this._photoActions.style.display = "block";
          if (this._removeBtn) this._removeBtn.style.display = "inline-block";
          if (this._retakeBtn) this._retakeBtn.style.display = "inline-block";

          alert("✅ The photo was successfully taken from the camera!");
          this._stopCamera();
        });
      } catch (err) {
        console.error("Error saat menangkap foto:", err);
        alert("An error occurred while taking the photo.");
      }
    });

    photoInput.addEventListener("change", () => {
      if (photoInput.files.length > 0) {
        this._camera.preview.src = URL.createObjectURL(photoInput.files[0]);
        this._camera.preview.style.display = "block";
        if (this._camera.photoWrapper)
          this._camera.photoWrapper.style.display = "block";
        this._photoSource.textContent = "Image selected from uploaded file.";
        if (this._photoActions) this._photoActions.style.display = "block";
        if (this._removeBtn) this._removeBtn.style.display = "inline-block";
        if (this._retakeBtn) this._retakeBtn.style.display = "none";
      }

      if (this._stream) this._stopCamera();
    });
  }

  _initPhotoActions() {
    if (this._removeBtn) {
      this._removeBtn.addEventListener("click", () => {
        if (this._camera.photoWrapper)
          this._camera.photoWrapper.style.display = "none";
        this._photoFile = null;
        if (this._camera.photoInput) this._camera.photoInput.value = "";
        if (this._camera.preview) this._camera.preview.style.display = "none";
        if (this._photoSource) this._photoSource.textContent = "";
        if (this._photoActions) this._photoActions.style.display = "none";

        if (this._camera.openBtn) {
          this._camera.openBtn.disabled = false;
          this._camera.openBtn.textContent = "Take from Camera";
        }
        alert("Image deleted. Please select or take a new photo.");
      });
    }

    if (this._retakeBtn) {
      this._retakeBtn.addEventListener("click", async () => {
        this._photoFile = null;
        if (this._camera.preview) this._camera.preview.style.display = "none";
        if (this._photoSource) this._photoSource.textContent = "";
        if (this._photoActions) this._photoActions.style.display = "none";
        await this._restartCamera();
      });
    }
  }

  async _restartCamera() {
    const { openBtn, video, captureBtn } = this._camera;

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.style.display = "block";
      captureBtn.style.display = "inline-block";
      video.srcObject = this._stream;
      openBtn.textContent = "Camera Active (retake)";
    } catch (err) {
      alert("Unable to access the camera again.");
      console.error(err);
    }
  }

  _stopCamera() {
    if (this._stream) {
      this._stream.getTracks().forEach((track) => track.stop());
      this._stream = null;
    }

    if (this._camera.video) this._camera.video.style.display = "none";
    if (this._camera.captureBtn) this._camera.captureBtn.style.display = "none";
    if (this._camera.closeBtn) this._camera.closeBtn.style.display = "none";
  }

  async _onSubmit(e) {
    e.preventDefault();

    const description = Validator.sanitizeInput(
      this._form.querySelector("#description").value
    );
    const photo =
      this._photoFile ||
      (this._camera.photoInput && this._camera.photoInput.files[0]);
    const lat = this._form.querySelector("#lat").value;
    const lon = this._form.querySelector("#lon").value;

    if (!description) {
      ErrorHandler.showUserError("Description is required");
      return;
    }

    if (!photo) {
      ErrorHandler.showUserError("Photo is required");
      return;
    }

    if (!Validator.isValidImageFile(photo)) {
      ErrorHandler.showUserError("Invalid image file. Max size: 5MB");
      return;
    }

    if (lat && lon && !Validator.isValidCoordinate(lat, lon)) {
      ErrorHandler.showUserError("Invalid coordinates");
      return;
    }

    const isOnline = BackgroundSync.isOnline();

    if (!isOnline) {
      await this._saveOfflineStory({ description, photo, lat, lon });
      return;
    }

    try {
      await StoryApi.addStory({ description, photo, lat, lon });
      alert("✅ Story successfully added!");
      this._resetForm();
      window.location.hash = "/home";
    } catch (error) {
      console.error("❌ Error adding story:", error);

      const userChoice = confirm(
        "Failed to add story to server. Do you want to save it for later sync when online?",
      );

      if (userChoice) {
        await this._saveOfflineStory({ description, photo, lat, lon });
      }
    } finally {
      this._stopCamera();
    }
  }

  async _saveOfflineStory({ description, photo, lat, lon }) {
    try {
      const photoBase64 = await this._convertPhotoToBase64(photo);

      const storyData = {
        description,
        photo: photoBase64,
        photoName: photo.name || "photo.jpg",
        lat,
        lon,
      };

      await IDBHelper.savePendingStory(storyData);

      alert(
        "📴 You are offline. Story saved locally and will be synced when you're back online!",
      );

      this._resetForm();
      BackgroundSync.registerSync();
      window.location.hash = "/home";
    } catch (error) {
      console.error("❌ Failed to save offline story:", error);
      alert("Failed to save story. Please try again.");
    }
  }

  async _convertPhotoToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  _resetForm() {
    this._form.reset();
    this._photoFile = null;
    if (this._camera.preview) this._camera.preview.style.display = "none";
    if (this._photoSource) this._photoSource.textContent = "";
    if (this._photoActions) this._photoActions.style.display = "none";
  }
}

export default AddStoryPresenter;
