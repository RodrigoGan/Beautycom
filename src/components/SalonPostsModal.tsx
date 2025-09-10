import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Image, Video, ArrowLeftRight, Calendar, Building2 } from 'lucide-react'

interface SalonPostsModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
  salonName: string
}

interface SalonPost {
  id: string
  title: string
  description?: string
  post_type: 'normal' | 'carousel' | 'before-after' | 'video'
  media_urls?: any
  created_at: string
  user_id: string
  user_name: string
  user_nickname: string
  category_name?: string
  likes_count: number
  comments_count: number
}

export const SalonPostsModal = ({ isOpen, onClose, salonId, salonName }: SalonPostsModalProps) => {
  const [posts, setPosts] = useState<SalonPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPosts = async () => {
    if (!salonId) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Buscando posts dos profissionais do salão:', salonId)

      // Primeiro, buscar profissionais vinculados ao salão
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('salon_professionals')
        .select('professional_id')
        .eq('salon_id', salonId)
        .eq('status', 'accepted')

      if (professionalsError) {
        console.error('❌ Erro ao buscar profissionais:', professionalsError)
        throw professionalsError
      }

      if (!professionalsData || professionalsData.length === 0) {
        setPosts([])
        setLoading(false)
        return
      }

      // Buscar posts dos profissionais vinculados
      const professionalIds = professionalsData.map(p => p.professional_id)
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          description,
          post_type,
          media_urls,
          created_at,
          user_id,
          category_id,
          likes_count,
          comments_count,
          author:users!posts_user_id_fkey(name, nickname),
          category:categories!posts_category_id_fkey(name)
        `)
        .in('user_id', professionalIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20)

      if (postsError) {
        console.error('❌ Erro ao buscar posts:', postsError)
        throw postsError
      }

      // Processar posts
      const processedPosts = (postsData || []).map((post: any) => ({
        id: post.id,
        title: post.title || 'Post sem título',
        description: post.description,
        post_type: post.post_type,
        media_urls: post.media_urls,
        created_at: post.created_at,
        user_id: post.user_id,
        user_name: post.author?.name || 'Profissional',
        user_nickname: post.author?.nickname || 'profissional',
        category_name: post.category?.name,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0
      }))

      console.log('📊 Posts encontrados:', processedPosts.length)
      setPosts(processedPosts)

    } catch (err) {
      console.error('❌ Erro ao buscar posts:', err)
      setError('Erro ao carregar posts')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && salonId) {
      fetchPosts()
    }
  }, [isOpen, salonId])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'agora'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 2592000)}m`
  }

  const getPostTypeIcon = (postType: string) => {
    switch (postType) {
      case 'video':
        return <Video className="h-4 w-4" />
      case 'carousel':
        return <Image className="h-4 w-4" />
      case 'before-after':
        return <ArrowLeftRight className="h-4 w-4" />
      default:
        return <Image className="h-4 w-4" />
    }
  }

  const getPostTypeLabel = (postType: string) => {
    switch (postType) {
      case 'video':
        return 'Vídeo'
      case 'carousel':
        return 'Carrossel'
      case 'before-after':
        return 'Antes/Depois'
      default:
        return 'Imagem'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[90vw] sm:max-w-2xl max-h-[85vh] overflow-hidden">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                <Image className="h-5 w-5 text-white" />
              </div>
              Posts dos Profissionais
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
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchPosts}
              >
                Tentar novamente
              </Button>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum post ainda</p>
              <p className="text-sm mt-1">
                Quando profissionais postarem, os posts aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map((post) => (
                <div key={post.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  {/* Thumbnail */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <div className="text-center">
                      {getPostTypeIcon(post.post_type)}
                      <p className="text-xs text-muted-foreground mt-1">
                        {getPostTypeLabel(post.post_type)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Info */}
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                      {post.title}
                    </h3>
                    
                    {post.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {post.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        <span>@{post.user_nickname}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatTimeAgo(post.created_at)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      {post.category_name && (
                        <Badge variant="outline" className="text-xs">
                          {post.category_name}
                        </Badge>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>❤️ {post.likes_count}</span>
                        <span>💬 {post.comments_count}</span>
                      </div>
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
