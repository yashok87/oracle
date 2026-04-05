const CACHE_NAME = 'oracle-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://api.dicebear.com/9.x/shapes/png?seed=Oracle&size=192&backgroundColor=000000',
  'https://api.dicebear.com/9.x/shapes/png?seed=Oracle&size=512&backgroundColor=000000',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;700;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Exclude AI API calls and backend proxy from Service Worker interception
  if (
    url.includes('generativelanguage.googleapis.com') || 
    url.includes('pollinations.ai') ||
    url.includes('bigmodel.cn') ||
    url.includes('corsproxy.io') ||
    url.includes('/api/') ||
    url.includes('googleSearch') ||
    url.includes('generateContent') ||
    url.includes('streamGenerateContent')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        if (fetchResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = fetchResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return fetchResponse;
      });
    }).catch(() => {
      if (event.request.mode === 'navigate') {
        return caches.match('./index.html');
      }
    })
  );
});