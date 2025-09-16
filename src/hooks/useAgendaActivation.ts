import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface TrialInfo {
  id: string
  professional_id: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' // Removido 'used' - não é mais necessário
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

      // 1. Verificar se é dono de salão com agenda profissional ativa
      const { data: salonData, error: salonError } = await supabase
        .from('salons_studios')
        .select('id, name')
        .eq('owner_id', professionalId)
        .single()

      if (!salonError && salonData) {
        // É dono de salão, verificar se tem agenda profissional ativa no salão
        const { data: salonProfessionalData, error: salonProfessionalError } = await supabase
          .from('salon_professionals')
          .select('agenda_enabled')
          .eq('professional_id', professionalId)
          .eq('salon_id', salonData.id)
          .eq('status', 'accepted')
          .single()

        if (!salonProfessionalError && salonProfessionalData?.agenda_enabled) {
          // É dono de salão com agenda profissional ativa - não precisa ativar
          setCanActivateAgenda(false)
          return
        }
      }

      // 2. Verificar se tem agenda profissional ativa (para profissionais independentes)
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('agenda_enabled')
        .eq('id', professionalId)
        .single()

      if (userError) throw userError

      if (userData?.agenda_enabled) {
        // Se já tem agenda profissional ativa, verificar se é trial válido para permitir configurações
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
        
        setCanActivateAgenda(false) // Já tem agenda profissional ativa mas sem trial válido
        return
      }

      // 2. PRIORIDADE: Verificar assinatura ativa PRIMEIRO
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
        // TEM ASSINATURA ATIVA - PRIORIDADE MÁXIMA
        setSubscriptionInfo(subscriptionData)
        setCanActivateAgenda(true)
        return // Retorna aqui - assinatura tem prioridade
      }

      // 3. Se não tem assinatura, verificar trial ativo
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
        const trialEndDate = new Date(trialData.end_date)
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

  // Ativar agenda do profissional (pessoal ou do salão)
  const activateAgenda = useCallback(async () => {
    if (!professionalId) return

    try {
      setLoading(true)

      // Verificar se é dono de salão
      const { data: salonData, error: salonError } = await supabase
        .from('salons_studios')
        .select('id, name')
        .eq('owner_id', professionalId)
        .single()

      if (!salonError && salonData) {
        // É dono de salão - ativar agenda do salão
        const { error: salonProfessionalError } = await supabase
          .from('salon_professionals')
          .update({ agenda_enabled: true })
          .eq('professional_id', professionalId)
          .eq('salon_id', salonData.id)

        if (salonProfessionalError) throw salonProfessionalError

        toast({
          title: 'Agenda do salão ativada!',
          description: `A agenda do salão "${salonData.name}" foi ativada. Você pode começar a receber agendamentos.`,
          variant: 'default'
        })
      } else {
        // Não é dono de salão - ativar agenda profissional
        if (!canActivateAgenda) return

        // 1. Ativar agenda profissional na tabela users
        const { error: updateError } = await supabase
          .from('users')
          .update({ agenda_enabled: true })
          .eq('id', professionalId)

        if (updateError) throw updateError

        // 2. Trial permanece 'active' - não muda status ao ativar agenda
        // O trial só muda para 'expired' quando expira por tempo

        // 3. Se tem assinatura, verificar se já existe vínculo na subscription_professionals
        if (subscriptionInfo) {
          // Primeiro, verificar se já existe vínculo
          const { data: existingLink, error: checkError } = await supabase
            .from('subscription_professionals')
            .select('id')
            .eq('subscription_id', subscriptionInfo.id)
            .eq('professional_id', professionalId)
            .single()

          // Se não existe vínculo, criar um novo
          if (checkError && checkError.code === 'PGRST116') { // PGRST116 = no rows returned
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
          } else if (existingLink) {
            console.log('✅ Vínculo de assinatura já existe para este profissional')
          } else if (checkError) {
            console.error('Erro ao verificar vínculo existente:', checkError)
          }
        }

        toast({
          title: 'Agenda profissional ativada!',
          description: 'Sua agenda profissional está agora ativa. Você pode começar a receber agendamentos.',
          variant: 'default'
        })

        // Atualizar status
        setCanActivateAgenda(false)
      }
      
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
  }, [professionalId, canActivateAgenda, subscriptionInfo, toast])

  // Desativar agenda (pessoal ou do salão)
  const deactivateAgenda = useCallback(async () => {
    if (!professionalId) return

    try {
      setLoading(true)

      // Verificar se é dono de salão
      const { data: salonData, error: salonError } = await supabase
        .from('salons_studios')
        .select('id, name')
        .eq('owner_id', professionalId)
        .single()

      if (!salonError && salonData) {
        // É dono de salão - desativar agenda do salão
        const { error: salonProfessionalError } = await supabase
          .from('salon_professionals')
          .update({ agenda_enabled: false })
          .eq('professional_id', professionalId)
          .eq('salon_id', salonData.id)

        if (salonProfessionalError) throw salonProfessionalError

        toast({
          title: 'Agenda do salão desativada',
          description: `A agenda do salão "${salonData.name}" foi desativada.`,
          variant: 'default'
        })
      } else {
        // Não é dono de salão - desativar agenda profissional
        const { error } = await supabase
          .from('users')
          .update({ agenda_enabled: false })
          .eq('id', professionalId)

        if (error) throw error

        toast({
          title: 'Agenda profissional desativada',
          description: 'Sua agenda profissional foi desativada.',
          variant: 'default'
        })
      }

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