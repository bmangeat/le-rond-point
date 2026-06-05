// Service worker — réception des notifications push pour Le Rond Point

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "Le Rond Point", body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Le Rond Point";
  const options = {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: data.url || "/" },
    tag: data.tag || undefined,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Si une fenêtre de l'app est déjà ouverte, on la focus
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      // Sinon on en ouvre une
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
