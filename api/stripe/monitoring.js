// Sistema de monitoramento para webhooks do Stripe
const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Log de eventos para monitoramento
const logWebhookEvent = async (eventType, eventId, status, error = null) => {
  try {
    const logData = {
      event_type: eventType,
      event_id: eventId,
      status: status, // 'success', 'error', 'warning'
      error_message: error?.message || null,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };

    // Aqui você poderia salvar em uma tabela de logs
    console.log('📊 Webhook Event Log:', logData);
    
    // Em produção, você poderia enviar para um serviço de monitoramento
    // como Sentry, DataDog, ou criar alertas via email/Slack
    
  } catch (logError) {
    console.error('❌ Erro ao registrar log:', logError);
  }
};

// Verificar saúde do sistema
const checkSystemHealth = async () => {
  try {
    // Verificar conexão com Supabase
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('❌ Problema de conectividade com Supabase:', error);
      return false;
    }
    
    console.log('✅ Sistema saudável');
    return true;
  } catch (healthError) {
    console.error('❌ Erro na verificação de saúde:', healthError);
    return false;
  }
};

// Alertas para eventos críticos
const sendAlert = async (alertType, message, data = null) => {
  try {
    console.log(`🚨 ALERTA ${alertType.toUpperCase()}:`, message);
    
    if (data) {
      console.log('📊 Dados do alerta:', data);
    }
    
    // Aqui você poderia implementar:
    // - Envio de email para administradores
    // - Notificação via Slack/Discord
    // - Integração com sistemas de monitoramento
    
  } catch (alertError) {
    console.error('❌ Erro ao enviar alerta:', alertError);
  }
};

// Métricas de performance
const trackPerformance = (operation, startTime, endTime) => {
  const duration = endTime - startTime;
  console.log(`⏱️ ${operation} executado em ${duration}ms`);
  
  // Alertar se operação demorou muito
  if (duration > 5000) { // 5 segundos
    sendAlert('performance', `Operação ${operation} demorou ${duration}ms`, { duration, operation });
  }
};

module.exports = {
  logWebhookEvent,
  checkSystemHealth,
  sendAlert,
  trackPerformance
};
