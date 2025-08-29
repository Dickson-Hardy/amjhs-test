/**
 * Caching Utilities for Next.js 15+
 */
import { useState, useCallback, useEffect } from 'react';

class MemoryCache<T = any> {
  private cache = new Map<string, { value: T; expires: number }>();
  
  set(key: string, value: T, ttl: number = 300000): void {
    this.cache.set(key, { value, expires: Date.now() + ttl });
  }
  
  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
}

export const memoryCache = new MemoryCache();

export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  ttl: number = 300000
): Promise<T> {
  const cacheKey = url + JSON.stringify(options);
  
  const cached = memoryCache.get(cacheKey);
  if (cached) return cached;
  
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const data = await response.json();
  memoryCache.set(cacheKey, data, ttl);
  return data;
}

export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttl?: number } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const cached = memoryCache.get(key);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
      
      const result = await fetcher();
      memoryCache.set(key, result, options.ttl);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, options.ttl]);
  
  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  return { data, loading, error, refetch: fetchData };
}