import { useState, useEffect, useRef } from 'react'

interface CachedImage {
  url: string
  loaded: boolean
  error: boolean
  timestamp: number
}

const imageCache = new Map<string, CachedImage>()
const CACHE_DURATION = 10 * 60 * 1000 // 10 minutos (aumentado para reduzir requisições)

export const useImageCache = (imageUrl: string | null) => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false)
      setError(false)
      setLoaded(false)
      return
    }

    // Verificar cache
    const cached = imageCache.get(imageUrl)
    const now = Date.now()

    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      // Usar cache
      setIsLoading(false)
      setError(cached.error)
      setLoaded(cached.loaded)
      return
    }

    // Carregar nova imagem
    setIsLoading(true)
    setError(false)
    setLoaded(false)

    const img = new Image()
    
    img.onload = () => {
      if (!mountedRef.current) return
      
      const cachedData: CachedImage = {
        url: imageUrl,
        loaded: true,
        error: false,
        timestamp: now
      }
      
      imageCache.set(imageUrl, cachedData)
      setIsLoading(false)
      setLoaded(true)
      setError(false)
    }

    img.onerror = () => {
      if (!mountedRef.current) return
      
      const cachedData: CachedImage = {
        url: imageUrl,
        loaded: false,
        error: true,
        timestamp: now
      }
      
      imageCache.set(imageUrl, cachedData)
      setIsLoading(false)
      setLoaded(false)
      setError(true)
    }

    img.src = imageUrl

    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [imageUrl])

  return { isLoading, error, loaded }
}

// Função para limpar cache
export const clearImageCache = () => {
  imageCache.clear()
}

// Função para obter estatísticas do cache
export const getImageCacheStats = () => {
  return {
    total: imageCache.size,
    loaded: Array.from(imageCache.values()).filter(img => img.loaded).length,
    errors: Array.from(imageCache.values()).filter(img => img.error).length
  }
}

