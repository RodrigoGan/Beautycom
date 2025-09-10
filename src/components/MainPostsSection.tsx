import { Star, ArrowLeftRight } from 'lucide-react'
import { MainPostButton } from './MainPostButton'
import { EmptyMainPostSlot } from './EmptyMainPostSlot'
import { OptimizedImage } from './OptimizedImage'
import { useLoopDetection } from '@/utils/loopDetector'

interface MainPostsSectionProps {
  mainPosts: any[]
  isOwnProfile: boolean
  targetUserId: string
  currentUserId?: string
  onPostClick: (post: any) => void
  onToggleMainPost: () => void
  forceRefreshButtons: number
  markAsMain?: (postId: string) => Promise<boolean>
  unmarkAsMain?: (postId: string) => Promise<boolean>
}

export const MainPostsSection = ({
  mainPosts,
  isOwnProfile,
  targetUserId,
  currentUserId,
  onPostClick,
  onToggleMainPost,
  forceRefreshButtons,
  markAsMain,
  unmarkAsMain
}: MainPostsSectionProps) => {
  const loopDetection = useLoopDetection('MainPostsSection')
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
        <Star className="h-5 w-5 text-yellow-500" />
        Posts Principais
      </h3>
      <div className="grid grid-cols-3 gap-4">
        {/* Sempre mostrar 3 espaços - preenchidos ou vazios */}
        {[1, 2, 3].map((position) => {
          const mainPost = mainPosts.find(post => post.priority_order === position)
          
          if (mainPost) {
            // Post principal existente
            return (
              <div 
                key={`main-${mainPost.id}`}
                className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group relative border-2 border-yellow-400"
                onClick={() => onPostClick(mainPost)}
              >
                {/* Conteúdo do post principal */}
                {(() => {
                  if (!mainPost.imagem) {
                    return null
                  }
                  
                  if (mainPost.isBeforeAfter) {
                    return (
                      <div className="w-full h-full grid grid-cols-2 gap-1">
                        <div className="relative">
                          <OptimizedImage 
                            src={mainPost.beforeUrl} 
                            alt="Antes"
                            className="w-full h-full object-cover"
                            onError={() => {
                              loopDetection.detectImageLoad(mainPost.beforeUrl)
                            }}
                          />
                          <div className="absolute top-1 left-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded text-center font-semibold shadow-sm">
                            ANTES
                          </div>
                        </div>
                        <div className="relative">
                          <OptimizedImage 
                            src={mainPost.afterUrl} 
                            alt="Depois"
                            className="w-full h-full object-cover"
                            onError={() => {
                              loopDetection.detectImageLoad(mainPost.afterUrl)
                            }}
                          />
                          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded text-center font-semibold shadow-sm">
                            DEPOIS
                          </div>
                        </div>
                      </div>
                    )
                  }
                  
                  if (mainPost.isVideo) {
                    return (
                      <video 
                        src={mainPost.imagem} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        muted
                        preload="metadata"
                        onLoadedData={(e) => {
                          e.currentTarget.pause()
                          e.currentTarget.currentTime = 0
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                    )
                  }
                  
                  if (mainPost.isCarousel) {
                    return (
                      <div className="relative w-full h-full">
                        <img 
                          src={mainPost.imagem} 
                          alt={mainPost.titulo || 'Post'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none'
                            e.currentTarget.nextElementSibling?.classList.remove('hidden')
                          }}
                        />
                        {mainPost.carouselImages && mainPost.carouselImages.length > 1 && (
                          <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded text-center font-semibold shadow-sm">
                            {mainPost.carouselImages.length}
                          </div>
                        )}
                      </div>
                    )
                  }
                  
                  return (
                    <OptimizedImage 
                      src={mainPost.imagem} 
                      alt={mainPost.titulo || 'Post'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => {
                        loopDetection.detectImageLoad(mainPost.imagem)
                      }}
                    />
                  )
                })()}
                
                {/* Indicadores de tipo de post */}
                <div className="absolute top-2 right-2 flex gap-1">
                  {mainPost.isVideo && (
                    <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                      <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                  )}

                  {mainPost.isBeforeAfter && (
                    <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                      <ArrowLeftRight className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Botão de Post Principal */}
                {isOwnProfile && (
                  <div 
                    className="absolute bottom-2 right-2 z-50"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                  >
                    <MainPostButton
                      postId={mainPost.id}
                      userId={targetUserId}
                      currentUserId={currentUserId}
                      onToggle={onToggleMainPost}
                      size="sm"
                      variant="ghost"
                      className="bg-black/50 hover:bg-black/70 text-white border-0"
                      forceRefresh={forceRefreshButtons}
                      markAsMain={markAsMain}
                      unmarkAsMain={unmarkAsMain}
                      priorityOrder={mainPost.priority_order}
                    />
                  </div>
                )}
              </div>
            )
          } else {
            // Espaço vazio
            return (
              <EmptyMainPostSlot 
                key={`empty-${position}`}
                position={position}
              />
            )
          }
        })}
      </div>
    </div>
  )
}
