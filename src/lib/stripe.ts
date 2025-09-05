import { loadStripe } from '@stripe/stripe-js';

// Carrega o Stripe com a chave pública
export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

// Configurações do Stripe
export const STRIPE_CONFIG = {
  // URLs de sucesso e cancelamento
  successUrl: `${window.location.origin}/planos?success=true`,
  cancelUrl: `${window.location.origin}/planos?canceled=true`,
  
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
      'Disponível apenas para assinantes do BeautyTime Plus',
    ],
    stripePriceId: 'price_1S43VlGdt04aH4j0Wohp1FgE', // BeautyTime Ad
  },
} as const;

