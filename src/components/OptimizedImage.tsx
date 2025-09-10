import React, { useState, useRef, useEffect } from 'react'
import { useImageCache } from '@/hooks/useImageCache'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAxMEMyMi43NjEgMTAgMjUgMTIuMjM5IDI1IDE1QzI1IDE3Ljc2MSAyMi43NjEgMjAgMjAgMjBDMTcuMjM5IDIwIDE1IDE3Ljc2MSAxNSAxNUMxNSAxMi4yMzkgMTcuMjM5IDEwIDIwIDEwWiIgZmlsbD0iI0Q5RDlEOSIvPgo8L3N2Zz4K',
  onLoad,
  onError
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [imageSrc, setImageSrc] = useState(placeholder)
  const imgRef = useRef<HTMLImageElement>(null)
  const { isLoading, error, loaded } = useImageCache(isVisible ? src : null)

  // Intersection Observer para lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(entry.target)
          }
        })
      },
      {
        rootMargin: '100px', // Aumentado para reduzir requisições desnecessárias
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current)
      }
    }
  }, [])

  // Atualizar src quando imagem carregar
  useEffect(() => {
    if (loaded && !error && isVisible) {
      setImageSrc(src)
      onLoad?.()
    } else if (error) {
      onError?.()
    }
  }, [loaded, error, isVisible, src, onLoad, onError])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          loaded && !error ? 'opacity-100' : 'opacity-50'
        }`}
        loading="lazy"
        decoding="async"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-50">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center text-gray-500">
            <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">Erro ao carregar imagem</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Hook para debug do cache
export const useImageCacheDebug = () => {
  const [stats, setStats] = useState(getImageCacheStats())

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getImageCacheStats())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return stats
}

