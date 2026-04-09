// MeAndYou Service Worker — network-only (sem cache de paginas)
// Push notifications + force reload em deploy novo

self.addEventListener('install', function() {
  self.skipWaiting()
})

self.addEventListener('activate', function(e) {
  // Limpa TODOS os caches antigos de qualquer versao
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k) }))
    })
  )
  self.clients.claim()
})

// Sem fetch handler = browser usa comportamento padrao (sem cache do SW)
// Isso evita servir versao antiga quando a rede falha

// Push notifications (necessario para PWA)
self.addEventListener('push', function(e) {
  var data = e.data ? e.data.json() : {}
  e.waitUntil(
    self.registration.showNotification(data.title || 'MeAndYou', {
      body: data.body || '',
      icon: '/logo.png',
      badge: '/logo.png',
      data: data.url ? { url: data.url } : undefined
    })
  )
})

self.addEventListener('notificationclick', function(e) {
  e.notification.close()
  var url = (e.notification.data && e.notification.data.url) || '/'
  e.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(function(clients) {
      for (var i = 0; i < clients.length; i++) {
        if (clients[i].url.indexOf('meandyou') !== -1 && 'focus' in clients[i]) {
          clients[i].navigate(url)
          return clients[i].focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
