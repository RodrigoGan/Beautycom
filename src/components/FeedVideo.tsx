import React, { useRef, useEffect, useState } from 'react'

interface FeedVideoProps {
  videoUrl: string
  mutedByDefault?: boolean
  className?: string
  onVideoClick?: () => void
}

const FeedVideo: React.FC<FeedVideoProps> = ({ 
  videoUrl, 
  mutedByDefault = true, 
  className = "",
  onVideoClick
}) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMuted, setIsMuted] = useState(mutedByDefault)
  const [isVisible, setIsVisible] = useState(false)
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)

  // Intersection Observer para detectar visibilidade
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (videoRef.current) {
              videoRef.current.play().catch(console.error)
            }
          } else {
            setIsVisible(false)
            if (videoRef.current) {
              videoRef.current.pause()
            }
          }
        })
      },
      {
        threshold: 0.5, // 50% do vídeo deve estar visível
        rootMargin: '0px 0px -10% 0px' // Pausa quando 10% do vídeo sai da tela
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  // Detectar aspect ratio do vídeo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      const ratio = video.videoHeight / video.videoWidth
      setAspectRatio(ratio)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
  }, [])

  // Toggle de som ao clicar no botão
  const handleSoundToggle = () => {
    if (videoRef.current) {
      const newMutedState = !isMuted
      setIsMuted(newMutedState)
      videoRef.current.muted = newMutedState
    }
  }

  // Calcular altura baseada no aspect ratio
  const containerStyle = aspectRatio 
    ? { aspectRatio: `${1 / aspectRatio}` }
    : { aspectRatio: '16/9' } // Fallback

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={containerStyle}
    >
                        <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-full object-cover cursor-pointer"
                    muted={isMuted}
                    loop
                    playsInline
                    preload="metadata"
                    onError={(e) => {
                      console.error('Erro ao carregar vídeo:', videoUrl)
                      e.currentTarget.style.display = 'none'
                    }}
                    onClick={onVideoClick}
                  />
      
                        {/* Overlay de som */}
                  <div 
                    className="absolute top-2 right-2 bg-black/50 text-white p-2 rounded-full cursor-pointer transition-all hover:bg-black/70 z-10"
                    onClick={handleSoundToggle}
                  >
        {isMuted ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </div>

      {/* Indicador de carregamento */}
      {!aspectRatio && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  )
}

export default FeedVideo

