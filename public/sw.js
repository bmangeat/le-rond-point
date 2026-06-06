// Service worker — Le Rond Point
// 1) Réception des notifications push
// 2) Cache des assets statiques immuables → lancements (re)quasi instantanés

const CACHE = "lrp-static-v1";

// On ne met en cache QUE des ressources au nom hashé/immuable. Jamais le HTML,
// le RSC ou les API (contenu auth-dépendant → risque de servir du périmé).
function isCacheableStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/splash/") ||
    url.pathname === "/logo-animated.svg"
  );
}

self.addEventListener("install", () => {
  // Active immédiatement la nouvelle version sans attendre la fermeture des onglets.
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Purge les anciens caches.
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !isCacheableStatic(url)) return;

  // Cache-first : ces ressources sont immuables (nom hashé).
  event.respondWith(
    (async () => {
      const cached = await caches.match(req);
      if (cached) return cached;
      const res = await fetch(req);
      if (res.ok) {
        const cache = await caches.open(CACHE);
        cache.put(req, res.clone());
      }
      return res;
    })()
  );
});

// ─── Notifications push ──────────────────────────────────────────────────────
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
