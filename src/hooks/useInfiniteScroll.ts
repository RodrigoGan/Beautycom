import { useEffect, useRef, useCallback } from 'react'

interface UseInfiniteScrollOptions {
  hasMore: boolean
  loading: boolean
  onLoadMore: () => void
  threshold?: number
  rootMargin?: string
  disabled?: boolean
}

export const useInfiniteScroll = ({
  hasMore,
  loading,
  onLoadMore,
  threshold = 0.1,
  rootMargin = '100px',
  disabled = false
}: UseInfiniteScrollOptions) => {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    
    if (entry.isIntersecting && hasMore && !loading && !disabled) {
      console.log('🔄 Intersection Observer: Carregando mais dados...')
      onLoadMore()
    }
  }, [hasMore, loading, onLoadMore, disabled])

  useEffect(() => {
    if (!elementRef.current) return

    // Limpar observer anterior
    if (observerRef.current) {
      observerRef.current.disconnect()
    }

    // Criar novo observer
    observerRef.current = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    })

    // Observar elemento
    observerRef.current.observe(elementRef.current)

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [handleIntersection, threshold, rootMargin])

  return {
    elementRef,
    isObserving: !!observerRef.current
  }
}

