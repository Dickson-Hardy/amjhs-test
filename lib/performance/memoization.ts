/**
 * Memoization Utilities for Next.js 15+
 */
import { useMemo, useCallback, memo, useState, useEffect, useRef } from 'react';

export function useStableMemo<T>(factory: () => T, deps: unknown[]): T {
  return useMemo(factory, deps);
}

export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: unknown[]
): T {
  return useCallback(callback, deps);
}

export function withMemo<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) {
  return memo(Component, areEqual);
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

export function useThrottledCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastCall = useRef(0);
  
  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall.current >= delay) {
      lastCall.current = now;
      return callback(...args);
    }
  }, [callback, delay]) as T;
}