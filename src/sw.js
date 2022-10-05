var CACHE_NAME = "2022-10-05 09:50";
var urlsToCache = [
  "/type-yomi/",
  "/type-yomi/index.js",
  "/type-yomi/mp3/end.mp3",
  "/type-yomi/mp3/correct3.mp3",
  "/type-yomi/mp3/keyboard.mp3",
  "/type-yomi/eraser.svg",
  "/type-yomi/favicon/favicon.svg",
  "https://cdn.jsdelivr.net/npm/bootstrap@5.2.1/dist/css/bootstrap.min.css",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(function (cache) {
        return cache.addAll(urlsToCache);
      }),
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request)
      .then(function (response) {
        if (response) {
          return response;
        }
        return fetch(event.request);
      }),
  );
});

self.addEventListener("activate", function (event) {
  var cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
});
