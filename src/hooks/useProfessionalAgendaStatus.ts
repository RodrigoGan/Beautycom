import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ProfessionalAgendaStatus {
  hasServices: boolean
  hasActiveAgenda: boolean
  agendaType: 'trial' | 'subscription' | 'salon' | 'none'
  isTrialExpired: boolean
  loading: boolean
  error: string | null
}

export const useProfessionalAgendaStatus = (professionalId?: string) => {
  const [status, setStatus] = useState<ProfessionalAgendaStatus>({
    hasServices: false,
    hasActiveAgenda: false,
    agendaType: 'none',
    isTrialExpired: false,
    loading: true,
    error: null
  })

  const checkAgendaStatus = useCallback(async (): Promise<ProfessionalAgendaStatus> => {
    if (!professionalId) {
      const defaultStatus = {
        hasServices: false,
        hasActiveAgenda: false,
        agendaType: 'none' as const,
        isTrialExpired: false,
        loading: false,
        error: null
      }
      setStatus(defaultStatus)
      return defaultStatus
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }))

      // 1. Verificar se tem serviços cadastrados
      const { data: servicesData, error: servicesError } = await supabase
        .from('professional_services')
        .select('id')
        .eq('professional_id', professionalId)
        .eq('is_active', true)
        .limit(1)

      if (servicesError) throw servicesError
      const hasServices = (servicesData?.length || 0) > 0

      // 2. Verificar se tem agenda ativa (users.agenda_enabled)
      let hasUserAgenda = false
      try {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('agenda_enabled')
          .eq('id', professionalId)
          .single()

        if (!userError && userData) {
          hasUserAgenda = userData.agenda_enabled || false
        }
      } catch (error) {
        console.warn('Erro ao verificar agenda do usuário:', error)
      }

      // 3. Verificar se está vinculado a um salão com agenda ativa
      let hasSalonAgenda = false
      try {
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
          .eq('professional_id', professionalId)
          .eq('status', 'accepted')
          .eq('agenda_enabled', true)
          .single()

        hasSalonAgenda = !salonError && salonData
      } catch (error) {
        console.warn('Erro ao verificar agenda do salão:', error)
      }

      // 4. Verificar trial ativo
      let hasActiveTrial = false
      let isTrialExpired = false
      try {
        const { data: trialData, error: trialError } = await supabase
          .from('professional_trials')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('status', 'active')
          .single()

        if (!trialError && trialData) {
          hasActiveTrial = new Date(trialData.end_date) > new Date()
          isTrialExpired = new Date(trialData.end_date) <= new Date()
        }
      } catch (error) {
        console.warn('Erro ao verificar trial:', error)
      }

      // 5. Verificar assinatura ativa
      let hasActiveSubscription = false
      try {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', professionalId)
          .eq('status', 'active')
          .single()

        hasActiveSubscription = !subscriptionError && subscriptionData
      } catch (error) {
        console.warn('Erro ao verificar assinatura:', error)
      }

      // Determinar tipo de agenda e se está ativa
      let agendaType: 'trial' | 'subscription' | 'salon' | 'none' = 'none'
      let hasActiveAgenda = false

      if (hasActiveSubscription) {
        agendaType = 'subscription'
        hasActiveAgenda = true
      } else if (hasActiveTrial) {
        agendaType = 'trial'
        hasActiveAgenda = true
      } else if (hasSalonAgenda) {
        agendaType = 'salon'
        hasActiveAgenda = true
      } else if (hasUserAgenda) {
        agendaType = 'subscription' // Assumindo que é assinatura se tem agenda habilitada
        hasActiveAgenda = true
      }

      const finalStatus = {
        hasServices,
        hasActiveAgenda,
        agendaType,
        isTrialExpired,
        loading: false,
        error: null
      }
      
      setStatus(finalStatus)
      return finalStatus

    } catch (error) {
      console.error('Erro ao verificar status da agenda:', error)
      const errorStatus = {
        hasServices: false,
        hasActiveAgenda: false,
        agendaType: 'none' as const,
        isTrialExpired: false,
        loading: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
      setStatus(errorStatus)
      return errorStatus
    }
  }, [professionalId])

  return {
    ...status,
    checkAgendaStatus
  }
}
