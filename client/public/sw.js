const CACHE_NAME = 'sevasetu-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/favicon.png',
  '/icons.svg',
  '/manifest.json'
];

// Install: Cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching App Shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Stale-While-Revalidate Strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and external resources (except fonts/CDNs if needed)
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Only handle internal requests or specific CDNs
  if (url.origin !== self.location.origin) {
    // Optional: Add logic here to cache external fonts or icons
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Only cache valid responses
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Fallback to index.html for navigation requests if offline
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });

        // Return cached response if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      });
    })
  );
});

