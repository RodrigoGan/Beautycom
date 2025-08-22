import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export interface SalonProfessional {
  id: string
  salon_id: string
  professional_id: string
  status: 'pending' | 'accepted' | 'rejected'
  service_type?: string
  agenda_enabled?: boolean
  agenda_enabled_at?: string
  agenda_enabled_by?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  professional?: {
    id: string
    name: string
    email: string
    profile_photo?: string
    user_type: string
  }
  enabled_by_user?: {
    id: string
    name: string
  }
}

export const useSalonProfessionals = (salonId: string) => {
  const { user } = useAuthContext()
  const [professionals, setProfessionals] = useState<SalonProfessional[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)


  // Buscar profissionais do salão
  const fetchProfessionals = useCallback(async () => {
    if (!salonId) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando profissionais do salão:', salonId)

      // Buscar dados dos profissionais primeiro
      const { data: salonProData, error: salonProError } = await supabase
        .from('salon_professionals')
        .select('*')
        .eq('salon_id', salonId)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (salonProError) {
        console.error('❌ Erro ao buscar salon_professionals:', salonProError)
        throw salonProError
      }

      // Se não tem dados, retornar vazio
      if (!salonProData || salonProData.length === 0) {
        console.log('ℹ️ Nenhum profissional encontrado')
        setProfessionals([])
        return
      }

      // Buscar dados dos usuários profissionais
      const professionalIds = salonProData.map(sp => sp.professional_id).filter(Boolean)
      const enabledByIds = salonProData.map(sp => sp.agenda_enabled_by).filter(Boolean)
      const allUserIds = [...new Set([...professionalIds, ...enabledByIds])]

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, profile_photo, user_type')
        .in('id', allUserIds)

      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError)
        // Mesmo com erro nos usuários, vamos mostrar os profissionais sem os dados do usuário
      }

      // Combinar os dados
      const data = salonProData.map(salonPro => ({
        ...salonPro,
        professional: usersData?.find(user => user.id === salonPro.professional_id) || null,
        enabled_by_user: usersData?.find(user => user.id === salonPro.agenda_enabled_by) || null
      }))

      const error = null

      if (error) {
        console.error('❌ Erro ao buscar profissionais:', error)
        throw error
      }

      console.log('✅ Profissionais encontrados:', data?.length || 0)
      
      // Log dos status encontrados para debug
      if (data && data.length > 0) {
        const statusCount = data.reduce((acc, prof) => {
          acc[prof.status] = (acc[prof.status] || 0) + 1
          return acc
        }, {} as Record<string, number>)
        console.log('📊 Status dos profissionais:', statusCount)
      }
      
      setProfessionals(data || [])

    } catch (err) {
      console.error('❌ Erro ao buscar profissionais:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [salonId])

  // Adicionar profissional ao salão
  const addProfessional = useCallback(async (professionalId: string, serviceType?: string) => {
    if (!salonId) return { success: false, error: 'ID do salão não fornecido' }

    try {
      setError(null)

      console.log('➕ Adicionando profissional:', { salonId, professionalId, serviceType })

      // Verificar se o profissional já está vinculado
      const existingProfessional = professionals.find(prof => prof.professional_id === professionalId)
      if (existingProfessional) {
        return { success: false, error: 'Profissional já está vinculado a este salão' }
      }

      const { data, error } = await supabase
        .from('salon_professionals')
        .insert({
          salon_id: salonId,
          professional_id: professionalId,
          status: 'pending',
          service_type: serviceType || 'other'
        })
        .select(`
          *,
          professional:users(id, name, email, profile_photo, user_type)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao adicionar profissional:', error)
        throw error
      }

      console.log('✅ Profissional adicionado com sucesso:', data)
      setProfessionals(prev => [data, ...prev])

      return { success: true, data }

    } catch (err) {
      console.error('❌ Erro ao adicionar profissional:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId, professionals])

  // Aceitar profissional
  const acceptProfessional = useCallback(async (professionalId: string) => {
    try {
      setError(null)

      console.log('✅ Aceitando profissional:', professionalId)

      const { data, error } = await supabase
        .from('salon_professionals')
        .update({ status: 'accepted' })
        .eq('id', professionalId)
        .eq('salon_id', salonId)
        .select(`
          *,
          professional:users(id, name, email, profile_photo, user_type)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao aceitar profissional:', error)
        throw error
      }

      console.log('✅ Profissional aceito com sucesso:', data)
      setProfessionals(prev => prev.map(prof => prof.id === professionalId ? data : prof))

      return { success: true, data }

    } catch (err) {
      console.error('❌ Erro ao aceitar profissional:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId])

  // Rejeitar profissional
  const rejectProfessional = useCallback(async (professionalId: string) => {
    try {
      setError(null)

      console.log('❌ Rejeitando profissional:', professionalId)

      const { data, error } = await supabase
        .from('salon_professionals')
        .update({ status: 'rejected' })
        .eq('id', professionalId)
        .eq('salon_id', salonId)
        .select(`
          *,
          professional:users(id, name, email, profile_photo, user_type)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao rejeitar profissional:', error)
        throw error
      }

      console.log('✅ Profissional rejeitado com sucesso:', data)
      setProfessionals(prev => prev.map(prof => prof.id === professionalId ? data : prof))

      return { success: true, data }

    } catch (err) {
      console.error('❌ Erro ao rejeitar profissional:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId])

  // Remover profissional
  const removeProfessional = useCallback(async (professionalId: string) => {
    try {
      setError(null)

      console.log('🗑️ Removendo profissional:', professionalId)

      const { error } = await supabase
        .from('salon_professionals')
        .delete()
        .eq('id', professionalId)
        .eq('salon_id', salonId)

      if (error) {
        console.error('❌ Erro ao remover profissional:', error)
        throw error
      }

      console.log('✅ Profissional removido com sucesso')
      setProfessionals(prev => prev.filter(prof => prof.id !== professionalId))

      return { success: true }

    } catch (err) {
      console.error('❌ Erro ao remover profissional:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId])

  // Habilitar agenda para profissional
  const enableAgenda = useCallback(async (professionalId: string) => {
    try {
      setError(null)

      console.log('✅ Habilitando agenda para profissional:', professionalId)

      // Primeiro, atualizar o registro
      const { data: updateData, error: updateError } = await supabase
        .from('salon_professionals')
        .update({ 
          agenda_enabled: true,
          agenda_enabled_at: new Date().toISOString(),
          agenda_enabled_by: user?.id
        })
        .eq('id', professionalId)
        .eq('salon_id', salonId)
        .select('*')
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar agenda:', updateError)
        throw updateError
      }

      console.log('✅ Agenda atualizada no banco:', updateData)

      // Buscar dados do profissional e quem habilitou
      const userIds = [updateData.professional_id, updateData.agenda_enabled_by].filter(Boolean)
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email, profile_photo, user_type')
        .in('id', userIds)

      // Combinar os dados
      const combinedData = {
        ...updateData,
        professional: usersData?.find(u => u.id === updateData.professional_id) || null,
        enabled_by_user: usersData?.find(u => u.id === updateData.agenda_enabled_by) || null
      }

      console.log('✅ Dados combinados:', combinedData)

      // Atualizar o estado local
      setProfessionals(prev => {
        const updated = prev.map(prof => prof.id === professionalId ? combinedData : prof)
        console.log('✅ Estado atualizado:', updated)
        return updated
      })

      return { success: true, data: combinedData }

    } catch (err) {
      console.error('❌ Erro ao habilitar agenda:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId, user?.id])

  // Desabilitar agenda para profissional
  const disableAgenda = useCallback(async (professionalId: string) => {
    try {
      setError(null)

      console.log('❌ Desabilitando agenda para profissional:', professionalId)

      // Primeiro, atualizar o registro
      const { data: updateData, error: updateError } = await supabase
        .from('salon_professionals')
        .update({ 
          agenda_enabled: false,
          agenda_enabled_at: null,
          agenda_enabled_by: null
        })
        .eq('id', professionalId)
        .eq('salon_id', salonId)
        .select('*')
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar agenda:', updateError)
        throw updateError
      }

      console.log('✅ Agenda desabilitada no banco:', updateData)

      // Buscar dados do profissional
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email, profile_photo, user_type')
        .eq('id', updateData.professional_id)
        .single()

      // Combinar os dados
      const combinedData = {
        ...updateData,
        professional: usersData || null,
        enabled_by_user: null // Quando desabilitado, não há usuário que habilitou
      }

      console.log('✅ Dados combinados:', combinedData)

      // Atualizar o estado local
      setProfessionals(prev => {
        const updated = prev.map(prof => prof.id === professionalId ? combinedData : prof)
        console.log('✅ Estado atualizado:', updated)
        return updated
      })

      return { success: true, data: combinedData }

    } catch (err) {
      console.error('❌ Erro ao desabilitar agenda:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId])

  // Buscar usuários para adicionar como profissionais
  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) return []

    try {
      // Buscar usuários que correspondem ao termo de busca e são profissionais
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, profile_photo, user_type')
        .eq('user_type', 'profissional')
        .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error)
        throw error
      }

      // Filtrar usuários que já são profissionais do salão
      const existingProfessionalIds = professionals.map(prof => prof.professional_id)
      const availableUsers = data?.filter(user => !existingProfessionalIds.includes(user.id)) || []

      return availableUsers

    } catch (err) {
      console.error('❌ Erro ao buscar usuários:', err)
      return []
    }
  }, [professionals])

  return {
    // Estados
    professionals,
    loading,
    error,

    // Funções
    fetchProfessionals,
    addProfessional,
    acceptProfessional,
    rejectProfessional,
    removeProfessional,
    enableAgenda,
    disableAgenda,
    searchUsers
  }
}
