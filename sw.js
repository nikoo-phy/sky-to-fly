/* A Sky to Fly · mobile (EN) Service Worker
   Only registers under http(s); opening the file directly over file:// never reaches this.
   The page is a single self-contained file (all CSS/JS/images inlined), so the core cache stays small. */
const V = 'astf-mobile-en-v1';
const CORE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== V).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // Navigations: network first, fall back to cache so it still opens offline
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const cp = r.clone(); caches.open(V).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match('./index.html').then(hit => hit || caches.match('./')))
    );
    return;
  }

  // Everything else: cache first, refresh in the background
  e.respondWith(
    caches.match(req).then(hit => {
      if (hit) return hit;
      return fetch(req).then(r => {
        try {
          if (r.ok && new URL(req.url).origin === self.location.origin) {
            const cp = r.clone();
            caches.open(V).then(c => c.put(req, cp));
          }
        } catch (_) {}
        return r;
      });
    })
  );
});
