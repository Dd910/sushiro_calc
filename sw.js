
const CACHE_NAME = 'sushi-cache-1755968243';
const CORE_ASSETS = [
  'index.html',
  'manifest.json',
  'sw.js',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/red.png',
  'assets/grey.png',
  'assets/gold.png',
  'assets/black.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('sushi-cache-') && k !== CACHE_NAME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const net = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put('index.html', net.clone());
        return net;
      } catch (e) {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match('index.html')) || Response.error();
      }
    })());
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    if (cached) return cached;
    try {
      const net = await fetch(req);
      if (req.method === 'GET') cache.put(req, net.clone());
      return net;
    } catch(e) {
      return cached || Response.error();
    }
  })());
});

self.addEventListener('message', async (event) => {
  const data = event.data || {};
  if (data.type === 'cache-add' && Array.isArray(data.urls)) {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(data.urls.map(async (u) => {
      try {
        const res = await fetch(u, {cache:'no-cache'});
        if (res.ok) cache.put(u, res.clone());
      } catch (e) { /* ignore */ }
    }));
  }
});
