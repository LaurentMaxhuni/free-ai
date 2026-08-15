const CACHE_NAME = "free-ai-v2"
const STATIC_ASSETS = [
  "/",
  "/offline",
]

self.addEventListener("install", (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    })
  )
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    })
  )
  event.waitUntil(self.clients.claim())
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  const url = new URL(request.url)

  if (url.origin !== self.location.origin) return

  // Next's development chunks are mutable and must never be served from a
  // production cache. This also lets an updated worker recover old dev tabs.
  // Firebase's auth helper is also stateful and must always be proxied to the
  // network rather than served from an old cache.
  if (url.pathname.startsWith("/_next/") || url.pathname.startsWith("/__/auth/")) {
    event.respondWith(fetch(request).catch(() => caches.match(request)))
    return
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline"))
    )
    return
  }

  if (
    request.destination === "style" ||
    request.destination === "script" ||
    request.destination === "font" ||
    request.destination === "image"
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, response.clone())
            return response
          })
        })
      })
    )
    return
  }

  event.respondWith(
    fetch(request).then((response) => {
      return response
    }).catch(() => {
      return caches.match(request)
    })
  )
})
