const CACHE_NAME = 'praxis-sandbox-v2';

// Asset URLs are resolved against the service worker location, so precaching works
// when the site is served from a subdirectory (GitHub Pages project pages).
const SW_ROOT = new URL('./', self.location);
const STATIC_ASSETS = [
    './',
    'index.html',
    'manifest.json',
    'src/styles.css',
    'src/app.js',
    'src/db/idb.js',
    'src/db/auth.js',
    'src/screens/auth-screen.js',
    'src/screens/module-selector.js',
    'src/screens/lesson-view.js',
    'src/components/code-editor.js',
    'src/components/console-output.js',
    'src/components/quiz-widgets.js',
    'lib/bcryptjs.min.js'
].map(assetPath => new URL(assetPath, SW_ROOT).href);

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    if (url.origin !== location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then((networkResponse) => {
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }

                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(request, responseToCache);
                            });

                        return networkResponse;
                    })
                    .catch(() => {
                        if (request.mode === 'navigate') {
                            return caches.match(new URL('index.html', SW_ROOT).href);
                        }
                        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
                    });
            })
    );
});

self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});