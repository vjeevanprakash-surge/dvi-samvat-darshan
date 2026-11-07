// The site used to be a PWA whose service worker served every file cache-first.
// Browsers that still have it registered check this URL for updates, so this
// replacement clears the old caches, unregisters itself and reloads open tabs
// onto the new app. The new app registers no service worker.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', event => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map(key => caches.delete(key)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) client.navigate(client.url);
    })());
});
