import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface TrialConversionResult {
  success: boolean
  trial_id?: string
  subscription_id?: string
  plan_name?: string
  message?: string
  error?: string
}

export const useTrialConversion = () => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  // Função para converter trial para assinatura paga
  const convertTrialToPaid = useCallback(async (
    professionalId: string, 
    planId: string, 
    stripeSubscriptionId?: string
  ): Promise<TrialConversionResult> => {
    try {
      setLoading(true)

      console.log('🔄 Convertendo trial para assinatura paga:', {
        professionalId,
        planId,
        stripeSubscriptionId
      })

      const { data, error } = await supabase.rpc('convert_trial_to_paid_subscription', {
        p_professional_id: professionalId,
        p_plan_id: planId,
        p_stripe_subscription_id: stripeSubscriptionId
      })

      if (error) {
        console.error('❌ Erro ao converter trial:', error)
        return {
          success: false,
          error: error.message
        }
      }

      console.log('✅ Trial convertido com sucesso:', data)

      if (data.success) {
        toast({
          title: 'Trial convertido com sucesso!',
          description: `Seu trial foi convertido para o plano ${data.plan_name}. Agora você tem acesso completo à agenda profissional.`,
          variant: 'default'
        })

        return {
          success: true,
          trial_id: data.trial_id,
          subscription_id: data.subscription_id,
          plan_name: data.plan_name,
          message: data.message
        }
      } else {
        return {
          success: false,
          error: data.error
        }
      }

    } catch (error) {
      console.error('❌ Erro inesperado ao converter trial:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Função para verificar se um trial foi convertido
  const isTrialConverted = useCallback(async (professionalId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_trial_converted', {
        p_professional_id: professionalId
      })

      if (error) {
        console.error('❌ Erro ao verificar conversão do trial:', error)
        return false
      }

      return data || false
    } catch (error) {
      console.error('❌ Erro inesperado ao verificar conversão:', error)
      return false
    }
  }, [])

  // Função para simular conversão (para testes)
  const simulateConversion = useCallback(async (professionalId: string): Promise<TrialConversionResult> => {
    // Buscar um plano disponível para teste
    const { data: plans, error: plansError } = await supabase
      .from('subscription_plans')
      .select('id, name')
      .eq('is_active', true)
      .limit(1)

    if (plansError || !plans || plans.length === 0) {
      return {
        success: false,
        error: 'Nenhum plano disponível para teste'
      }
    }

    const testPlan = plans[0]
    
    return await convertTrialToPaid(
      professionalId, 
      testPlan.id, 
      `test_stripe_${Date.now()}` // ID de teste
    )
  }, [convertTrialToPaid])

  return {
    convertTrialToPaid,
    isTrialConverted,
    simulateConversion,
    loading
  }
}









