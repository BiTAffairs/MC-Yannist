// Minimal service worker — its presence is what lets Chrome/Edge/Android
// show a real "Install app" prompt. It doesn't do offline caching of dynamic
// data (this app always needs a live connection to Supabase), it just passes
// requests straight through.
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request))
})
