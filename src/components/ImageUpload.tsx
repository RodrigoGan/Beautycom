import React, { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useStorage, BucketType } from '@/hooks/useStorage'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  bucket: BucketType
  onUploadComplete: (url: string) => void
  onRemove?: () => void
  currentImage?: string
  userId?: string
  postId?: string
  businessId?: string
  className?: string
  aspectRatio?: 'square' | 'video' | 'auto'
  maxSize?: number // em MB
  disabled?: boolean
}

export function ImageUpload({
  bucket,
  onUploadComplete,
  onRemove,
  currentImage,
  userId,
  postId,
  businessId,
  className,
  aspectRatio = 'square',
  maxSize = 5,
  disabled = false
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null)
  const [isUploading, setIsUploading] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const { uploadImage, validateFile, compressImage } = useStorage()

  // Atualizar preview quando currentImage mudar
  useEffect(() => {
    setPreview(currentImage || null)
  }, [currentImage])

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showMenu && !event.target?.closest('.image-upload-container')) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const handleFileSelect = async (file: File) => {
    if (disabled) return

    try {
      // Validar arquivo
      validateFile(file, maxSize)

      // Criar preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Comprimir e fazer upload
      setIsUploading(true)
      const compressedFile = await compressImage(file, 1200, 0.8)
      
      const url = await uploadImage({
        bucket,
        file: compressedFile,
        userId,
        postId,
        businessId
      })

      if (url) {
        onUploadComplete(url)
      }
    } catch (error) {
      console.error('Erro ao processar imagem:', error)
      setPreview(null)
    } finally {
      setIsUploading(false)
      setShowMenu(false)
    }
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onRemove?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square'
      case 'video':
        return 'aspect-video'
      case 'auto':
        return 'aspect-auto'
      default:
        return 'aspect-square'
    }
  }

  const getBucketConfig = () => {
    switch (bucket) {
      case 'fotoperfil':
        return {
          title: 'Foto de Perfil',
          description: 'Sua foto de perfil',
          icon: '👤',
          maxWidth: 400
        }
      case 'fotopost':
        return {
          title: 'Foto do Post',
          description: 'Imagem para o post',
          icon: '📸',
          maxWidth: 1200
        }
      case 'fotodecapa':
        return {
          title: 'Foto de Capa',
          description: 'Foto de capa do salão',
          icon: '🖼️',
          maxWidth: 800
        }
      case 'logotipo':
        return {
          title: 'Logotipo',
          description: 'Logo do estabelecimento',
          icon: '🏢',
          maxWidth: 800
        }
      default:
        return {
          title: 'Imagem',
          description: 'Selecione uma imagem',
          icon: '📷',
          maxWidth: 1200
        }
    }
  }

  const config = getBucketConfig()

  return (
    <div className={cn('image-upload-container', className)}>
             <Card className={cn(
         'relative overflow-hidden border-2 border-dashed border-primary/30 hover:border-primary/50 transition-colors cursor-pointer bg-gradient-card',
         getAspectRatioClass(),
         disabled && 'opacity-50 cursor-not-allowed',
         preview && 'border-solid border-primary/20'
       )}>
        {/* Preview da imagem */}
        {preview && (
          <div className="absolute inset-0">
            <img
              src={preview}
              alt={config.title}
              className="w-full h-full object-cover"
            />
            
            {/* Overlay com botões */}
            <div className="absolute inset-0 bg-black/20 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setShowMenu(true)}
                  disabled={disabled || isUploading}
                  className="bg-white/90 hover:bg-white text-gray-800"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  Alterar
                </Button>
                
                {onRemove && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    disabled={disabled || isUploading}
                    className="bg-red-500/90 hover:bg-red-500 text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Loading overlay */}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Enviando...</span>
                </div>
              </div>
            )}
          </div>
        )}

                 {/* Estado vazio */}
         {!preview && (
           <div 
             className="flex flex-col items-center justify-center h-full p-3 text-center"
             onClick={() => !disabled && setShowMenu(true)}
           >
             <div className="text-3xl mb-1">{config.icon}</div>
             <p className="text-xs text-muted-foreground">
               Clique para adicionar
             </p>
           </div>
         )}

        {/* Menu de opções */}
        {showMenu && !disabled && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
            <Card className="p-4 bg-white shadow-lg max-w-sm w-full mx-4">
              <h3 className="font-medium text-gray-900 mb-4 text-center">
                Escolha uma opção
              </h3>
              
              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    cameraInputRef.current?.click()
                    setShowMenu(false)
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Tirar Foto
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => {
                    fileInputRef.current?.click()
                    setShowMenu(false)
                  }}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Escolher da Galeria
                </Button>
                
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => setShowMenu(false)}
                >
                  Cancelar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </Card>

      {/* Inputs ocultos */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />

      
    </div>
  )
} 