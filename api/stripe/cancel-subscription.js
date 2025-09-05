const { stripe } = require('./config');
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

exports.handler = async (event, context) => {
  // Configurar CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Responder a requisições OPTIONS (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    // Verificar se é uma requisição POST
    if (event.httpMethod !== 'POST') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Método não permitido' }),
      };
    }

    // Parse do body da requisição
    const { userId } = JSON.parse(event.body);

    // Validar parâmetros obrigatórios
    if (!userId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'userId é obrigatório' }),
      };
    }

    // Buscar assinatura ativa do usuário
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('stripe_subscription_id, status')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single();

    if (subError || !subscription) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Assinatura ativa não encontrada' }),
      };
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

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        subscription: {
          id: canceledSubscription.id,
          status: canceledSubscription.status,
          canceled_at: new Date(canceledSubscription.canceled_at * 1000).toISOString(),
        },
      }),
    };

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message,
      }),
    };
  }
};





