import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export const useMainPosts = (userId?: string, operationUserId?: string) => {
  const [mainPosts, setMainPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Buscar posts principais de um usuário
  const fetchMainPosts = async (targetUserId: string) => {
    if (!targetUserId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          description,
          post_type,
          media_urls,
          created_at,
          priority_order,
          category:categories!posts_category_id_fkey(name)
        `)
        .eq('user_id', targetUserId)
        .eq('is_main_post', true)
        .eq('is_active', true)
        .order('priority_order', { ascending: true })
        .limit(3)

      if (error) {
        console.error('Erro ao buscar posts principais:', error)
        setError('Erro ao carregar posts principais')
        return
      }

      // Processar posts para exibição
      const processedPosts = (data || []).map(post => {
        let imagemUrl = ''
        let isVideo = false
        let isCarousel = false
        let isBeforeAfter = false
        let carouselImages: string[] = []
        let beforeUrl = ''
        let afterUrl = ''

        // Processar diferentes tipos de posts
        switch (post.post_type) {
          case 'normal':
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
              const firstMedia = post.media_urls.media[0]
              imagemUrl = firstMedia.url
              isVideo = firstMedia.type === 'video' || (imagemUrl && (imagemUrl.includes('.mp4') || imagemUrl.includes('.mov') || imagemUrl.includes('.avi')))
            } else if (post.media_urls && post.media_urls.url) {
              imagemUrl = post.media_urls.url
              isVideo = imagemUrl && (imagemUrl.includes('.mp4') || imagemUrl.includes('.mov') || imagemUrl.includes('.avi'))
            }
            break
            
          case 'carousel':
            isCarousel = true
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
              carouselImages = post.media_urls.media.map((media: any) => media.url)
              imagemUrl = carouselImages[0]
            }
            break
            
          case 'before-after':
            isBeforeAfter = true
            if (post.media_urls && post.media_urls.beforeAfter) {
              beforeUrl = post.media_urls.beforeAfter.before
              afterUrl = post.media_urls.beforeAfter.after
              imagemUrl = afterUrl
            } else if (post.media_urls && post.media_urls.before && post.media_urls.after) {
              beforeUrl = post.media_urls.before
              afterUrl = post.media_urls.after
              imagemUrl = afterUrl
            }
            break
            
          case 'video':
            isVideo = true
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
              const videoMedia = post.media_urls.media.find((media: any) => media.type === 'video')
              if (videoMedia) {
                imagemUrl = videoMedia.url
              }
            } else if (post.media_urls && post.media_urls.url) {
              imagemUrl = post.media_urls.url
            }
            break
        }

        return {
          id: post.id,
          titulo: post.title,
          descricao: post.description,
          categoria: (post.category as any)?.name || 'Sem categoria',
          post_type: post.post_type,
          imagem: imagemUrl,
          isVideo,
          isCarousel,
          isBeforeAfter,
          carouselImages,
          beforeUrl,
          afterUrl,
          created_at: post.created_at,
          priority_order: post.priority_order
        }
      })

      setMainPosts(processedPosts)
    } catch (error) {
      console.error('Erro ao buscar posts principais:', error)
      setError('Erro ao carregar posts principais')
    } finally {
      setLoading(false)
    }
  }

  // Marcar post como principal
  const markAsMain = async (postId: string) => {
    const currentUserId = operationUserId || userId
    console.log(`🎯 markAsMain chamado - postId: ${postId}, currentUserId: ${currentUserId}, userId: ${userId}, operationUserId: ${operationUserId}`)
    
    if (!currentUserId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para marcar posts como principais.",
        variant: "destructive"
      })
      return false
    }

    try {
      // Verificar quantos posts principais já existem
      console.log(`🔍 Verificando posts principais existentes para o usuário: ${currentUserId}`)
      
      const { data: existingMainPosts, error: countError } = await supabase
        .from('posts')
        .select('id, priority_order')
        .eq('user_id', currentUserId)
        .eq('is_main_post', true)
        .order('priority_order', { ascending: true })

      console.log(`🔍 Query executada para posts principais do usuário: ${currentUserId}`)
      console.log(`🔍 Ordenação: priority_order ASC (1, 2, 3)`)

      if (countError) {
        console.error('Erro ao verificar posts principais existentes:', countError)
        toast({
          title: "Erro",
          description: "Não foi possível verificar os posts principais existentes.",
          variant: "destructive"
        })
        return false
      }

      console.log(`🔍 Posts principais existentes:`, existingMainPosts?.map(p => ({
        id: p.id,
        priority_order: p.priority_order
      })))

      // Calcular nova prioridade para o post
      const newPriority = 1 // Sempre será o primeiro (prioridade 1)
      
      // Se já tem posts principais, reorganizar as prioridades
      if (existingMainPosts && existingMainPosts.length > 0) {
        console.log(`🔄 Reorganizando ${existingMainPosts.length} posts existentes`)
        
        // Primeiro, verificar se já temos 3 posts principais
        if (existingMainPosts.length >= 3) {
          // Se já temos 3 posts, remover o último (prioridade 3)
          const lastPost = existingMainPosts[existingMainPosts.length - 1]
          console.log(`🗑️ Removendo último post (prioridade ${lastPost.priority_order}): ${lastPost.id}`)
          
          await supabase
            .from('posts')
            .update({ is_main_post: false, priority_order: null })
            .eq('id', lastPost.id)
            .eq('user_id', currentUserId)
          
          // Atualizar a lista para não incluir o post removido
          existingMainPosts.pop()
        }
        
        // Agora mover os posts restantes uma posição para baixo
        for (let i = existingMainPosts.length - 1; i >= 0; i--) {
          const post = existingMainPosts[i]
          const newOrder = post.priority_order + 1
          
          console.log(`🔄 Movendo post ${post.id} de prioridade ${post.priority_order} para ${newOrder}`)
          
          const { error: moveError } = await supabase
            .from('posts')
            .update({ priority_order: newOrder })
            .eq('id', post.id)
            .eq('user_id', currentUserId)
          
          if (moveError) {
            console.error(`❌ Erro ao mover post ${post.id}:`, moveError)
            throw moveError
          }
          
          console.log(`✅ Post ${post.id} movido com sucesso para prioridade ${newOrder}`)
        }
      }

      // Marcar o novo post como principal com prioridade 1
      console.log(`🎯 Marcando post ${postId} como principal com prioridade ${newPriority}`)
      
      const { data: updateData, error } = await supabase
        .from('posts')
        .update({ is_main_post: true, priority_order: newPriority })
        .eq('id', postId)
        .eq('user_id', currentUserId)
        .select('id, is_main_post, priority_order')

      if (error) {
        console.error('❌ Erro ao marcar post como principal:', error)
        console.error('❌ Detalhes do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        toast({
          title: "Erro",
          description: `Não foi possível marcar o post como principal: ${error.message}`,
          variant: "destructive"
        })
        return false
      }

      console.log('✅ Post marcado como principal com sucesso:', updateData)

      toast({
        title: "Post marcado como principal!",
        description: "Este post agora aparecerá em destaque no seu perfil.",
      })

      // Recarregar posts principais
      await fetchMainPosts(userId)

      return true
    } catch (error) {
      console.error('Erro ao marcar post como principal:', error)
      toast({
        title: "Erro",
        description: "Não foi possível marcar o post como principal.",
        variant: "destructive"
      })
      return false
    }
  }

  // Desmarcar post como principal
  const unmarkAsMain = async (postId: string) => {
    const currentUserId = operationUserId || userId
    if (!currentUserId) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para desmarcar posts principais.",
        variant: "destructive"
      })
      return false
    }

    try {
      // Primeiro, obter a prioridade do post que será removido
      const { data: postToRemove, error: getError } = await supabase
        .from('posts')
        .select('priority_order')
        .eq('id', postId)
        .eq('user_id', currentUserId)
        .single()

      if (getError) {
        console.error('Erro ao obter prioridade do post:', getError)
        return false
      }

      const removedPriority = postToRemove?.priority_order

      // Remover o post dos principais
      const { error } = await supabase
        .from('posts')
        .update({ is_main_post: false, priority_order: null })
        .eq('id', postId)
        .eq('user_id', currentUserId)

      if (error) {
        console.error('Erro ao desmarcar post como principal:', error)
        toast({
          title: "Erro",
          description: "Não foi possível desmarcar o post como principal.",
          variant: "destructive"
        })
        return false
      }

      // Reorganizar prioridades dos posts restantes
      if (removedPriority) {
        const { data: remainingPosts, error: getRemainingError } = await supabase
          .from('posts')
          .select('id, priority_order')
          .eq('user_id', currentUserId)
          .eq('is_main_post', true)
          .gt('priority_order', removedPriority)
          .order('priority_order', { ascending: true })

        if (!getRemainingError && remainingPosts) {
          // Mover posts com prioridade maior para cima
          for (const post of remainingPosts) {
            const newPriority = post.priority_order - 1
            console.log(`🔄 Reorganizando: post ${post.id} de prioridade ${post.priority_order} para ${newPriority}`)
            
            await supabase
              .from('posts')
              .update({ priority_order: newPriority })
              .eq('id', post.id)
              .eq('user_id', currentUserId)
          }
        }
      }

      toast({
        title: "Post removido dos principais",
        description: "Este post não aparecerá mais em destaque no seu perfil.",
      })

      // Recarregar posts principais se estivermos visualizando o perfil do usuário atual
      if (userId) {
        fetchMainPosts(userId)
      }

      return true
    } catch (error) {
      console.error('Erro ao desmarcar post como principal:', error)
      toast({
        title: "Erro",
        description: "Não foi possível desmarcar o post como principal.",
        variant: "destructive"
      })
      return false
    }
  }

  // Verificar se um post é principal
  const checkIfMainPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('is_main_post')
        .eq('id', postId)
        .single()

      if (error) {
        console.error('Erro ao verificar se post é principal:', error)
        return false
      }

      return data?.is_main_post || false
    } catch (error) {
      console.error('Erro ao verificar se post é principal:', error)
      return false
    }
  }

  // Buscar posts principais quando o userId mudar
  useEffect(() => {
    if (userId) {
      fetchMainPosts(userId)
    }
  }, [userId])

  return {
    mainPosts,
    loading,
    error,
    fetchMainPosts,
    markAsMain,
    unmarkAsMain,
    checkIfMainPost
  }
}