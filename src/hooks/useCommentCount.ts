import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export const useCommentCount = (postId: string) => {
  const [commentCount, setCommentCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const fetchCommentCount = useCallback(async () => {
    setIsLoading(true)
    try {
      const { count } = await supabase
        .from('post_comments')
        .select('*', { count: 'exact', head: true })
        .eq('post_id', postId)
        .eq('is_active', true)

      setCommentCount(count || 0)
    } catch (error) {
      console.error('Erro ao contar comentários:', error)
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  return {
    commentCount,
    isLoading,
    fetchCommentCount
  }
}
