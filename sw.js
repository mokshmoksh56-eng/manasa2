const CACHE_NAME = 'ehgezly-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './login.html',
  './index2.html',
  './school.html',
  './group.html',
  './end.html',
  './talep.html',
  './privacy.html',
  './manifest.json',
  './icon-192x192.png',
  './icon-512x512.png'
];

// تثبيت ملفات الكاش
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// تفعيل السيرفيس وركر ومسح الكاش القديم عند التحديث
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// جلب الملفات من الكاش إذا لم يتوفر اتصال بالإنترنت
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});
