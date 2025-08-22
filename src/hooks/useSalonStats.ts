import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface SalonStats {
  followers: number
  professionals: number
  clients: number
  posts: number
}

export const useSalonStats = (salonId: string) => {
  const [stats, setStats] = useState<SalonStats>({
    followers: 0,
    professionals: 0,
    clients: 0,
    posts: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!salonId) return

    console.log('📊 Iniciando busca de estatísticas do salão:', salonId)
    setLoading(true)
    setError(null)

    try {
      // Buscar seguidores do salão (quem segue o salão)
      console.log('👥 Buscando seguidores do salão...')
      const { count: followersCount } = await supabase
        .from('salon_follows')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', salonId)

      console.log('📊 Seguidores encontrados:', followersCount)

      // Buscar profissionais vinculados ao salão (apenas profissionais, excluindo usuários comuns)
      console.log('👨‍💼 Buscando profissionais vinculados...')
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('salon_professionals')
        .select('professional_id')
        .eq('salon_id', salonId)
        .eq('status', 'accepted')

      if (professionalsError) {
        console.error('❌ Erro ao buscar profissionais:', professionalsError)
      }

      console.log('📊 Profissionais vinculados encontrados:', professionalsData?.length || 0, professionalsData)

      // Buscar tipos de usuário dos profissionais
      let professionalsCount = 0
      let postsCount = 0
      if (professionalsData && professionalsData.length > 0) {
        const professionalIds = professionalsData.map(p => p.professional_id)
        console.log('🔍 Buscando tipos de usuário para:', professionalIds)
        
        const { data: usersData } = await supabase
          .from('users')
          .select('id, user_type')
          .in('id', professionalIds)
        
        console.log('👥 Dados dos usuários:', usersData)
        
        // Contar apenas profissionais (excluindo usuários comuns)
        professionalsCount = usersData?.filter(user => user.user_type === 'profissional').length || 0
        console.log('📊 Profissionais confirmados:', professionalsCount)

        // Buscar posts dos profissionais vinculados
        console.log('📝 Buscando posts dos profissionais...')
        const { count: postsCountResult } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .in('user_id', professionalIds)
          .eq('is_active', true)

        postsCount = postsCountResult || 0
        console.log('📊 Posts encontrados:', postsCount)
      }

      // Buscar clientes que interagem com o salão (likes, comentários, etc.)
      console.log('👤 Buscando clientes que interagem...')
      const { count: clientsCount } = await supabase
        .from('salon_interactions')
        .select('*', { count: 'exact', head: true })
        .eq('salon_id', salonId)

      console.log('📊 Clientes encontrados:', clientsCount)

      console.log('📊 Estatísticas finais do salão:', {
        salonId,
        followersCount,
        professionalsCount,
        clientsCount,
        postsCount
      })

      setStats({
        followers: followersCount || 0,
        professionals: professionalsCount,
        clients: clientsCount || 0,
        posts: postsCount
      })

    } catch (err) {
      console.error('❌ Erro ao buscar estatísticas do salão:', err)
      setError('Erro ao carregar estatísticas')
    } finally {
      setLoading(false)
    }
  }, [salonId])

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
