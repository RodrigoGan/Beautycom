import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { LikeButton } from "@/components/LikeButton"
import { CommentSection } from "@/components/CommentSection"
import { ShareButton } from "@/components/ShareButton"
import { FavoriteButton } from "@/components/FavoriteButton"
import { CommentCount } from "@/components/CommentCount"
import { CommentInput } from "@/components/CommentInput"
import { PostMenu } from "@/components/PostMenu"
import { useAuthContext } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { Heart, MessageCircle, Bookmark, Share2, Play, ChevronLeft, ChevronRight, Star } from "lucide-react"
import FeedVideo from "@/components/FeedVideo"
import VideoModal from "@/components/VideoModal"
import { OptimizedImage } from './OptimizedImage'
import { useLoopDetection } from '@/utils/loopDetector'

interface PostModalProps {
  post: any
  isOpen: boolean
  onClose: () => void
  onPostDeleted?: () => void
}

export const PostModal = ({ post, isOpen, onClose, onPostDeleted }: PostModalProps) => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const loopDetection = useLoopDetection('PostModal')
  
  // Estados para carrossel
  const [carouselIndex, setCarouselIndex] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  
  // Refs para touch
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)

  // Estados para modal de imagem (antes/depois)
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    label: string
    type: 'before' | 'after'
  } | null>(null)
  const [beforeAfterImages, setBeforeAfterImages] = useState<{
    before: { url: string; label: string }
    after: { url: string; label: string }
  } | null>(null)
  
  // Estados para carrossel de antes/depois (como na BeautyWall)
  const [carouselPosition, setCarouselPosition] = useState(0)

  // Estados para modal de vídeo
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string>('')

  // Estado para controlar visibilidade dos comentários
  const [showComments, setShowComments] = useState(false)
  
  // Ref para a área de comentários
  const commentsRef = useRef<HTMLDivElement>(null)
  
  // Efeito para fazer scroll quando comentários são exibidos
  useEffect(() => {
    if (showComments && commentsRef.current) {
      setTimeout(() => {
        commentsRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'start' 
        })
      }, 100) // Pequeno delay para garantir que o conteúdo foi renderizado
    }
  }, [showComments]) // Removida dependência loopDetection

  const handleImageClick = (url: string, label: string, type: 'before' | 'after', beforeUrl?: string, afterUrl?: string) => {
    setSelectedImage({ url, label, type })
    if (beforeUrl && afterUrl) {
      setBeforeAfterImages({
        before: { url: beforeUrl, label: 'ANTES' },
        after: { url: afterUrl, label: 'DEPOIS' }
      })
    }
    setShowImageModal(true)
  }

  const handleVideoClick = (videoUrl: string) => {
    setSelectedVideo(videoUrl)
    setShowVideoModal(true)
  }

  // Funções para carrossel de antes/depois (como na BeautyWall)
  const handleNextImage = () => {
    if (beforeAfterImages) {
      setCarouselPosition(1)
    }
  }

  const handlePrevImage = () => {
    if (beforeAfterImages) {
      setCarouselPosition(0)
    }
  }

  // Gestos de swipe para mobile (modal de imagem)
  const handleTouchStart = (e: React.TouchEvent) => {
    const startX = e.targetTouches[0].clientX
    touchStartX.current = startX
    setIsSwiping(true)
    setDragOffset(0)
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
    
    touchEndX.current = currentX
  }

  const handleTouchEnd = () => {
    if (!isSwiping) return
    
    const minSwipeDistance = 50 // 50px mínimo para considerar swipe
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe && carouselPosition === 0) {
      setCarouselPosition(1)
    } else if (isRightSwipe && carouselPosition === 1) {
      setCarouselPosition(0)
    }
    
    // Resetar estados
    setIsSwiping(false)
    touchStartX.current = 0
    touchEndX.current = 0
    setDragOffset(0)
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'agora mesmo'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 2592000)}m`
  }

  const handleNavigateToProfile = () => {
    onClose()
    navigate(`/perfil/${post.user_id}`)
  }

  if (!post) return null

  return (
    <>
             <Dialog open={isOpen} onOpenChange={onClose}>
                   <DialogContent className="max-w-[90vw] sm:max-w-4xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto p-0 bg-white mx-4 sm:mx-6 rounded-xl">
                                 <DialogHeader className="p-4 border-b relative">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Avatar className="w-10 h-10 cursor-pointer flex-shrink-0" onClick={handleNavigateToProfile}>
                  <AvatarImage src={post.user?.profile_photo} />
                  <AvatarFallback className="bg-gradient-primary text-white">
                    {post.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 cursor-pointer hover:text-purple-600 truncate" onClick={handleNavigateToProfile}>
                      {post.user?.name || 'Usuário'}
                    </span>
                    {post.user?.user_type === 'profissional' && (
                      <Badge variant="secondary" className="text-xs bg-gradient-primary text-white flex-shrink-0">
                        Profissional
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{formatTimeAgo(post.created_at)}</span>
                    {post.user?.cidade && post.user?.uf && (
                      <>
                        <span>•</span>
                        <span className="truncate">{post.user.cidade}, {post.user.uf}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="absolute bottom-2 right-4">
                <PostMenu 
                  postId={post.id} 
                  postUserId={post.user_id}
                  postTitle={post.titulo || ''}
                  postDescription={post.descricao || ''}
                  postCategory={post.categoria || ''}
                  onPostDeleted={onPostDeleted}
                />
              </div>
            </DialogHeader>

          <div className="flex flex-col lg:flex-row">
            {/* Área de mídia */}
            <div className="lg:w-2/3 bg-black">
                             {post.isBeforeAfter ? (
                 <div className="grid grid-cols-2 gap-1 max-h-[80vh]">
                  <div className="relative group cursor-pointer aspect-square" onClick={() => handleImageClick(post.beforeUrl, 'ANTES', 'before', post.beforeUrl, post.afterUrl)}>
                    <OptimizedImage 
                      src={post.beforeUrl} 
                      alt="Antes"
                      className="w-full h-full object-cover"
                      onError={() => {
                        loopDetection.detectImageLoad(post.beforeUrl)
                      }}
                    />
                    <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                      ANTES
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="relative group cursor-pointer aspect-square" onClick={() => handleImageClick(post.afterUrl, 'DEPOIS', 'after', post.beforeUrl, post.afterUrl)}>
                    <OptimizedImage 
                      src={post.afterUrl} 
                      alt="Depois"
                      className="w-full h-full object-cover"
                      onError={() => {
                        loopDetection.detectImageLoad(post.afterUrl)
                      }}
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                      DEPOIS
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                </div>
                             ) : post.isVideo ? (
                 <div className="h-80 sm:h-96 lg:h-[600px]">
                  <FeedVideo 
                    videoUrl={post.imagem}
                    mutedByDefault={false}
                    className="w-full h-full"
                    onVideoClick={() => handleVideoClick(post.imagem)}
                  />
                </div>
                             ) : post.isCarousel && post.carouselImages && post.carouselImages.length > 1 ? (
                 <div 
                   className="relative h-80 sm:h-96 lg:h-[600px] overflow-hidden"
                  onTouchStart={(e) => {
                    const startX = e.targetTouches[0].clientX
                    touchStartX.current = startX
                    setIsSwiping(true)
                    setDragOffset(0)
                  }}
                  onTouchMove={(e) => {
                    if (!isSwiping) return
                    
                    const currentX = e.targetTouches[0].clientX
                    const startX = touchStartX.current
                    const containerWidth = window.innerWidth
                    const dragDistance = currentX - startX
                    const dragPercentage = (dragDistance / containerWidth) * 100
                    const clampedDrag = Math.max(-100, Math.min(100, dragPercentage))
                    
                    setDragOffset(clampedDrag)
                    touchEndX.current = currentX
                  }}
                  onTouchEnd={() => {
                    if (!isSwiping) return
                    
                    const minSwipeDistance = 50
                    const distance = touchStartX.current - touchEndX.current
                    const isLeftSwipe = distance > minSwipeDistance
                    const isRightSwipe = distance < -minSwipeDistance
                    
                    if (isLeftSwipe && carouselIndex < post.carouselImages.length - 1) {
                      setCarouselIndex(carouselIndex + 1)
                    } else if (isRightSwipe && carouselIndex > 0) {
                      setCarouselIndex(carouselIndex - 1)
                    }
                    
                    setIsSwiping(false)
                    touchStartX.current = 0
                    touchEndX.current = 0
                    setDragOffset(0)
                  }}
                >
                  <div 
                    className="flex w-full h-full transition-transform duration-300 ease-in-out"
                    style={{ 
                      transform: `translateX(calc(-${carouselIndex * 100}% + ${dragOffset}%))`,
                      transition: isSwiping ? 'none' : 'transform 0.3s ease-in-out'
                    }}
                  >
                    {post.carouselImages.map((imageUrl: string, index: number) => (
                      <div key={index} className="w-full h-full flex-shrink-0">
                        <img 
                          src={imageUrl} 
                          alt={`Post ${index + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  
                  {/* Indicadores do carrossel */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                    {post.carouselImages.map((_: any, index: number) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-200 ${
                          index === carouselIndex 
                            ? 'bg-white scale-110' 
                            : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                  
                  {/* Contador */}
                  <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
                    {carouselIndex + 1}/{post.carouselImages.length}
                  </div>
                  
                                     {/* Setas de navegação para desktop */}
                   <div className="absolute inset-0 pointer-events-none hidden md:block">
                     <button
                       onClick={() => {
                         if (carouselIndex > 0) {
                           setCarouselIndex(carouselIndex - 1)
                         }
                       }}
                       className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-50 ${
                         carouselIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                       }`}
                       disabled={carouselIndex === 0}
                     >
                       <ChevronLeft className="w-5 h-5" />
                     </button>
                     <button
                       onClick={() => {
                         if (carouselIndex < post.carouselImages.length - 1) {
                           setCarouselIndex(carouselIndex + 1)
                         }
                       }}
                       className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-50 ${
                         carouselIndex === post.carouselImages.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                       }`}
                       disabled={carouselIndex === post.carouselImages.length - 1}
                     >
                       <ChevronRight className="w-5 h-5" />
                     </button>
                   </div>
                </div>
                             ) : (
                 <div className="h-80 sm:h-96 lg:h-[600px]">
                  <img 
                    src={post.imagem} 
                    alt={post.titulo}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>

            {/* Área de conteúdo */}
            <div className="lg:w-1/3 flex flex-col">
                             {/* Ações do Post */}
               <div className="p-4 border-b">
                 <div className="flex items-center justify-between mb-3">
                   <div className="flex gap-4">
                     <LikeButton postId={post.id} />
                     <CommentCount 
                       postId={post.id} 
                       postTitle={post.titulo} 
                       onToggleComments={() => setShowComments(!showComments)}
                     />
                     <ShareButton 
                       postId={post.id} 
                       postTitle={post.titulo}
                       postUrl={`${window.location.origin}/post/${post.id}`}
                     />
                   </div>
                   <div className="flex items-center gap-2">
                     <FavoriteButton postId={post.id} />
                   </div>
                 </div>

                 {/* Título e Descrição */}
                 <div className="mb-2">
                   <h3 className="font-semibold text-gray-900 mb-1">{post.titulo}</h3>
                   {post.descricao && (
                     <p className="text-gray-700 text-sm leading-relaxed">{post.descricao}</p>
                   )}
                 </div>

                 {/* Categoria */}
                 {post.categoria && (
                   <div className="mb-3">
                     <Badge variant="outline" className="text-xs">
                       {post.categoria}
                     </Badge>
                   </div>
                 )}
               </div>

                               {/* Seção de comentários simplificada */}
                <div className="flex-1 overflow-y-auto" ref={commentsRef}>
                  <CommentSection 
                    postId={post.id} 
                    showComments={showComments}
                    onToggleComments={() => setShowComments(!showComments)}
                  />
                </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

                          {/* Modal de imagem ampliada (antes/depois) */}
        <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
          <DialogContent className="sm:max-w-none w-full h-full max-h-none p-0 bg-black/95">
            <div className="relative w-full h-full flex flex-col">
              {/* Header do modal */}
              <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline" 
                    className={`text-sm font-semibold ${
                      carouselPosition === 0 
                        ? 'bg-red-500 text-white border-red-500' 
                        : 'bg-green-500 text-white border-green-500'
                    }`}
                  >
                    {carouselPosition === 0 ? 'ANTES' : 'DEPOIS'}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImageModal(false)}
                  className="h-8 w-8 text-white hover:bg-white/10"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>

              {/* Carrossel de imagens */}
              <div 
                className="flex-1 relative overflow-hidden"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                {beforeAfterImages && (
                  <div 
                    className="flex h-full transition-transform duration-300 ease-in-out"
                    style={{ 
                      transform: `translateX(calc(-${carouselPosition * 100}% + ${dragOffset}%))`,
                      transition: isSwiping ? 'none' : 'transform 0.3s ease-in-out'
                    }}
                  >
                    {/* Imagem ANTES */}
                    <div className="w-full h-full flex-shrink-0 flex items-center justify-center p-4">
                      <img 
                        src={beforeAfterImages.before.url} 
                        alt="Antes"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    
                    {/* Imagem DEPOIS */}
                    <div className="w-full h-full flex-shrink-0 flex items-center justify-center p-4">
                      <img 
                        src={beforeAfterImages.after.url} 
                        alt="Depois"
                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Setas de navegação (apenas em telas maiores) */}
                <div className="absolute inset-0 pointer-events-none hidden md:block">
                  {/* Seta esquerda */}
                  <button
                    onClick={handlePrevImage}
                    className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-50 ${
                      carouselPosition === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                    }`}
                    disabled={carouselPosition === 0}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  
                  {/* Seta direita */}
                  <button
                    onClick={handleNextImage}
                    className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-50 ${
                      carouselPosition === 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                    }`}
                    disabled={carouselPosition === 1}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Footer do modal */}
              <div className="p-4 bg-black/50 backdrop-blur-sm text-center">
                <p className="text-white/80 text-sm md:hidden">
                  Deslize para comparar as imagens
                </p>
                <p className="text-white/80 text-sm hidden md:block">
                  Use as setas para navegar
                </p>
              </div>
            </div>
          </DialogContent>
        </Dialog>

                           {/* Modal de vídeo */}
        <VideoModal
          videoUrl={selectedVideo}
          isOpen={showVideoModal}
          onClose={() => setShowVideoModal(false)}
        />
    </>
  )
}
