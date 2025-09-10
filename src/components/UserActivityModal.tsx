import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { supabase } from '@/lib/supabase'
import { useAuthContext } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"
import { Heart, Bookmark, Image, Video, Calendar } from "lucide-react"

interface Post {
  id: string
  title: string
  description: string
  post_type: string
  media_urls: string[]
  created_at: string
  author: {
    id: string
    name: string
    nickname: string
    profile_photo?: string
  }
}

interface UserActivityModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  type: 'favorites' | 'likes'
  title: string
}

export const UserActivityModal = ({ isOpen, onClose, userId, type, title }: UserActivityModalProps) => {
  const { user: currentUser } = useAuthContext()
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar posts favoritados ou curtidos
  const fetchUserActivity = async () => {
    if (!userId) return

    setLoading(true)
    try {
      let query
      
      if (type === 'favorites') {
        // Buscar posts favoritados
        const { data, error } = await supabase
          .from('post_favorites')
          .select(`
            post_id,
            posts!post_favorites_post_id_fkey (
              id,
              title,
              description,
              post_type,
              media_urls,
              created_at,
              user_id,
              users!posts_user_id_fkey (
                id,
                name,
                nickname,
                profile_photo
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        
                 const favoritePosts = data?.map(item => {
           // Processar media_urls baseado na estrutura do BeautyWall
           let processedMediaUrls: string[] = []
           
           if (item.posts?.media_urls) {
             // Estrutura nova: { type: 'normal', media: [{ url: '...', type: 'image', order: 1 }] }
             if (item.posts.media_urls.media && Array.isArray(item.posts.media_urls.media)) {
               processedMediaUrls = item.posts.media_urls.media.map((media: any) => media.url)
             }
             // Estrutura antiga: array direto de URLs
             else if (Array.isArray(item.posts.media_urls)) {
               processedMediaUrls = item.posts.media_urls
             }
             // Estrutura antiga: string JSON
             else if (typeof item.posts.media_urls === 'string') {
               try {
                 const parsed = JSON.parse(item.posts.media_urls)
                 if (parsed.media && Array.isArray(parsed.media)) {
                   processedMediaUrls = parsed.media.map((media: any) => media.url)
                 } else if (Array.isArray(parsed)) {
                   processedMediaUrls = parsed
                 }
               } catch (e) {
                 console.log('❌ Erro ao fazer parse de media_urls:', e)
                 processedMediaUrls = []
               }
             }
           }
           
           return {
             ...item.posts,
             author: item.posts.users,
             media_urls: processedMediaUrls
           }
         }).filter(Boolean) || []
        setPosts(favoritePosts)
      } else {
        // Buscar posts curtidos
        const { data, error } = await supabase
          .from('post_likes')
          .select(`
            post_id,
            posts!post_likes_post_id_fkey (
              id,
              title,
              description,
              post_type,
              media_urls,
              created_at,
              user_id,
              users!posts_user_id_fkey (
                id,
                name,
                nickname,
                profile_photo
              )
            )
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        
                 const likedPosts = data?.map(item => {
           // Processar media_urls baseado na estrutura do BeautyWall
           let processedMediaUrls: string[] = []
           
           if (item.posts?.media_urls) {
             // Estrutura nova: { type: 'normal', media: [{ url: '...', type: 'image', order: 1 }] }
             if (item.posts.media_urls.media && Array.isArray(item.posts.media_urls.media)) {
               processedMediaUrls = item.posts.media_urls.media.map((media: any) => media.url)
             }
             // Estrutura antiga: array direto de URLs
             else if (Array.isArray(item.posts.media_urls)) {
               processedMediaUrls = item.posts.media_urls
             }
             // Estrutura antiga: string JSON
             else if (typeof item.posts.media_urls === 'string') {
               try {
                 const parsed = JSON.parse(item.posts.media_urls)
                 if (parsed.media && Array.isArray(parsed.media)) {
                   processedMediaUrls = parsed.media.map((media: any) => media.url)
                 } else if (Array.isArray(parsed)) {
                   processedMediaUrls = parsed
                 }
               } catch (e) {
                 console.log('❌ Erro ao fazer parse de media_urls (likes):', e)
                 processedMediaUrls = []
               }
             }
           }
           
           return {
             ...item.posts,
             author: item.posts.users,
             media_urls: processedMediaUrls
           }
         }).filter(Boolean) || []
        
        setPosts(likedPosts)
      }
    } catch (error) {
      console.error(`Erro ao buscar ${type}:`, error)
      toast({
        title: "Erro",
        description: `Não foi possível carregar os ${type}.`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // Remover favorito
  const removeFavorite = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

      if (error) throw error

      setPosts(prev => prev.filter(post => post.id !== postId))
      toast({
        title: "Favorito removido",
        description: "Post removido dos seus favoritos.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o favorito.",
        variant: "destructive"
      })
    }
  }

  // Remover like
  const removeLike = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

      if (error) throw error

      setPosts(prev => prev.filter(post => post.id !== postId))
      toast({
        title: "Like removido",
        description: "Post removido dos seus likes.",
      })
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível remover o like.",
        variant: "destructive"
      })
    }
  }

  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Carregar dados quando modal abre
  useEffect(() => {
    if (isOpen) {
      fetchUserActivity()
    }
  }, [isOpen, userId, type])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[90vw] sm:max-w-2xl max-h-[85vh] overflow-hidden">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                {type === 'favorites' ? <Bookmark className="h-5 w-5 text-white" /> : <Heart className="h-5 w-5 text-white" />}
              </div>
              {title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[60vh] px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === 'favorites' ? <Bookmark className="h-12 w-12 mx-auto mb-4 opacity-50" /> : <Heart className="h-12 w-12 mx-auto mb-4 opacity-50" />}
              <p>Nenhum post encontrado</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border">
                  {/* Thumbnail */}
                  <div className="flex-shrink-0">
                     <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                                               {(() => {
                          const hasValidMedia = post.media_urls && 
                            Array.isArray(post.media_urls) && 
                            post.media_urls.length > 0 && 
                            post.media_urls[0] && 
                            post.media_urls[0].trim() !== ''
                          
                          // Renderizar baseado no tipo de post
                         if (post.post_type === 'video') {
                           // Para vídeos, mostrar thumbnail do vídeo ou ícone
                           if (hasValidMedia) {
                             return (
                               <div className="relative w-full h-full">
                                 <img 
                                   src={post.media_urls[0]} 
                                   alt="Video thumbnail"
                                   className="w-full h-full object-cover"
                                   onError={(e) => {
                                     e.currentTarget.style.display = 'none'
                                     const fallback = e.currentTarget.parentElement?.querySelector('.video-fallback')
                                     if (fallback) fallback.classList.remove('hidden')
                                   }}
                                 />
                                 <div className="video-fallback hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                                   <Video className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                                 </div>
                                 <div className="absolute inset-0 flex items-center justify-center">
                                   <div className="bg-black/50 rounded-full p-1">
                                     <Video className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                                   </div>
                                 </div>
                               </div>
                             )
                           } else {
                             return <Video className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                           }
                         } else if (post.post_type === 'before-after') {
                           // Para antes/depois, mostrar as duas imagens lado a lado
                           if (hasValidMedia && post.media_urls.length >= 2) {
                             return (
                               <div className="flex w-full h-full">
                                 <div className="w-1/2 h-full">
                                   <img 
                                     src={post.media_urls[0]} 
                                     alt="Antes"
                                     className="w-full h-full object-cover"
                                     onError={(e) => e.currentTarget.style.display = 'none'}
                                   />
                                 </div>
                                 <div className="w-1/2 h-full">
                                   <img 
                                     src={post.media_urls[1]} 
                                     alt="Depois"
                                     className="w-full h-full object-cover"
                                     onError={(e) => e.currentTarget.style.display = 'none'}
                                   />
                                 </div>
                               </div>
                             )
                           } else if (hasValidMedia) {
                             // Se só tem uma imagem, mostrar ela com indicador A/D
                             return (
                               <div className="relative w-full h-full">
                                 <img 
                                   src={post.media_urls[0]} 
                                   alt="Before/After"
                                   className="w-full h-full object-cover"
                                   onError={(e) => {
                                     e.currentTarget.style.display = 'none'
                                     const fallback = e.currentTarget.parentElement?.querySelector('.before-after-fallback')
                                     if (fallback) fallback.classList.remove('hidden')
                                   }}
                                 />
                                 <div className="before-after-fallback hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                                   <div className="text-xs text-gray-400 font-medium">A/D</div>
                                 </div>
                                 <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1 rounded">
                                   A/D
                                 </div>
                               </div>
                             )
                           } else {
                             return (
                               <div className="text-xs text-gray-400 font-medium">A/D</div>
                             )
                           }
                         } else if (post.post_type === 'carousel') {
                           // Para carrossel, mostrar primeira imagem com indicador de múltiplas
                           if (hasValidMedia) {
                             return (
                               <div className="relative w-full h-full">
                                 <img 
                                   src={post.media_urls[0]} 
                                   alt="Carousel thumbnail"
                                   className="w-full h-full object-cover"
                                   onError={(e) => {
                                     e.currentTarget.style.display = 'none'
                                     const fallback = e.currentTarget.parentElement?.querySelector('.carousel-fallback')
                                     if (fallback) fallback.classList.remove('hidden')
                                   }}
                                 />
                                 <div className="carousel-fallback hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                                   <div className="text-xs text-gray-400 font-medium">📷</div>
                                 </div>
                                 {post.media_urls.length > 1 && (
                                   <div className="absolute top-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                                     +{post.media_urls.length - 1}
                                   </div>
                                 )}
                               </div>
                             )
                           } else {
                             return (
                               <div className="text-xs text-gray-400 font-medium">📷</div>
                             )
                           }
                         } else {
                           // Para posts normais, mostrar imagem única
                           if (hasValidMedia) {
                             return (
                               <div className="relative w-full h-full">
                        <img 
                          src={post.media_urls[0]} 
                          alt="Post thumbnail"
                          className="w-full h-full object-cover"
                                   onError={(e) => {
                                     e.currentTarget.style.display = 'none'
                                     const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback')
                                     if (fallback) fallback.classList.remove('hidden')
                                   }}
                                 />
                                 <div className="image-fallback hidden absolute inset-0 flex items-center justify-center bg-gray-200">
                                   <Image className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                                 </div>
                               </div>
                             )
                           } else {
                             return <Image className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                           }
                         }
                       })()}
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate text-sm sm:text-base">{post.title}</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.description}
                        </p>
                        
                        {/* Autor */}
                        {post.author && (
                        <div className="flex items-center gap-2 mt-2">
                            <Avatar className="h-5 w-5 sm:h-6 sm:w-6">
                            <AvatarImage src={post.author.profile_photo} />
                            <AvatarFallback className="text-xs">
                              {post.author.name?.charAt(0) || post.author.nickname?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                            <span className="text-xs text-muted-foreground truncate">
                            @{post.author.nickname}
                          </span>
                        </div>
                        )}

                        {/* Data e tipo */}
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {formatDate(post.created_at)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {post.post_type === 'before-after' ? 'Antes/Depois' : 
                             post.post_type === 'video' ? 'Vídeo' : 
                             post.post_type === 'carousel' ? 'Carrossel' : 'Post'}
                          </Badge>
                        </div>
                      </div>

                      {/* Botão de remover */}
                      {currentUser?.id === userId && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => type === 'favorites' ? removeFavorite(post.id) : removeLike(post.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs sm:text-sm px-2 sm:px-3"
                        >
                          {type === 'favorites' ? 'Remover' : 'Descurtir'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
