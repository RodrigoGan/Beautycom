import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface FollowStats {
  following: number
  followers: number
}

interface FollowUser {
  id: string
  name: string
  nickname: string
  profile_photo?: string
  user_type: string
  cidade?: string
  uf?: string
}

export const useFollows = (userId: string) => {
  const [stats, setStats] = useState<FollowStats>({ following: 0, followers: 0 })
  const [followingList, setFollowingList] = useState<FollowUser[]>([])
  const [followersList, setFollowersList] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar estatísticas de follow
  const fetchFollowStats = useCallback(async () => {
    if (!userId) return

    try {
      // Contar seguindo
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)

      // Contar seguidores
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)

      setStats({
        following: followingCount || 0,
        followers: followersCount || 0
      })
    } catch (err) {
      console.error('Erro ao buscar estatísticas de follow:', err)
      setError('Erro ao carregar estatísticas')
    }
  }, [userId])

  // Buscar lista de seguindo
  const fetchFollowingList = useCallback(async () => {
    if (!userId) return

    try {
      console.log('🔍 Buscando seguindo para userId:', userId)
      
      // Primeiro, vamos buscar apenas os IDs dos seguindo
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })

      if (followError) {
        console.error('❌ Erro na query de follows:', followError)
        throw followError
      }

      console.log('📊 IDs dos seguindo:', followData)
      
      if (!followData || followData.length === 0) {
        console.log('👥 Nenhum seguindo encontrado')
        setFollowingList([])
        return
      }

      // Agora vamos buscar os dados dos usuários
      const followingIds = followData.map(item => item.following_id)
      console.log('🔍 IDs para buscar usuários:', followingIds)
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, nickname, profile_photo, user_type, cidade, uf')
        .in('id', followingIds)

      if (usersError) {
        console.error('❌ Erro na query de usuários:', usersError)
        throw usersError
      }

      console.log('📊 Dados dos usuários seguindo:', usersData)
      
      setFollowingList(usersData || [])
    } catch (err) {
      console.error('❌ Erro ao buscar lista de seguindo:', err)
    }
  }, [userId])

  // Buscar lista de seguidores
  const fetchFollowersList = useCallback(async () => {
    if (!userId) return

    try {
      console.log('🔍 Buscando seguidores para userId:', userId)
      
      // Primeiro, vamos buscar apenas os IDs dos seguidores
      const { data: followData, error: followError } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('following_id', userId)
        .order('created_at', { ascending: false })

      if (followError) {
        console.error('❌ Erro na query de follows:', followError)
        throw followError
      }

      console.log('📊 IDs dos seguidores:', followData)
      
      if (!followData || followData.length === 0) {
        console.log('👥 Nenhum seguidor encontrado')
        setFollowersList([])
        return
      }

      // Agora vamos buscar os dados dos usuários
      const followerIds = followData.map(item => item.follower_id)
      console.log('🔍 IDs para buscar usuários:', followerIds)
      
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, nickname, profile_photo, user_type, cidade, uf')
        .in('id', followerIds)

      if (usersError) {
        console.error('❌ Erro na query de usuários:', usersError)
        throw usersError
      }

      console.log('📊 Dados dos usuários seguidores:', usersData)
      
      setFollowersList(usersData || [])
    } catch (err) {
      console.error('❌ Erro ao buscar lista de seguidores:', err)
    }
  }, [userId])

  // Seguir usuário
  const followUser = useCallback(async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: userId,
          following_id: targetUserId
        })

      if (error) throw error

      // Atualizar estatísticas
      await fetchFollowStats()
      
      return { success: true }
    } catch (err) {
      console.error('Erro ao seguir usuário:', err)
      return { success: false, error: err }
    }
  }, [userId, fetchFollowStats])

  // Deixar de seguir usuário
  const unfollowUser = useCallback(async (targetUserId: string) => {
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)

      if (error) throw error

      // Atualizar estatísticas e listas
      await fetchFollowStats()
      await fetchFollowingList()
      
      return { success: true }
    } catch (err) {
      console.error('Erro ao deixar de seguir usuário:', err)
      return { success: false, error: err }
    }
  }, [userId, fetchFollowStats, fetchFollowingList])

  // Verificar se está seguindo
  const checkIfFollowing = useCallback(async (targetUserId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      return !!data
    } catch (err) {
      console.error('Erro ao verificar follow:', err)
      return false
    }
  }, [userId])

  // Carregar dados iniciais
  useEffect(() => {
    if (userId) {
      setLoading(true)
      Promise.all([
        fetchFollowStats(),
        fetchFollowingList(),
        fetchFollowersList()
      ]).finally(() => setLoading(false))
    }
  }, [userId, fetchFollowStats, fetchFollowingList, fetchFollowersList])

  return {
    stats,
    followingList,
    followersList,
    loading,
    error,
    followUser,
    unfollowUser,
    checkIfFollowing,
    refetch: () => {
      fetchFollowStats()
      fetchFollowingList()
      fetchFollowersList()
    }
  }
}
