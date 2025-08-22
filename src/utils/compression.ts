// =====================================================
// UTILITÁRIOS DE COMPRESSÃO - MOBILE FIRST
// =====================================================

// Detectar se é dispositivo mobile
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
}

// Detectar suporte a WebP
export const supportsWebP = (): boolean => {
  if (typeof window === 'undefined') return false
  
  const canvas = document.createElement('canvas')
  canvas.width = 1
  canvas.height = 1
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
}

// =====================================================
// COMPRESSÃO DE IMAGENS
// =====================================================

interface ImageCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  forceFormat?: boolean
}

export const compressImage = async (
  file: File, 
  options: ImageCompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = isMobile() ? 800 : 1200,
    maxHeight = isMobile() ? 800 : 1200,
    quality = isMobile() ? 0.6 : 0.7,
    format = supportsWebP() ? 'webp' : 'jpeg',
    forceFormat = false
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      try {
        // Calcular novas dimensões mantendo proporção
        const ratio = Math.min(
          maxWidth / img.width,
          maxHeight / img.height,
          1 // Não aumentar a imagem
        )
        
        const newWidth = Math.round(img.width * ratio)
        const newHeight = Math.round(img.height * ratio)

        canvas.width = newWidth
        canvas.height = newHeight

        // Configurar contexto para melhor qualidade
        ctx!.imageSmoothingEnabled = true
        ctx!.imageSmoothingQuality = 'high'

        // Desenhar imagem redimensionada
        ctx!.drawImage(img, 0, 0, newWidth, newHeight)

        // Determinar formato de saída
        let outputFormat = format
        let outputMimeType = `image/${format}`
        
        if (!forceFormat && file.type === 'image/png' && format === 'jpeg') {
          // Se é PNG com transparência, manter PNG
          outputFormat = 'png'
          outputMimeType = 'image/png'
        }

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              // Gerar nome do arquivo com extensão correta
              const originalName = file.name
              const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'))
              const newFileName = `${nameWithoutExt}_compressed.${outputFormat}`
              
              const compressedFile = new File([blob], newFileName, {
                type: outputMimeType,
                lastModified: Date.now()
              })
              
              console.log(`📸 Imagem comprimida: ${file.size} → ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% redução)`)
              resolve(compressedFile)
            } else {
              reject(new Error('Falha na compressão da imagem'))
            }
          },
          outputMimeType,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'))
    }

    img.src = URL.createObjectURL(file)
  })
}

// =====================================================
// COMPRESSÃO DE VÍDEOS
// =====================================================

interface VideoCompressionOptions {
  maxWidth?: number
  maxHeight?: number
  bitrate?: number
  fps?: number
  quality?: number
}

export const compressVideo = async (
  file: File,
  options: VideoCompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = isMobile() ? 1280 : 1920, // 720p mobile, 1080p desktop
    maxHeight = isMobile() ? 720 : 1080,
    bitrate = isMobile() ? 1500000 : 2500000, // 1.5Mbps mobile, 2.5Mbps desktop
    fps = 30,
    quality = 0.8
  } = options

  return new Promise((resolve, reject) => {
    // Verificar se o navegador suporta MediaRecorder
    if (!window.MediaRecorder) {
      console.warn('MediaRecorder não suportado, retornando arquivo original')
      resolve(file)
      return
    }

    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    video.onloadedmetadata = () => {
      try {
        // Calcular dimensões mantendo proporção
        const ratio = Math.min(
          maxWidth / video.videoWidth,
          maxHeight / video.videoHeight,
          1
        )
        
        const newWidth = Math.round(video.videoWidth * ratio)
        const newHeight = Math.round(video.videoHeight * ratio)

        canvas.width = newWidth
        canvas.height = newHeight

        // Configurar MediaRecorder
        const stream = canvas.captureStream(fps)
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
          videoBitsPerSecond: bitrate
        })

        const chunks: Blob[] = []
        
        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.push(event.data)
          }
        }

        mediaRecorder.onstop = () => {
          const compressedBlob = new Blob(chunks, { type: 'video/webm' })
          const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '_compressed.webm'), {
            type: 'video/webm',
            lastModified: Date.now()
          })
          
          console.log(`🎥 Vídeo comprimido: ${file.size} → ${compressedFile.size} bytes (${Math.round((1 - compressedFile.size / file.size) * 100)}% redução)`)
          resolve(compressedFile)
        }

        mediaRecorder.onerror = (event) => {
          reject(new Error(`Erro na compressão do vídeo: ${event}`))
        }

        // Iniciar gravação
        mediaRecorder.start()

        // Reproduzir vídeo e capturar frames
        video.currentTime = 0
        video.play()

        const drawFrame = () => {
          if (video.ended || video.paused) {
            mediaRecorder.stop()
            return
          }

          ctx!.drawImage(video, 0, 0, newWidth, newHeight)
          requestAnimationFrame(drawFrame)
        }

        drawFrame()

      } catch (error) {
        reject(error)
      }
    }

    video.onerror = () => {
      reject(new Error('Erro ao carregar vídeo'))
    }

    video.src = URL.createObjectURL(file)
  })
}

// =====================================================
// VALIDAÇÃO DE ARQUIVOS
// =====================================================

export const validateFileSize = (file: File, maxSizeMB: number): boolean => {
  const maxSize = maxSizeMB * 1024 * 1024
  return file.size <= maxSize
}

export const validateImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  return allowedTypes.includes(file.type)
}

export const validateVideoFile = (file: File): boolean => {
  const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime']
  return allowedTypes.includes(file.type)
}

// =====================================================
// UTILITÁRIOS DE FORMATO
// =====================================================

export const getOptimalFormat = (file: File): string => {
  if (file.type.startsWith('image/')) {
    return supportsWebP() ? 'webp' : 'jpeg'
  }
  if (file.type.startsWith('video/')) {
    return 'webm'
  }
  return 'unknown'
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// =====================================================
// CONFIGURAÇÕES DE COMPRESSÃO POR TIPO
// =====================================================

export const COMPRESSION_CONFIGS = {
  // Imagens
  profile: {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.8,
    maxSizeMB: 2
  },
  post: {
    maxWidth: isMobile() ? 800 : 1200,
    maxHeight: isMobile() ? 800 : 1200,
    quality: isMobile() ? 0.6 : 0.7,
    maxSizeMB: 5
  },
  cover: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.9,
    maxSizeMB: 3
  },
  logo: {
    maxWidth: 800,
    maxHeight: 800,
    quality: 0.9,
    maxSizeMB: 1
  },
  
  // Vídeos
  video: {
    maxWidth: isMobile() ? 1280 : 1920,
    maxHeight: isMobile() ? 720 : 1080,
    bitrate: isMobile() ? 1500000 : 2500000,
    fps: 30,
    maxSizeMB: isMobile() ? 10 : 25
  }
} as const


