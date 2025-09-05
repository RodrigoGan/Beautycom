// Configuração do Stripe para o backend
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Configurações do Stripe
export const STRIPE_CONFIG = {
  successUrl: process.env.STRIPE_SUCCESS_URL || 'https://beautycom.com.br/planos?success=true',
  cancelUrl: process.env.STRIPE_CANCEL_URL || 'https://beautycom.com.br/planos?canceled=true',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

// Mapeamento dos planos
export const PLAN_MAPPING = {
  'start': 'price_1QZ8XxSGdt04aH4j0bSkiVkGIaJuiS8ukPuaeXdUprBI6dp84teWx2fnnn86QnhmhxEvKaav0V7R2HFtBSZMWww3C00BV0NAwbi',
  'pro': 'price_1QZ8Y0SGdt04aH4j0bSkiVkGIaJuiS8ukPuaeXdUprBI6dp84teWx2fnnn86QnhmhxEvKaav0V7R2HFtBSZMWww3C00BV0NAwbi',
  'plus': 'price_1QZ8Y1SGdt04aH4j0bSkiVkGIaJuiS8ukPuaeXdUprBI6dp84teWx2fnnn86QnhmhxEvKaav0V7R2HFtBSZMWww3C00BV0NAwbi',
  'additional': 'price_1QZ8Y2SGdt04aH4j0bSkiVkGIaJuiS8ukPuaeXdUprBI6dp84teWx2fnnn86QnhmhxEvKaav0V7R2HFtBSZMWww3C00BV0NAwbi'
};

export { stripe };