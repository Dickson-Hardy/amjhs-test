// Service Worker for AMHSJ - International Journal of Advanced Medical and Health Sciences
// Enhanced PWA service worker with offline functionality and push notifications

const CACHE_NAME = 'amhsj-v1.2.0';
const STATIC_CACHE = 'amhsj-static-v1.2.0';
const DYNAMIC_CACHE = 'amhsj-dynamic-v1.2.0';

// Enhanced cache strategy
const staticAssets = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/login',
  '/about',
  '/_next/static/css/app.css',
  '/_next/static/js/app.js'
];

const dynamicAssets = [
  '/api/articles',
  '/api/search',
  '/dashboard',
  '/submit'
];

// Install event - Enhanced caching
self.addEventListener('install', (event) => {
  logger.info('Service Worker: Installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        logger.info('Service Worker: Caching static assets');
        return cache.addAll(staticAssets);
      }),
      // Cache dynamic assets
      caches.open(DYNAMIC_CACHE).then((cache) => {
        logger.info('Service Worker: Preparing dynamic cache');
        return cache.addAll(['/offline.html']);
      })
    ]).then(() => {
      logger.info('Service Worker: Installation successful');
      self.skipWaiting();
    }).catch((error) => {
      logger.error('Service Worker: Installation failed:', error);
    })
  );
});

// Fetch event - Advanced caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (url.pathname.startsWith('/api/')) {
      // Network first for API calls with cache fallback
      event.respondWith(networkFirstStrategy(request));
    } else if (staticAssets.some(asset => url.pathname === asset || url.pathname.startsWith(asset))) {
      // Cache first for static assets
      event.respondWith(cacheFirstStrategy(request));
    } else {
      // Stale while revalidate for other requests
      event.respondWith(staleWhileRevalidateStrategy(request));
    }
  }
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  logger.info('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            logger.info('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      logger.info('Service Worker: Activation successful');
      return self.clients.claim();
    })
  );
});

// Push notification event
self.addEventListener('push', (event) => {
  logger.info('Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from AMHSJ',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'amhsj-notification',
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png'
      }
    ],
    requireInteraction: true,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification('AMHSJ Journal', options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  logger.info('Service Worker: Notification clicked');
  
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Background sync event
self.addEventListener('sync', (event) => {
  logger.info('Service Worker: Background sync triggered');
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

// Caching strategies
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    logger.error('Network request failed:', error);
    return await caches.match('/offline.html');
  }
}

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    logger.info('Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline response for API calls
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'You are currently offline' 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.status === 200) {
      const cache = caches.open(DYNAMIC_CACHE);
      cache.then(c => c.put(request, networkResponse.clone()));
    }
    return networkResponse;
  }).catch(() => cachedResponse);
  
  return cachedResponse || fetchPromise;
}

// Background sync function
async function doBackgroundSync() {
  logger.info('Service Worker: Performing background sync');
  
  try {
    // Sync offline actions stored in IndexedDB
    const offlineActions = await getOfflineActions();
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, action.options);
        await removeOfflineAction(action.id);
        logger.info('Background sync: Action completed:', action.type);
      } catch (error) {
        logger.error('Background sync: Action failed:', action.type, error);
      }
    }
  } catch (error) {
    logger.error('Background sync failed:', error);
  }
}

// Utility functions for offline actions (simplified)
async function getOfflineActions() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

async function removeOfflineAction(id) {
  // In a real implementation, this would remove from IndexedDB
  logger.info('Removing offline action:', id);
}

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  logger.info('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then((cache) => {
        return cache.addAll(event.data.payload);
      })
    );
  }
});

logger.info('Service Worker: Script loaded successfully');
