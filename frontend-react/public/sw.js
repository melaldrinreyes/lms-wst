const CACHE_NAME = 'lms-wst-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/pwa-192x192.png',
  '/pwa-512x512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  try {
    const reqUrl = new URL(event.request.url);

    // If the request is cross-origin (different origin than the app) or targets an API route,
    // don't try to cache it with our asset caching strategy. Just attempt a normal fetch.
    if (reqUrl.origin !== self.location.origin || reqUrl.pathname.startsWith('/api')) {
      event.respondWith(
        fetch(event.request).catch(() => caches.match('/index.html'))
      );
      return;
    }

    // For same-origin assets and navigation requests, use network-first and cache responses.
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('/index.html')))
    );
  } catch (err) {
    // If URL parsing fails, fall back to network
    event.respondWith(fetch(event.request).catch(() => caches.match('/index.html')));
  }
});
