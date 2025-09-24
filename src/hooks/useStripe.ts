import { useState } from 'react';
import { stripePromise, STRIPE_CONFIG, PLAN_CONFIGS, PlanType } from '@/lib/stripe';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

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
      
      // Verificar se a chave pública do Stripe está configurada
      const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      console.log('  - stripePublishableKey:', stripePublishableKey ? `${stripePublishableKey.substring(0, 20)}...` : 'undefined');
      console.log('  - import.meta.env keys:', Object.keys(import.meta.env).filter(key => key.includes('STRIPE')));
      
      console.log('Chave pública detectada:', stripePublishableKey ? '✅ Configurada' : '❌ Não configurada');
      
      if (!stripePublishableKey || stripePublishableKey.includes('sua_chave')) {
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
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ Erro no createCheckoutSession:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const activateTrial = async () => {
    try {
      console.log('🔄 Ativando trial para usuário:', user?.id);
      
      const { error } = await supabase
        .from('trials')
        .upsert({
          user_id: user?.id,
          plan_type: 'trial',
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 dias
        });

      if (error) {
        console.error('❌ Erro ao criar trial:', error);
        throw error;
      }

      console.log('✅ Trial criado com sucesso');

      // Atualizar status do usuário
      const { error: userError } = await supabase
        .from('users')
        .update({ 
          subscription_status: 'trial',
          trial_activated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (userError) {
        console.error('❌ Erro ao atualizar usuário:', userError);
        throw userError;
      }

      console.log('✅ Usuário atualizado com sucesso');
      
      // Redirecionar para página de sucesso
      window.location.href = '/planos?trial=activated';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao ativar trial';
      console.error('❌ Erro no activateTrial:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const cancelSubscription = async () => {
    if (!user) {
      console.warn('⚠️ Usuário não autenticado para cancelar assinatura');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔄 Cancelando assinatura para usuário:', user.id);
      
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
        const errorMessage = errorData.error || 'Erro ao cancelar assinatura';
        console.error('❌ Erro na resposta da API:', errorMessage);
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('✅ Assinatura cancelada com sucesso:', result);

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar assinatura';
      console.error('❌ Erro no cancelSubscription:', errorMessage);
      setError(errorMessage);
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
