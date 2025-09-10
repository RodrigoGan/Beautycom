import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLoginModal } from '@/contexts/LoginModalContext'

export const useFavorites = (postId: string) => {
  const { user } = useAuthContext()
  const { showLoginModal } = useLoginModal()
  const [isFavorited, setIsFavorited] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Verificar se o usuário já favoritou o post
  const checkIfFavorited = useCallback(async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('post_favorites')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)

      // Se não há dados ou erro, o usuário não favoritou
      if (error || !data || data.length === 0) {
        setIsFavorited(false)
      } else {
        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Erro ao verificar favorito:', error)
      setIsFavorited(false)
    }
  }, [postId, user])

  // Toggle favorito
  const toggleFavorite = useCallback(async () => {
    if (!user) {
      showLoginModal()
      return
    }

    setIsLoading(true)

    try {
      if (isFavorited) {
        // Remover favorito
        await supabase
          .from('post_favorites')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id)

        setIsFavorited(false)
      } else {
        // Adicionar favorito
        await supabase
          .from('post_favorites')
          .insert({
            post_id: postId,
            user_id: user.id
          })

        setIsFavorited(true)
      }
    } catch (error) {
      console.error('Erro ao toggle favorito:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId, user, isFavorited])

  return {
    isFavorited,
    isLoading,
    toggleFavorite,
    checkIfFavorited
  }
}
