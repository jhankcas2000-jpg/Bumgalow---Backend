/* Service worker: guarda la app para que abra sin internet. Sube el número de V al actualizar. */
const V = 'bgsys-m2';
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

/* Notificaciones push: llegan aunque la app esté cerrada. Si la app está abierta y a la vista, ya suena adentro. */
self.addEventListener('push', e => {
  let d = {}; try { d = e.data.json(); } catch (x) { d = { texto: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
    if (cs.some(c => c.visibilityState === 'visible')) return;
    return self.registration.showNotification(d.titulo || 'Bumgalow', { body: d.texto || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || 'bgp', renotify: true, vibrate: [200, 100, 200] });
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
