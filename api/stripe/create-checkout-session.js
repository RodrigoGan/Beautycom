const { stripe, STRIPE_CONFIG, PLAN_MAPPING } = require('./config');
const { createClient } = require('@supabase/supabase-js');

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





