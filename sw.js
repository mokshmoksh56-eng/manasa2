// ✅ اسم ثابت للكاش (تم رفع الإصدار إلى v2 لضمان مسح الكاش القديم عند التحديث)
const CACHE_NAME = 'ehgezly-cache-v2';

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

// ✅ واجهة انقطاع الإنترنت (تعرض عند فشل الاتصال وعدم وجود الصفحة المطلوبة في الكاش)
// هذا الإجراء ضروري لاجتياز مراجعة Google Play Console لتطبيقات Web-Wrapper
const OFFLINE_HTML = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>لا يوجد اتصال بالإنترنت</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@700;900&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Cairo', sans-serif; background-color: #F8FAFC; color: #0F2D5C; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
    .icon { font-size: 72px; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1)); }
    h1 { font-size: 22px; font-weight: 900; margin-bottom: 10px; color: #1E293B; }
    p { font-size: 14px; color: #64748B; margin-bottom: 25px; font-weight: 700; line-height: 1.6; }
    button { background: #2563EB; color: white; border: none; padding: 12px 28px; border-radius: 99px; font-size: 14px; font-weight: 900; cursor: pointer; box-shadow: 0 4px 15px rgba(37, 99, 235, 0.3); border-bottom: 3px solid #1D4ED8; transition: transform 0.2s; font-family: 'Cairo', sans-serif;}
    button:active { transform: translateY(2px); border-bottom-width: 1px; }
  </style>
</head>
<body>
  <div class="icon">📶❌</div>
  <h1>أنت غير متصل بالإنترنت</h1>
  <p>يبدو أنك فقدت الاتصال بالشبكة.<br>يرجى التحقق من اتصالك بالإنترنت ثم المحاولة مرة أخرى.</p>
  <button onclick="window.location.reload()">تحديث الصفحة 🔄</button>
</body>
</html>
`;

// ✅ التثبيت: إجبار المتصفح على تفعيل النسخة الجديدة فوراً
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .catch(err => console.warn('⚠️ فشل كاش بعض الملفات:', err))
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
    }).then(() => self.clients.claim()) // السيطرة على كل الصفحات المفتوحة فوراً
  );
});

// ✅ الجلب: Network First + واجهة انقطاع مخصصة
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // تجاهل الطلبات الخارجية (مثل API أو خرائط جوجل)
  if (url.origin !== location.origin) return;
  if (event.request.method !== 'GET') return;

  // منع استخدام كاش المتصفح الافتراضي لملفات الكود لضمان جلب التحديثات
  let fetchOptions = {};
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      fetchOptions = { cache: 'no-store' }; 
  }

  event.respondWith(
    fetch(event.request, fetchOptions)
      .then(response => {
        // تحديث الكاش بالنسخة الأحدث في حال نجاح الاتصال
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // في حالة انقطاع الإنترنت، نبحث في الكاش أولاً
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          
          // إذا كان الطلب لصفحة HTML ولم توجد في الكاش، نعرض صفحة "انقطاع الإنترنت" المخصصة
          if (event.request.mode === 'navigate' || event.request.headers.get('accept').includes('text/html')) {
            return new Response(OFFLINE_HTML, {
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          }
        });
      })
  );
});

// ✅ الاستماع لرسائل من الصفحة للتحديث اليدوي
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
