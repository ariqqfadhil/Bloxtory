const CACHE_VERSION = "bloxtory-v3"; // Increment version
const APP_SHELL_CACHE = `${CACHE_VERSION}-app-shell`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Assets yang akan di-cache untuk offline (App Shell)
const APP_SHELL_ASSETS = [
  "/",
  "/index.html",
  "/app.bundle.js",
  "/images/logo.png",
  "/images/bloxtory_logo.png",
  "/favicon.png",
  "/manifest.json",
];

const OFFLINE_IMAGE = "/images/bloxtory_logo.png";

// INSTALL EVENT - Cache App Shell
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      console.log("Service Worker: Caching App Shell");
      return cache.addAll(APP_SHELL_ASSETS).catch((error) => {
        console.error("Failed to cache:", error);
      });
    }),
  );
  self.skipWaiting();
});

// ACTIVATE EVENT - Clean Old Caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (
            !cacheName.startsWith(CACHE_VERSION) &&
            cacheName.includes("bloxtory")
          ) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});

// FETCH EVENT - FIXED: Online vs Offline Strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Filter invalid requests
  if (!request.url.startsWith("http")) return;
  if (url.protocol === "chrome-extension:") return;
  if (request.method !== "GET") return;

  // ===== STRATEGY 1: Cache First for Local Static Assets =====
  if (
    APP_SHELL_ASSETS.includes(url.pathname) ||
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(cacheFirst(request, APP_SHELL_CACHE));
    return;
  }

  // ===== STRATEGY 2: FIXED - Network First for API Images (Online) =====
  // Cache only as fallback when offline
  if (
    url.hostname === "story-api.dicoding.dev" &&
    (request.destination === "image" || url.pathname.includes("/images/"))
  ) {
    event.respondWith(networkFirstImages(request, IMAGE_CACHE, OFFLINE_IMAGE));
    return;
  }

  // ===== STRATEGY 3: Network First for API JSON Data =====
  if (
    url.hostname === "story-api.dicoding.dev" &&
    request.destination !== "image"
  ) {
    event.respondWith(networkFirst(request, API_CACHE));
    return;
  }

  // ===== STRATEGY 4: Cache First for Local Images =====
  if (request.destination === "image") {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE));
    return;
  }

  // ===== DEFAULT: Stale While Revalidate =====
  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// CACHING STRATEGIES

/* Cache First - Prioritas cache, fallback ke network */
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Cache First error:", error);

    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    return new Response("Offline - Asset not available", {
      status: 503,
      statusText: "Service Unavailable",
    });
  }
}

/* Network First - Prioritas network, fallback ke cache */
async function networkFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("Network First fallback to cache:", error);

    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      return cached;
    }

    return new Response(
      JSON.stringify({
        error: true,
        message: "Offline - Data tidak tersedia",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

async function networkFirstImages(request, cacheName, offlineFallback) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      // Cache successful response for offline use
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());

      console.log("✅ Image loaded from network:", request.url);
      return networkResponse;
    }

    // If response not ok, try cache
    throw new Error("Network response not ok");
  } catch (error) {
    // Network failed, try cache
    console.log("⚠️ Network failed, trying cache for:", request.url);

    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    if (cached) {
      console.log("✅ Image loaded from cache (offline):", request.url);
      return cached;
    }

    // No cache available, return fallback
    console.log("❌ No cache, using fallback image");
    return getFallbackImage(offlineFallback);
  }
}

/* Stale While Revalidate - Return cache immediately, update in background */
async function staleWhileRevalidate(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);

    const fetchPromise = fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
      .catch(() => cached);

    return cached || fetchPromise;
  } catch (error) {
    console.error("Stale While Revalidate error:", error);
    return new Response("Error loading resource", { status: 500 });
  }
}

/* Get fallback image for offline mode */
async function getFallbackImage(fallbackPath) {
  const cache = await caches.open(APP_SHELL_CACHE);
  const fallback = await cache.match(fallbackPath);

  if (fallback) {
    return fallback;
  }

  // Return transparent 1x1 pixel as last resort
  return new Response(
    new Blob(
      [
        atob(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        ),
      ],
      { type: "image/png" },
    ),
    { status: 200, statusText: "OK", headers: { "Content-Type": "image/png" } },
  );
}

