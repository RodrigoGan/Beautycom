import { useState, useEffect, useCallback, useRef } from 'react'
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

interface FollowCache {
  [userId: string]: {
    value: boolean
    timestamp: number
    ttl: number
  }
}

export const useFollows = (userId: string) => {
  const [stats, setStats] = useState<FollowStats>({ following: 0, followers: 0 })
  const [followingList, setFollowingList] = useState<FollowUser[]>([])
  const [followersList, setFollowersList] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Cache otimizado com TTL
  const followCache = useRef<FollowCache>({})
  const pendingRequests = useRef<Map<string, Promise<boolean>>>(new Map())
  const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

  const fetchFollowStats = useCallback(async () => {
    if (!userId) return

    try {
      const [followingResult, followersResult] = await Promise.all([
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId),
        supabase
          .from('user_follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId)
      ])

      setStats({
        following: followingResult.count || 0,
        followers: followersResult.count || 0
      })
    } catch (error) {
      console.error('Erro ao buscar estatísticas de follow:', error)
    }
  }, [userId])

  const fetchFollowingList = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          created_at,
          users!user_follows_following_id_fkey (
            id,
            name,
            nickname,
            profile_photo,
            user_type
          )
        `)
        .eq('follower_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar lista de seguindo:', error)
        return
      }

      const followingUsers = data?.map(item => ({
        id: item.following_id,
        name: item.users?.name || 'Usuário',
        nickname: item.users?.nickname || '',
        profile_photo: item.users?.profile_photo,
        user_type: item.users?.user_type || 'usuario',
        followed_at: item.created_at
      })) || []

      setFollowingList(followingUsers)
    } catch (error) {
      console.error('Erro ao buscar lista de seguindo:', error)
    }
  }, [userId])

  const fetchFollowersList = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          follower_id,
          created_at,
          users!user_follows_follower_id_fkey (
            id,
            name,
            nickname,
            profile_photo,
            user_type
          )
        `)
        .eq('following_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar lista de seguidores:', error)
        return
      }

      const followersUsers = data?.map(item => ({
        id: item.follower_id,
        name: item.users?.name || 'Usuário',
        nickname: item.users?.nickname || '',
        profile_photo: item.users?.profile_photo,
        user_type: item.users?.user_type || 'usuario',
        followed_at: item.created_at
      })) || []

      setFollowersList(followersUsers)
    } catch (error) {
      console.error('Erro ao buscar lista de seguidores:', error)
    }
  }, [userId])

  const followUser = useCallback(async (targetUserId: string) => {
    if (!userId || !targetUserId || userId === targetUserId) {
      return { success: false, error: 'Usuário inválido' }
    }

    try {
      const { error } = await supabase
        .from('user_follows')
        .insert({
          follower_id: userId,
          following_id: targetUserId
        })

      if (error) {
        console.error('Erro ao seguir usuário:', error)
        return { success: false, error: error.message }
      }

      await fetchFollowStats()
      return { success: true }
    } catch (error) {
      console.error('Erro ao seguir usuário:', error)
      return { success: false, error: 'Erro interno' }
    }
  }, [userId, fetchFollowStats])

  const unfollowUser = useCallback(async (targetUserId: string) => {
    if (!userId || !targetUserId || userId === targetUserId) {
      return { success: false, error: 'Usuário inválido' }
    }

    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', targetUserId)

      if (error) {
        console.error('Erro ao deixar de seguir usuário:', error)
        return { success: false, error: error.message }
      }

      await fetchFollowStats()
      await fetchFollowingList()
      return { success: true }
    } catch (error) {
      console.error('Erro ao deixar de seguir usuário:', error)
      return { success: false, error: 'Erro interno' }
    }
  }, [userId, fetchFollowStats, fetchFollowingList])

  const checkIfFollowing = useCallback(async (targetUserId: string): Promise<boolean> => {
    if (!userId || !targetUserId || userId === targetUserId) return false

    // Verificar cache primeiro
    const cached = followCache.current[targetUserId]
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.value
    }

    // Verificar requisição pendente
    if (pendingRequests.current.has(targetUserId)) {
      return pendingRequests.current.get(targetUserId)!
    }

    // Fazer requisição
    const promise = (async () => {
      try {
        const { data, error } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', userId)
          .eq('following_id', targetUserId)
          .single()

        const result = !!(data && !error)
        
        // Cachear resultado
        followCache.current[targetUserId] = {
          value: result,
          timestamp: Date.now(),
          ttl: CACHE_TTL
        }

        return result
      } catch (error) {
        console.error('Erro ao verificar follow:', error)
        return false
      }
    })()

    pendingRequests.current.set(targetUserId, promise)
    const result = await promise
    pendingRequests.current.delete(targetUserId)

    return result
  }, [userId, CACHE_TTL])

  // Verificação em lote otimizada
  const checkMultipleFollowStates = useCallback(async (userIds: string[]): Promise<Record<string, boolean>> => {
    if (!userId || !userIds.length) return {}

    try {
      const { data } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', userId)
        .in('following_id', userIds)

      const followingSet = new Set(data?.map(item => item.following_id) || [])
      const result: Record<string, boolean> = {}

      userIds.forEach(id => {
        result[id] = followingSet.has(id)
        // Cachear resultado
        followCache.current[id] = {
          value: result[id],
          timestamp: Date.now(),
          ttl: CACHE_TTL
        }
      })

      return result
    } catch (error) {
      console.error('Erro ao verificar múltiplos follows:', error)
      return {}
    }
  }, [userId, CACHE_TTL])

  // Carregar dados iniciais com dependências estáveis
  useEffect(() => {
    if (userId) {
      setLoading(true)
      Promise.all([
        fetchFollowStats(),
        fetchFollowingList(),
        fetchFollowersList()
      ]).finally(() => setLoading(false))
    }
  }, [userId]) // Apenas userId como dependência - SEM DEPENDÊNCIAS CIRCULARES

  return {
    stats,
    followingList,
    followersList,
    loading,
    error,
    followUser,
    unfollowUser,
    checkIfFollowing,
    checkMultipleFollowStates, // NOVA FUNÇÃO OTIMIZADA
    refetch: () => {
      fetchFollowStats()
      fetchFollowingList()
      fetchFollowersList()
    }
  }
}
