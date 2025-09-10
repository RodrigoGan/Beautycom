import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface SalonMainPost {
  id: string
  title: string  // CORRIGIDO: era titulo
  description: string  // CORRIGIDO: era descricao
  media_urls?: any  // Coluna real da tabela
  post_type?: string  // Tipo do post
  created_at: string
  user_id: string
  salon_main_post_priority: number
  author: {
    name: string
    nickname: string
  }
}

export const useSalonMainPosts = (salonId: string, currentUserId?: string) => {
  console.log('🏗️ useSalonMainPosts instanciado:', { salonId, currentUserId })
  
  const [mainPosts, setMainPosts] = useState<SalonMainPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Buscar posts principais do salão
  const fetchMainPosts = async () => {
    console.log('🔍 fetchMainPosts chamado:', { salonId, currentUserId })
    console.log('🔍 fetchMainPosts - timestamp:', new Date().toISOString())
    
    if (!salonId) {
      console.log('⚠️ Nenhum salonId fornecido')
      setMainPosts([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('📡 Fazendo query para buscar posts principais...')
      
      // Buscar profissionais E funcionários vinculados ao salão
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

      if (professionalsResult.error) {
        console.error('❌ Erro ao buscar profissionais:', professionalsResult.error)
        throw professionalsResult.error
      }

      if (employeesResult.error) {
        console.error('❌ Erro ao buscar funcionários:', employeesResult.error)
        throw employeesResult.error
      }

      const professionalIds = professionalsResult.data?.map(p => p.professional_id) || []
      const employeeIds = employeesResult.data?.map(e => e.user_id) || []
      
      // Combinar IDs de profissionais e funcionários
      const allMemberIds = [...professionalIds, ...employeeIds]
      
      console.log('👥 Profissionais do salão:', professionalIds)
      console.log('👥 Funcionários do salão:', employeeIds)
      console.log('👥 Todos os membros do salão:', allMemberIds)

      if (allMemberIds.length === 0) {
        console.log('⚠️ Nenhum membro vinculado ao salão')
        setMainPosts([])
        setLoading(false)
        return
      }

      // Buscar posts principais dos membros do salão
      console.log('🔍 Fazendo query com allMemberIds:', allMemberIds)
      
             const { data, error: fetchError } = await supabase
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
           author:users!posts_user_id_fkey(name, nickname, profile_photo)
         `)
        .in('user_id', allMemberIds)
        .eq('is_salon_main_post', true)
        .order('salon_main_post_priority', { ascending: true })

      if (fetchError) {
        console.error('❌ Erro ao buscar posts principais:', fetchError)
        throw fetchError
      }

             console.log('✅ Posts principais encontrados:', data?.length || 0, data)
      console.log('🔍 Dados brutos dos posts:', data)
      console.log('🖼️ media_urls dos posts:', data?.map(p => ({
        id: p.id,
        title: p.title,
        media_urls: p.media_urls,
        post_type: p.post_type
      })))
      
      // Log específico para debug
      if (data && data.length > 0) {
        console.log('🎯 DEBUG: Posts principais encontrados com sucesso!')
        console.log('🎯 DEBUG: IDs dos posts:', data.map(p => p.id))
        console.log('🎯 DEBUG: Prioridades:', data.map(p => p.salon_main_post_priority))
        console.log('🎯 DEBUG: Ordenação por prioridade:', data.sort((a, b) => (a.salon_main_post_priority || 0) - (b.salon_main_post_priority || 0)).map(p => ({
          id: p.id,
          priority: p.salon_main_post_priority,
          title: p.title
        })))
      } else {
        console.log('⚠️ DEBUG: Nenhum post principal encontrado na query')
        console.log('⚠️ DEBUG: allMemberIds usado na query:', allMemberIds)
      }
      
             // Transformar os dados para o formato correto
       const transformedData = data?.map(post => {
         // Parsear media_urls se for string
         let parsedMediaUrls = post.media_urls
         if (typeof post.media_urls === 'string') {
           try {
             parsedMediaUrls = JSON.parse(post.media_urls)
           } catch (error) {
             console.error('❌ Erro ao parsear media_urls:', error, post.media_urls)
             parsedMediaUrls = null
           }
         }
         
         return {
           ...post,
           media_urls: parsedMediaUrls,
           author: Array.isArray(post.author) ? post.author[0] : post.author
         }
       }) || []
      
             console.log('🔄 Dados transformados:', transformedData)
       console.log('🎯 DEBUG: Definindo mainPosts com:', transformedData.length, 'posts')
       setMainPosts(transformedData)
       console.log('🎯 DEBUG: setMainPosts executado')
    } catch (err) {
      console.error('💥 Erro ao buscar posts principais:', err)
      setError('Erro ao carregar posts principais')
    } finally {
      setLoading(false)
    }
  }

  // Marcar post como principal
  const markAsMain = async (postId: string) => {
    console.log('🎯 markAsMain chamado:', { postId, salonId, currentUserId })
    
    if (!salonId || !currentUserId) {
      console.error('❌ Usuário não autorizado:', { salonId, currentUserId })
      toast({
        title: "Erro",
        description: "Usuário não autorizado",
        variant: "destructive"
      })
      return false
    }

    try {
      // Verificar se o usuário atual é o proprietário do salão
      const { data: salonData, error: salonError } = await supabase
        .from('salons_studios')
        .select('owner_id')
        .eq('id', salonId)
        .single()

      if (salonError) {
        console.error('❌ Erro ao verificar proprietário do salão:', salonError)
        throw salonError
      }

      const isOwner = salonData?.owner_id === currentUserId
      console.log('👑 Verificação de proprietário (markAsMain):')
      console.log('👑 - currentUserId:', currentUserId)
      console.log('👑 - salonData.owner_id:', salonData?.owner_id)
      console.log('👑 - isOwner:', isOwner)
      console.log('👑 - Comparação:', salonData?.owner_id === currentUserId)

      // Buscar profissionais E funcionários vinculados ao salão
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

      if (professionalsResult.error) {
        console.error('❌ Erro ao buscar profissionais:', professionalsResult.error)
        throw professionalsResult.error
      }

      if (employeesResult.error) {
        console.error('❌ Erro ao buscar funcionários:', employeesResult.error)
        throw employeesResult.error
      }

      const professionalIds = professionalsResult.data?.map(p => p.professional_id) || []
      const employeeIds = employeesResult.data?.map(e => e.user_id) || []
      
      // Combinar IDs de profissionais e funcionários
      const allMemberIds = [...professionalIds, ...employeeIds]
      
      console.log('👥 Profissionais do salão:', professionalIds)
      console.log('👥 Funcionários do salão:', employeeIds)
      console.log('👥 Todos os membros do salão:', allMemberIds)

      // Verificar posts principais existentes dos membros do salão
      const { data: existingMainPosts, error: countError } = await supabase
        .from('posts')
        .select('id, salon_main_post_priority')
        .in('user_id', allMemberIds)
        .eq('is_salon_main_post', true)
        .order('salon_main_post_priority', { ascending: true })

      // Verificar se há prioridades duplicadas e corrigir
      if (existingMainPosts && existingMainPosts.length > 0) {
        const priorities = existingMainPosts.map(p => p.salon_main_post_priority).sort((a, b) => a - b)
        const uniquePriorities = [...new Set(priorities)]
        
        if (priorities.length !== uniquePriorities.length) {
          console.log('⚠️ Prioridades duplicadas detectadas, corrigindo...')
          console.log('🔍 Prioridades atuais:', priorities)
          
          // Reorganizar prioridades para eliminar duplicatas
          for (let i = 0; i < existingMainPosts.length; i++) {
            const post = existingMainPosts[i]
            const correctPriority = i + 1
            
            if (post.salon_main_post_priority !== correctPriority) {
              console.log(`🔄 Corrigindo prioridade do post ${post.id}: ${post.salon_main_post_priority} → ${correctPriority}`)
              
              await supabase
                .from('posts')
                .update({ salon_main_post_priority: correctPriority })
                .eq('id', post.id)
            }
          }
          
          // Buscar novamente após correção
          const { data: correctedPosts, error: correctedError } = await supabase
            .from('posts')
            .select('id, salon_main_post_priority')
            .in('user_id', allMemberIds)
            .eq('is_salon_main_post', true)
            .order('salon_main_post_priority', { ascending: true })
          
          if (!correctedError && correctedPosts) {
            existingMainPosts.length = 0
            existingMainPosts.push(...correctedPosts)
            console.log('✅ Prioridades corrigidas:', correctedPosts.map(p => p.salon_main_post_priority))
          }
        }
      }

      console.log(`🔍 Posts principais existentes:`, existingMainPosts?.map(p => ({
        id: p.id,
        salon_main_post_priority: p.salon_main_post_priority
      })))

      // Verificar se o post pertence a um profissional do salão
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('id, user_id, title')
        .eq('id', postId)
        .single()

      if (postError) {
        console.error('❌ Erro ao buscar post:', postError)
        toast({
          title: "Erro",
          description: "Post não encontrado.",
          variant: "destructive"
        })
        return false
      }

      console.log('📄 Dados do post:', postData)
      console.log('👥 Todos os membros do salão:', allMemberIds)
      console.log('🔍 Post pertence a membro do salão?', allMemberIds.includes(postData.user_id))
      console.log('👑 Usuário é proprietário?', isOwner)
      console.log('🔍 Post pertence a membro OU usuário é proprietário?', allMemberIds.includes(postData.user_id) || isOwner)

      // Verificar se o post pertence a um membro do salão OU se o usuário é proprietário
      if (!allMemberIds.includes(postData.user_id) && !isOwner) {
        console.error('❌ Post não pertence a membro do salão e usuário não é proprietário')
        console.error('❌ Detalhes da verificação:')
        console.error('❌ - Post user_id:', postData.user_id)
        console.error('❌ - allMemberIds:', allMemberIds)
        console.error('❌ - currentUserId:', currentUserId)
        console.error('❌ - isOwner:', isOwner)
        toast({
          title: "Erro",
          description: "Apenas posts de membros vinculados ao salão podem ser marcados como principais.",
          variant: "destructive"
        })
        return false
      }
      
      console.log('✅ Autorização aprovada - post pode ser gerenciado')

      // Verificar se o post já é principal
      const isAlreadyMain = existingMainPosts?.some(mp => mp.id === postId)
      console.log('🔍 Post já é principal?', isAlreadyMain)
       
      if (isAlreadyMain) {
        console.log('⚠️ Post já está marcado como principal')
        toast({
          title: "Post já é principal",
          description: "Este post já está marcado como principal.",
          variant: "destructive"
        })
        return false
      }

      // Calcular nova prioridade para o post
      const newPriority = 1 // Sempre será o primeiro (prioridade 1)
      
      // Se já tem posts principais, reorganizar as prioridades
      if (existingMainPosts && existingMainPosts.length > 0) {
        console.log(`🔄 Reorganizando ${existingMainPosts.length} posts existentes`)
        
        // Primeiro, verificar se já temos 3 posts principais
        if (existingMainPosts.length >= 3) {
          // Se já temos 3 posts, remover o último (prioridade 3)
          const lastPost = existingMainPosts[existingMainPosts.length - 1]
          console.log(`🗑️ Removendo último post (prioridade ${lastPost.salon_main_post_priority}): ${lastPost.id}`)
          
          await supabase
            .from('posts')
            .update({ is_salon_main_post: false, salon_main_post_priority: null })
            .eq('id', lastPost.id)
          
          // Atualizar a lista para não incluir o post removido
          existingMainPosts.pop()
        }
        
        // Agora mover os posts restantes uma posição para baixo
        for (let i = existingMainPosts.length - 1; i >= 0; i--) {
          const post = existingMainPosts[i]
          const newOrder = post.salon_main_post_priority + 1
          
          console.log(`🔄 Movendo post ${post.id} de prioridade ${post.salon_main_post_priority} para ${newOrder}`)
          
          const { error: moveError } = await supabase
            .from('posts')
            .update({ salon_main_post_priority: newOrder })
            .eq('id', post.id)
          
          if (moveError) {
            console.error(`❌ Erro ao mover post ${post.id}:`, moveError)
            throw moveError
          }
          
          console.log(`✅ Post ${post.id} movido com sucesso para prioridade ${newOrder}`)
        }
      }
      
      // Log detalhado antes do update
      console.log('🔍 DEBUG: Executando UPDATE no Supabase...')
      console.log('🔍 DEBUG: Tabela: posts')
      console.log('🔍 DEBUG: Condição: id =', postId)
      console.log('🔍 DEBUG: Valores: is_salon_main_post = true, salon_main_post_priority =', newPriority)
      
      const { data: updateData, error: updateError } = await supabase
        .from('posts')
        .update({
          is_salon_main_post: true,
          salon_main_post_priority: newPriority
        })
        .eq('id', postId)
        .select()

      // Log detalhado após o update
      console.log('🔍 DEBUG: Resposta do Supabase:')
      console.log('🔍 DEBUG: updateData:', updateData)
      console.log('🔍 DEBUG: updateError:', updateError)
      console.log('🔍 DEBUG: updateError?.code:', updateError?.code)
      console.log('🔍 DEBUG: updateError?.message:', updateError?.message)

      if (updateError) {
        console.error('❌ Erro ao marcar post como principal:', updateError)
        console.error('❌ Código do erro:', updateError.code)
        console.error('❌ Mensagem do erro:', updateError.message)
        console.error('❌ Detalhes do erro:', updateError.details)
        throw updateError
      }

      console.log('✅ Post marcado como principal com sucesso:', updateData)
      
      // Verificar se realmente foi salvo
      if (updateData && updateData.length > 0) {
        const savedPost = updateData[0]
        console.log('✅ DEBUG: Post salvo com sucesso:')
        console.log('✅ DEBUG: is_salon_main_post =', savedPost.is_salon_main_post)
        console.log('✅ DEBUG: salon_main_post_priority =', savedPost.salon_main_post_priority)
      } else {
        console.warn('⚠️ DEBUG: updateData está vazio ou nulo')
      }

      toast({
        title: "Post marcado como principal!",
        description: "O post foi adicionado aos principais do salão.",
      })

             // Recarregar posts principais
      console.log('🔄 Recarregando posts principais...')
      await fetchMainPosts()
       
      // Verificar se os posts foram carregados
      console.log('🔍 Verificando se fetchMainPosts foi executado corretamente...')
       
      console.log('✅ markAsMain concluído com sucesso')
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
  }

  // Remover post dos principais
  const unmarkAsMain = async (postId: string) => {
    if (!salonId || !currentUserId) {
      toast({
        title: "Erro",
        description: "Usuário não autorizado",
        variant: "destructive"
      })
      return false
    }

    try {
      // Verificar se o usuário atual é o proprietário do salão
      const { data: salonData, error: salonError } = await supabase
        .from('salons_studios')
        .select('owner_id')
        .eq('id', salonId)
        .single()

      if (salonError) {
        console.error('❌ Erro ao verificar proprietário do salão:', salonError)
        throw salonError
      }

      const isOwner = salonData?.owner_id === currentUserId
      console.log('👑 Verificação de proprietário (unmarkAsMain):')
      console.log('👑 - currentUserId:', currentUserId)
      console.log('👑 - salonData.owner_id:', salonData?.owner_id)
      console.log('👑 - isOwner:', isOwner)
      console.log('👑 - Comparação:', salonData?.owner_id === currentUserId)

      // Buscar profissionais E funcionários vinculados ao salão
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

      if (professionalsResult.error) {
        console.error('❌ Erro ao buscar profissionais:', professionalsResult.error)
        throw professionalsResult.error
      }

      if (employeesResult.error) {
        console.error('❌ Erro ao buscar funcionários:', employeesResult.error)
        throw employeesResult.error
      }

      const professionalIds = professionalsResult.data?.map(p => p.professional_id) || []
      const employeeIds = employeesResult.data?.map(e => e.user_id) || []
      
      // Combinar IDs de profissionais e funcionários
      const allMemberIds = [...professionalIds, ...employeeIds]

      // Verificar se o post pertence a um membro do salão OU se o usuário é proprietário
      const { data: postData, error: postError } = await supabase
        .from('posts')
        .select('id, user_id, salon_main_post_priority, is_salon_main_post')
        .eq('id', postId)
        .single()

      if (postError) {
        console.error('❌ Erro ao buscar post:', postError)
        throw postError
      }

      // Verificar se o post pertence a um membro do salão OU se o usuário é proprietário
      console.log('🔍 Verificação de autorização (unmarkAsMain):')
      console.log('🔍 - Post user_id:', postData.user_id)
      console.log('🔍 - allMemberIds:', allMemberIds)
      console.log('🔍 - isOwner:', isOwner)
      console.log('🔍 - Post pertence a membro OU usuário é proprietário?', allMemberIds.includes(postData.user_id) || isOwner)
      
      if (!allMemberIds.includes(postData.user_id) && !isOwner) {
        console.error('❌ Post não pertence a membro do salão e usuário não é proprietário')
        console.error('❌ Detalhes da verificação (unmarkAsMain):')
        console.error('❌ - Post user_id:', postData.user_id)
        console.error('❌ - allMemberIds:', allMemberIds)
        console.error('❌ - currentUserId:', currentUserId)
        console.error('❌ - isOwner:', isOwner)
        toast({
          title: "Erro",
          description: "Você não tem permissão para gerenciar este post.",
          variant: "destructive"
        })
        return false
      }
      
      console.log('✅ Autorização aprovada (unmarkAsMain) - post pode ser gerenciado')

      // Verificar se o post realmente é principal
      if (!postData.is_salon_main_post) {
        console.log('⚠️ Post não está marcado como principal')
        toast({
          title: "Post não é principal",
          description: "Este post não está marcado como principal.",
          variant: "destructive"
        })
        return false
      }

      const removedPriority = postData?.salon_main_post_priority

      // Remover post dos principais
      console.log('🔍 DEBUG: Executando UPDATE para remover post dos principais...')
      console.log('🔍 DEBUG: Tabela: posts')
      console.log('🔍 DEBUG: Condição: id =', postId)
      console.log('🔍 DEBUG: Valores: is_salon_main_post = false, salon_main_post_priority = null')
      
      const { data: updateData, error: updateError } = await supabase
        .from('posts')
        .update({
          is_salon_main_post: false,
          salon_main_post_priority: null
        })
        .eq('id', postId)
        .select()

      // Log detalhado após o update
      console.log('🔍 DEBUG: Resposta do Supabase (unmarkAsMain):')
      console.log('🔍 DEBUG: updateData:', updateData)
      console.log('🔍 DEBUG: updateError:', updateError)

      if (updateError) {
        console.error('❌ Erro ao remover post dos principais:', updateError)
        console.error('❌ Código do erro:', updateError.code)
        console.error('❌ Mensagem do erro:', updateError.message)
        console.error('❌ Detalhes do erro:', updateError.details)
        throw updateError
      }

      console.log('✅ Post removido dos principais com sucesso:', updateData)

      // Reorganizar prioridades dos posts restantes
      if (removedPriority) {
        console.log('🔄 Reorganizando prioridades após remoção do post com prioridade:', removedPriority)
        
        // Buscar todos os posts principais restantes com prioridade maior que a removida
        const { data: remainingPosts, error: getRemainingError } = await supabase
          .from('posts')
          .select('id, salon_main_post_priority')
          .in('user_id', allMemberIds)
          .eq('is_salon_main_post', true)
          .gt('salon_main_post_priority', removedPriority) // CORRIGIDO: usar gt para pegar apenas posts com prioridade maior
          .order('salon_main_post_priority', { ascending: true })

        if (!getRemainingError && remainingPosts) {
          console.log('📊 Posts restantes para reorganizar:', remainingPosts)
          
          // Mover posts com prioridade maior para cima (decrementar prioridade)
          for (const post of remainingPosts) {
            const newPriority = post.salon_main_post_priority - 1
            console.log(`🔄 Reorganizando: post ${post.id} de prioridade ${post.salon_main_post_priority} para ${newPriority}`)
            
            const { error: moveError } = await supabase
              .from('posts')
              .update({ salon_main_post_priority: newPriority })
              .eq('id', post.id)
            
            if (moveError) {
              console.error(`❌ Erro ao reorganizar post ${post.id}:`, moveError)
              throw moveError
            }
          }
          
          // Verificar se há prioridades duplicadas após reorganização
          const { data: finalCheck, error: checkError } = await supabase
            .from('posts')
            .select('id, salon_main_post_priority')
            .in('user_id', allMemberIds)
            .eq('is_salon_main_post', true)
            .order('salon_main_post_priority', { ascending: true })
          
          if (!checkError && finalCheck) {
            const priorities = finalCheck.map(p => p.salon_main_post_priority).sort((a, b) => a - b)
            const uniquePriorities = [...new Set(priorities)]
            
            if (priorities.length !== uniquePriorities.length) {
              console.log('⚠️ Prioridades duplicadas detectadas após reorganização, corrigindo...')
              
              // Reorganizar prioridades para eliminar duplicatas
              for (let i = 0; i < finalCheck.length; i++) {
                const post = finalCheck[i]
                const correctPriority = i + 1
                
                if (post.salon_main_post_priority !== correctPriority) {
                  console.log(`🔄 Corrigindo prioridade do post ${post.id}: ${post.salon_main_post_priority} → ${correctPriority}`)
                  
                  await supabase
                    .from('posts')
                    .update({ salon_main_post_priority: correctPriority })
                    .eq('id', post.id)
                }
              }
            }
          }
        }
      }

      toast({
        title: "Post removido dos principais",
        description: "O post foi removido dos principais do salão.",
      })

      // Recarregar posts principais
      await fetchMainPosts()
      return true
    } catch (err) {
      console.error('❌ Erro ao remover post dos principais:', err)
      toast({
        title: "Erro",
        description: "Não foi possível remover o post dos principais.",
        variant: "destructive"
      })
      return false
    }
  }

  // Buscar posts principais quando o salão mudar
  useEffect(() => {
    console.log('🔄 useEffect useSalonMainPosts - salonId mudou:', salonId)
    console.log('🔄 useEffect useSalonMainPosts - currentUserId:', currentUserId)
    console.log('🔄 useEffect useSalonMainPosts - timestamp:', new Date().toISOString())
    
    if (salonId) {
      console.log('✅ salonId válido, buscando posts principais...')
      fetchMainPosts()
    } else {
      console.log('⚠️ salonId vazio, limpando posts principais')
      setMainPosts([])
      setLoading(false)
    }
  }, [salonId])

  return {
    mainPosts,
    loading,
    error,
    markAsMain,
    unmarkAsMain,
    refetch: fetchMainPosts
  }
}

