const CACHE_NAME = "radar-local-v1";
const ASSETS = [
    "./",
    "./index.html",
    "./css/styles.css",
    "./js/app.js",
    "./js/map_gps.js",
    "./js/viewer_adaptive.js",
    "./js/spatial_audio.js"
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener("fetch", (event) => {
    if (event.request.url.includes("/api/")) {
        return;
    }
    event.respondWith(
        caches.match(event.request).then((cached) => cached || fetch(event.request))
    );
});