/* Service worker: guarda la app para que abra sin internet. Sube el número de V al actualizar. */
const V = 'bgsys-m1';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  if (new URL(r.url).origin !== location.origin || /^\/(api|salud)/.test(new URL(r.url).pathname)) return;   // la API va directo a la red
  e.respondWith(caches.match(r, { ignoreSearch: true }).then(hit => {
    const net = fetch(r).then(res => { if (res && res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); } return res; })
      .catch(() => hit || (r.mode === 'navigate' ? caches.match('index.html') : undefined));
    return hit || net;
  }));
});
