// Service Worker for Push Notifications
const CACHE_NAME = 'fixer-admin-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Push event
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

  const options = {
    body: event.data ? event.data.text() : 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192x192.png'
      }
    ]
  };

  let notificationData = {};
  try {
    notificationData = event.data ? JSON.parse(event.data.text()) : {};
  } catch (e) {
    console.error('Error parsing notification data:', e);
  }

  // Override options with notification data if available
  if (notificationData.title) {
    options.title = notificationData.title;
  }
  if (notificationData.body) {
    options.body = notificationData.body;
  }
  if (notificationData.icon) {
    options.icon = notificationData.icon;
  }
  if (notificationData.data) {
    options.data = { ...options.data, ...notificationData.data };
  }
  // Web Push payload uses top-level `url` (see NotificationService.sendWebPushNotification)
  if (notificationData.url) {
    options.data = { ...options.data, url: notificationData.url };
  }

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'Fixer Admin',
      options
    )
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const payload = event.notification.data || {};
  const rawTarget = payload.url || payload.actionUrl || '/';
  const openUrl =
    rawTarget.startsWith('http://') || rawTarget.startsWith('https://')
      ? rawTarget
      : new URL(rawTarget, self.location.origin).href;

  if (event.action === 'explore') {
    event.waitUntil(clients.openWindow(openUrl));
  } else if (event.action === 'close') {
    console.log('Notification closed');
  } else {
    event.waitUntil(clients.openWindow(openUrl));
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Handle background sync for notifications
      console.log('Syncing notifications in background')
    );
  }
});

// Message event (for communication with main thread)
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
