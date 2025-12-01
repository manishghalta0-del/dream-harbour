self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (e) => {
  // Minimal network-first strategy for dynamic content
});
