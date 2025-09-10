import { loadStripe } from '@stripe/stripe-js';

// Função para obter URL base de forma segura
const getBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  // Fallback para produção
  return 'https://beautycom.com.br'
}

// Carrega o Stripe com a chave pública de forma segura
export const stripePromise = (() => {
  try {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    // Se não há chave configurada, retornar Promise rejeitada
    if (!publishableKey || publishableKey.includes('sua_chave')) {
      return Promise.reject(new Error('Chave do Stripe não configurada'));
    }
    
    return loadStripe(publishableKey);
  } catch (error) {
    console.warn('⚠️ Erro ao carregar Stripe:', error);
    return Promise.reject(error);
  }
})();

// Configurações do Stripe
export const STRIPE_CONFIG = {
  // URLs de sucesso e cancelamento
  successUrl: `${getBaseUrl()}/planos?success=true`,
  cancelUrl: `${getBaseUrl()}/planos?canceled=true`,
  
  // Configurações de localização
  locale: 'pt-BR',
  currency: 'BRL',
  
  // Modo de cobrança
  billingAddressCollection: 'required',
  customerCreation: 'always',
};

// Tipos de planos disponíveis
export const PLAN_TYPES = {
  TRIAL: 'trial',
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
  ADDITIONAL: 'additional',
} as const;

export type PlanType = typeof PLAN_TYPES[keyof typeof PLAN_TYPES];

// Configurações dos planos (alinhados com o modal)
export const PLAN_CONFIGS = {
  [PLAN_TYPES.TRIAL]: {
    name: 'Trial Gratuito',
    price: 0,
    interval: 'month',
    features: [
      'Agenda básica',
      'Até 5 agendamentos/mês',
      'Suporte por email',
    ],
    stripePriceId: null, // Trial não tem preço no Stripe
  },
  [PLAN_TYPES.BASIC]: {
    name: 'BeautyTime Start',
    price: 39.90,
    interval: 'month',
    features: [
      'Agenda online para 1 profissional',
      'Notificação por e-mail para o cliente',
      'Notificações push 24h, 1h e 20min antes',
      'Sistema de avaliação completo',
      'Relatório de atendimento',
    ],
    stripePriceId: 'price_1S43Q6Gdt04aH4j03KJt0wXk', // BeautyTime Start
  },
  [PLAN_TYPES.PREMIUM]: {
    name: 'BeautyTime Pro',
    price: 49.90,
    interval: 'month',
    features: [
      'Tudo do BeautyTime Start',
      'Gerenciar múltiplos profissionais',
      'Verificar agenda de todos os profissionais',
      'Relatórios consolidados',
      'Gestão centralizada',
    ],
    stripePriceId: 'price_1S43SfGdt04aH4j0kT3Raqih', // BeautyTime Pro
  },
  [PLAN_TYPES.ENTERPRISE]: {
    name: 'BeautyTime Plus',
    price: 89.90,
    interval: 'month',
    features: [
      'Tudo do BeautyTime Pro',
      'Até 10 profissionais inclusos',
      'Possibilidade de adicionar mais profissionais',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
    stripePriceId: 'price_1S43UTGdt04aH4j0SxLDFbtC', // BeautyTime Plus
  },
  [PLAN_TYPES.ADDITIONAL]: {
    name: 'BeautyTime Ad',
    price: 29.90,
    interval: 'month',
    features: [
      '+1 profissional adicional',
      'Sem limite de profissionais',
      'Disponível para assinantes do BeautyTime Start, Pro ou Plus',
    ],
    stripePriceId: 'price_1S43VlGdt04aH4j0Wohp1FgE', // BeautyTime Ad
  },
} as const;

