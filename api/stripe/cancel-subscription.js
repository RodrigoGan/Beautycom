import { stripe } from './config.js';
import { createClient } from '@supabase/supabase-js';

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
    const { userId } = req.body;

    // Validar parâmetros obrigatórios
    if (!userId) {
      return res.status(400).json({ error: 'userId é obrigatório' });
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return res.status(404).json({ error: 'Assinatura ativa não encontrada' });
    }

    // Cancelar assinatura no Stripe
    const canceledSubscription = await stripe.subscriptions.cancel(
      subscription.stripe_subscription_id
    );

    // Atualizar status no banco
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (updateError) {
      console.error('Erro ao atualizar assinatura no banco:', updateError);
    }

    // Atualizar status do usuário
    const { error: userError } = await supabase
      .from('users')
      .update({
        subscription_status: 'canceled',
        subscription_canceled_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (userError) {
      console.error('Erro ao atualizar usuário:', userError);
    }

    return res.status(200).json({
      success: true,
      subscription: {
        id: canceledSubscription.id,
        status: canceledSubscription.status,
        canceled_at: new Date(canceledSubscription.canceled_at * 1000).toISOString(),
      },
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    
    return res.status(500).json({
      error: 'Erro interno do servidor',
      details: error.message,
    });
  }
}





