import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLoginModal } from '@/contexts/LoginModalContext'

export const useLikes = (postId: string) => {
  const { user } = useAuthContext()
  const { showLoginModal } = useLoginModal()
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Verificar se o usuário já curtiu o post
  const checkIfLiked = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('post_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)

      // Se não há dados ou erro, o usuário não curtiu
      if (error || !data || data.length === 0) {
        setIsLiked(false)
      } else {
        setIsLiked(true)
      }
    } catch (error) {
      console.error('Erro ao verificar like:', error)
      setIsLiked(false)
    }
  }, [postId, user])

  // Contar likes do post
  const getLikeCount = useCallback(async () => {
    try {
      const { count } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)

      setLikeCount(count || 0)
    } catch (error) {
      console.error('Erro ao contar likes:', error)
    }
  }, [postId])

  // Toggle like
  const toggleLike = useCallback(async () => {
    if (!user) {
      showLoginModal()
      return
    }

    setIsLoading(true)

    try {
      if (isLiked) {
        // Remover like
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        setIsLiked(false)
        setLikeCount(prev => Math.max(0, prev - 1))
      } else {
        // Adicionar like
        await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Erro ao toggle like:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId, user, isLiked])

  return {
    isLiked,
    likeCount,
    isLoading,
    toggleLike,
    checkIfLiked,
    getLikeCount
  }
}
