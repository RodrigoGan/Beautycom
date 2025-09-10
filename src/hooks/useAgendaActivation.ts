import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface TrialInfo {
  id: string
  professional_id: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'used'
  created_at: string
}

export interface SubscriptionInfo {
  id: string
  user_id: string
  plan_id: string
  status: 'active' | 'canceled' | 'past_due'
  current_period_start: string
  current_period_end: string
  plan: {
    id: string
    name: string
    max_professionals: number
  }
}

export const useAgendaActivation = (professionalId?: string) => {
  const [loading, setLoading] = useState(false)
  const [trialInfo, setTrialInfo] = useState<TrialInfo | null>(null)
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null)
  const [canActivateAgenda, setCanActivateAgenda] = useState(false)
  const { toast } = useToast()

  // Verificar se profissional pode ativar agenda
  const checkAgendaActivationStatus = useCallback(async () => {
    if (!professionalId) return

    try {
      setLoading(true)

      // 0. Primeiro, verificar e desativar trials expirados
      try {
        await supabase.rpc('deactivate_expired_trial_agendas')
      } catch (deactivateError) {
        console.warn('⚠️ Erro ao desativar trials expirados:', deactivateError)
        // Não falhar o processo principal por causa disso
      }

      // 1. Verificar se já tem agenda ativa
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('agenda_enabled')
        .eq('id', professionalId)
        .single()

      if (userError) throw userError

      if (userData?.agenda_enabled) {
        // Se já tem agenda ativa, verificar se é trial válido para permitir configurações
        const { data: trialData, error: trialError } = await supabase
          .from('professional_trials')
          .select('*')
          .eq('professional_id', professionalId)
          .eq('status', 'active')
          .single()

        if (trialData && new Date(trialData.end_date) > new Date()) {
          setTrialInfo(trialData)
          setCanActivateAgenda(true) // Trial ativo - pode configurar
          return
        }
        
        setCanActivateAgenda(false) // Já tem agenda ativa mas sem trial válido
        return
      }

      // 2. Verificar trial ativo
      const { data: trialData, error: trialError } = await supabase
        .from('professional_trials')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('status', 'active')
        .single()

      if (trialError && trialError.code !== 'PGRST116') {
        throw trialError
      }

      if (trialData) {
        const trialEndDate = new Date(trialData.end_date) // ✅ Corrigido: usar end_date
        const now = new Date()
        
        if (now <= trialEndDate) {
          setTrialInfo(trialData)
          setCanActivateAgenda(true)
          return
        } else {
          // Trial expirado
          setTrialInfo({ ...trialData, status: 'expired' })
        }
      }

      // 3. Verificar assinatura ativa
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(id, name, max_professionals)
        `)
        .eq('user_id', professionalId)
        .eq('status', 'active')
        .single()

      if (subscriptionError && subscriptionError.code !== 'PGRST116') {
        throw subscriptionError
      }

      if (subscriptionData) {
        setSubscriptionInfo(subscriptionData)
        setCanActivateAgenda(true)
        return
      }

      // 4. Se chegou até aqui, não pode ativar agenda
      setCanActivateAgenda(false)

    } catch (error) {
      console.error('Erro ao verificar status da agenda:', error)
      toast({
        title: 'Erro ao verificar agenda',
        description: 'Não foi possível verificar se você pode ativar sua agenda.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [professionalId, toast])

  // Ativar agenda do profissional
  const activateAgenda = useCallback(async () => {
    if (!professionalId || !canActivateAgenda) return

    try {
      setLoading(true)

      // 1. Ativar agenda na tabela users
      const { error: updateError } = await supabase
        .from('users')
        .update({ agenda_enabled: true })
        .eq('id', professionalId)

      if (updateError) throw updateError

      // 2. Se tem trial ativo, marcar como usado
      if (trialInfo && trialInfo.status === 'active') {
        const { error: trialError } = await supabase
          .from('professional_trials')
          .update({ status: 'used' })
          .eq('id', trialInfo.id)

        if (trialError) {
          console.error('Erro ao marcar trial como usado:', trialError)
          // Não falhar a ativação por causa disso
        }
      }

      // 3. Se tem assinatura, criar vínculo na subscription_professionals
      if (subscriptionInfo) {
        const { error: subscriptionError } = await supabase
          .from('subscription_professionals')
          .insert({
            subscription_id: subscriptionInfo.id,
            professional_id: professionalId,
            enabled_by: professionalId, // Auto-ativação
            status: 'active'
          })

        if (subscriptionError) {
          console.error('Erro ao criar vínculo de assinatura:', subscriptionError)
          // Não falhar a ativação por causa disso
        }
      }

      toast({
        title: 'Agenda ativada com sucesso!',
        description: 'Sua agenda online está agora ativa. Você pode começar a receber agendamentos.',
        variant: 'default'
      })

      // Atualizar status
      setCanActivateAgenda(false)
      
      return { success: true }

    } catch (error) {
      console.error('Erro ao ativar agenda:', error)
      toast({
        title: 'Erro ao ativar agenda',
        description: 'Não foi possível ativar sua agenda. Tente novamente.',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [professionalId, canActivateAgenda, trialInfo, subscriptionInfo, toast])

  // Desativar agenda (para testes ou se necessário)
  const deactivateAgenda = useCallback(async () => {
    if (!professionalId) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('users')
        .update({ agenda_enabled: false })
        .eq('id', professionalId)

      if (error) throw error

      toast({
        title: 'Agenda desativada',
        description: 'Sua agenda online foi desativada.',
        variant: 'default'
      })

      return { success: true }

    } catch (error) {
      console.error('Erro ao desativar agenda:', error)
      toast({
        title: 'Erro ao desativar agenda',
        description: 'Não foi possível desativar sua agenda.',
        variant: 'destructive'
      })
      return { success: false, error }
    } finally {
      setLoading(false)
    }
  }, [professionalId, toast])

  return {
    loading,
    trialInfo,
    subscriptionInfo,
    canActivateAgenda,
    checkAgendaActivationStatus,
    activateAgenda,
    deactivateAgenda
  }
}
