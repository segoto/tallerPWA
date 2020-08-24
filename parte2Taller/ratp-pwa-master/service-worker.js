"use strict";
importScripts('https://storage.googleapis.com/workbox-cdn/releases/4.3.1/workbox-sw.js');
if (workbox) {
    workbox.routing.registerRoute(
        new RegExp('/.*'),
        new workbox.strategies.CacheFirst(
            {
                cacheName: 'static-cache-v2',
            }
        )
    );

    // CODELAB: Update cache names any time any of the cached files change.
    const CACHE_NAME = "static-cache-v1";
    const DATA_CACHE_NAME = 'data-cache-v1';

    // CODELAB: Add list of files to cache here.
    const FILES_TO_CACHE = [
        '/',
        '/index.html',
        "/offline.html",
        '/styles/inline.css',
        '/images/icons/icon-128x128.png',
        '/images/icons/icon-192x192.png',
        '/images/icons/icon-256x256.png',
        '/images/icons/icon-512x512.png',
        '/images/ic_add_white_24px.svg',
        '/images/ic_refresh_white_24px.svg',
        '/scripts/app.js'

    ];

    self.addEventListener("install", evt => {
        console.log("[ServiceWorker] Install");
        // CODELAB: Precache static resources here.
        evt.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                console.log("[ServiceWorker] Pre-caching offline page");
                return cache.addAll(FILES_TO_CACHE);
            })
        );

        self.skipWaiting();
    });

    self.addEventListener("activate", evt => {
        console.log("[ServiceWorker] Activate");
        // CODELAB: Remove previous cached data from disk.
        // CODELAB: Remove previous cached data from disk.
        evt.waitUntil(
            caches.keys().then(keyList => {
                return Promise.all(
                    keyList.map(key => {
                        if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                            console.log("[ServiceWorker] Removing old cache", key);
                            return caches.delete(key);
                        }
                    })
                );
            })
        );

        self.clients.claim();
    });

    self.addEventListener('fetch', (evt) => {
        console.log('[ServiceWorker] Fetch', evt.request.url);
        if (evt.request.url.includes('https://api-ratp.pierre-grimaud.fr/v3/schedules/')) {
            console.log('[Service Worker] Fetch (data)', evt.request.url);
            evt.respondWith(
                caches.open(DATA_CACHE_NAME).then((cache) => {
                    return fetch(evt.request)
                        .then((response) => {
                            // If the response was good, clone it and store it in the cache.
                            if (response.status === 200) {
                                cache.put(evt.request.url, response.clone());
                            }
                            return response;
                        }).catch((err) => {
                            // Network request failed, try to get it from the cache.
                            return cache.match(evt.request);
                        });
                }));
            return;
        }
        evt.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(evt.request)
                    .then((response) => {
                        return response || fetch(evt.request);
                    });
            })
        );

    });
}
else {
    console.log('Workbox no disponible');
}