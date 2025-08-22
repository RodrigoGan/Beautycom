export interface Permission {
  key: string
  label: string
  description?: string
}

export interface PermissionCategory {
  id: string
  title: string
  icon: string
  permissions: Permission[]
}

export const PERMISSION_CATEGORIES: PermissionCategory[] = [
  {
    id: 'manage_employees',
    title: 'Gerenciamento de Pessoas',
    icon: '👥',
    permissions: [
      {
        key: 'manage_employees.view',
        label: 'Visualizar funcionários',
        description: 'Ver lista de funcionários e seus cargos'
      },
      {
        key: 'manage_employees.add',
        label: 'Adicionar funcionários',
        description: 'Convidar novos funcionários para o salão'
      },
      {
        key: 'manage_employees.edit',
        label: 'Editar funcionários',
        description: 'Modificar informações e cargos dos funcionários'
      },
      {
        key: 'manage_employees.remove',
        label: 'Remover funcionários',
        description: 'Desvincular funcionários do salão'
      },
      {
        key: 'manage_employees.manage_permissions',
        label: 'Gerenciar permissões',
        description: 'Configurar permissões específicas de cada funcionário'
      }
    ]
  },
  {
    id: 'manage_service_professionals',
    title: 'Profissionais de Serviço',
    icon: '💇‍♀️',
    permissions: [
      {
        key: 'manage_service_professionals.view',
        label: 'Visualizar profissionais',
        description: 'Ver lista de profissionais vinculados'
      },
      {
        key: 'manage_service_professionals.add',
        label: 'Adicionar profissionais',
        description: 'Convidar novos profissionais para o salão'
      },
      {
        key: 'manage_service_professionals.edit',
        label: 'Editar profissionais',
        description: 'Modificar informações dos profissionais'
      },
      {
        key: 'manage_service_professionals.remove',
        label: 'Remover profissionais',
        description: 'Desvincular profissionais do salão'
      },
      {
        key: 'manage_service_professionals.view_schedule',
        label: 'Ver agenda',
        description: 'Visualizar agenda e horários dos profissionais'
      },
      {
        key: 'manage_service_professionals.manage_schedule',
        label: 'Gerenciar agenda',
        description: 'Configurar horários e disponibilidade dos profissionais'
      }
    ]
  },
  {
    id: 'appointments',
    title: 'Agendamentos',
    icon: '📅',
    permissions: [
      {
        key: 'appointments.view',
        label: 'Visualizar agendamentos',
        description: 'Ver todos os agendamentos do salão'
      },
      {
        key: 'appointments.create',
        label: 'Criar agendamentos',
        description: 'Agendar novos serviços para clientes'
      },
      {
        key: 'appointments.edit',
        label: 'Editar agendamentos',
        description: 'Modificar horários e detalhes dos agendamentos'
      },
      {
        key: 'appointments.cancel',
        label: 'Cancelar agendamentos',
        description: 'Cancelar agendamentos existentes'
      },
      {
        key: 'appointments.reschedule',
        label: 'Reagendar',
        description: 'Alterar data/hora de agendamentos'
      },
      {
        key: 'appointments.view_all_professionals',
        label: 'Ver todos os profissionais',
        description: 'Visualizar agendamentos de todos os profissionais'
      }
    ]
  },
  {
    id: 'salon_info',
    title: 'Informações do Salão',
    icon: '🏢',
    permissions: [
      {
        key: 'salon_info.view',
        label: 'Visualizar informações',
        description: 'Ver dados básicos do salão'
      },
      {
        key: 'salon_info.edit_basic_info',
        label: 'Editar informações básicas',
        description: 'Modificar nome, endereço, telefone do salão'
      },
      {
        key: 'salon_info.edit_social_media',
        label: 'Editar redes sociais',
        description: 'Atualizar links das redes sociais'
      },
      {
        key: 'salon_info.edit_photos',
        label: 'Editar fotos',
        description: 'Adicionar ou remover fotos do salão'
      },
      {
        key: 'salon_info.edit_description',
        label: 'Editar descrição',
        description: 'Modificar bio e descrição do salão'
      }
    ]
  },
  {
    id: 'reports',
    title: 'Relatórios',
    icon: '📊',
    permissions: [
      {
        key: 'reports.view',
        label: 'Visualizar relatórios',
        description: 'Acessar relatórios gerais do salão'
      },
      {
        key: 'reports.export',
        label: 'Exportar relatórios',
        description: 'Baixar relatórios em PDF ou Excel'
      },
      {
        key: 'reports.financial_reports',
        label: 'Relatórios financeiros',
        description: 'Acessar relatórios de faturamento e despesas'
      },
      {
        key: 'reports.performance_reports',
        label: 'Relatórios de performance',
        description: 'Ver métricas de produtividade e atendimentos'
      }
    ]
  },
  {
    id: 'system_settings',
    title: 'Configurações do Sistema',
    icon: '⚙️',
    permissions: [
      {
        key: 'system_settings.view',
        label: 'Visualizar configurações',
        description: 'Ver configurações gerais do sistema'
      },
      {
        key: 'system_settings.edit',
        label: 'Editar configurações',
        description: 'Modificar configurações do sistema'
      },
      {
        key: 'system_settings.manage_integrations',
        label: 'Gerenciar integrações',
        description: 'Configurar integrações com outros sistemas'
      }
    ]
  },
  {
    id: 'content_management',
    title: 'Gerenciamento de Conteúdo',
    icon: '📝',
    permissions: [
      {
        key: 'content_management.view_posts',
        label: 'Visualizar posts',
        description: 'Ver posts dos profissionais do salão'
      },
      {
        key: 'content_management.manage_main_posts',
        label: 'Gerenciar posts principais',
        description: 'Marcar e desmarcar posts como principais do salão'
      },
      {
        key: 'content_management.moderate_posts',
        label: 'Moderar posts',
        description: 'Aprovar ou rejeitar posts antes da publicação'
      }
    ]
  }
]

