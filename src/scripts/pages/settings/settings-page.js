const CACHE_NAME = "bloxtory-v1";

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(self.clients.claim());
});

// Push event - menangani notifikasi yang dikirim dari server
self.addEventListener("push", (event) => {
  console.log("Service Worker: Push Received.");

  let notificationData = {
    title: "Bloxtory Notification",
    body: "You have a new story!",
    icon: "/favicon.png",
    badge: "/favicon.png",
    data: {
      url: "/#/home",
    },
  };

  // Jika ada data dari push event, gunakan data tersebut
  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        data: {
          url: data.url || notificationData.data.url,
        },
      };
    } catch (error) {
      console.error("Error parsing push data:", error);
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    data: notificationData.data,
    actions: [
      {
        action: "open",
        title: "Open Story",
        icon: "/favicon.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/favicon.png",
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options),
  );
});

// Notification click event - menangani aksi ketika notifikasi diklik
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked.");

  event.notification.close();

  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data.url || "/#/home";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Cek apakah ada window yang sudah terbuka
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus().then(() => client.navigate(urlToOpen));
          }
        }
        // Jika tidak ada window yang terbuka, buka window baru
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