// BACKGROUND SYNC
self.addEventListener("sync", (event) => {
  console.log("🔄 Background Sync Event:", event.tag);

  if (event.tag === "sync-pending-stories") {
    event.waitUntil(syncPendingStories());
  }
});

async function syncPendingStories() {
  try {
    const db = await openIndexedDB();
    const pendingStories = await getAllPendingStories(db);

    if (pendingStories.length === 0) {
      console.log("✅ No pending stories to sync");
      return;
    }

    console.log(`🔄 Syncing ${pendingStories.length} pending stories...`);

    for (const story of pendingStories) {
      try {
        const photoBlob = await fetch(story.photo).then((r) => r.blob());

        const formData = new FormData();
        formData.append("description", story.description);
        formData.append("photo", photoBlob, story.photoName);
        if (story.lat) formData.append("lat", story.lat);
        if (story.lon) formData.append("lon", story.lon);

        const token = await getAuthToken();

        if (!token) {
          console.warn("No auth token available for sync");
          continue;
        }

        const response = await fetch(
          "https://story-api.dicoding.dev/v1/stories",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: formData,
          },
        );

        if (response.ok) {
          await deletePendingStory(db, story.tempId);
          console.log(`✅ Story ${story.tempId} synced successfully`);

          await self.registration.showNotification("Story Synced", {
            body: "Your story has been synced to the server!",
            icon: "/images/bloxtory_logo.png",
            badge: "/images/bloxtory_logo.png",
          });
        } else {
          console.warn(
            `Failed to sync story ${story.tempId}:`,
            response.status,
          );
        }
      } catch (error) {
        console.error(`❌ Failed to sync story ${story.tempId}:`, error);
      }
    }
  } catch (error) {
    console.error("❌ Background sync error:", error);
  }
}

// INDEXEDDB HELPERS
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("bloxtory-db", 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllPendingStories(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["pending-stories"], "readonly");
    const store = tx.objectStore("pending-stories");
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function deletePendingStory(db, tempId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(["pending-stories"], "readwrite");
    const store = tx.objectStore("pending-stories");
    const request = store.delete(tempId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function getAuthToken() {
  const clients = await self.clients.matchAll();
  if (clients.length > 0) {
    const response = await new Promise((resolve) => {
      const channel = new MessageChannel();
      const timeout = setTimeout(() => resolve({ token: null }), 1000);

      channel.port1.onmessage = (event) => {
        clearTimeout(timeout);
        resolve(event.data);
      };

      clients[0].postMessage({ type: "GET_TOKEN" }, [channel.port2]);
    });

    return response.token;
  }

  return null;
}

// PUSH NOTIFICATION
self.addEventListener("push", (event) => {
  try {
    const raw = event.data ? event.data.text() : "";
    if (raw instanceof Promise) {
      event.waitUntil(raw.then((resolved) => showParsedNotification(resolved)));
      return;
    } else {
      return event.waitUntil(showParsedNotification(raw));
    }
  } catch (err) {
    console.error("Error membaca data push:", err);
    const data = {
      title: "Bloxtory Notification",
      body: "Ada cerita baru di Bloxtory!",
    };
    event.waitUntil(showNotification(data));
  }
});

function showParsedNotification(raw) {
  let data = {};
  try {
    data = JSON.parse(raw);
  } catch {
    data = {
      title: "Bloxtory Notification",
      body: raw || "Ada cerita baru di Bloxtory!",
    };
  }
  return showNotification(data);
}

function showNotification(data) {
  const title = data.title || "Bloxtory Notification";
  const options = {
    body: data.body || "Ada cerita baru di Bloxtory!",
    icon: data.icon || "/images/bloxtory_logo.png",
    badge: "/images/bloxtory_logo.png",
    data: { url: data.url || "#/home" },
    actions: [{ action: "open_url", title: "Lihat Detail" }],
  };
  return self.registration.showNotification(title, options);
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = new URL(event.notification.data.url, self.location.origin)
    .href;
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client)
            return client.focus();
        }
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      }),
  );
});

// MESSAGE HANDLER
self.addEventListener("message", (event) => {
  if (event.data.type === "GET_TOKEN") {
    // Handled by client-side code in index.js
  }
});