// Função para obter todas as permissões em formato plano
export const getAllPermissions = (): Permission[] => {
  return PERMISSION_CATEGORIES.flatMap(category => category.permissions)
}

// Função para obter permissões por categoria
export const getPermissionsByCategory = (categoryId: string): Permission[] => {
  const category = PERMISSION_CATEGORIES.find(cat => cat.id === categoryId)
  return category ? category.permissions : []
}

// Função para validar dependências entre permissões
export const validatePermissionDependencies = (
  permissions: Record<string, boolean>
): Record<string, boolean> => {
  const validated = { ...permissions }
  
  // Se pode editar, deve poder visualizar
  if (validated['manage_employees.edit'] && !validated['manage_employees.view']) {
    validated['manage_employees.view'] = true
  }
  if (validated['manage_employees.remove'] && !validated['manage_employees.view']) {
    validated['manage_employees.view'] = true
  }
  if (validated['manage_employees.manage_permissions'] && !validated['manage_employees.view']) {
    validated['manage_employees.view'] = true
  }
  
  if (validated['manage_service_professionals.edit'] && !validated['manage_service_professionals.view']) {
    validated['manage_service_professionals.view'] = true
  }
  if (validated['manage_service_professionals.remove'] && !validated['manage_service_professionals.view']) {
    validated['manage_service_professionals.view'] = true
  }
  if (validated['manage_service_professionals.manage_schedule'] && !validated['manage_service_professionals.view_schedule']) {
    validated['manage_service_professionals.view_schedule'] = true
  }
  
  if (validated['appointments.edit'] && !validated['appointments.view']) {
    validated['appointments.view'] = true
  }
  if (validated['appointments.cancel'] && !validated['appointments.view']) {
    validated['appointments.view'] = true
  }
  if (validated['appointments.reschedule'] && !validated['appointments.view']) {
    validated['appointments.view'] = true
  }
  
  if (validated['salon_info.edit_basic_info'] && !validated['salon_info.view']) {
    validated['salon_info.view'] = true
  }
  if (validated['salon_info.edit_social_media'] && !validated['salon_info.view']) {
    validated['salon_info.view'] = true
  }
  if (validated['salon_info.edit_photos'] && !validated['salon_info.view']) {
    validated['salon_info.view'] = true
  }
  if (validated['salon_info.edit_description'] && !validated['salon_info.view']) {
    validated['salon_info.view'] = true
  }
  
  if (validated['reports.export'] && !validated['reports.view']) {
    validated['reports.view'] = true
  }
  if (validated['reports.financial_reports'] && !validated['reports.view']) {
    validated['reports.view'] = true
  }
  if (validated['reports.performance_reports'] && !validated['reports.view']) {
    validated['reports.view'] = true
  }
  
  if (validated['system_settings.edit'] && !validated['system_settings.view']) {
    validated['system_settings.view'] = true
  }
  if (validated['system_settings.manage_integrations'] && !validated['system_settings.view']) {
    validated['system_settings.view'] = true
  }
  
  if (validated['content_management.manage_main_posts'] && !validated['content_management.view_posts']) {
    validated['content_management.view_posts'] = true
  }
  if (validated['content_management.moderate_posts'] && !validated['content_management.view_posts']) {
    validated['content_management.view_posts'] = true
  }
  
  return validated
}

