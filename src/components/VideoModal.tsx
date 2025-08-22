import React, { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Play, Pause, Volume2, VolumeX, SkipBack, SkipForward, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface VideoModalProps {
  videoUrl: string
  isOpen: boolean
  onClose: () => void
}

const VideoModal: React.FC<VideoModalProps> = ({ videoUrl, isOpen, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(true)

  // Formatar tempo em MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Carregar metadados do vídeo
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
    }
  }, [])

  // Play/Pause
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  // Pular 10 segundos
  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(duration, currentTime + seconds))
    }
  }

  // Controle de progresso
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = (parseFloat(e.target.value) / 100) * duration
    if (videoRef.current) {
      videoRef.current.currentTime = newTime
    }
  }

  // Auto-hide controles
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      setShowControls(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isOpen, showControls])

  // Reset quando modal abre
  useEffect(() => {
    if (isOpen && videoRef.current) {
      videoRef.current.currentTime = 0
      setIsPlaying(false)
      setShowControls(true)
    }
  }, [isOpen])

  // Renderizar apenas se estiver aberto
  if (!isOpen) return null

  return createPortal(
    <div 
      className="fixed inset-0 z-[999999] flex items-center justify-center transition-all duration-300 ease-out bg-black/95 opacity-100 scale-100"
      style={{
        backdropFilter: 'blur(4px)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        pointerEvents: 'auto'
      }}
    >
      {/* Overlay para capturar cliques no background */}
      <div 
        className="absolute inset-0"
        onClick={() => setShowControls(!showControls)}
        style={{ pointerEvents: 'auto' }}
      />

      {/* Botão fechar */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          onClose()
        }}
        className="absolute top-4 right-4 z-[1000000] bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-all duration-300 opacity-100 scale-100"
        style={{ pointerEvents: 'auto' }}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Container do vídeo e controles */}
      <div 
        className="relative w-full h-full flex items-center justify-center"
        style={{ pointerEvents: 'auto' }}
      >
        <video
          ref={videoRef}
          src={videoUrl}
          className="max-w-full max-h-full object-contain transition-all duration-300 ease-out scale-100 opacity-100"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            setShowControls(!showControls)
          }}
          style={{
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pointerEvents: 'auto'
          }}
        />

        {/* Controles */}
        {showControls && (
          <div 
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4"
            style={{ pointerEvents: 'auto' }}
          >
            {/* Barra de progresso */}
            <div className="mb-4">
              <input
                type="range"
                min="0"
                max="100"
                value={(currentTime / duration) * 100 || 0}
                onChange={handleProgressChange}
                onClick={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onMouseDown={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                onMouseUp={(e) => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                className="w-full h-1 bg-white/30 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fff 0%, #fff ${(currentTime / duration) * 100 || 0}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100 || 0}%)`,
                  pointerEvents: 'auto'
                }}
              />
            </div>

            {/* Controles principais */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Play/Pause */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    togglePlay()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="text-white hover:bg-white/20"
                  style={{ pointerEvents: 'auto' }}
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </Button>

                {/* Skip Back */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    skip(-10)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="text-white hover:bg-white/20"
                  style={{ pointerEvents: 'auto' }}
                >
                  <SkipBack className="w-5 h-5" />
                </Button>

                {/* Skip Forward */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    skip(10)
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="text-white hover:bg-white/20"
                  style={{ pointerEvents: 'auto' }}
                >
                  <SkipForward className="w-5 h-5" />
                </Button>

                {/* Tempo */}
                <span className="text-white text-sm" style={{ pointerEvents: 'none' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Mute/Unmute */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    toggleMute()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="text-white hover:bg-white/20"
                  style={{ pointerEvents: 'auto' }}
                >
                  {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                </Button>

                {/* Fullscreen */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    videoRef.current?.requestFullscreen()
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                  className="text-white hover:bg-white/20"
                  style={{ pointerEvents: 'auto' }}
                >
                  <Maximize2 className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

export default VideoModal
