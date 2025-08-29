/**
 * Lazy Loading Utilities for Next.js 15+
 */
import { lazy, Suspense, ComponentType, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';

export function createLazyComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  fallback?: React.ReactNode
) {
  const LazyComponent = lazy(importFn);
  
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <div>Loading...</div>}>
        <LazyComponent {...props} />
      </Suspense>
    );
  };
}

export function createDynamicComponent<T = {}>(
  importFn: () => Promise<{ default: ComponentType<T> }>,
  options: { ssr?: boolean; loading?: () => React.ReactNode } = {}
) {
  return dynamic(importFn, {
    ssr: options.ssr ?? false,
    loading: options.loading || (() => <div>Loading...</div>)
  });
}

export function useLazyIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          callback();
          observer.disconnect();
        }
      },
      { threshold: 0.1, ...options }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, [callback]);
  
  return ref;
}