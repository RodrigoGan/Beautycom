const { stripe, STRIPE_CONFIG } = require('./config');
const { createClient } = require('@supabase/supabase-js');
const { logWebhookEvent, checkSystemHealth, sendAlert, trackPerformance } = require('./monitoring');
// Importar funções de notificação (ajustar caminho conforme necessário)
// const { handlePaymentSuccess, handlePaymentFailed, handleSubscriptionCanceled } = require('../../src/utils/notifications');

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  // Validar método HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validar headers necessários
  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.error('❌ Webhook signature não encontrada');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  // Validar webhook secret
  if (!STRIPE_CONFIG.webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET não configurado');
    return res.status(500).json({ error: 'Webhook secret not configured' });
  }

  try {
    const startTime = Date.now();
    const payload = JSON.stringify(req.body);
    const eventType = req.body?.type || 'unknown';
    
    console.log('🔄 Processando webhook:', eventType);

    // Verificar saúde do sistema
    const isHealthy = await checkSystemHealth();
    if (!isHealthy) {
      await sendAlert('system_health', 'Sistema com problemas de conectividade');
    }

    // Verificar webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        payload,
        sig,
        STRIPE_CONFIG.webhookSecret
      );
      console.log('✅ Webhook signature validada com sucesso');
    } catch (err) {
      console.error('❌ Erro na verificação do webhook:', err.message);
      await logWebhookEvent(eventType, 'signature_verification', 'error', err);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Processar diferentes tipos de eventos
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(stripeEvent.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(stripeEvent.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;
      
      default:
        console.log(`Evento não tratado: ${stripeEvent.type}`);
    }

    // Log de sucesso
    const endTime = Date.now();
    trackPerformance('webhook_processing', startTime, endTime);
    await logWebhookEvent(eventType, stripeEvent.id, 'success');
    
    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    await logWebhookEvent(eventType || 'unknown', 'webhook_error', 'error', error);
    await sendAlert('webhook_error', `Erro no processamento do webhook: ${error.message}`, { error: error.message });
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Handler para sessão de checkout completada
async function handleCheckoutSessionCompleted(session) {
  console.log('🔄 Processando checkout session completed:', session.id);
  
  // Validar dados obrigatórios
  if (!session.id) {
    console.error('❌ Session ID não encontrado');
    return;
  }

  const userId = session.metadata?.user_id;
  const planType = session.metadata?.plan_type;
  
  if (!userId) {
    console.error('❌ User ID não encontrado na sessão');
    return;
  }

  if (!planType) {
    console.error('❌ Plan type não encontrado na sessão');
    return;
  }

  console.log('✅ Dados validados:', { userId, planType });

  // Atualizar status do usuário
  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_status: 'active',
        subscription_plan: planType,
        subscription_started_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('❌ Erro ao atualizar usuário:', error);
      throw error;
    }
    
    console.log('✅ Usuário atualizado com sucesso:', userId);
  } catch (updateError) {
    console.error('❌ Falha crítica ao atualizar usuário:', updateError);
    // Aqui você poderia implementar retry logic ou notificação de admin
  }
}

// Handler para assinatura criada
async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created:', subscription.id);
  
  const userId = subscription.metadata.user_id;
  const planType = subscription.metadata.plan_type;
  
  if (!userId) {
    console.error('User ID não encontrado na assinatura');
    return;
  }

  // Criar registro de assinatura
  const { error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_type: planType,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error('Erro ao criar assinatura:', error);
  } else {
    console.log('Assinatura criada com sucesso:', subscription.id);
  }
}

// Handler para assinatura atualizada
async function handleSubscriptionUpdated(subscription) {
  console.log('Subscription updated:', subscription.id);
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Erro ao atualizar assinatura:', error);
  } else {
    console.log('Assinatura atualizada com sucesso:', subscription.id);
  }
}

// Handler para assinatura cancelada
async function handleSubscriptionDeleted(subscription) {
  console.log('Subscription deleted:', subscription.id);
  
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Erro ao cancelar assinatura:', error);
  } else {
    console.log('Assinatura cancelada com sucesso:', subscription.id);
  }
}

// Handler para pagamento bem-sucedido
async function handlePaymentSucceeded(invoice) {
  console.log('Payment succeeded:', invoice.id);
  
  if (invoice.subscription) {
    // Atualizar status da assinatura
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        last_payment_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Erro ao atualizar pagamento:', error);
    } else {
      console.log('Pagamento atualizado com sucesso:', invoice.id);
    }
  }
}

// Handler para pagamento falhado
async function handlePaymentFailed(invoice) {
  console.log('Payment failed:', invoice.id);
  
  if (invoice.subscription) {
    // Atualizar status da assinatura
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'past_due',
        last_payment_failed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', invoice.subscription);

    if (error) {
      console.error('Erro ao atualizar falha de pagamento:', error);
    } else {
      console.log('Falha de pagamento registrada:', invoice.id);
    }
  }
}





