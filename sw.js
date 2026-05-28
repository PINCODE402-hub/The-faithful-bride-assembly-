// sw.js - Minimalist Service Worker to enable PWA installation
const CACHE_NAME = 'faithful-bride-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/manifest.json'
];

// Install event - Caches core assets
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

// Fetch event - Required by browsers for PWA installation functionality
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});