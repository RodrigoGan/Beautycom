// Sistema de notificações para eventos do Stripe
import { supabase } from '@/lib/supabase';

export interface NotificationData {
  type: 'payment_success' | 'payment_failed' | 'subscription_canceled' | 'trial_expiring';
  userId: string;
  data: any;
}

// Enviar notificação por email (simulado)
export const sendEmailNotification = async (email: string, subject: string, content: string) => {
  try {
    console.log('📧 Enviando email:', { email, subject });
    console.log('📧 Conteúdo:', content);
    
    // Aqui você integraria com um serviço de email como:
    // - SendGrid
    // - Mailgun
    // - AWS SES
    // - Resend
    
    // Por enquanto, apenas log
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao enviar email:', error);
    return { success: false, error };
  }
};

// Enviar notificação push (simulado)
export const sendPushNotification = async (userId: string, title: string, body: string) => {
  try {
    console.log('🔔 Enviando push notification:', { userId, title, body });
    
    // Aqui você integraria com:
    // - Firebase Cloud Messaging
    // - OneSignal
    // - Pusher
    
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao enviar push notification:', error);
    return { success: false, error };
  }
};

// Salvar notificação no banco de dados
export const saveNotification = async (notification: NotificationData) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        data: notification.data,
        read: false,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
    
    console.log('✅ Notificação salva no banco');
    return { success: true };
  } catch (error) {
    console.error('❌ Erro ao salvar notificação:', error);
    return { success: false, error };
  }
};

// Processar notificação de pagamento bem-sucedido
export const handlePaymentSuccess = async (userId: string, amount: number, planName: string) => {
  const subject = 'Pagamento Confirmado - BeautyTime';
  const content = `
    <h2>Pagamento Confirmado!</h2>
    <p>Seu pagamento de R$ ${amount.toFixed(2)} foi processado com sucesso.</p>
    <p>Plano: ${planName}</p>
    <p>Obrigado por usar o BeautyTime!</p>
  `;

  // Buscar email do usuário
  const { data: user } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (user?.email) {
    await sendEmailNotification(user.email, subject, content);
  }

  // Salvar notificação
  await saveNotification({
    type: 'payment_success',
    userId,
    data: { amount, planName }
  });

  // Enviar push notification
  await sendPushNotification(userId, 'Pagamento Confirmado', `Seu pagamento de R$ ${amount.toFixed(2)} foi processado!`);
};

// Processar notificação de falha de pagamento
export const handlePaymentFailed = async (userId: string, amount: number, planName: string) => {
  const subject = 'Falha no Pagamento - BeautyTime';
  const content = `
    <h2>Falha no Pagamento</h2>
    <p>Houve um problema ao processar seu pagamento de R$ ${amount.toFixed(2)}.</p>
    <p>Plano: ${planName}</p>
    <p>Por favor, verifique seus dados de pagamento e tente novamente.</p>
  `;

  // Buscar email do usuário
  const { data: user } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (user?.email) {
    await sendEmailNotification(user.email, subject, content);
  }

  // Salvar notificação
  await saveNotification({
    type: 'payment_failed',
    userId,
    data: { amount, planName }
  });

  // Enviar push notification
  await sendPushNotification(userId, 'Falha no Pagamento', 'Verifique seus dados de pagamento');
};

// Processar notificação de cancelamento
export const handleSubscriptionCanceled = async (userId: string, planName: string) => {
  const subject = 'Assinatura Cancelada - BeautyTime';
  const content = `
    <h2>Assinatura Cancelada</h2>
    <p>Sua assinatura do plano ${planName} foi cancelada.</p>
    <p>Você ainda terá acesso até o final do período atual.</p>
    <p>Esperamos vê-lo novamente em breve!</p>
  `;

  // Buscar email do usuário
  const { data: user } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (user?.email) {
    await sendEmailNotification(user.email, subject, content);
  }

  // Salvar notificação
  await saveNotification({
    type: 'subscription_canceled',
    userId,
    data: { planName }
  });

  // Enviar push notification
  await sendPushNotification(userId, 'Assinatura Cancelada', 'Sua assinatura foi cancelada');
};

// Processar notificação de trial expirando
export const handleTrialExpiring = async (userId: string, daysRemaining: number) => {
  const subject = 'Trial Expirando - BeautyTime';
  const content = `
    <h2>Seu Trial está Expirando</h2>
    <p>Seu trial gratuito expira em ${daysRemaining} dias.</p>
    <p>Para continuar usando o BeautyTime, escolha um de nossos planos.</p>
    <p><a href="/planos">Ver Planos Disponíveis</a></p>
  `;

  // Buscar email do usuário
  const { data: user } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', userId)
    .single();

  if (user?.email) {
    await sendEmailNotification(user.email, subject, content);
  }

  // Salvar notificação
  await saveNotification({
    type: 'trial_expiring',
    userId,
    data: { daysRemaining }
  });

  // Enviar push notification
  await sendPushNotification(userId, 'Trial Expirando', `Seu trial expira em ${daysRemaining} dias`);
};

// Verificar e enviar notificações de trial expirando
export const checkExpiringTrials = async () => {
  try {
    console.log('🔍 Verificando trials expirando...');
    
    // Buscar trials que expiram em 3, 1 e 0 dias
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const oneDayFromNow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
    
    // Trials expirando em 3 dias
    const { data: trials3Days } = await supabase
      .from('professional_trials')
      .select('professional_id, end_date')
      .eq('status', 'active')
      .lte('end_date', threeDaysFromNow.toISOString())
      .gte('end_date', oneDayFromNow.toISOString());

    // Trials expirando em 1 dia
    const { data: trials1Day } = await supabase
      .from('professional_trials')
      .select('professional_id, end_date')
      .eq('status', 'active')
      .lte('end_date', oneDayFromNow.toISOString())
      .gt('end_date', now.toISOString());

    // Processar notificações
    for (const trial of trials3Days || []) {
      await handleTrialExpiring(trial.professional_id, 3);
    }

    for (const trial of trials1Day || []) {
      await handleTrialExpiring(trial.professional_id, 1);
    }

    console.log('✅ Verificação de trials concluída');
  } catch (error) {
    console.error('❌ Erro ao verificar trials expirando:', error);
  }
};
