import { stripe, STRIPE_CONFIG } from './config.js';
import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  try {
    const sig = req.headers['stripe-signature'];
    const payload = JSON.stringify(req.body);

    // Verificar webhook signature
    let stripeEvent;
    try {
      stripeEvent = stripe.webhooks.constructEvent(
        payload,
        sig,
        STRIPE_CONFIG.webhookSecret
      );
    } catch (err) {
      console.error('Erro na verificação do webhook:', err.message);
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

    return res.status(200).json({ received: true });

  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

// Handler para sessão de checkout completada
async function handleCheckoutSessionCompleted(session) {
  console.log('Checkout session completed:', session.id);
  
  const userId = session.metadata.user_id;
  const planType = session.metadata.plan_type;
  
  if (!userId) {
    console.error('User ID não encontrado na sessão');
    return;
  }

  // Atualizar status do usuário
  const { error } = await supabase
    .from('users')
    .update({
      subscription_status: 'active',
      subscription_plan: planType,
      subscription_started_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('Erro ao atualizar usuário:', error);
  } else {
    console.log('Usuário atualizado com sucesso:', userId);
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





