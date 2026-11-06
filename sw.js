/**
 * Dvi-Samvat Darshan — Service Worker
 * Cache-first strategy for offline-first operation.
 */

const CACHE_NAME = 'samvat-v11';
const ASSETS = [
    './',
    './index.html',
    './styles.css',
    './js/app.js',
    './js/panchang.js',
    './js/mandala.js',
    './js/festivals.js',
    './js/utils.js',
    './manifest.json'
];

// Install: Pre-cache all assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate: Clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(key => key !== CACHE_NAME)
                    .map(key => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// Fetch: Cache-first strategy
self.addEventListener('fetch', event => {
    const { request } = event;
    // Cache.put rejects non-GET requests and non-http(s) schemes (e.g. chrome-extension://).
    if (request.method !== 'GET' || !request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(request)
            .then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    if (response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    }
                    return response;
                });
            })
            .catch(async () => {
                if (request.mode === 'navigate') {
                    const shell = await caches.match('./index.html');
                    if (shell) return shell;
                }
                return Response.error();
            })
    );
});
