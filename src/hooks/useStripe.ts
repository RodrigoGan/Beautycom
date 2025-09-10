import { useState } from 'react';
import { stripePromise, STRIPE_CONFIG, PLAN_CONFIGS, PlanType } from '@/lib/stripe';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Função para verificar se o Stripe está disponível
const isStripeAvailable = async () => {
  try {
    await stripePromise;
    return true;
  } catch (error) {
    console.warn('⚠️ Stripe não disponível:', error);
    return false;
  }
};

export const useStripe = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthContext();

  const createCheckoutSession = async (planType: PlanType) => {
    console.log('🚀 createCheckoutSession chamada para planType:', planType);
    
    if (!user) {
      setError('Usuário não autenticado');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Para trial, não precisamos do Stripe
      if (planType === 'trial') {
        await activateTrial();
        return;
      }

      const plan = PLAN_CONFIGS[planType];
      
      // Verificar se o Stripe está disponível
      const stripeAvailable = await isStripeAvailable();
      
      if (!stripeAvailable) {
        // Chaves não configuradas - mostrar mensagem de desenvolvimento
        console.log('Chaves do Stripe não configuradas, simulando processo...');
        
        // Simular delay da API
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mostrar mensagem de que precisa configurar
        alert(`🚧 Configuração do Stripe Necessária\n\nPlano selecionado: ${plan.name}\nPreço: R$ ${plan.price.toFixed(2)}/mês\n\nPara ativar os pagamentos:\n1. Configure as chaves do Stripe no arquivo .env\n2. Crie os produtos no Stripe Dashboard\n3. Atualize os Price IDs no código\n\nVeja o arquivo: GUIA_CONFIGURACAO_STRIPE.md`);
        
        return;
      }

      // Chaves configuradas - usar Stripe real
      console.log('Usando Stripe real para:', planType);
      
      // Verificar se estamos em desenvolvimento local
      const isLocalDev = window.location.hostname === 'localhost';
      
      let apiUrl = '/api/stripe/create-checkout-session';
      if (isLocalDev) {
        // Em desenvolvimento local, usar a API do Vercel em produção
        apiUrl = 'https://beautycom.com.br/api/stripe/create-checkout-session';
      }
      
      // Chamar API para criar sessão de checkout
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planType,
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar sessão de checkout');
      }

      const { sessionId, url } = await response.json();
      
      if (url) {
        // Redirecionar para o Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('URL de checkout não recebida');
      }

      /* Código do Stripe que será usado quando o backend estiver pronto:
      
      // Criar sessão de checkout no backend
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan.stripePriceId,
          customerId: user.id,
          successUrl: STRIPE_CONFIG.successUrl,
          cancelUrl: STRIPE_CONFIG.cancelUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao criar sessão de checkout');
      }

      const { sessionId } = await response.json();

      // Redirecionar para o Stripe Checkout
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe não carregado');
      }

      const { error: stripeError } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }
      
      */
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const activateTrial = async () => {
    try {
      const { error } = await supabase
        .from('trials')
        .upsert({
          user_id: user?.id,
          plan_type: 'trial',
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        });

      if (error) throw error;

      // Atualizar status do usuário
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          subscription_status: 'trial',
          trial_activated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (userError) throw userError;

      // Redirecionar para página de sucesso
      window.location.href = '/planos?trial=activated';
    } catch (err) {
      throw new Error('Erro ao ativar trial');
    }
  };

  const cancelSubscription = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao cancelar assinatura');
      }

      const result = await response.json();
      console.log('Assinatura cancelada:', result);

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar assinatura');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    cancelSubscription,
    loading,
    error,
  };
};
