// ✅ رقم الكاش التلقائي بيتغير كل ثانية (مش هتحتاج تغيره يدوياً تاني)
const CACHE_NAME = 'ehgezly-cache-' + Date.now();

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

// ✅ التثبيت: إجبار المتصفح على تفعيل النسخة الجديدة فوراً
self.addEventListener('install', event => {
  self.skipWaiting(); // 🔥 أهم سطر
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache).catch(err => {
          console.warn('⚠️ فشل كاش بعض الملفات:', err);
        });
      })
  );
});

// ✅ التفعيل: مسح الكاش القديم والسيطرة على الصفحات
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ مسح كاش قديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // 🔥 السيطرة على كل الصفحات المفتوحة
  );
});

// ✅ الجلب: Network First (النت أولاً، ثم الكاش لو النت قطع)
self.addEventListener('fetch', event => {
  // تجاهل الطلبات اللي مش من نفس الموقع (زي Firebase, Tailwind CDN)
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) {
    return;
  }

  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          return caches.match('./index.html');
        });
      })
  );
});

// ✅ الاستماع لرسائل من الصفحة
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
