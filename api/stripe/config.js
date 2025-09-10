// Configuração do Stripe para o backend
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configurações do Stripe
const STRIPE_CONFIG = {
  successUrl: process.env.STRIPE_SUCCESS_URL || 'https://beautycom.com.br/planos?success=true',
  cancelUrl: process.env.STRIPE_CANCEL_URL || 'https://beautycom.com.br/planos?canceled=true',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

// Mapeamento dos planos (alinhado com src/lib/stripe.ts)
const PLAN_MAPPING = {
  'basic': 'price_1S43Q6Gdt04aH4j03KJt0wXk', // BeautyTime Start
  'premium': 'price_1S43SfGdt04aH4j0kT3Raqih', // BeautyTime Pro
  'plus': 'price_1S43UTGdt04aH4j0SxLDFbtC', // BeautyTime Plus
  'additional': 'price_1S43VlGdt04aH4j0Wohp1FgE', // BeautyTime Ad
  // Aliases para compatibilidade
  'start': 'price_1S43Q6Gdt04aH4j03KJt0wXk',
  'pro': 'price_1S43SfGdt04aH4j0kT3Raqih'
};

export {
  stripe,
  STRIPE_CONFIG,
  PLAN_MAPPING
};