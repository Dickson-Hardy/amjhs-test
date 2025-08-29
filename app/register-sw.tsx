'use client';

import { useEffect } from 'react';

export function RegisterServiceWorker() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js').then(
          function(registration) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Service Worker registration successful with scope: ', registration.scope);
            }
          },
          function(err) {
            if (process.env.NODE_ENV === 'development') {
              console.error('Service Worker registration failed: ', err);
            }
          }
        );
      });
    }
  }, []);

  return null;
}

export default RegisterServiceWorker;
