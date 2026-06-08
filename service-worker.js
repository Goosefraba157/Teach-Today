const CACHE_NAME = "teach-today-offline-v2026-06-08-section7-hfw-arrows-1";

const APP_SHELL = [
  "./",
  "./TeachToday.html",
  "./ReferencePdfs.html",
  "./StudentDisplay.html",
  "./StudentProfile.html",
  "./index.html",
  "./teach-today.css",
  "./student-display.css",
  "./student-profile.css",
  "./styles.css",
  "./app.js",
  "./teach-today.js",
  "./student-display.js",
  "./student-profile.js",
  "./reader-wordlists.js",
  "./reader-chart-index.js",
  "./reader-sentences.js",
  "./reader-sentence-index.js",
  "./dictation-content.js",
  "./dictation-index.js",
  "./dictation-phrase-index.js",
  "./dictation-sentence-index.js",
  "./sample-blue-group-data.js",
  "./sofia-carbajal-chart-data.js",
  "./wilson-lp-template.js",
  "./wilson-hfw-data.js",
  "./vendor/pdf-lib.min.js",
  "./pwa-register.js",
  "./manifest.webmanifest",
  "./assets/morrocoy-logo.png",
  "./Sounds%20for%20Section%201/1.1.png",
  "./Sounds%20for%20Section%201/1.2%20-%201.3.png",
  "./Sounds%20for%20Section%201/1.4.png",
  "./Sounds%20for%20Section%201/1.5%20-%201.6.png",
  "./Sounds%20for%20Section%201/2.1%20-%202.2.png",
  "./Sounds%20for%20Section%201/2.3%20-%203.5.png",
  "./Sounds%20for%20Section%201/4.1%20-%204.4.png",
  "./Sounds%20for%20Section%201/5.1%20-%205.2.png",
  "./Sounds%20for%20Section%201/5.3%20-%205.4.png",
  "./Sounds%20for%20Section%201/5.5%20-%206.3.png",
  "./Sounds%20for%20Section%201/6.4.png",
  "./Sounds%20for%20Section%201/7.1.png",
  "./Sounds%20for%20Section%201/7.2.png",
  "./Sounds%20for%20Section%201/7.3.png",
  "./Sounds%20for%20Section%201/7.4%20-%207.5.png",
  "./Sounds%20for%20Section%201/8.1.png",
  "./Sounds%20for%20Section%201/8.1%20-%208.4.png",
  "./Sounds%20for%20Section%201/8.5.png",
  "./Sounds%20for%20Section%201/9.1%20and%20on.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached || caches.match("./TeachToday.html"));
      return cached || network;
    })
  );
});
