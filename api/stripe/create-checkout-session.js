import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Configuração do Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
console.log('🔍 DEBUG Stripe Secret Key RAW:', stripeSecretKey);
console.log('🔍 DEBUG Key length:', stripeSecretKey ? stripeSecretKey.length : 0);

if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY não está configurada');
}

// Verificar se a chave está corrompida (duplicada)
let finalKey = stripeSecretKey;
if (stripeSecretKey.includes('...sk_live_')) {
  console.log('🚨 CHAVE CORROMPIDA DETECTADA! Extraindo chave correta...');
  // Extrair apenas a primeira parte da chave (antes da duplicação)
  const firstPart = stripeSecretKey.split('...sk_live_')[0];
  finalKey = firstPart;
  console.log('🔧 Chave corrigida:', finalKey.substring(0, 20) + '...' + finalKey.substring(-10));
}

const stripe = new Stripe(finalKey);

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

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Verificar se é uma requisição POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método não permitido' });
    }

    // Parse do body da requisição
    const { planType, userId, userEmail, userName } = req.body;

    // Validar parâmetros obrigatórios
    if (!planType || !userId) {
      return res.status(400).json({ error: 'planType e userId são obrigatórios' });
    }

    // Verificar se o plano existe
    const priceId = PLAN_MAPPING[planType];
    if (!priceId) {
      return res.status(400).json({ error: 'Plano inválido' });
    }

    // Buscar ou criar customer no Stripe
    let customerId;
    
    // Verificar se o usuário já tem um customer no Stripe
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw new Error(`Erro ao buscar usuário: ${userError.message}`);
    }

    if (userData?.stripe_customer_id) {
      customerId = userData.stripe_customer_id;
    } else {
      // Criar novo customer no Stripe
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName,
        metadata: {
          user_id: userId,
        },
      });

      customerId = customer.id;

      // Salvar customer ID no banco
      const { error: updateError } = await supabase
        .from('users')
        .update({ stripe_customer_id: customerId })
        .eq('id', userId);

      if (updateError) {
        console.error('Erro ao salvar customer ID:', updateError);
        // Não falhar a operação por causa disso
      }
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${STRIPE_CONFIG.successUrl}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: STRIPE_CONFIG.cancelUrl,
      metadata: {
        user_id: userId,
        plan_type: planType,
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          plan_type: planType,
        },
      },
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
    });
  }
}





