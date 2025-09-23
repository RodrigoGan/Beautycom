export interface WhatsAppTemplate {
  id: string
  name: string
  description: string
  category: 'profissional' | 'usuario' | 'geral'
  variables: string[]
  content: string
  useCase: string
}

export const whatsappTemplates: WhatsAppTemplate[] = [
  {
    id: 'profissional_trial_boas_vindas',
    name: 'Profissional - Boas-vindas Trial',
    description: 'Mensagem para novos profissionais incentivando o uso da agenda',
    category: 'profissional',
    variables: ['NOME', 'DIAS_RESTANTES', 'LINK_AGENDA'],
    content: `Olá [NOME]!

Bem-vindo(a) à Beautycom, a Rede Social da Beleza com o melhor agendador eletrônico do Brasil!
E você se cadastrou gratuitamente!
Desfrute desse Rede Social que é dedicada à área da beleza, publique seus trabalhos para ser facilmente encontrado, e aproveite, pois você tem [DIAS_RESTANTES] dias restantes no seu trial gratuito para experimentar nossa agenda online.

Durante este período você pode:
• Configurar sua agenda profissional
• Receber agendamentos de clientes
• Testar todas as funcionalidades

Não perca esta oportunidade! Configure sua agenda agora e comece a receber seus primeiros agendamentos.

Acesse: [LINK_AGENDA]

Precisa de ajuda? Estamos aqui para você!

Equipe Beautycom`,
    useCase: 'Enviar para profissionais recém-cadastrados com trial ativo'
  },
  
  {
    id: 'usuario_boas_vindas',
    name: 'Usuário - Boas-vindas',
    description: 'Mensagem para novos usuários incentivando a busca por profissionais',
    category: 'usuario',
    variables: ['NOME', 'LINK_BUSCA'],
    content: `Olá [NOME]!

Bem-vindo(a) à Beautycom!

Obrigado por se cadastrar em nossa plataforma. Aqui você pode encontrar os melhores profissionais de beleza da sua região.

O que você pode fazer:
• Buscar profissionais por especialidade
• Ver portfólio e avaliações
• Agendar serviços online
• Conectar-se com a comunidade

Encontre seu profissional ideal:
[LINK_BUSCA]

Dica: Use os filtros para encontrar profissionais próximos a você!

Equipe Beautycom`,
    useCase: 'Enviar para usuários recém-cadastrados'
  },

  {
    id: 'profissional_lembrete_configuracao',
    name: 'Profissional - Lembrete Configuração',
    description: 'Lembrar profissionais para completar configuração da agenda',
    category: 'profissional',
    variables: ['NOME', 'DIAS_RESTANTES'],
    content: `Olá [NOME]!

Lembrete importante: você ainda tem [DIAS_RESTANTES] dias no seu trial gratuito!

Para começar a receber agendamentos, complete a configuração da sua agenda:

• Cadastre seus serviços
• Defina seus horários de atendimento
• Configure seus dias de trabalho

Complete agora: [LINK_AGENDA]

Não perca esta oportunidade de começar a receber clientes!

Equipe Beautycom`,
    useCase: 'Enviar para profissionais com trial ativo mas agenda incompleta'
  },

  {
    id: 'usuario_promocao_servicos',
    name: 'Usuário - Promoção de Serviços',
    description: 'Promover serviços disponíveis na plataforma',
    category: 'usuario',
    variables: ['NOME', 'LINK_BUSCA'],
    content: `Olá [NOME]!

Que tal cuidar de você hoje?

Na Beautycom você encontra profissionais incríveis para:

• Cabelo e Penteados
• Maquiagem
• Unhas e Manicure
• Estética Facial
• Depilação
• E muito mais!

Explore nossos profissionais:
[LINK_BUSCA]

Todos os profissionais são verificados e têm avaliações reais!

Equipe Beautycom`,
    useCase: 'Enviar para usuários ativos promovendo serviços'
  },

  {
    id: 'profissional_trial_expirado',
    name: 'Profissional - Trial Expirado',
    description: 'Mensagem para profissionais cujo trial expirou',
    category: 'profissional',
    variables: ['NOME', 'LINK_PLANOS'],
    content: `Olá [NOME]!

Seu trial gratuito expirou, mas você pode continuar usando a Beautycom!

Nossos planos:
• BeautyTime Start - R$ 39,90/mês
• BeautyTime Pro - R$ 49,90/mês  
• BeautyTime Plus - R$ 89,90/mês

Benefícios:
• Agenda online ilimitada
• Notificações automáticas
• Relatórios detalhados
• Suporte prioritário

Conheça nossos planos:
[LINK_PLANOS]

Continue crescendo com a Beautycom!

Equipe Beautycom`,
    useCase: 'Enviar para profissionais com trial expirado'
  },

  {
    id: 'geral_feedback',
    name: 'Geral - Solicitação de Feedback',
    description: 'Solicitar feedback dos usuários sobre a plataforma',
    category: 'geral',
    variables: ['NOME'],
    content: `Olá [NOME]!

Sua opinião é muito importante para nós!

Gostaríamos de saber como está sendo sua experiência na Beautycom:

• Como você avalia nossa plataforma?
• Tem alguma sugestão de melhoria?
• O que mais gosta na Beautycom?

Sua feedback nos ajuda a melhorar cada vez mais!

Obrigado por fazer parte da nossa comunidade!

Equipe Beautycom`,
    useCase: 'Enviar para usuários ativos solicitando feedback'
  },

  {
    id: 'profissional_dicas_crescimento',
    name: 'Profissional - Dicas de Crescimento',
    description: 'Dicas para profissionais crescerem na plataforma',
    category: 'profissional',
    variables: ['NOME'],
    content: `Olá [NOME]!

Dicas para crescer na Beautycom:

**Portfólio Completo**
• Adicione fotos dos seus trabalhos
• Mostre antes e depois
• Atualize regularmente

**Avaliações**
• Peça feedback dos clientes
• Responda aos comentários
• Use críticas para melhorar

**Perfil Profissional**
• Complete todas as informações
• Adicione especialidades
• Defina preços competitivos

**Engajamento**
• Poste no BeautyWall
• Interaja com a comunidade
• Compartilhe conhecimento

Continue investindo no seu sucesso!

Equipe Beautycom`,
    useCase: 'Enviar para profissionais ativos com dicas de crescimento'
  },

  {
    id: 'usuario_lembrete_agendamento',
    name: 'Usuário - Lembrete de Agendamento',
    description: 'Lembrar usuários para agendar serviços',
    category: 'usuario',
    variables: ['NOME', 'LINK_BUSCA'],
    content: `Olá [NOME]!

Que tal cuidar de você hoje?

Lembre-se: na Beautycom você pode agendar serviços com os melhores profissionais da sua região!

Serviços disponíveis:
• Cabelo e Penteados
• Maquiagem
• Unhas e Manicure
• Estética Facial
• Depilação

Encontre seu profissional:
[LINK_BUSCA]

Agende com segurança e comodidade!

Equipe Beautycom`,
    useCase: 'Enviar para usuários que não agendaram recentemente'
  },

  {
    id: 'agendamento_confirmacao',
    name: 'Agendamento - Confirmação',
    description: 'Confirmar agendamento com cliente',
    category: 'geral',
      variables: ['CLIENTE', 'PROFISSIONAL', 'SERVICO', 'SERVICO_ICONE', 'DATA', 'HORA', 'DURACAO', 'VALOR', 'ENDERECO'],
      content: `Olá [CLIENTE]! Seu agendamento foi confirmado:

📅 Data: [DATA]
⏰ Horário: [HORA]
👨‍⚕️ Profissional: [PROFISSIONAL]
[SERVICO_ICONE] Serviço: [SERVICO]
⏱️ Duração: [DURACAO]min
💰 Valor: R$ [VALOR]
📍 Local: [ENDERECO]

Qualquer dúvida, entre em contato!

Equipe Beautycom`,
    useCase: 'Enviar após criação de agendamento'
  },
  {
    id: 'agendamento_lembrete',
    name: 'Agendamento - Lembrete',
    description: 'Lembrar cliente do agendamento próximo',
    category: 'geral',
      variables: ['CLIENTE', 'PROFISSIONAL', 'SERVICO', 'SERVICO_ICONE', 'DATA', 'HORA', 'ENDERECO'],
      content: `Olá [CLIENTE]! 

Este é um lembrete do seu agendamento:

📅 Data: [DATA]
⏰ Horário: [HORA]
👨‍⚕️ Profissional: [PROFISSIONAL]
[SERVICO_ICONE] Serviço: [SERVICO]
📍 Local: [ENDERECO]

O profissional está aguardando você! Caso precise reagendar ou cancelar, entre em contato conosco.

Equipe Beautycom`,
    useCase: 'Enviar como lembrete antes do agendamento'
  },
  {
    id: 'agendamento_pontualidade',
    name: 'Agendamento - Pontualidade',
    description: 'Solicitar que cliente chegue 10 minutos antes',
    category: 'geral',
      variables: ['CLIENTE', 'PROFISSIONAL', 'SERVICO', 'SERVICO_ICONE', 'DATA', 'HORA', 'ENDERECO'],
      content: `Olá [CLIENTE]!

Lembramos que seu agendamento é:

📅 Data: [DATA]
⏰ Horário: [HORA]
👨‍⚕️ Profissional: [PROFISSIONAL]
[SERVICO_ICONE] Serviço: [SERVICO]
📍 Local: [ENDERECO]

Para garantir que tudo corra perfeitamente, pedimos que chegue 10 minutos antes do horário marcado.

Obrigado pela compreensão!

Equipe Beautycom`,
    useCase: 'Enviar para solicitar pontualidade'
  }
]

export const getTemplatesByCategory = (category: 'profissional' | 'usuario' | 'geral' | 'all') => {
  if (category === 'all') return whatsappTemplates
  return whatsappTemplates.filter(template => template.category === category)
}

export const getTemplateById = (id: string) => {
  console.log('🔍 Buscando template com ID:', id)
  console.log('📋 Templates disponíveis:', whatsappTemplates.map(t => t.id))
  const template = whatsappTemplates.find(template => template.id === id)
  console.log('✅ Template encontrado:', template)
  return template
}
