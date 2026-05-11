const CACHE = 'capybarabu-v1.0.1';
const SHELL = ['./index.html', './manifest.json'];

const SKIP_HOSTS = [
  'firebasedatabase.app',
  'firebaseio.com',
  'googleapis.com',
  'gstatic.com',
  'line-scdn.net',
  'liff.line.me',
  'accounts.line-apps.com',
  'access.line.me',
  'obs.line-apps.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (SKIP_HOSTS.some(h => url.hostname.endsWith(h))) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        if (e.request.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 503 });
      });
    })
  );
});
