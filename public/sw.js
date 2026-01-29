// Basic Service Worker to satisfy PWA requirements
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
    // Simple network-first strategy
    event.respondWith(
        fetch(event.request).catch(() => {
            return new Response('Offline');
        })
    );
});
