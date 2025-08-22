import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface ProfileStats {
  following: number
  followers: number
  favorites: number
  likes: number
  posts: number
}

interface UserSocialMedia {
  instagram?: string
  facebook?: string
  youtube?: string
  linkedin?: string
  x?: string
  tiktok?: string
}

export const useProfileStats = (userId: string) => {
  const [stats, setStats] = useState<ProfileStats>({
    following: 0,
    followers: 0,
    favorites: 0,
    likes: 0,
    posts: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!userId) return

    setLoading(true)
    setError(null)

    try {
      // Buscar número de posts do usuário (apenas posts ativos)
      const { count: postsCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true)

      // Buscar likes dados pelo usuário
      const { count: likesCount } = await supabase
        .from('post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Buscar favoritos dados pelo usuário
      const { count: favoritesCount } = await supabase
        .from('post_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      // Buscar estatísticas de follow
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      console.log('📊 Estatísticas do perfil:', {
        userId,
        postsCount,
        likesCount,
        favoritesCount,
        followingCount,
        followersCount
      })

      setStats({
        following: followingCount,
        followers: followersCount,
        favorites: favoritesCount,
        likes: likesCount,
        posts: postsCount || 0
      })

    } catch (err) {
      console.error('Erro ao buscar estatísticas do perfil:', err)
      setError('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}
