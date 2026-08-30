const CACHE = "sotersa-estatico-v1";
const ARCHIVOS = [
  "/sin-conexion",
  "/logo-sotersa.png",
  "/icono-lobo-sotersa-192.png",
  "/icono-lobo-sotersa-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(caches.keys().then((claves) => Promise.all(claves.filter((clave) => clave.startsWith("sotersa-estatico-") && clave !== CACHE).map((clave) => caches.delete(clave)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (evento) => {
  if (evento.request.method !== "GET") return;
  const url = new URL(evento.request.url);
  if (url.origin !== self.location.origin) return;
  if (evento.request.mode === "navigate") {
    evento.respondWith(fetch(evento.request).catch(() => caches.match("/sin-conexion")));
    return;
  }
  if (ARCHIVOS.includes(url.pathname)) evento.respondWith(caches.match(evento.request).then((guardado) => guardado || fetch(evento.request)));
});
