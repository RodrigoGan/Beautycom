import { useCallback, useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useSubscriptionInfo } from './useSubscriptionInfo'

export interface AgendaStatus {
  hasActiveAgenda: boolean
  agendaType: 'trial' | 'subscription' | 'salon_enabled' | 'none'
  isActive: boolean
  loading: boolean
  error: string | null
}

export const useAgendaStatus = (userId?: string) => {
  const [agendaStatus, setAgendaStatus] = useState<AgendaStatus>({
    hasActiveAgenda: false,
    agendaType: 'none',
    isActive: false,
    loading: true,
    error: null
  })

  const { subscriptionSummary } = useSubscriptionInfo(userId)

  const checkAgendaStatus = useCallback(async () => {
    if (!userId) {
      setAgendaStatus({
        hasActiveAgenda: false,
        agendaType: 'none',
        isActive: false,
        loading: false,
        error: null
      })
      return
    }

    try {
      setAgendaStatus(prev => ({ ...prev, loading: true, error: null }))

      // 1. Verificar se tem trial ativo
      if (subscriptionSummary?.type === 'trial' && subscriptionSummary?.isActive) {
        setAgendaStatus({
          hasActiveAgenda: true,
          agendaType: 'trial',
          isActive: true,
          loading: false,
          error: null
        })
        return
      }

      // 2. Verificar se tem assinatura ativa
      if (subscriptionSummary?.type === 'subscription' && subscriptionSummary?.isActive) {
        setAgendaStatus({
          hasActiveAgenda: true,
          agendaType: 'subscription',
          isActive: true,
          loading: false,
          error: null
        })
        return
      }

      // 3. Verificar se tem agenda habilitada no perfil
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('agenda_enabled')
        .eq('id', userId)
        .single()

      if (userError) {
        throw userError
      }

      if (userData?.agenda_enabled) {
        setAgendaStatus({
          hasActiveAgenda: true,
          agendaType: 'salon_enabled',
          isActive: true,
          loading: false,
          error: null
        })
        return
      }

      // 4. Verificar se está vinculado a salão com agenda ativa
      const { data: salonData, error: salonError } = await supabase
        .from('salon_professionals')
        .select('agenda_enabled, salons_studios!inner(owner_id)')
        .eq('professional_id', userId)
        .eq('status', 'active')
        .eq('agenda_enabled', true)
        .single()

      if (salonError && salonError.code !== 'PGRST116') {
        throw salonError
      }

      if (salonData?.agenda_enabled) {
        setAgendaStatus({
          hasActiveAgenda: true,
          agendaType: 'salon_enabled',
          isActive: true,
          loading: false,
          error: null
        })
        return
      }

      // 5. Nenhuma agenda ativa encontrada
      setAgendaStatus({
        hasActiveAgenda: false,
        agendaType: 'none',
        isActive: false,
        loading: false,
        error: null
      })

    } catch (error) {
      console.error('Erro ao verificar status da agenda:', error)
      setAgendaStatus({
        hasActiveAgenda: false,
        agendaType: 'none',
        isActive: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      })
    }
  }, [userId, subscriptionSummary])

  useEffect(() => {
    checkAgendaStatus()
  }, [checkAgendaStatus])

  return {
    ...agendaStatus,
    refetch: checkAgendaStatus
  }
}
