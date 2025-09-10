import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Image, Video, Sparkles, ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { useAuthContext } from "@/contexts/AuthContext"

interface PostPreviewProps {
  postData: {
    title: string
    description: string
    category: string
    postType: string
    images?: File[]
    videos?: File[]
  }
  isMobile?: boolean
}

const PostPreview = ({ postData, isMobile = false }: PostPreviewProps) => {
  const { user } = useAuthContext()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)
  
  // Nova implementação baseada em Instagram e Swiper.js
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [dragOffset, setDragOffset] = useState(0) // Para acompanhar o dedo em tempo real
  
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  
  const hasMedia = (postData.images && postData.images.length > 0) || 
                   (postData.videos && postData.videos.length > 0)

  // Resetar o índice quando as imagens mudam
  useEffect(() => {
    setCurrentImageIndex(0)
  }, [postData.images, postData.videos, postData.postType])

  const nextImage = () => {
    if (postData.images && postData.images.length > 1 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentImageIndex((prev) => 
        prev === postData.images!.length - 1 ? 0 : prev + 1
      )
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  const prevImage = () => {
    if (postData.images && postData.images.length > 1 && !isTransitioning) {
      setIsTransitioning(true)
      setCurrentImageIndex((prev) => 
        prev === 0 ? postData.images!.length - 1 : prev - 1
      )
      setTimeout(() => setIsTransitioning(false), 300)
    }
  }

  // Gestos de swipe para mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    const startX = e.targetTouches[0].clientX
    console.log('PostPreview - Touch start at:', startX)
    touchStartX.current = startX
    setTouchStart(startX)
    setIsSwiping(true)
    setDragOffset(0) // Resetar o drag
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    const currentX = e.targetTouches[0].clientX
    const startX = touchStartX.current
    const containerWidth = window.innerWidth
    const dragDistance = currentX - startX
    const dragPercentage = (dragDistance / containerWidth) * 100
    
    // Limitar o drag entre -100% e 100%
    const clampedDrag = Math.max(-100, Math.min(100, dragPercentage))
    setDragOffset(clampedDrag)
    
    console.log('PostPreview - Touch move - dragDistance:', dragDistance, 'dragPercentage:', dragPercentage, 'clampedDrag:', clampedDrag)
    touchEndX.current = currentX
    setTouchEnd(currentX)
  }

  const handleTouchEnd = () => {
    if (!isSwiping) return
    
    const minSwipeDistance = 50 // 50px mínimo para considerar swipe
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    console.log('PostPreview - Swipe - touchStartX:', touchStartX.current, 'touchEndX:', touchEndX.current, 'distance:', distance)
    console.log('Current image index:', currentImageIndex)
    
    if (isLeftSwipe && postData.images && currentImageIndex < postData.images.length - 1) {
      console.log('Swiping left to next image')
      setCurrentImageIndex(currentImageIndex + 1)
    } else if (isRightSwipe && currentImageIndex > 0) {
      console.log('Swiping right to previous image')
      setCurrentImageIndex(currentImageIndex - 1)
    } else {
      console.log('Not enough swipe distance or invalid direction')
    }
    
    // Resetar estados
    setIsSwiping(false)
    setTouchStart(0)
    setTouchEnd(0)
    setDragOffset(0) // Resetar o drag visual
    touchStartX.current = 0
    touchEndX.current = 0
  }

  const renderMediaPreview = () => {
    if (!hasMedia) {
      return (
        <div className="bg-muted flex items-center justify-center aspect-square">
          <div className="text-center text-muted-foreground">
            <Image className="w-8 h-8 mx-auto mb-2" />
            <p className="text-xs">Mídia será exibida aqui</p>
          </div>
        </div>
      )
    }

    if (postData.postType === 'before-after' && postData.images && postData.images.length === 2) {
      return (
        <div className="space-y-3">
          <div className="text-center">
            <Badge variant="outline" className="text-xs bg-gradient-hero text-white border-0 shadow-beauty-glow">
              <Sparkles className="w-3 h-3 mr-1" />
              Transformação Antes e Depois
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="relative group">
              <img 
                src={URL.createObjectURL(postData.images[0])} 
                alt="Antes"
                className="w-full aspect-square object-cover shadow-md border-2 border-red-200"
              />
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                ANTES
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <div className="relative group">
              <img 
                src={URL.createObjectURL(postData.images[1])} 
                alt="Depois"
                className="w-full aspect-square object-cover shadow-md border-2 border-green-200"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                DEPOIS
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
          </div>
        </div>
      )
    }

    if (postData.videos && postData.videos.length > 0) {
      return (
        <div className="relative">
          <video 
            src={URL.createObjectURL(postData.videos[0])}
            className="w-full aspect-square object-cover"
            muted
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="w-8 h-8 text-white bg-black/50 rounded-full p-2" />
          </div>
        </div>
      )
    }

    if (postData.images && postData.images.length > 0) {
      if (postData.images.length === 1) {
        return (
          <img 
            src={URL.createObjectURL(postData.images[0])} 
            alt="Preview"
            className="w-full aspect-square object-cover"
          />
        )
      } else {
        // Carrossel para múltiplas imagens com swipe real-time
        return (
          <div 
            ref={carouselRef}
            className="relative group overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div 
              className="flex w-full aspect-square transition-transform duration-300 ease-in-out"
              style={{ 
                transform: `translateX(calc(-${currentImageIndex * 100}% + ${dragOffset}%))`,
                transition: isSwiping ? 'none' : 'transform 0.3s ease-in-out'
              }}
            >
              {postData.images.map((image, index) => (
                <div key={index} className="w-full h-full flex-shrink-0">
                  <img 
                    src={URL.createObjectURL(image)} 
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            
            {/* Navegação do carrossel */}
            {postData.images.length > 1 && (
              <>
                {/* Botão anterior - apenas em desktop */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors hidden sm:block z-10"
                  disabled={isTransitioning || currentImageIndex === 0}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                {/* Botão próximo - apenas em desktop */}
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors hidden sm:block z-10"
                  disabled={isTransitioning || (postData.images && currentImageIndex === postData.images.length - 1)}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Indicadores */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {postData.images.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (!isTransitioning) {
                          setIsTransitioning(true)
                          setCurrentImageIndex(index)
                          setTimeout(() => setIsTransitioning(false), 300)
                        }
                      }}
                      className={`w-2 h-2 rounded-full transition-all duration-200 ${
                        index === currentImageIndex 
                          ? 'bg-white scale-110' 
                          : 'bg-white/50 hover:bg-white/75 hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
                
                {/* Contador */}
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                  {currentImageIndex + 1}/{postData.images.length}
                </div>

                {/* Indicador de swipe no mobile */}
                {isMobile && (
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    ← Arraste →
                  </div>
                )}
              </>
            )}
          </div>
        )
      }
    }

    return null
  }

  const getCategoryIcon = () => {
    const categoryIcons: { [key: string]: React.ReactNode } = {
      'Cabelos Femininos': '👩‍🦰',
      'Cabelos Masculinos': '👨‍🦱',
      'Cuidados com as Unhas': '💅',
      'Cuidados com a Barba': '🧔',
      'Estética Corporal': '💪',
      'Estética Facial': '✨',
      'Tatuagem': '🎨',
      'Piercing': '💎',
      'Maquiagem': '💄',
      'Sobrancelhas/Cílios': '👁️'
    }
    return categoryIcons[postData.category] || '📝'
  }

  const getPostTypeIcon = () => {
    if (postData.postType === 'before-after') {
      return <Sparkles className="w-4 h-4" />
    }
    return <Image className="w-4 h-4" />
  }

  if (isMobile) {
    return (
      <Card className="lg:hidden">
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar className="w-6 h-6">
              <AvatarImage src={user?.profile_photo} />
              <AvatarFallback className="w-6 h-6 bg-gradient-hero rounded-full flex items-center justify-center">
                <span className="text-white text-xs">
                  {user?.name?.charAt(0) || user?.nickname?.charAt(0) || 'U'}
                </span>
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-xs">{user?.name || 'Usuário'}</p>
              <p className="text-xs text-muted-foreground">Agora</p>
            </div>
          </div>
          
          {renderMediaPreview()}
          
          <div className="mt-2">
            <h3 className="font-bold text-sm mb-1">
              {postData.title || "Título do post..."}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {postData.description || "Descrição do post..."}
            </p>
            {/* Badge de categoria abaixo da descrição */}
            {postData.category && (
              <Badge variant="secondary" className="text-xs">
                {postData.category}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hidden lg:block">
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.profile_photo} />
            <AvatarFallback className="w-10 h-10 bg-gradient-hero rounded-full flex items-center justify-center">
              <span className="text-white text-sm">
                {user?.name?.charAt(0) || user?.nickname?.charAt(0) || 'U'}
              </span>
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{user?.name || 'Usuário'}</p>
            <p className="text-sm text-muted-foreground">Agora</p>
          </div>
        </div>
        
        {renderMediaPreview()}
        
        <div className="mt-4">
          <h3 className="font-bold text-lg mb-2">
            {postData.title || "Título do post..."}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {postData.description || "Descrição do post..."}
          </p>
          {/* Badge de categoria abaixo da descrição */}
          {postData.category && (
            <Badge variant="secondary" className="text-xs">
              {postData.category}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default PostPreview 