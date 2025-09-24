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
    if (!targetUserId) {
      console.warn('⚠️ Usuário não autenticado para buscar informações de assinatura');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      console.log('🔄 Buscando informações de assinatura para usuário:', targetUserId);

      // 1. Buscar assinatura ativa do usuário
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
        throw subscriptionError;
      }

      if (subscriptionData) {
        console.log('✅ Assinatura encontrada:', subscriptionData);
        
        // Calcular dias restantes
        const periodEndDate = new Date(subscriptionData.current_period_end);
        const now = new Date();
        const timeDiff = periodEndDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        
        // Contar profissionais ativos
        const { data: professionalsData } = await supabase
          .from('subscription_professionals')
          .select('professional_id')
          .eq('subscription_id', subscriptionData.id)
          .eq('status', 'active');

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
        });
        return;
      }

      // 2. Verificar trial ativo
      const { data: trialData, error: trialError } = await supabase
        .from('professional_trials')
        .select('*')
        .eq('professional_id', targetUserId)
        .eq('status', 'active')
        .single()

      if (trialError && trialError.code !== 'PGRST116') {
        throw trialError;
      }

      if (trialData) {
        console.log('✅ Trial encontrado:', trialData);
        
        const trialEndDate = new Date(trialData.end_date);
        const now = new Date();
        const timeDiff = trialEndDate.getTime() - now.getTime();
        const daysRemaining = Math.max(0, Math.floor(timeDiff / (1000 * 60 * 60 * 24)));
        const isActive = now <= trialEndDate;
        
        setSubscriptionSummary({
          type: 'trial',
          status: isActive ? 'active' : 'expired',
          planName: 'Trial Gratuito',
          maxProfessionals: 1,
          currentProfessionals: 1,
          expirationDate: trialData.end_date,
          daysRemaining,
          isActive,
          trialInfo: trialData
        });
        return;
      }

      // 3. Se não tem trial nem assinatura
      setSubscriptionSummary({
        type: 'none',
        status: 'expired',
        isActive: false
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro ao buscar informações da assinatura:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
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