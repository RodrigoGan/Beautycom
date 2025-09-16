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
    agenda_enabled?: boolean // ✅ Adicionado campo agenda_enabled
  }
  enabled_by_user?: {
    id: string
    name: string
  }
}

export const useSalonProfessionals = (salonId: string | null) => {
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

      // Buscar dados dos usuários profissionais (incluindo agenda_enabled)
      const professionalIds = salonProData.map(sp => sp.professional_id).filter(Boolean)
      const enabledByIds = salonProData.map(sp => sp.agenda_enabled_by).filter(Boolean)
      const allUserIds = [...new Set([...professionalIds, ...enabledByIds])]

      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email, profile_photo, user_type, agenda_enabled')
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
        
        // Log detalhado de cada profissional para debug
        data.forEach(prof => {
          console.log('🔍 Profissional:', {
            id: prof.id,
            professional_id: prof.professional_id,
            professional_name: prof.professional?.name,
            agenda_enabled: prof.agenda_enabled,
            user_agenda_enabled: prof.professional?.agenda_enabled,
            agenda_enabled_at: prof.agenda_enabled_at,
            agenda_enabled_by: prof.agenda_enabled_by
          })
        })
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
          professional:users!salon_professionals_professional_id_fkey(id, name, email, profile_photo, user_type)
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
          professional:users!salon_professionals_professional_id_fkey(id, name, email, profile_photo, user_type)
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
          professional:users!salon_professionals_professional_id_fkey(id, name, email, profile_photo, user_type)
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
    if (!salonId) {
      console.error('❌ salonId é obrigatório para habilitar agenda')
      throw new Error('ID do salão é obrigatório')
    }

    try {
      setError(null)

      console.log('✅ Habilitando agenda para profissional:', professionalId)

      // 1. Primeiro, atualizar o registro na tabela salon_professionals
      const { data: updateData, error: updateError } = await supabase
        .from('salon_professionals')
        .update({ 
          agenda_enabled: true,
          agenda_enabled_at: new Date().toISOString(),
          agenda_enabled_by: user?.id
        })
        .eq('professional_id', professionalId)
        .eq('salon_id', salonId)
        .select('*')
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar salon_professionals:', updateError)
        throw updateError
      }

      // 2. Atualizar também a tabela users (agenda global)
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ agenda_enabled: true })
        .eq('id', updateData.professional_id)

      if (userUpdateError) {
        console.error('❌ Erro ao atualizar users:', userUpdateError)
        throw userUpdateError
      }

      // 3. Adicionar o profissional à subscription_professionals (se não existir)
      // Primeiro, buscar a assinatura ativa do dono do salão
      if (!salonId) {
        console.error('❌ salonId é null, pulando busca do dono do salão')
        return { success: true, data: updateData }
      }
      
      const { data: salonData } = await supabase
        .from('salons_studios')
        .select('owner_id')
        .eq('id', salonId)
        .single()

      if (salonData?.owner_id) {
        // Buscar a assinatura ativa do dono
        const { data: subscriptionData } = await supabase
          .from('user_subscriptions')
          .select('id')
          .eq('user_id', salonData.owner_id)
          .eq('status', 'active')
          .single()

        if (subscriptionData) {
          // Verificar se o profissional já está na subscription_professionals
          const { data: existingSubscription } = await supabase
            .from('subscription_professionals')
            .select('id')
            .eq('subscription_id', subscriptionData.id)
            .eq('professional_id', professionalId)
            .single()

          if (!existingSubscription) {
            // Adicionar o profissional à subscription_professionals
            const { error: subscriptionError } = await supabase
              .from('subscription_professionals')
              .insert({
                subscription_id: subscriptionData.id,
                professional_id: professionalId,
                status: 'active',
                enabled_by: user?.id, // Adicionar o ID do usuário que habilitou
                created_at: new Date().toISOString()
              })

            if (subscriptionError) {
              console.error('❌ Erro ao adicionar à subscription_professionals:', subscriptionError)
              // Não falhar a operação por causa disso, apenas logar
            } else {
              console.log('✅ Profissional adicionado à subscription_professionals')
            }
          }
        }
      }

      console.log('✅ Agenda habilitada no banco (salon_professionals, users e subscription_professionals):', updateData)

      // 4. Buscar dados atualizados do profissional e quem habilitou
      const userIds = [updateData.professional_id, updateData.agenda_enabled_by].filter(Boolean)
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email, profile_photo, user_type, agenda_enabled')
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
        const updated = prev.map(prof => prof.professional_id === professionalId ? combinedData : prof)
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
    if (!salonId) {
      console.error('❌ salonId é obrigatório para desabilitar agenda')
      throw new Error('ID do salão é obrigatório')
    }

    try {
      setError(null)

      console.log('❌ Desabilitando agenda para profissional:', professionalId)

      // 1. Primeiro, atualizar o registro na tabela salon_professionals
      const { data: updateData, error: updateError } = await supabase
        .from('salon_professionals')
        .update({ 
          agenda_enabled: false,
          agenda_enabled_at: null,
          agenda_enabled_by: null
        })
        .eq('professional_id', professionalId)
        .eq('salon_id', salonId)
        .select('*')
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar salon_professionals:', updateError)
        throw updateError
      }

      // 2. Atualizar também a tabela users (agenda global)
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ agenda_enabled: false })
        .eq('id', updateData.professional_id)

      if (userUpdateError) {
        console.error('❌ Erro ao atualizar users:', userUpdateError)
        throw userUpdateError
      }

      // 3. NÃO remover o profissional da subscription_professionals
      // ✅ MANTÉM O VÍNCULO COM O SALÃO - APENAS PAUSA A AGENDA
      console.log('✅ Agenda pausada (salon_professionals e users) - vínculo com salão mantido:', updateData)

      // 4. Buscar dados atualizados do profissional
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email, profile_photo, user_type, agenda_enabled')
        .eq('id', updateData.professional_id)
        .single()

      // 5. Combinar os dados
      const combinedData = {
        ...updateData,
        professional: usersData || null,
        enabled_by_user: null // Quando desabilitado, não há usuário que habilitou
      }

      console.log('✅ Dados combinados:', combinedData)

      // 6. Atualizar o estado local
      setProfessionals(prev => {
        const updated = prev.map(prof => prof.professional_id === professionalId ? combinedData : prof)
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
