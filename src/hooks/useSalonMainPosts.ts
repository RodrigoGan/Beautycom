import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface SalonMainPost {
  id: string
  title: string
  description: string
  media_urls: any
  post_type: string
  created_at: string
  user_id: string
  salon_main_post_priority: number
  author: {
    name: string
    nickname: string
    profile_photo?: string
  }
}

export const useSalonMainPosts = (salonId: string) => {
  const [mainPosts, setMainPosts] = useState<SalonMainPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Buscar posts principais
  const fetchMainPosts = useCallback(async () => {
    if (!salonId) {
      setMainPosts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando posts principais para salão:', salonId)

      // Buscar posts marcados como principais
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          description,
          media_urls,
          post_type,
          created_at,
          user_id,
          salon_main_post_priority,
          author:users!posts_user_id_fkey(
            name,
            nickname,
            profile_photo
          )
        `)
        .eq('is_salon_main_post', true)
        .not('salon_main_post_priority', 'is', null)
        .order('salon_main_post_priority', { ascending: true })

      if (postsError) {
        console.error('❌ Erro ao buscar posts principais:', postsError)
        throw postsError
      }

      // Filtrar apenas posts de membros do salão (profissionais + funcionários)
      const [professionalsResult, employeesResult] = await Promise.all([
        supabase
          .from('salon_professionals')
          .select('professional_id')
          .eq('salon_id', salonId)
          .eq('status', 'accepted'),
        supabase
          .from('salon_employees')
          .select('user_id')
          .eq('salon_id', salonId)
          .eq('status', 'active')
      ])

      const professionalIds = professionalsResult.data?.map(p => p.professional_id) || []
      const employeeIds = employeesResult.data?.map(e => e.user_id) || []
      const allMemberIds = [...professionalIds, ...employeeIds]

      // Filtrar posts que pertencem a membros do salão
      const validPosts = posts?.filter(post => allMemberIds.includes(post.user_id)) || []

      // Transformar os dados para o formato correto
      const transformedPosts: SalonMainPost[] = validPosts.map(post => {
        const authorData = Array.isArray(post.author) ? post.author[0] : post.author
        return {
          id: post.id,
          title: post.title,
          description: post.description,
          media_urls: post.media_urls,
          post_type: post.post_type,
          created_at: post.created_at,
          user_id: post.user_id,
          salon_main_post_priority: post.salon_main_post_priority,
          author: {
            name: authorData?.name || '',
            nickname: authorData?.nickname || '',
            profile_photo: authorData?.profile_photo
          }
        }
      })

      console.log('✅ Posts principais encontrados:', transformedPosts.length)
      setMainPosts(transformedPosts)

    } catch (err) {
      console.error('💥 Erro ao buscar posts principais:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [salonId])

  // Marcar post como principal
  const markAsMain = useCallback(async (postId: string): Promise<boolean> => {
    if (!salonId) return false

    try {
      console.log('⭐ Marcando post como principal:', postId)

      // Verificar quantos posts principais já existem
      const { data: existingMainPosts } = await supabase
        .from('posts')
        .select('id, salon_main_post_priority')
        .eq('is_salon_main_post', true)
        .not('salon_main_post_priority', 'is', null)
        .order('salon_main_post_priority', { ascending: true })

      console.log('📊 Posts principais existentes:', existingMainPosts?.length || 0)

      // Se já temos 3 posts principais, remover o último (prioridade 3)
      if (existingMainPosts && existingMainPosts.length >= 3) {
        const lastPost = existingMainPosts[existingMainPosts.length - 1]
        console.log(`🗑️ Removendo último post (prioridade ${lastPost.salon_main_post_priority}): ${lastPost.id}`)
        
        await supabase
          .from('posts')
          .update({ 
            is_salon_main_post: false, 
            salon_main_post_priority: null 
          })
          .eq('id', lastPost.id)
        
        console.log('✅ Post removido para dar lugar ao novo')
        
        // Remover o post da lista para reorganização
        existingMainPosts.pop()
      }

      // Reorganizar prioridades dos posts existentes (empurrar para baixo)
      if (existingMainPosts && existingMainPosts.length > 0) {
        console.log('🔄 Reorganizando prioridades dos posts existentes')
        
        // Reorganizar todos os posts existentes (agora temos no máximo 2)
        for (let i = existingMainPosts.length - 1; i >= 0; i--) {
          const post = existingMainPosts[i]
          const newPriority = post.salon_main_post_priority + 1
          console.log(`🔄 Movendo post ${post.id} da prioridade ${post.salon_main_post_priority} para ${newPriority}`)
          
          await supabase
            .from('posts')
            .update({ salon_main_post_priority: newPriority })
            .eq('id', post.id)
        }
      }

      // Marcar o novo post como principal com prioridade 1
      console.log(`⭐ Marcando post ${postId} como principal com prioridade 1`)
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          is_salon_main_post: true,
          salon_main_post_priority: 1
        })
        .eq('id', postId)

      if (updateError) {
        console.error('❌ Erro ao marcar post como principal:', updateError)
        throw updateError
      }

      console.log('✅ Post marcado como principal com sucesso')

      toast({
        title: "Post marcado como principal!",
        description: "O post foi adicionado aos principais do salão.",
      })

      // Recarregar lista
      await fetchMainPosts()
      return true

    } catch (err) {
      console.error('💥 Erro ao marcar post como principal:', err)
      toast({
        title: "Erro",
        description: "Não foi possível marcar o post como principal.",
        variant: "destructive"
      })
      return false
    }
  }, [salonId, fetchMainPosts, toast])

  // Desmarcar post como principal
  const unmarkAsMain = useCallback(async (postId: string): Promise<boolean> => {
    if (!salonId) return false

    try {
      console.log('🚫 Removendo post dos principais:', postId)

      // Obter prioridade do post que será removido
      const { data: postData } = await supabase
        .from('posts')
        .select('salon_main_post_priority')
        .eq('id', postId)
        .single()

      const removedPriority = postData?.salon_main_post_priority

      // Remover post dos principais
      const { error: removeError } = await supabase
        .from('posts')
        .update({
          is_salon_main_post: false,
          salon_main_post_priority: null
        })
        .eq('id', postId)

      if (removeError) {
        console.error('❌ Erro ao remover post dos principais:', removeError)
        throw removeError
      }

      // Reorganizar prioridades dos posts restantes
      if (removedPriority) {
        const { error: reorganizeError } = await supabase
          .rpc('reorganize_main_post_priorities', {
            removed_priority: removedPriority
          })

        if (reorganizeError) {
          console.warn('⚠️ Erro ao reorganizar prioridades:', reorganizeError)
          // Não falhar por causa disso, apenas reorganizar manualmente
          const { data: remainingPosts } = await supabase
            .from('posts')
            .select('id, salon_main_post_priority')
            .eq('is_salon_main_post', true)
            .gt('salon_main_post_priority', removedPriority)
            .order('salon_main_post_priority', { ascending: true })

          // Reduzir prioridade dos posts restantes
          if (remainingPosts) {
            for (const post of remainingPosts) {
              await supabase
                .from('posts')
                .update({ salon_main_post_priority: post.salon_main_post_priority - 1 })
                .eq('id', post.id)
            }
          }
        }
      }

      toast({
        title: "Post removido dos principais",
        description: "O post foi removido da lista de principais do salão.",
      })

      // Recarregar lista
      await fetchMainPosts()
      return true

    } catch (err) {
      console.error('💥 Erro ao remover post dos principais:', err)
      toast({
        title: "Erro",
        description: "Não foi possível remover o post dos principais.",
        variant: "destructive"
      })
      return false
    }
  }, [salonId, fetchMainPosts, toast])

  // Carregar posts ao montar ou quando salonId mudar
  useEffect(() => {
    fetchMainPosts()
  }, [fetchMainPosts])

  return {
    mainPosts,
    loading,
    error,
    fetchMainPosts,
    markAsMain,
    unmarkAsMain,
    refetch: fetchMainPosts
  }
}