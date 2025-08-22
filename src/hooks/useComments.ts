import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLoginModal } from '@/contexts/LoginModalContext'

export interface Comment {
  id: string
  comment: string
  created_at: string
  user: {
    name: string
    email: string
    profile_photo?: string
  }
}

export const useComments = (postId: string) => {
  const { user } = useAuthContext()
  const { showLoginModal } = useLoginModal()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isPosting, setIsPosting] = useState(false)

  // Buscar comentários do post
  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          comment,
          created_at,
          user:users!post_comments_user_id_fkey(name, email, profile_photo)
        `)
        .eq('post_id', postId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      
      console.log('🔍 Comentários buscados:', data)
      console.log('🔍 Estrutura do primeiro comentário:', data?.[0])
      
      setComments(data || [])
    } catch (error) {
      console.error('Erro ao buscar comentários:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  // Adicionar comentário
  const addComment = useCallback(async (commentText: string) => {
    if (!user) {
      showLoginModal()
      return
    }

    if (!commentText.trim()) {
      alert('Digite um comentário')
      return
    }

    setIsPosting(true)
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          comment: commentText.trim()
        })
        .select(`
          id,
          comment,
          created_at,
          user:users!post_comments_user_id_fkey(name, email, profile_photo)
        `)
        .single()

      if (error) throw error

      // Adicionar novo comentário à lista
      setComments(prev => [...prev, data])
      
      return data
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error)
      throw error
    } finally {
      setIsPosting(false)
    }
  }, [postId, user])

  return {
    comments,
    isLoading,
    isPosting,
    fetchComments,
    addComment
  }
}
