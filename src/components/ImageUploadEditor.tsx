import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { 
  Upload, 
  Image, 
  Video, 
  RotateCcw, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  X,
  Check
} from "lucide-react"
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageUploadEditorProps {
  postType: 'normal' | 'before-after'
  onImagesChange: (images: File[]) => void
  onVideosChange: (videos: File[]) => void
  onBeforeAfterComplete?: (isComplete: boolean) => void
}

interface UploadedFile {
  id: string
  file: File
  preview: string
  crop?: Crop
  edited?: boolean
  type?: 'before' | 'after'
}

const ImageUploadEditor = ({ 
  postType, 
  onImagesChange, 
  onVideosChange,
  onBeforeAfterComplete
}: ImageUploadEditorProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null)
  const [currentCrop, setCurrentCrop] = useState<Crop>()
  const [rotation, setRotation] = useState(0)
  const [zoom, setZoom] = useState(1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const beforeInputRef = useRef<HTMLInputElement>(null)
  const afterInputRef = useRef<HTMLInputElement>(null)

  // Verificar se as duas fotos estão carregadas para "Antes e Depois"
  useEffect(() => {
    if (postType === 'before-after' && onBeforeAfterComplete) {
      const beforePhoto = uploadedFiles.find(f => f.type === 'before')
      const afterPhoto = uploadedFiles.find(f => f.type === 'after')
      const isComplete = !!(beforePhoto && afterPhoto)
      onBeforeAfterComplete(isComplete)
    }
  }, [uploadedFiles, postType, onBeforeAfterComplete])

     const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
     const files = event.target.files
     if (!files) return

     // Validar duração dos vídeos
     const validateVideoDuration = async (file: File): Promise<boolean> => {
       return new Promise((resolve) => {
         const video = document.createElement('video')
         video.preload = 'metadata'
         video.onloadedmetadata = () => {
           URL.revokeObjectURL(video.src)
           const duration = video.duration
           resolve(duration <= 60) // Máximo 1 minuto (60 segundos)
         }
         video.onerror = () => {
           URL.revokeObjectURL(video.src)
           resolve(false)
         }
         video.src = URL.createObjectURL(file)
       })
     }

     // Validar tamanho dos vídeos
     const validateVideoSize = (file: File): boolean => {
       const maxSizeMB = window.innerWidth <= 768 ? 10 : 25 // 10MB mobile, 25MB desktop
       const maxSize = maxSizeMB * 1024 * 1024
       return file.size <= maxSize
     }

     const processFiles = async () => {
       const newFiles: UploadedFile[] = []
       
       for (const file of Array.from(files)) {
         if (file.type.startsWith('video/')) {
           const isValidDuration = await validateVideoDuration(file)
           if (!isValidDuration) {
             alert('Vídeos devem ter no máximo 1 minuto de duração')
             return
           }
           
           const isValidSize = validateVideoSize(file)
           if (!isValidSize) {
             const maxSizeMB = window.innerWidth <= 768 ? 10 : 25
             alert(`Vídeo muito grande. Máximo: ${maxSizeMB}MB`)
             return
           }
         }
         
         newFiles.push({
           id: Math.random().toString(36).substr(2, 9),
           file,
           preview: URL.createObjectURL(file),
           crop: undefined,
           edited: false
         })
       }

       // Separar novos arquivos por tipo
       const newImages = newFiles.filter(f => f.file.type.startsWith('image/'))
       const newVideos = newFiles.filter(f => f.file.type.startsWith('video/'))
    
            // Verificar arquivos existentes
        const existingImages = uploadedFiles.filter(f => f.file.type.startsWith('image/'))
        const existingVideos = uploadedFiles.filter(f => f.file.type.startsWith('video/'))

        // REGRA 1: Se já existe um vídeo, não pode adicionar mais nada
        if (existingVideos.length > 0) {
          alert('Post de vídeo: apenas 1 vídeo é permitido por post')
          newFiles.forEach(f => URL.revokeObjectURL(f.preview))
          return
        }

        // REGRA 2: Se está tentando adicionar vídeo e já há imagens
        if (newVideos.length > 0 && existingImages.length > 0) {
          alert('Não é possível misturar vídeo com fotos. Escolha apenas um tipo de mídia.')
          newFiles.forEach(f => URL.revokeObjectURL(f.preview))
          return
        }

        // REGRA 3: Se está tentando adicionar imagens e já há vídeo
        if (newImages.length > 0 && existingVideos.length > 0) {
          alert('Não é possível misturar fotos com vídeo. Escolha apenas um tipo de mídia.')
          newFiles.forEach(f => URL.revokeObjectURL(f.preview))
          return
        }

        // REGRA 4: Limite de 5 fotos para carrossel
        if (newImages.length > 0 && (existingImages.length + newImages.length) > 5) {
          alert('Máximo de 5 fotos permitidas para carrossel')
          newFiles.forEach(f => URL.revokeObjectURL(f.preview))
          return
        }

        // REGRA 5: Apenas 1 vídeo
        if (newVideos.length > 1) {
          alert('Apenas 1 vídeo é permitido por post')
          newFiles.forEach(f => URL.revokeObjectURL(f.preview))
          return
        }

        setUploadedFiles(prev => [...prev, ...newFiles])
        
        // Atualizar callbacks
        if (newImages.length > 0) {
          onImagesChange([...existingImages, ...newImages].map(f => f.file))
        }
        if (newVideos.length > 0) {
          onVideosChange(newVideos.map(f => f.file))
        }
      }

      // Executar o processamento
      processFiles()
  }

  const handleBeforeAfterSelect = (type: 'before' | 'after', event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    const file = files[0]
    
    // Verificar se já existe uma foto deste tipo
    const existingPhoto = uploadedFiles.find(f => f.type === type)
    if (existingPhoto) {
      alert(`Você já carregou a foto de ${type === 'before' ? 'Antes' : 'Depois'}`)
      return
    }

    const newFile: UploadedFile = {
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      crop: undefined,
      edited: false,
      type
    }

    setUploadedFiles(prev => {
      const newFiles = [...prev, newFile]
      
      // Atualizar callbacks com todas as imagens
      const allImages = newFiles.filter(f => f.file.type.startsWith('image/'))
      onImagesChange(allImages.map(f => f.file))
      
      // Verificar se antes e depois estão completos
      const beforeImage = newFiles.find(f => f.type === 'before')
      const afterImage = newFiles.find(f => f.type === 'after')
      if (beforeImage && afterImage && onBeforeAfterComplete) {
        onBeforeAfterComplete(true)
      } else if (onBeforeAfterComplete) {
        onBeforeAfterComplete(false)
      }
      
      return newFiles
    })
  }

  const handleFileClick = (file: UploadedFile) => {
    setSelectedFile(file)
    setCurrentCrop(file.crop)
    setRotation(0)
    setZoom(1)
  }

  const handleCropChange = useCallback((crop: Crop) => {
    setCurrentCrop(crop)
  }, [])

  const handleCropComplete = useCallback((crop: PixelCrop) => {
    if (selectedFile) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === selectedFile.id 
          ? { ...f, crop: crop, edited: true }
          : f
      ))
    }
  }, [selectedFile])

  const handleRotate = (direction: 'left' | 'right') => {
    setRotation(prev => direction === 'left' ? prev - 90 : prev + 90)
  }

  const handleZoom = (direction: 'in' | 'out') => {
    setZoom(prev => {
      const newZoom = direction === 'in' ? prev * 1.2 : prev / 1.2
      return Math.min(Math.max(newZoom, 0.5), 3)
    })
  }

  const handleApplyCrop = () => {
    if (selectedFile && currentCrop) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === selectedFile.id 
          ? { ...f, crop: currentCrop, edited: true }
          : f
      ))
      setSelectedFile(null)
      setCurrentCrop(undefined)
    }
  }

  const handleRemoveFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId)
      if (file) {
        URL.revokeObjectURL(file.preview)
      }
      const newFiles = prev.filter(f => f.id !== fileId)
      
      // Recalcular callbacks
      const remainingImages = newFiles.filter(f => f.file.type.startsWith('image/'))
      const remainingVideos = newFiles.filter(f => f.file.type.startsWith('video/'))
      
      if (remainingImages.length > 0) {
        onImagesChange(remainingImages.map(f => f.file))
      } else {
        onImagesChange([])
      }
      
      if (remainingVideos.length > 0) {
        onVideosChange(remainingVideos.map(f => f.file))
      } else {
        onVideosChange([])
      }
      
      // Verificar se antes e depois ainda estão completos
      const beforeImage = newFiles.find(f => f.type === 'before')
      const afterImage = newFiles.find(f => f.type === 'after')
      if (beforeImage && afterImage && onBeforeAfterComplete) {
        onBeforeAfterComplete(true)
      } else if (onBeforeAfterComplete) {
        onBeforeAfterComplete(false)
      }
      
      return newFiles
    })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <Image className="w-6 h-6" />
    } else if (file.type.startsWith('video/')) {
      return <Video className="w-6 h-6" />
    }
    return <Upload className="w-6 h-6" />
  }

    const renderUploadArea = () => {
    if (postType === 'before-after') {
      return renderBeforeAfterUpload()
    }

    const existingImages = uploadedFiles.filter(f => f.file.type.startsWith('image/'))
    const existingVideos = uploadedFiles.filter(f => f.file.type.startsWith('video/'))
    
         const getUploadMessage = () => {
       if (existingVideos.length > 0) {
         return "Post de vídeo completo"
       } else if (existingImages.length === 0) {
         return "1 vídeo (máx. 1 min) OU até 5 fotos"
       } else if (existingImages.length === 1) {
         return "Foto única ou adicione mais para carrossel"
       } else if (existingImages.length >= 5) {
         return "Carrossel completo (5/5)"
       } else {
         return `Carrossel: ${existingImages.length}/5`
       }
     }

         const isUploadDisabled = existingVideos.length > 0 || existingImages.length >= 5

    return (
      <div className="space-y-4">
                 <div className="text-center">
           <Button
             variant="outline"
             onClick={() => fileInputRef.current?.click()}
             disabled={isUploadDisabled}
             className={`w-full ${uploadedFiles.length > 0 ? 'h-20' : 'h-32'} border-dashed border-2 transition-colors ${
               isUploadDisabled 
                 ? 'border-muted-foreground/10 bg-muted/20 cursor-not-allowed' 
                 : 'border-muted-foreground/25 hover:border-primary/50'
             }`}
           >
                         <div className="flex flex-col items-center gap-2">
               <Upload className={`${uploadedFiles.length > 0 ? 'w-6 h-6' : 'w-8 h-8'} ${isUploadDisabled ? 'text-muted-foreground/50' : 'text-muted-foreground'}`} />
               <div className="text-center max-w-full">
                 <p className={`${uploadedFiles.length > 0 ? 'text-sm' : 'font-medium'}`}>
                   {uploadedFiles.length > 0 ? 'Adicionar mais' : 'Clique para fazer upload'}
                 </p>
                 <p className="text-xs text-muted-foreground leading-relaxed px-2">
                   {getUploadMessage()}
                 </p>
               </div>
             </div>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Tipo de Post */}
        {uploadedFiles.length > 0 && (
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {existingVideos.length > 0 ? (
                <>
                  <Video className="w-4 h-4" />
                  Post de Vídeo
                </>
              ) : existingImages.length === 1 ? (
                <>
                  <Image className="w-4 h-4" />
                  Post de Foto Única
                </>
              ) : (
                <>
                  <Image className="w-4 h-4" />
                  Carrossel de Fotos ({existingImages.length}/5)
                </>
              )}
            </div>
          </div>
        )}

        {/* Arquivos carregados */}
        {uploadedFiles.length > 0 && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Arquivos carregados</Label>
                         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
              {uploadedFiles.map((file) => (
                <Card 
                  key={file.id}
                  className={`cursor-pointer transition-all hover:shadow-lg max-w-[120px] sm:max-w-[150px] ${
                    selectedFile?.id === file.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : ''
                  }`}
                  onClick={() => handleFileClick(file)}
                >
                                     <CardContent className="p-2 sm:p-3 relative">
                                         <div className="aspect-square bg-muted rounded-lg flex items-center justify-center mb-2 max-h-[80px] sm:max-h-[100px] mx-auto w-20 sm:w-24">
                       {file.file.type.startsWith('image/') ? (
                         <img 
                           src={file.preview} 
                           alt="Preview" 
                           className="w-full h-full object-cover rounded-lg"
                         />
                       ) : (
                         <div className="flex items-center justify-center">
                           {getFileIcon(file.file)}
                         </div>
                       )}
                     </div>
                                         <div className="flex items-center justify-between">
                       <span className="text-xs truncate max-w-[60%]">{file.file.name}</span>
                      {file.edited && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6 bg-background/80 hover:bg-background"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveFile(file.id)
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderBeforeAfterUpload = () => {
    const beforePhoto = uploadedFiles.find(f => f.type === 'before')
    const afterPhoto = uploadedFiles.find(f => f.type === 'after')

    return (
      <div className="space-y-6">
                 <div className="grid grid-cols-1 gap-4">
          {/* Foto Antes */}
          <Card className={`transition-all ${beforePhoto ? 'ring-2 ring-green-500 bg-green-50' : 'hover:bg-muted/50'}`}>
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">Foto de Antes</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Como estava antes da transformação
                  </p>
                </div>
                
                                 {beforePhoto ? (
                   <div className="space-y-2">
                     <div className="relative aspect-square bg-muted rounded-lg overflow-hidden max-h-[100px] sm:max-h-[120px] mx-auto w-24 sm:w-28">
                       <img 
                         src={beforePhoto.preview} 
                         alt="Antes" 
                         className="w-full h-full object-cover"
                       />
                       <Button
                         variant="ghost"
                         size="icon"
                         className="absolute top-1 right-1 h-5 w-5 bg-background/80 hover:bg-background"
                         onClick={() => handleRemoveFile(beforePhoto.id)}
                       >
                         <X className="w-3 h-3" />
                       </Button>
                       {beforePhoto.edited && (
                         <div className="absolute top-1 left-1">
                           <Check className="w-4 h-4 text-green-500 bg-white rounded-full p-0.5" />
                         </div>
                       )}
                     </div>
                     <div className="text-center">
                       <span className="text-xs text-muted-foreground truncate block max-w-full">
                         {beforePhoto.file.name}
                       </span>
                     </div>
                     <div className="flex justify-center">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleFileClick(beforePhoto)}
                         className="text-xs px-3"
                       >
                         Editar
                       </Button>
                     </div>
                   </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => beforeInputRef.current?.click()}
                    className="w-full h-24 border-dashed border-2 border-muted-foreground/25 hover:border-green-500/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Carregar Foto de Antes</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={beforeInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBeforeAfterSelect('before', e)}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          {/* Foto Depois */}
          <Card className={`transition-all ${afterPhoto ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-muted/50'}`}>
            <CardContent className="p-4">
              <div className="text-center space-y-3">
                
                <div>
                  <h3 className="font-semibold text-lg mb-1">Foto de Depois</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    O resultado incrível da transformação
                  </p>
                </div>
                
                                 {afterPhoto ? (
                   <div className="space-y-2">
                     <div className="relative aspect-square bg-muted rounded-lg overflow-hidden max-h-[100px] sm:max-h-[120px] mx-auto w-24 sm:w-28">
                       <img 
                         src={afterPhoto.preview} 
                         alt="Depois" 
                         className="w-full h-full object-cover"
                       />
                       <Button
                         variant="ghost"
                         size="icon"
                         className="absolute top-1 right-1 h-5 w-5 bg-background/80 hover:bg-background"
                         onClick={() => handleRemoveFile(afterPhoto.id)}
                       >
                         <X className="w-3 h-3" />
                       </Button>
                       {afterPhoto.edited && (
                         <div className="absolute top-1 left-1">
                           <Check className="w-4 h-4 text-green-500 bg-white rounded-full p-0.5" />
                         </div>
                       )}
                     </div>
                     <div className="text-center">
                       <span className="text-xs text-muted-foreground truncate block max-w-full">
                         {afterPhoto.file.name}
                       </span>
                     </div>
                     <div className="flex justify-center">
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => handleFileClick(afterPhoto)}
                         className="text-xs px-3"
                       >
                         Editar
                       </Button>
                     </div>
                   </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => afterInputRef.current?.click()}
                    className="w-full h-24 border-dashed border-2 border-muted-foreground/25 hover:border-blue-500/50 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Carregar Foto de Depois</span>
                    </div>
                  </Button>
                )}
                <input
                  ref={afterInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleBeforeAfterSelect('after', e)}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>
        </div>

                 {/* Status das fotos */}
         <div className="text-center">
           <div className="inline-flex flex-col items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg">
             <span className="text-xs font-medium text-muted-foreground">Status do Upload</span>
             <div className="flex gap-3">
               <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                 beforePhoto ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
               }`}>
                 <span>{beforePhoto ? '✅' : '⏳'}</span>
                 <span>{beforePhoto ? 'Antes' : 'Aguardando'}</span>
               </div>
               <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                 afterPhoto ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
               }`}>
                 <span>{afterPhoto ? '✅' : '⏳'}</span>
                 <span>{afterPhoto ? 'Depois' : 'Aguardando'}</span>
               </div>
             </div>
           </div>
         </div>
      </div>
    )
  }

  const renderEditor = () => {
    if (!selectedFile) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Editor</h3>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotate('left')}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotate('right')}
            >
              <RotateCw className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom('out')}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom('in')}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="relative bg-muted rounded-lg overflow-hidden">
          <ReactCrop
            crop={currentCrop}
            onChange={handleCropChange}
            onComplete={handleCropComplete}
            aspect={postType === 'normal' ? 1 : undefined}
          >
            <img
              src={selectedFile.preview}
              alt="Editor"
              style={{
                transform: `rotate(${rotation}deg) scale(${zoom})`,
                transition: 'transform 0.2s ease'
              }}
              className="max-w-full h-auto"
            />
          </ReactCrop>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSelectedFile(null)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleApplyCrop}
            className="flex-1"
          >
            Aplicar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {selectedFile ? renderEditor() : renderUploadArea()}
    </div>
  )
}

export default ImageUploadEditor 