import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, User, Users, BarChart3, Plus, Settings, AlertCircle, ArrowLeft, Edit3, UserCheck, UserX } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
import { useSalonPermissions, type EmployeePermissions } from "@/hooks/useSalonPermissions"
import { useAppointments } from "@/hooks/useAppointments"
import { useSalonProfessionals } from "@/hooks/useSalonProfessionals"
import { useSalonEmployees } from "@/hooks/useSalonEmployees"
import { useEffect, useState } from "react"
import { PERMISSION_CATEGORIES } from "@/config/permissionCategories"

const AgendaProfissional = () => {
  const { user } = useAuthContext()
  const { userSalon } = useSalons(user?.id)
  const { hasPermission, isOwner, isEmployee, loading: permissionsLoading } = useSalonPermissions(userSalon?.id)
  const { appointments, loading: appointmentsLoading, fetchSalonAppointments, todayAppointments, upcomingAppointments } = useAppointments()
  const { professionals, loading: professionalsLoading, fetchProfessionals, enableAgenda, disableAgenda } = useSalonProfessionals(userSalon?.id || '')
  const { employees, loading: employeesLoading, fetchEmployees, updateEmployee } = useSalonEmployees(userSalon?.id || '')
  
  // Estados para o modal de adicionar gestor
  const [showAddManagerModal, setShowAddManagerModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [showPermissionsStep, setShowPermissionsStep] = useState(false)
  const [addingManager, setAddingManager] = useState(false)
  
  // Estados para o modal de editar gestor
  const [showEditManagerModal, setShowEditManagerModal] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState<SalonEmployee | null>(null)
  const [editingPermissions, setEditingPermissions] = useState<Partial<EmployeePermissions>>({
    appointments: {
      view: false,
      create: false,
      edit: false,
      cancel: false,
      reschedule: false,
      view_all_professionals: false
    },
    manage_service_professionals: {
      view: false,
      add: false,
      edit: false,
      remove: false,
      view_schedule: false,
      manage_schedule: false
    }
  })
  const [updatingManager, setUpdatingManager] = useState(false)
  
  // Sistema de segurança contra loops REFORÇADO
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [lastLoadedSalonId, setLastLoadedSalonId] = useState<string | null>(null)
  const [loadAttempts, setLoadAttempts] = useState(0)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)
  const [permissions, setPermissions] = useState<Partial<EmployeePermissions>>({
    appointments: {
      view: false,
      create: false,
      edit: false,
      cancel: false,
      reschedule: false,
      view_all_professionals: false
    },
    manage_service_professionals: {
      view: false,
      add: false,
      edit: false,
      remove: false,
      view_schedule: false,
      manage_schedule: false
    }
  })



  // Verificar se pode acessar agenda profissional
  const canAccessProfessionalAgenda = () => {
    if (!user) return false
    
    // Profissionais sempre podem acessar
    if (user.user_type === 'profissional') return true
    
    // Funcionários com permissão podem acessar
    if (isEmployee() && hasPermission('appointments.view')) return true
    
    // Dono do salão pode acessar
    if (isOwner()) return true
    
    return false
  }

  // Carregar agendamentos, profissionais e funcionários do salão
  useEffect(() => {

    
    // Sistema de segurança ULTRA RÍGIDO contra loops
    if (!userSalon?.id || userSalon.id.trim() === '') {
      console.log('❌ ID do salão inválido')
      return
    }
    
    if (isLoadingData) {
      console.log('❌ Já está carregando, ignorando')
      return
    }
    
    if (hasInitialLoad && lastLoadedSalonId === userSalon.id) {
      console.log('❌ Dados já carregados, ignorando')
      return
    }
    
    if (loadAttempts >= 3) {
      console.log('❌ Muitas tentativas, parando para evitar loop')
      return
    }
    
    console.log('✅ Iniciando carregamento único')
    setIsLoadingData(true)
    setLastLoadedSalonId(userSalon.id)
    setLoadAttempts(prev => prev + 1)
    
    // Executar carregamentos em paralelo
    Promise.all([
      fetchSalonAppointments(userSalon.id),
      fetchProfessionals(),
      fetchEmployees()
    ]).finally(() => {
      console.log('✅ Carregamento finalizado')
      setIsLoadingData(false)
      setHasInitialLoad(true)
    })
  }, [userSalon?.id]) // Apenas o ID do salão como dependência

  // Funções para controlar agenda dos profissionais
  const handleEnableAgenda = async (professionalId: string) => {
    const result = await enableAgenda(professionalId)
    if (result.success) {
      // Toast de sucesso seria mostrado aqui
      console.log('✅ Agenda habilitada com sucesso')
      // Recarregar dados para garantir sincronização
      await fetchProfessionals()
    } else {
      // Toast de erro seria mostrado aqui
      console.error('❌ Erro ao habilitar agenda:', result.error)
    }
  }

  const handleDisableAgenda = async (professionalId: string) => {
    const result = await disableAgenda(professionalId)
    if (result.success) {
      // Toast de sucesso seria mostrado aqui
      console.log('✅ Agenda desabilitada com sucesso')
      // Recarregar dados para garantir sincronização
      await fetchProfessionals()
    } else {
      // Toast de erro seria mostrado aqui
      console.error('❌ Erro ao desabilitar agenda:', result.error)
    }
  }

  // Verificar se o profissional é o dono do salão (tem agenda própria)
  const isProfessionalOwner = (professionalId: string) => {
    return userSalon?.owner_id === professionalId
  }

  // Verificar se pode controlar a agenda do profissional
  const canControlAgenda = (professionalId: string) => {
    // Se for o próprio dono do salão, ele pode controlar sua própria agenda
    if (isProfessionalOwner(professionalId)) {
      // Só o próprio dono pode controlar sua agenda
      return user?.id === professionalId
    }
    
    // Para outros profissionais, precisa ter permissão de edição de funcionários
    return hasPermission('employees.edit')
  }

  // Funções para gerenciar gestores da agenda
  const handleAddManager = () => {
    setShowAddManagerModal(true)
  }

  const handleSelectEmployee = (employeeId: string) => {
    setSelectedEmployee(employeeId)
    setShowPermissionsStep(true)
  }

  const handleBackToEmployeeSelection = () => {
    setShowPermissionsStep(false)
    setSelectedEmployee(null)
    setPermissions({
      appointments: {
        view: false,
        create: false,
        edit: false,
        cancel: false,
        reschedule: false,
        view_all_professionals: false
      },
      manage_service_professionals: {
        view: false,
        add: false,
        edit: false,
        remove: false,
        view_schedule: false,
        manage_schedule: false
      }
    })
  }

  const handlePermissionChange = (category: string, permission: string, value: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [permission]: value
      }
    }))
  }

  const handleConfirmAddManager = async () => {
    if (!selectedEmployee || addingManager) return
    
    try {
      setAddingManager(true)
      console.log('Adicionando gestor com permissões:', {
        employeeId: selectedEmployee,
        permissions: permissions
      })

      // Buscar o funcionário atual para manter suas outras permissões
      const currentEmployee = employees.find(emp => emp.id === selectedEmployee)
      if (!currentEmployee) {
        console.error('Funcionário não encontrado')
        return
      }

      // Converter permissões do formato hierárquico para o formato plano
      const flatPermissions: Record<string, boolean> = {}
      
      // Se as permissões atuais estão no formato plano, preservá-las
      if (currentEmployee.permissions) {
        // Verificar se está no formato plano (chaves com pontos)
        const isFlat = Object.keys(currentEmployee.permissions).some(key => key.includes('.'))
        
        if (isFlat) {
          // Já está no formato plano
          Object.assign(flatPermissions, currentEmployee.permissions)
        } else {
          // Converter do formato hierárquico para plano
          Object.entries(currentEmployee.permissions).forEach(([category, perms]) => {
            if (typeof perms === 'object' && perms !== null) {
              Object.entries(perms).forEach(([perm, value]) => {
                flatPermissions[`${category}.${perm}`] = value as boolean
              })
            }
          })
        }
      }

      // Converter as novas permissões de agenda do formato hierárquico para plano
      Object.entries(permissions).forEach(([category, perms]) => {
        if (typeof perms === 'object' && perms !== null) {
          Object.entries(perms).forEach(([perm, value]) => {
            flatPermissions[`${category}.${perm}`] = value as boolean
          })
        }
      })

      console.log('Permissões em formato plano:', flatPermissions)

      // Atualizar as permissões do funcionário (não cria vínculo de gestor)
      const result = await updateEmployee(
        selectedEmployee,
        currentEmployee.role,
        flatPermissions,
        currentEmployee.role_description
      )

      if (result.success) {
        console.log('✅ Gestor adicionado com sucesso!')
        
        // Fechar o modal e resetar estados
        setShowAddManagerModal(false)
        setSelectedEmployee(null)
        setShowPermissionsStep(false)
        setPermissions({
          appointments: {
            view: false,
            create: false,
            edit: false,
            cancel: false,
            reschedule: false,
            view_all_professionals: false
          },
          manage_service_professionals: {
            view: false,
            add: false,
            edit: false,
            remove: false,
            view_schedule: false,
            manage_schedule: false
          }
        })

        // Recarregar funcionários para mostrar as mudanças
        await fetchEmployees()
      } else {
        console.error('❌ Erro ao adicionar gestor:', result.error)
        // Aqui você pode mostrar um toast/notification de erro
      }
      
    } catch (error) {
      console.error('❌ Erro ao adicionar gestor:', error)
      // Aqui você pode mostrar um toast/notification de erro
    } finally {
      setAddingManager(false)
    }
  }

  const handleCancelAddManager = () => {
    setShowAddManagerModal(false)
    setSelectedEmployee(null)
    setShowPermissionsStep(false)
    setAddingManager(false)
    setPermissions({
      appointments: {
        view: false,
        create: false,
        edit: false,
        cancel: false,
        reschedule: false,
        view_all_professionals: false
      },
      manage_service_professionals: {
        view: false,
        add: false,
        edit: false,
        remove: false,
        view_schedule: false,
        manage_schedule: false
      }
    })
  }

  // Funções para editar gestor
  const handleEditManager = (employee: SalonEmployee) => {
    setEditingEmployee(employee)
    
    // Converter permissões do formato plano para hierárquico para o modal
    const hierarchicalPermissions: Partial<EmployeePermissions> = {
      appointments: {
        view: false,
        create: false,
        edit: false,
        cancel: false,
        reschedule: false,
        view_all_professionals: false
      },
      manage_service_professionals: {
        view: false,
        add: false,
        edit: false,
        remove: false,
        view_schedule: false,
        manage_schedule: false
      }
    }

    if (employee.permissions) {
      // Verificar se está no formato plano
      const isFlat = Object.keys(employee.permissions).some(key => key.includes('.'))
      
      if (isFlat) {
        // Converter do formato plano para hierárquico
        Object.entries(employee.permissions).forEach(([key, value]) => {
          const [category, permission] = key.split('.')
          if (hierarchicalPermissions[category as keyof typeof hierarchicalPermissions]) {
            (hierarchicalPermissions[category as keyof typeof hierarchicalPermissions] as any)[permission] = value
          }
        })
      } else {
        // Já está no formato hierárquico
        Object.entries(employee.permissions).forEach(([category, perms]) => {
          if (hierarchicalPermissions[category as keyof typeof hierarchicalPermissions]) {
            Object.entries(perms as any).forEach(([perm, value]) => {
              (hierarchicalPermissions[category as keyof typeof hierarchicalPermissions] as any)[perm] = value
            })
          }
        })
      }
    }

    setEditingPermissions(hierarchicalPermissions)
    setShowEditManagerModal(true)
  }

  const handleEditPermissionChange = (category: string, permission: string, value: boolean) => {
    setEditingPermissions(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [permission]: value
      }
    }))
  }

  const handleConfirmEditManager = async () => {
    if (!editingEmployee || updatingManager) return
    
    try {
      setUpdatingManager(true)
      console.log('Editando permissões de agenda para funcionário:', {
        employeeId: editingEmployee.id,
        permissions: editingPermissions
      })

      // Converter permissões do formato hierárquico para o formato plano
      const flatPermissions: Record<string, boolean> = {}
      
      // Preservar permissões existentes que não são de agenda
      if (editingEmployee.permissions) {
        const isFlat = Object.keys(editingEmployee.permissions).some(key => key.includes('.'))
        
        if (isFlat) {
          // Já está no formato plano - preservar todas
          Object.assign(flatPermissions, editingEmployee.permissions)
        } else {
          // Converter do formato hierárquico para plano
          Object.entries(editingEmployee.permissions).forEach(([category, perms]) => {
            if (typeof perms === 'object' && perms !== null) {
              Object.entries(perms).forEach(([perm, value]) => {
                flatPermissions[`${category}.${perm}`] = value as boolean
              })
            }
          })
        }
      }

      // Atualizar apenas as permissões de agenda
      Object.entries(editingPermissions).forEach(([category, perms]) => {
        if (typeof perms === 'object' && perms !== null) {
          Object.entries(perms).forEach(([perm, value]) => {
            flatPermissions[`${category}.${perm}`] = value as boolean
          })
        }
      })

      console.log('Permissões em formato plano:', flatPermissions)

      // Atualizar as permissões do funcionário
      const result = await updateEmployee(
        editingEmployee.id,
        editingEmployee.role,
        flatPermissions,
        editingEmployee.role_description
      )

      if (result.success) {
        console.log('✅ Permissões de agenda editadas com sucesso!')
        
        // Fechar o modal e resetar estados
        setShowEditManagerModal(false)
        setEditingEmployee(null)
        setEditingPermissions({
          appointments: {
            view: false,
            create: false,
            edit: false,
            cancel: false,
            reschedule: false,
            view_all_professionals: false
          },
          manage_service_professionals: {
            view: false,
            add: false,
            edit: false,
            remove: false,
            view_schedule: false,
            manage_schedule: false
          }
        })

        // Recarregar funcionários para mostrar as mudanças
        await fetchEmployees()
      } else {
        console.error('❌ Erro ao editar permissões:', result.error)
      }
      
    } catch (error) {
      console.error('❌ Erro ao editar permissões:', error)
    } finally {
      setUpdatingManager(false)
    }
  }

  const handleCancelEditManager = () => {
    setShowEditManagerModal(false)
    setEditingEmployee(null)
    setUpdatingManager(false)
    setEditingPermissions({
      appointments: {
        view: false,
        create: false,
        edit: false,
        cancel: false,
        reschedule: false,
        view_all_professionals: false
      },
      manage_service_professionals: {
        view: false,
        add: false,
        edit: false,
        remove: false,
        view_schedule: false,
        manage_schedule: false
      }
    })
  }

  // Função para verificar se um funcionário tem qualquer permissão de agenda
  const hasAnyAgendaPermission = (permissions: any) => {
    if (!permissions) return false
    
    const agendaPermissions = [
      'appointments.view', 'appointments.create', 'appointments.edit', 
      'appointments.cancel', 'appointments.reschedule', 'appointments.view_all_professionals',
      'manage_service_professionals.view_schedule', 'manage_service_professionals.manage_schedule'
    ]
    
    return agendaPermissions.some(perm => permissions[perm] === true)
  }

  // Filtrar funcionários que podem ser gestores (excluindo o proprietário e gestores atuais)
  const availableEmployees = employees.filter(emp => 
    emp.user?.id !== userSalon?.owner_id && 
    emp.status === 'active' &&
    !hasAnyAgendaPermission(emp.permissions) // Excluir quem já tem permissões de agenda
  )

  // Filtrar gestores atuais (funcionários com permissões de agenda)
  const currentManagers = employees.filter(emp => 
    emp.status === 'active' && 
    emp.permissions && 
    hasAnyAgendaPermission(emp.permissions)
  )

  // Filtrar permissões relacionadas à agenda para o modal
  const getAgendaRelatedPermissions = () => {
    return PERMISSION_CATEGORIES.filter(category => 
      ['appointments', 'manage_service_professionals'].includes(category.id)
    ).map(category => {
      // Para cada categoria, filtrar apenas as permissões específicas da agenda
      if (category.id === 'appointments') {
        return {
          ...category,
          permissions: category.permissions.filter(permission => 
            ['appointments.view', 'appointments.create', 'appointments.edit', 'appointments.cancel', 'appointments.reschedule', 'appointments.view_all_professionals'].includes(permission.key)
          )
        }
      }
      if (category.id === 'manage_service_professionals') {
        return {
          ...category,
          permissions: category.permissions.filter(permission => 
            ['manage_service_professionals.view_schedule', 'manage_service_professionals.manage_schedule'].includes(permission.key)
          )
        }
      }
      return category
    }).filter(category => category.permissions.length > 0)
  }

  // Funções auxiliares idênticas ao SalonEmployeeManager
  const getRoleLabel = (role: SalonEmployee['role'], roleDescription?: string) => {
    // Se tem role_description personalizada, usar ela
    if (roleDescription && roleDescription.trim()) {
      return roleDescription
    }
    
    // Senão, usar os labels padrão
    const labels = {
      admin: 'Administrador',
      secretary: 'Secretária',
      manager: 'Gerente',
      receptionist: 'Recepcionista',
      cleaner: 'Limpeza',
      other: 'Outro',
      owner: 'Proprietário'
    }
    return labels[role] || role
  }

  const getRoleColor = (role: SalonEmployee['role']) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      secretary: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      receptionist: 'bg-purple-100 text-purple-800',
      cleaner: 'bg-gray-100 text-gray-800',
      other: 'bg-orange-100 text-orange-800',
      owner: 'bg-yellow-100 text-yellow-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: SalonEmployee['status']) => {
    switch (status) {
      case 'active':
        return <UserCheck className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'rejected':
        return <UserX className="h-3 w-3" />
      case 'suspended':
        return <UserX className="h-3 w-3" />
      case 'inactive':
        return <UserX className="h-3 w-3" />
      default:
        return <UserX className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: SalonEmployee['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-orange-100 text-orange-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: SalonEmployee['status']) => {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'pending':
        return 'Pendente'
      case 'rejected':
        return 'Rejeitado'
      case 'suspended':
        return 'Suspenso'
      case 'inactive':
        return 'Inativo'
      default:
        return 'Desconhecido'
    }
  }

  // Se não pode acessar, mostrar mensagem
  if (!permissionsLoading && !canAccessProfessionalAgenda()) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Acesso Negado
              </CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta agenda profissional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Para acessar agendas profissionais, você precisa ser:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                <li>Um profissional cadastrado</li>
                <li>Um funcionário com permissão de visualização</li>
                <li>O dono do salão</li>
              </ul>
              <Button asChild className="w-full">
                <Link to="/agenda-pessoal">Ir para Agenda Pessoal</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            BeautyTime - Agenda Profissional
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus agendamentos e sua equipe de forma profissional
          </p>
        </div>

        {/* Resumo da Agenda */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Resumo da Agenda
              <Badge variant="secondary">Ativo</Badge>
            </CardTitle>
            <CardDescription>
              {appointmentsLoading ? 'Carregando...' : `${appointments.length} agendamentos no total`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile: Apenas 2 métricas essenciais */}
            <div className="grid grid-cols-2 gap-4 sm:hidden">
              <div className="text-center">
                <div className="text-lg font-bold text-secondary">
                  {appointmentsLoading ? '...' : todayAppointments.length}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Hoje
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {appointmentsLoading ? '...' : appointments.filter(apt => apt.status === 'confirmed').length}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Confirmados
                </div>
              </div>
            </div>
            
            {/* Desktop: Todas as 4 métricas */}
            <div className="hidden sm:grid sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  {appointmentsLoading ? '...' : appointments.filter(apt => apt.status === 'confirmed').length}
                </div>
                <div className="text-sm text-muted-foreground">Confirmados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {professionalsLoading ? '...' : professionals.filter(prof => 
                    prof.agenda_enabled || userSalon?.owner_id === prof.professional_id
                  ).length}
                </div>
                <div className="text-sm text-muted-foreground">Agendas Ativas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {appointmentsLoading ? '...' : todayAppointments.length}
                </div>
                <div className="text-sm text-muted-foreground">Agendamentos Hoje</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {appointmentsLoading ? '...' : upcomingAppointments.length}
                </div>
                <div className="text-sm text-muted-foreground">Próximos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo da Assinatura */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Resumo da Assinatura
              <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Ativa</Badge>
            </CardTitle>
            <CardDescription>
              Plano Plus - Até 5 profissionais • Renovação em 30 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Mobile: Apenas 3 métricas essenciais */}
            <div className="grid grid-cols-3 gap-4 sm:hidden">
              <div className="text-center">
                <div className="text-lg font-bold text-accent">
                  {professionalsLoading ? '...' : professionals.length}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Users className="h-3 w-3" />
                  Ativos
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {professionalsLoading ? '...' : professionals.filter(prof => prof.agenda_enabled).length}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Habilitadas
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {professionalsLoading ? '...' : Math.max(0, 5 - professionals.length)}
                </div>
                <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Vagas
                </div>
              </div>
            </div>
            
            {/* Desktop: Todas as 4 métricas */}
            <div className="hidden sm:grid sm:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">
                  5
                </div>
                <div className="text-sm text-muted-foreground">Profissionais Incluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">
                  {professionalsLoading ? '...' : professionals.length}
                </div>
                <div className="text-sm text-muted-foreground">Profissionais Ativos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {professionalsLoading ? '...' : professionals.filter(prof => prof.agenda_enabled).length}
                </div>
                <div className="text-sm text-muted-foreground">Agendas Habilitadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {professionalsLoading ? '...' : Math.max(0, 5 - professionals.length)}
                </div>
                <div className="text-sm text-muted-foreground">Vagas Disponíveis</div>
              </div>
            </div>
            
            {/* Barra de progresso - sempre visível */}
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Uso da Assinatura:</span>
                <span className="font-medium">
                  {professionalsLoading ? '...' : `${Math.round((professionals.length / 5) * 100)}%`}
                </span>
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${professionalsLoading ? 0 : Math.min((professionals.length / 5) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {hasPermission('appointments.view_all_professionals') && (
            <Button variant="hero" className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm" asChild>
              <Link to="/agenda-completa">
                <Calendar className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="hidden sm:inline">Ver Agenda Completa</span>
                <span className="sm:hidden">Agenda</span>
              </Link>
            </Button>
          )}
          {hasPermission('appointments.create') && (
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm" asChild>
              <Link to="/novo-agendamento">
                <Plus className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="hidden sm:inline">Novo Agendamento</span>
                <span className="sm:hidden">Novo</span>
              </Link>
            </Button>
          )}
          {hasPermission('reports.view') && (
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm" asChild>
              <Link to="/relatorios-agenda">
                <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="hidden sm:inline">Relatórios</span>
                <span className="sm:hidden">Relatórios</span>
              </Link>
            </Button>
          )}
          {hasPermission('system_settings.edit') && (
            <Button variant="outline" className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm" asChild>
              <Link to="/configuracoes-agenda">
                <Settings className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
                <span className="hidden sm:inline">Configurações</span>
                <span className="sm:hidden">Config</span>
              </Link>
            </Button>
          )}
        </div>

        {/* Profissionais da Equipe */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profissionais da Equipe</CardTitle>
          </CardHeader>
          <CardContent>
            {professionalsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando profissionais...</div>
              </div>
            ) : (
              <div className="space-y-4">
                {professionals.map((salonProfessional) => {
                  const todayAppointments = appointments.filter(
                    apt => apt.professional?.id === salonProfessional.professional_id && 
                           apt.date === new Date().toISOString().split('T')[0]
                  )
                  
                  return (
                    <div key={salonProfessional.id} className="flex flex-col gap-3 p-3 sm:p-4 rounded-lg bg-gradient-card sm:flex-row sm:items-center sm:justify-between">
                      {/* Header com avatar e nome - full width no mobile */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <Avatar className="h-10 w-10 flex-shrink-0">
                          <AvatarImage src={salonProfessional.professional?.profile_photo} />
                          <AvatarFallback>{salonProfessional.professional?.name?.charAt(0) || 'P'}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-base truncate">
                            {salonProfessional.professional?.name || 'Profissional não informado'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {todayAppointments.length} agendamentos hoje
                          </p>
                        </div>
                      </div>

                      {/* Badges - full width no mobile, inline no desktop */}
                      <div className="flex flex-wrap gap-2 sm:flex-nowrap sm:gap-2 sm:items-center">
                        <Badge variant="secondary" className="text-xs">
                          {salonProfessional.service_type || 'Profissional'}
                        </Badge>
                        {isProfessionalOwner(salonProfessional.professional_id) ? (
                          <Badge 
                            variant={salonProfessional.agenda_enabled ? "default" : "outline"} 
                            className="text-xs"
                          >
                            {salonProfessional.agenda_enabled ? "Agenda Própria Ativa" : "Agenda Própria Inativa"}
                          </Badge>
                        ) : (
                          <Badge 
                            variant={salonProfessional.agenda_enabled ? "default" : "outline"} 
                            className="text-xs"
                          >
                            {salonProfessional.agenda_enabled ? "Agenda Ativa" : "Agenda Inativa"}
                          </Badge>
                        )}
                      </div>

                      {/* Informação de habilitação - só mostra quando relevante */}
                      {!isProfessionalOwner(salonProfessional.professional_id) && 
                       salonProfessional.agenda_enabled && 
                       salonProfessional.agenda_enabled_at && (
                        <div className="text-xs text-muted-foreground sm:hidden">
                          Habilitada em {new Date(salonProfessional.agenda_enabled_at).toLocaleDateString('pt-BR')}
                          {salonProfessional.enabled_by_user && ` por ${salonProfessional.enabled_by_user.name}`}
                        </div>
                      )}

                      {/* Botões - full width no mobile, compactos no desktop */}
                      <div className="flex flex-col gap-2 w-full sm:flex-row sm:gap-2 sm:w-auto sm:flex-shrink-0">
                        <Button variant="outline" size="sm" className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50 w-full sm:w-auto">
                          Ver Agenda
                        </Button>
                        
                        <div className="flex gap-2">
                          {canControlAgenda(salonProfessional.professional_id) && (
                            <>
                              {salonProfessional.agenda_enabled ? (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 flex-1 sm:flex-none"
                                  onClick={() => handleDisableAgenda(salonProfessional.id)}
                                >
                                  Desabilitar Agenda
                                </Button>
                              ) : (
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="text-xs border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 flex-1 sm:flex-none"
                                  onClick={() => handleEnableAgenda(salonProfessional.id)}
                                >
                                  Habilitar Agenda
                                </Button>
                              )}
                            </>
                          )}

                        </div>
                      </div>
                    </div>
                  )
                })}
                {professionals.length === 0 && (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum profissional encontrado</p>
                    <p className="text-sm text-muted-foreground">Adicione profissionais para começar</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agendamentos de Hoje */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Agendamentos de Hoje</CardTitle>
            <CardDescription>{new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando agendamentos...</div>
              </div>
            ) : todayAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhum agendamento para hoje</p>
                <p className="text-sm text-muted-foreground">Aproveite para organizar sua agenda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-center flex-shrink-0">
                        <div className="font-semibold text-sm sm:text-base">{appointment.start_time}</div>
                        <div className="text-xs text-muted-foreground">{appointment.duration_minutes}min</div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-sm sm:text-base truncate">
                          {appointment.client?.name || 'Cliente não informado'}
                        </h4>
                        <p className="text-xs sm:text-sm text-muted-foreground truncate">
                          {appointment.service?.name || 'Serviço não informado'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          com {appointment.professional?.name || 'Profissional não informado'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                      <Button variant="outline" size="sm" className="text-xs border-gray-300 text-gray-700 hover:bg-gray-50">
                        Detalhes
                      </Button>

                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" className="w-full mt-4 border-gray-300 text-gray-700 hover:bg-gray-50" asChild>
              <Link to="/agenda-completa">Ver todos os agendamentos</Link>
            </Button>
          </CardContent>
        </Card>



        {/* Gestores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Gestores da Agenda</span>
              {hasPermission('employees.edit') && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={handleAddManager}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Gestor
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando gestores...</div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Proprietário sempre aparece primeiro */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-card border border-yellow-400/50">
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={userSalon?.owner?.profile_photo} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                      {userSalon?.owner?.name?.charAt(0).toUpperCase() || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate text-sm">
                        {userSalon?.owner?.name || 'Proprietário'}
                      </p>
                      <Badge 
                        variant="default" 
                        className="text-xs bg-yellow-100 text-yellow-800"
                      >
                        Proprietário
                      </Badge>
                      <Badge 
                        variant="default" 
                        className="text-xs bg-green-100 text-green-800"
                      >
                        <UserCheck className="h-3 w-3" />
                        <span className="ml-1">Ativo</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{userSalon?.owner?.email?.split('@')[0] || 'proprietario'}
                    </p>
                  </div>
                </div>

                {/* Gestores adicionais */}
                {currentManagers.map((manager) => (
                  <div 
                    key={manager.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarImage src={manager.user?.profile_photo} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                        {manager.user?.name?.charAt(0).toUpperCase() || 'G'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate text-sm">
                          {manager.user?.name || 'Gestor'}
                        </p>
                        <Badge 
                          variant="default" 
                          className={`text-xs ${getRoleColor(manager.role)}`}
                        >
                          {getRoleLabel(manager.role, manager.role_description)}
                        </Badge>
                        <Badge 
                          variant="default" 
                          className={`text-xs ${getStatusColor(manager.status)}`}
                          title={manager.status === 'pending' ? 'Aguardando aceitação do convite' : undefined}
                        >
                          {getStatusIcon(manager.status)}
                          <span className="ml-1">{getStatusLabel(manager.status)}</span>
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        @{manager.user?.nickname || 'funcionario'}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {hasPermission('employees.edit') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditManager(manager)}
                          className="h-8 w-8 p-0"
                          title="Editar permissões da agenda"
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Estado vazio se não há gestores adicionais */}
                {currentManagers.length === 0 && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                    <div className="text-center w-full text-muted-foreground">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhum gestor adicional</p>
                      <p className="text-xs">Adicione funcionários como gestores da agenda</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal para Adicionar Gestor */}
        {showAddManagerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                {/* Passo 1: Seleção do Funcionário */}
                {!showPermissionsStep && (
                  <>
                    <h2 className="text-xl font-semibold mb-4">Adicionar Gestor da Agenda</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Selecione um funcionário para dar permissões de gestão da agenda
                    </p>
                    
                    {availableEmployees.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum funcionário disponível</p>
                        <p className="text-sm text-muted-foreground">
                          Adicione funcionários no perfil do salão primeiro
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availableEmployees.map((employee) => (
                          <div
                            key={employee.id}
                            className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer transition-colors"
                            onClick={() => handleSelectEmployee(employee.id)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={employee.user?.profile_photo} />
                                <AvatarFallback>
                                  {employee.user?.name?.charAt(0) || 'F'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">
                                  {employee.user?.name || 'Funcionário'}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {employee.role || 'Funcionário'}
                                </p>
                              </div>
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleCancelAddManager}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </>
                )}

                {/* Passo 2: Configuração de Permissões */}
                {showPermissionsStep && selectedEmployee && (
                  <>
                    <div className="flex items-center gap-3 mb-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleBackToEmployeeSelection}
                        className="p-0 h-auto"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div>
                        <h2 className="text-xl font-semibold">Configurar Permissões</h2>
                        <p className="text-sm text-muted-foreground">
                          {availableEmployees.find(emp => emp.id === selectedEmployee)?.user?.name || 'Funcionário'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {getAgendaRelatedPermissions().map((category) => (
                        <div key={category.id}>
                          <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                            <span className="text-lg">{category.icon}</span>
                            {category.title}
                          </h3>
                          <div className="space-y-2">
                            {category.permissions.map((permission) => {
                              const [categoryKey, permissionKey] = permission.key.split('.')
                              const isChecked = permissions[categoryKey as keyof typeof permissions]?.[permissionKey as any] || false
                              
                              return (
                                <label key={permission.key} className="flex items-start gap-2 text-sm">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={(e) => handlePermissionChange(categoryKey, permissionKey, e.target.checked)}
                                    className="rounded mt-0.5"
                                  />
                                  <div className="flex-1">
                                    <div className="font-medium">{permission.label}</div>
                                    {permission.description && (
                                      <div className="text-xs text-muted-foreground">{permission.description}</div>
                                    )}
                                  </div>
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex gap-3 mt-6">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleBackToEmployeeSelection}
                      >
                        Voltar
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleConfirmAddManager}
                        disabled={addingManager || !Object.values(permissions).some(category => 
                          Object.values(category).some(permission => permission)
                        )}
                      >
                        {addingManager ? 'Adicionando...' : 'Adicionar Gestor'}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modal para Editar Gestor */}
        {showEditManagerModal && editingEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={editingEmployee.user?.profile_photo} />
                    <AvatarFallback>
                      {editingEmployee.user?.name?.charAt(0) || 'G'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-semibold">Editar Permissões da Agenda</h2>
                    <p className="text-sm text-muted-foreground">
                      {editingEmployee.user?.name || 'Gestor'}
                    </p>
                  </div>
                </div>

                <div className="space-y-6">
                  {getAgendaRelatedPermissions().map((category) => (
                    <div key={category.id}>
                      <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
                        <span className="text-lg">{category.icon}</span>
                        {category.title}
                      </h3>
                      <div className="space-y-2">
                        {category.permissions.map((permission) => {
                          const [categoryKey, permissionKey] = permission.key.split('.')
                          const isChecked = editingPermissions[categoryKey as keyof typeof editingPermissions]?.[permissionKey as any] || false
                          
                          return (
                            <label key={permission.key} className="flex items-start gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => handleEditPermissionChange(categoryKey, permissionKey, e.target.checked)}
                                className="rounded mt-0.5"
                              />
                              <div className="flex-1">
                                <div className="font-medium">{permission.label}</div>
                                {permission.description && (
                                  <div className="text-xs text-muted-foreground">{permission.description}</div>
                                )}
                              </div>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelEditManager}
                    disabled={updatingManager}
                  >
                    Cancelar
                  </Button>
                                      <Button
                      className="flex-1"
                      onClick={handleConfirmEditManager}
                      disabled={updatingManager}
                    >
                      {updatingManager ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgendaProfissional;