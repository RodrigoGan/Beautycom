import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export interface SubscriptionInfo {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
  plan: {
    id: string
    name: string
    description: string
    max_professionals: number
    price_monthly: number
    price_yearly: number
    features: string[]
  }
}

export interface TrialInfo {
  id: string
  professional_id: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'used'
  created_at: string
}

export interface SubscriptionSummary {
  type: 'trial' | 'subscription' | 'none'
  status: 'active' | 'expired' | 'canceled'
  planName?: string
  maxProfessionals?: number
  currentProfessionals?: number
  expirationDate?: string
  daysRemaining?: number
  isActive: boolean
  trialInfo?: TrialInfo
  subscriptionInfo?: SubscriptionInfo
}

export const useSubscriptionInfo = (userId?: string) => {
  const { user } = useAuthContext()
  const [loading, setLoading] = useState(false)
  const [subscriptionSummary, setSubscriptionSummary] = useState<SubscriptionSummary | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchSubscriptionInfo = useCallback(async () => {
    const targetUserId = userId || user?.id
    if (!targetUserId) return

    try {
      setLoading(true)
      setError(null)

      // 0. Primeiro, verificar e desativar trials expirados (opcional)
      try {
        await supabase.rpc('deactivate_expired_trial_agendas')
      } catch (deactivateError) {
        // Função pode não existir ainda, não é crítico
        console.log('ℹ️ Função deactivate_expired_trial_agendas não disponível:', deactivateError.message)
      }

      // 1. Buscar assinatura ativa do usuário
      console.log('🔍 Buscando informações de assinatura para usuário:', targetUserId)
      
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          id,
          status,
          current_period_end,
          plan:subscription_plans(
            id,
            name,
            max_professionals
          )
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError
      }

      if (subscriptionData) {
        console.log('✅ Assinatura encontrada:', subscriptionData)
        
        // Usar UTC para evitar problemas de fuso horário
        const periodEndDate = new Date(subscriptionData.current_period_end)
        const now = new Date()
        
        // Calcular diferença em dias de forma mais precisa
        const periodEndUTC = new Date(periodEndDate.getTime() + periodEndDate.getTimezoneOffset() * 60000)
        const nowUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
        
        // Calcular diferença em milissegundos
        const timeDiff = periodEndUTC.getTime() - nowUTC.getTime()
        
        // Converter para dias (arredondar para baixo para ser mais conservador)
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))
        
        // Contar profissionais com agenda ATIVA vinculados a esta assinatura
        console.log('🔍 Buscando profissionais na subscription_professionals para subscription_id:', subscriptionData.id)
        
        const { data: professionalsData, error: professionalsError } = await supabase
          .from('subscription_professionals')
          .select(`
            professional_id,
            users!subscription_professionals_professional_id_fkey(agenda_enabled)
          `)
          .eq('subscription_id', subscriptionData.id)
          .eq('status', 'active')

        console.log('🔍 Resultado da query subscription_professionals:', { professionalsData, professionalsError })
        console.log('✅ Profissionais com agenda ativa:', professionalsData?.length || 0)
        
        // Query alternativa: buscar todos os profissionais da assinatura e filtrar depois
        const { data: allProfessionalsData } = await supabase
          .from('subscription_professionals')
          .select(`
            professional_id,
            users!subscription_professionals_professional_id_fkey(agenda_enabled)
          `)
          .eq('subscription_id', subscriptionData.id)
          .eq('status', 'active')
        
        console.log('🔍 Todos os profissionais da assinatura:', allProfessionalsData)
        
        // Buscar dados de salon_professionals para cada profissional
        const professionalIds = allProfessionalsData?.map(p => p.professional_id) || []
        const { data: salonProfessionalsData } = await supabase
          .from('salon_professionals')
          .select('professional_id, agenda_enabled')
          .in('professional_id', professionalIds)
        
        console.log('🔍 Dados de salon_professionals:', salonProfessionalsData)
        
        // Filtrar apenas os com agenda ativa (considerando tanto users.agenda_enabled quanto salon_professionals.agenda_enabled)
        const activeProfessionals = allProfessionalsData?.filter(p => {
          // Para profissionais independentes: verificar users.agenda_enabled
          // Para profissionais de salão: verificar salon_professionals.agenda_enabled
          const salonProfessional = salonProfessionalsData?.find(sp => sp.professional_id === p.professional_id)
          const isActive = p.users?.agenda_enabled === true || salonProfessional?.agenda_enabled === true
          console.log('🔍 Profissional:', {
            professional_id: p.professional_id,
            users_agenda_enabled: p.users?.agenda_enabled,
            salon_professionals_agenda_enabled: salonProfessional?.agenda_enabled,
            isActive
          })
          return isActive
        }) || []
        
        console.log('✅ Profissionais com agenda ativa (filtrado):', activeProfessionals.length)

        setSubscriptionSummary({
          type: 'subscription',
          status: subscriptionData.status,
          planName: subscriptionData.plan.name,
          maxProfessionals: subscriptionData.plan.max_professionals,
          currentProfessionals: activeProfessionals.length,
          expirationDate: subscriptionData.current_period_end,
          daysRemaining,
          isActive: subscriptionData.status === 'active',
          subscriptionInfo: subscriptionData
        })
        return
      }

      // 2. Verificar se tem trial ativo (não convertido)
      const { data: trialData, error: trialError } = await supabase
        .from('professional_trials')
        .select('*')
        .eq('professional_id', targetUserId)
        .eq('status', 'active')
        .eq('converted_to_paid', false)
        .single()

      console.log('🔍 Resultado da busca de trial (professional_trials):', { trialData, trialError })

      // Se não encontrou, verificar se está na tabela appointments (possível confusão)
      if (trialError && trialError.code === 'PGRST116') {
        console.log('🔍 Trial não encontrado em professional_trials, verificando appointments...')
        
        const { data: appointmentData, error: appointmentError } = await supabase
          .from('appointments')
          .select('*')
          .eq('professional_id', targetUserId)
          .eq('status', 'active')
          .single()

        console.log('🔍 Resultado da busca em appointments:', { appointmentData, appointmentError })
        
        if (appointmentData) {
          // Se encontrou em appointments, usar esses dados
          const trialEndDate = new Date(appointmentData.end_date)
          const now = new Date()
          const timeDiff = trialEndDate.getTime() - now.getTime()
          const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))
          
          console.log('🔍 Usando dados de appointments:', {
            endDate: appointmentData.end_date,
            trialEndDate,
            now,
            timeDiff,
            daysRemaining
          })
          
          setSubscriptionSummary({
            type: 'trial',
            status: now <= trialEndDate ? 'active' : 'expired',
            planName: 'Trial Gratuito',
            maxProfessionals: 1,
            currentProfessionals: 1,
            expirationDate: appointmentData.end_date,
            daysRemaining,
            isActive: now <= trialEndDate,
            trialInfo: appointmentData
          })
          return
        }
      }

      if (trialError && trialError.code !== 'PGRST116') {
        throw trialError
      }

      if (trialData) {
        // Usar UTC para evitar problemas de fuso horário
        const trialEndDate = new Date(trialData.end_date) // ✅ Corrigido: usar end_date em vez de trial_end_date
        const now = new Date()
        
        // Calcular diferença em dias de forma mais precisa
        const trialEndUTC = new Date(trialEndDate.getTime() + trialEndDate.getTimezoneOffset() * 60000)
        const nowUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
        
        // Calcular diferença em milissegundos
        const timeDiff = trialEndUTC.getTime() - nowUTC.getTime()
        
        // Converter para dias (arredondar para baixo para ser mais conservador)
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))
        
        console.log('🔍 Trial Debug:', {
          trialEndDate: trialData.end_date, // ✅ Corrigido
          trialEndDateObj: trialEndDate,
          trialEndUTC: trialEndUTC,
          now: now,
          nowUTC: nowUTC,
          timeDiff,
          daysRemaining,
          isActive: now <= trialEndDate
        })
        
        setSubscriptionSummary({
          type: 'trial',
          status: now <= trialEndDate ? 'active' : 'expired',
          planName: 'Trial Gratuito',
          maxProfessionals: 1,
          currentProfessionals: 1,
          expirationDate: trialData.end_date, // ✅ Corrigido
          daysRemaining,
          isActive: now <= trialEndDate,
          trialInfo: trialData
        })
        return
      }

      // 2. Verificar se tem assinatura ativa (fallback)
      const { data: subscriptionDataFallback, error: subscriptionErrorFallback } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(
            id,
            name,
            description,
            max_professionals,
            price_monthly,
            price_yearly,
            features
          )
        `)
        .eq('user_id', targetUserId)
        .eq('status', 'active')
        .single()

      if (subscriptionErrorFallback && subscriptionErrorFallback.code !== 'PGRST116') {
        throw subscriptionErrorFallback
      }

      if (subscriptionDataFallback) {
        // Usar UTC para evitar problemas de fuso horário
        const periodEndDate = new Date(subscriptionDataFallback.current_period_end)
        const now = new Date()
        
        // Calcular diferença em dias de forma mais precisa
        const periodEndUTC = new Date(periodEndDate.getTime() + periodEndDate.getTimezoneOffset() * 60000)
        const nowUTC = new Date(now.getTime() + now.getTimezoneOffset() * 60000)
        
        // Calcular diferença em milissegundos
        const timeDiff = periodEndUTC.getTime() - nowUTC.getTime()
        
        // Converter para dias (arredondar para baixo para ser mais conservador)
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)))
        
        // Contar profissionais com agenda ATIVA vinculados a esta assinatura
        const { data: professionalsData } = await supabase
          .from('subscription_professionals')
          .select(`
            professional_id,
            users!inner(agenda_enabled)
          `)
          .eq('subscription_id', subscriptionData.id)
          .eq('status', 'active')
          .eq('users.agenda_enabled', true)

        setSubscriptionSummary({
          type: 'subscription',
          status: subscriptionData.status,
          planName: subscriptionData.plan.name,
          maxProfessionals: subscriptionData.plan.max_professionals,
          currentProfessionals: professionalsData?.length || 0,
          expirationDate: subscriptionData.current_period_end,
          daysRemaining,
          isActive: subscriptionData.status === 'active',
          subscriptionInfo: subscriptionData
        })
        return
      }

      // 3. Se não tem trial nem assinatura
      setSubscriptionSummary({
        type: 'none',
        status: 'expired',
        isActive: false
      })

    } catch (err) {
      console.error('Erro ao buscar informações da assinatura:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [userId, user?.id])

  useEffect(() => {
    fetchSubscriptionInfo()
  }, [fetchSubscriptionInfo])

  return {
    loading,
    subscriptionSummary,
    error,
    refetch: fetchSubscriptionInfo
  }
}
