import { useState, useEffect, useCallback } from 'react'
import { useSubscriptionInfo } from './useSubscriptionInfo'
import { supabase } from '@/lib/supabase'

export interface AgendaStatus {
  hasActiveAgenda: boolean
  agendaType: 'trial' | 'subscription' | 'salon' | 'none'
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

      // 1. Verificar se tem assinatura ativa
      if (subscriptionSummary?.isActive) {
        setAgendaStatus({
          hasActiveAgenda: true,
          agendaType: subscriptionSummary.type === 'trial' ? 'trial' : 'subscription',
          isActive: true,
          loading: false,
          error: null
        })
        return
      }

      // 2. Verificar se está vinculado a um salão com agenda ativa
      const { data: salonData, error: salonError } = await supabase
        .from('salon_professionals')
        .select(`
          id,
          agenda_enabled,
          salon:salons_studios(
            id,
            name,
            owner_id
          )
        `)
        .eq('professional_id', userId)
        .eq('status', 'accepted')
        .eq('agenda_enabled', true)
        .single()

      if (!salonError && salonData) {
        setAgendaStatus({
          hasActiveAgenda: true,
          agendaType: 'salon',
          isActive: true,
          loading: false,
          error: null
        })
        return
      }

      // 3. Verificar se tem agenda habilitada diretamente no usuário
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('agenda_enabled')
        .eq('id', userId)
        .eq('agenda_enabled', true)
        .single()

      if (!userError && userData) {
        setAgendaStatus({
          hasActiveAgenda: true,
          agendaType: 'trial', // Assumir trial se tem agenda_enabled
          isActive: true,
          loading: false,
          error: null
        })
        return
      }

      // 4. Nenhuma agenda ativa encontrada
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
