/**
 * Traduz mensagens de erro do Supabase e outras bibliotecas para português
 */
export const translateError = (error: string | Error): string => {
  const errorMessage = typeof error === 'string' ? error : error.message
  
  // Mensagens de erro do Supabase
  const translations: Record<string, string> = {
    // Autenticação
    'Invalid login credentials': 'Email ou senha incorretos',
    'Email not confirmed': 'Email não confirmado. Verifique sua caixa de entrada.',
    'User not found': 'Usuário não encontrado',
    'Email already exists': 'Este email já está cadastrado',
    'Password too weak': 'Senha muito fraca. Use pelo menos 6 caracteres',
    'Invalid email': 'Email inválido',
    'Invalid password': 'Senha inválida',
    'Invalid token': 'Token inválido',
    'Token expired': 'Token expirado',
    'Session expired': 'Sessão expirada',
    'Account locked': 'Conta bloqueada',
    'Account disabled': 'Conta desabilitada',
    'Too many attempts': 'Muitas tentativas. Tente novamente mais tarde',
    
    // Permissões
    'Permission denied': 'Permissão negada',
    'Access denied': 'Acesso negado',
    'Not authorized': 'Não autorizado',
    'Forbidden': 'Acesso proibido',
    'Unauthorized': 'Não autorizado',
    
    // Recursos
    'Not found': 'Recurso não encontrado',
    'Resource not found': 'Recurso não encontrado',
    'Service not found': 'Serviço não encontrado',
    'Appointment not found': 'Agendamento não encontrado',
    
    // Validação
    'Required': 'Campo obrigatório',
    'Invalid': 'Dados inválidos',
    'Missing': 'Campo obrigatório',
    'Invalid format': 'Formato inválido',
    'Invalid data': 'Dados inválidos',
    'Validation failed': 'Falha na validação',
    
    // Banco de dados
    'Foreign key constraint': 'Dados inválidos. Verifique se os dados selecionados existem.',
    'Unique constraint': 'Este item já existe',
    'Not null constraint': 'Campo obrigatório não pode estar vazio',
    'Check constraint': 'Dados inválidos',
    'Constraint violation': 'Violação de regra de negócio',
    
    // Limites e rate limiting
    'Rate limit exceeded': 'Limite de uso excedido. Tente novamente em alguns minutos.',
    'Quota exceeded': 'Limite de uso excedido. Tente novamente em alguns minutos.',
    'Usage limit exceeded': 'Limite de uso excedido. Tente novamente em alguns minutos.',
    'Too many requests': 'Muitas solicitações. Tente novamente em alguns minutos.',
    'Rate limit': 'Limite de uso excedido. Tente novamente em alguns minutos.',
    'Exceeding usage limits': 'Limite de uso excedido. Tente novamente em alguns minutos.',
    
    // Rede e conectividade
    'Network error': 'Erro de conexão. Verifique sua internet.',
    'Connection failed': 'Falha na conexão. Verifique sua internet.',
    'Connection timeout': 'Timeout de conexão. Verifique sua internet.',
    'Request timeout': 'Timeout na solicitação. Tente novamente.',
    'Gateway timeout': 'Timeout do servidor. Tente novamente.',
    'Service unavailable': 'Serviço indisponível. Tente novamente mais tarde.',
    
    // Servidor
    'Internal server error': 'Erro interno do servidor. Tente novamente.',
    'Server error': 'Erro do servidor. Tente novamente.',
    'Bad request': 'Solicitação inválida',
    'Method not allowed': 'Método não permitido',
    'Conflict': 'Conflito de dados',
    'Unprocessable entity': 'Dados inválidos',
    
    // Upload e storage
    'Upload failed': 'Falha no upload. Tente novamente.',
    'File too large': 'Arquivo muito grande',
    'Invalid file type': 'Tipo de arquivo inválido',
    'Storage error': 'Erro no armazenamento. Tente novamente.',
    
    // Políticas RLS
    'Row Level Security': 'Erro de permissão. Verifique se você tem acesso.',
    'RLS policy': 'Erro de permissão. Verifique se você tem acesso.',
    'Policy violation': 'Erro de permissão. Verifique se você tem acesso.',
    
    // Timeout
    'Timeout': 'Timeout. Tente novamente.',
    'Operation timeout': 'Timeout na operação. Tente novamente.',
    
    // Fetch e conexão
    'fetch': 'Erro de conexão. Verifique sua internet.',
    'Failed to fetch': 'Falha na conexão. Verifique sua internet.',
    'Network request failed': 'Falha na solicitação de rede. Verifique sua internet.',
    
    // Supabase específico
    'PGRST301': 'Limite de uso excedido. Tente novamente em alguns minutos.',
    'PGRST116': 'Recurso não encontrado',
  }
  
  // Buscar tradução exata
  for (const [english, portuguese] of Object.entries(translations)) {
    if (errorMessage.toLowerCase().includes(english.toLowerCase())) {
      return portuguese
    }
  }
  
  // Buscar por palavras-chave
  const lowerError = errorMessage.toLowerCase()
  
  if (lowerError.includes('permission') || lowerError.includes('policy') || lowerError.includes('rls')) {
    return 'Erro de permissão. Verifique se você tem acesso para esta operação.'
  }
  
  if (lowerError.includes('limit') || lowerError.includes('rate') || lowerError.includes('quota')) {
    return 'Limite de uso excedido. Tente novamente em alguns minutos.'
  }
  
  if (lowerError.includes('timeout')) {
    return 'Timeout. Tente novamente em alguns minutos.'
  }
  
  if (lowerError.includes('network') || lowerError.includes('connection') || lowerError.includes('fetch')) {
    return 'Erro de conexão. Verifique sua internet e tente novamente.'
  }
  
  if (lowerError.includes('foreign key') || lowerError.includes('constraint')) {
    return 'Dados inválidos. Verifique se os dados selecionados existem.'
  }
  
  if (lowerError.includes('not found')) {
    return 'Recurso não encontrado.'
  }
  
  if (lowerError.includes('invalid')) {
    return 'Dados inválidos. Verifique as informações fornecidas.'
  }
  
  // Verificar se é erro de logout (ignorar erros de "required" durante logout)
  if (lowerError.includes('signout') || lowerError.includes('logout')) {
    return 'Logout realizado com sucesso.'
  }
  
  if (lowerError.includes('required') || lowerError.includes('missing')) {
    return 'Campo obrigatório não preenchido.'
  }
  
  // Se não encontrar tradução, retornar mensagem genérica
  return 'Ocorreu um erro inesperado. Tente novamente.'
}

/**
 * Traduz erro e retorna objeto formatado para toast
 */
export const translateErrorForToast = (error: string | Error) => {
  const translatedMessage = translateError(error)
  
  return {
    title: 'Erro',
    description: translatedMessage,
    variant: 'destructive' as const
  }
}
