import { useRef, useCallback } from 'react'

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

export const useCacheManager = <T>(maxSize: number = 100, defaultTTL: number = 5 * 60 * 1000) => {
  const cache = useRef<Map<string, CacheItem<T>>>(new Map())

  const get = useCallback((key: string): T | null => {
    const item = cache.current.get(key)
    
    if (!item) return null
    
    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      cache.current.delete(key)
      return null
    }
    
    return item.data
  }, [])

  const set = useCallback((key: string, data: T, ttl: number = defaultTTL): void => {
    // Se cache está cheio, remover item mais antigo
    if (cache.current.size >= maxSize) {
      const firstKey = cache.current.keys().next().value
      if (firstKey) {
        cache.current.delete(firstKey)
      }
    }
    
    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }, [maxSize, defaultTTL])

  const clear = useCallback((): void => {
    cache.current.clear()
  }, [])

  const has = useCallback((key: string): boolean => {
    const item = cache.current.get(key)
    
    if (!item) return false
    
    // Verificar se expirou
    if (Date.now() - item.timestamp > item.ttl) {
      cache.current.delete(key)
      return false
    }
    
    return true
  }, [])

  const size = useCallback((): number => {
    return cache.current.size
  }, [])

  const cleanup = useCallback((): void => {
    const now = Date.now()
    for (const [key, item] of cache.current.entries()) {
      if (now - item.timestamp > item.ttl) {
        cache.current.delete(key)
      }
    }
  }, [])

  return {
    get,
    set,
    clear,
    has,
    size,
    cleanup
  }
}

