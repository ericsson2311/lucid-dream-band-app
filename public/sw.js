// Chrome auf Android erkennt eine Seite nur dann als installierbare PWA
// (mit eigenem Eintrag in den System-Einstellungen), wenn der Service
// Worker einen fetch-Handler registriert — ohne den bleibt "Zum
// Startbildschirm hinzufügen" nur eine einfache Verknüpfung.
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Lucid Dream", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Lucid Dream";
  const options = {
    body: data.body || "",
    icon: "/icon-black.png",
    badge: "/icon-black.png",
    data: { url: data.url || "/" },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsList) => {
      for (const client of clientsList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          if ("navigate" in client) client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
