import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Calendar, Clock, Users, Plus, 
  Edit3, UserCheck, UserX, Building2, 
  Shield, Briefcase, TrendingUp, BarChart3, Settings
} from "lucide-react"
import { Link } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
// import { useSalonPermissions, type EmployeePermissions } from "@/hooks/useSalonPermissions" // REMOVIDO TEMPORARIAMENTE
import { useAppointments } from "@/hooks/useAppointments"
import { useSalonProfessionals } from "@/hooks/useSalonProfessionals"
// import { useSalonEmployees } from "@/hooks/useSalonEmployees" // REMOVIDO TEMPORARIAMENTE
import { supabase } from "@/lib/supabase"
import { useEffect, useState } from "react"
// import { PERMISSION_CATEGORIES } from "@/config/permissionCategories" // REMOVIDO TEMPORARIAMENTE
// import { type SalonEmployee } from "@/hooks/useSalonPermissions" // REMOVIDO TEMPORARIAMENTE
// import { AddEmployeeModal } from "@/components/AddEmployeeModal" // REMOVIDO TEMPORARIAMENTE

const AreaAdministrativa = () => {
    const { user } = useAuthContext()
  const { userSalon } = useSalons(user?.id)
  
  // Estado para salão onde trabalha (se não for proprietário)
  const [workplaceSalon, setWorkplaceSalon] = useState<any>(null)
  const [workplaceLoading, setWorkplaceLoading] = useState(false)
  
  // const { hasPermission, isOwner, isEmployee, loading: permissionsLoading, userPermissions, userRole } = useSalonPermissions(userSalon?.id || workplaceSalon?.id) // REMOVIDO TEMPORARIAMENTE
  
  // Simplificação temporária - apenas verificar se é dono
  const isOwner = user?.id === userSalon?.owner_id
  const hasPermission = (permission: string) => isOwner // Apenas donos têm todas as permissões
  const permissionsLoading = false // REMOVIDO TEMPORARIAMENTE
  const userPermissions = null // REMOVIDO TEMPORARIAMENTE
  
  const { appointments, loading: appointmentsLoading, fetchSalonAppointments, todayAppointments, upcomingAppointments } = useAppointments()
  const { professionals, loading: professionalsLoading, fetchProfessionals, enableAgenda, disableAgenda } = useSalonProfessionals(userSalon?.id || workplaceSalon?.id || '')
  // const { employees, loading: employeesLoading, fetchEmployees, updateEmployee, addEmployee } = useSalonEmployees(userSalon?.id || workplaceSalon?.id || '') // REMOVIDO TEMPORARIAMENTE
  
  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Estados para modais
  // const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false) // REMOVIDO TEMPORARIAMENTE
  const [showAddProfessionalModal, setShowAddProfessionalModal] = useState(false)
  // const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false) // REMOVIDO TEMPORARIAMENTE
  const [showEditProfessionalModal, setShowEditProfessionalModal] = useState(false)
  // const [selectedEmployee, setSelectedEmployee] = useState<SalonEmployee | null>(null) // REMOVIDO TEMPORARIAMENTE
  const [selectedProfessional, setSelectedProfessional] = useState<any>(null)

  // Função para buscar salão onde trabalha
  const fetchWorkplaceSalon = async () => {
    if (!user?.id || userSalon?.id) return
    
    try {
      setWorkplaceLoading(true)
      
      // Buscar na tabela salon_employees
      const { data: employeeData, error: employeeError } = await supabase
        .from('salon_employees')
        .select(`
          salon_id,
          salons_studios!inner(
              id,
              name,
              owner_id,
              owner:users!inner(
                id,
                name,
                email,
                profile_photo
            )
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle()
    
      if (employeeError) {
        console.error('Erro ao buscar salão do funcionário:', employeeError)
        return
      }
      
      if (employeeData) {
          setWorkplaceSalon(employeeData.salons_studios)
      }
    } catch (error) {
      console.error('Erro ao buscar salão onde trabalha:', error)
    } finally {
      setWorkplaceLoading(false)
    }
  }
  

  
  // Estados para permissões - REMOVIDO TEMPORARIAMENTE
  // const [employeePermissions, setEmployeePermissions] = useState<Partial<EmployeePermissions>>({
  //   appointments: {
  //     view: false,
  //     create: false,
  //     edit: false,
  //     cancel: false,
  //     reschedule: false,
  //     view_all_professionals: false
  //   },
  //   manage_service_professionals: {
  //     view: false,
  //     add: false,
  //     edit: false,
  //     remove: false,
  //     view_schedule: false,
  //     manage_schedule: false
  //   }
  // })
  
  // Estados de loading
  const [isLoadingData, setIsLoadingData] = useState(false)
  // const [updatingEmployee, setUpdatingEmployee] = useState(false) // REMOVIDO TEMPORARIAMENTE
  const [updatingProfessional, setUpdatingProfessional] = useState(false)
  
  // Carregar dados do salão
  useEffect(() => {
    // Se não tem salão próprio, buscar salão onde trabalha como funcionário
    if (!userSalon?.id) {
      fetchWorkplaceSalon()
      return
    }
    
    setIsLoadingData(true)
    
    Promise.all([
      fetchSalonAppointments(userSalon.id),
      fetchProfessionals()
      // fetchEmployees() // REMOVIDO TEMPORARIAMENTE
    ]).catch((error) => {
      console.error('Erro ao carregar dados:', error)
    }).finally(() => {
      setIsLoadingData(false)
    })
  }, [userSalon?.id])

  // Carregar dados quando encontrar salão onde trabalha
  useEffect(() => {
    if (!workplaceSalon?.id || userSalon?.id) return
    
    setIsLoadingData(true)
    
    Promise.all([
      fetchSalonAppointments(workplaceSalon.id),
      fetchProfessionals()
      // fetchEmployees() // REMOVIDO TEMPORARIAMENTE
    ]).catch((error) => {
      console.error('Erro ao carregar dados do salão onde trabalha:', error)
    }).finally(() => {
      setIsLoadingData(false)
    })
  }, [workplaceSalon?.id])



  // Verificar se pode acessar área administrativa
  const canAccessAdminArea = () => {
    if (!user) return false
    
    // Proprietários sempre podem acessar
    if (isOwner) return true
    
    // Funcionários com permissões administrativas podem acessar - REMOVIDO TEMPORARIAMENTE
    // if (isEmployee && (
    //   hasPermission('manage_employees.view') ||
    //   hasPermission('manage_service_professionals.view') ||
    //   hasPermission('appointments.view_all_professionals') ||
    //   hasPermission('reports.view')
    // )) return true
    
    // Funcionários que trabalham em salões podem acessar (mesmo sem permissões específicas) - REMOVIDO TEMPORARIAMENTE
    // if (workplaceSalon?.id) return true
    
    return false
  }

  // Funções para gerenciar funcionários - REMOVIDO TEMPORARIAMENTE
  // const handleAddEmployee = () => {
  //   setShowAddEmployeeModal(true)
  // }

  // const handleEditEmployee = (employee: SalonEmployee) => {
  //   setSelectedEmployee(employee)
  //   setShowEditEmployeeModal(true)
  // }

  // const handleUpdateEmployeePermissions = async (employeeId: string, permissions: Partial<EmployeePermissions>) => {
  //   if (!employeeId || updatingEmployee) return
  //   
  //   try {
  //     setUpdatingEmployee(true)
  //     
  //     // Converter permissões para formato plano
  //     const flatPermissions: Record<string, boolean> = {}
  //     Object.entries(permissions).forEach(([category, perms]) => {
  //       if (typeof perms === 'object' && perms !== null) {
  //         Object.entries(perms).forEach(([perm, value]) => {
  //           flatPermissions[`${category}.${perm}`] = value as boolean
  //         })
  //       }
  //   }

  //     // Buscar funcionário atual
  //     const currentEmployee = employees.find(emp => emp.id === employeeId)
  //     if (!currentEmployee) return

  //     // Atualizar funcionário
  //     const result = await updateEmployee(
  //       employeeId,
  //       currentEmployee.role,
  //       flatPermissions,
  //       currentEmployee.role_description
  //     )

  //     if (result.success) {
  //       await fetchEmployees()
  //       setShowEditEmployeeModal(false)
  //       setSelectedEmployee(null)
  //     }
  //   } catch (error) {
  //     console.error('Erro ao atualizar funcionário:', error)
  //   } finally {
  //     setUpdatingEmployee(false)
  //   }
  // }

  // Funções para gerenciar profissionais
  const handleAddProfessional = () => {
    setShowAddProfessionalModal(true)
  }

  const handleEditProfessional = (professional: any) => {
    setSelectedProfessional(professional)
    setShowEditProfessionalModal(true)
  }

  const handleToggleAgenda = async (professionalId: string, enable: boolean) => {
    if (updatingProfessional) return
    
    try {
      setUpdatingProfessional(true)
      
      if (enable) {
        await enableAgenda(professionalId)
      } else {
        await disableAgenda(professionalId)
      }
      
      await fetchProfessionals()
    } catch (error) {
      console.error('Erro ao alterar agenda:', error)
    } finally {
      setUpdatingProfessional(false)
    }
  }

     // Funções auxiliares para profissionais
   const isProfessionalOwner = (professionalId: string) => {
     return (userSalon?.owner_id || workplaceSalon?.owner_id) === professionalId
   }

  const canControlAgenda = (professionalId: string, professional: any) => {
    // Se for o próprio dono do salão, ele pode controlar sua própria agenda
    if (isProfessionalOwner(professionalId)) {
      // Só o próprio dono pode controlar sua agenda
      return user?.id === professionalId
    }
    
    // Se o profissional tem agenda própria (trial/assinatura), não pode ser controlada pelo salão
    if (professional?.agenda_enabled) {
      return false
    }
    
    // Para outros profissionais sem agenda própria, precisa ter permissão de edição de funcionários - REMOVIDO TEMPORARIAMENTE
    return isOwner // || hasPermission('employees.edit') || (userPermissions?.manage_employees?.edit)
  }

  // Funções auxiliares para funcionários/gestores - REMOVIDO TEMPORARIAMENTE
  // const hasAnyAgendaPermission = (permissions: any) => {
  //   if (!permissions) return false
  //   
  //   // Verificar permissões de agenda de forma hierárquica
  //   const hasAppointmentPermissions = permissions.appointments && (
  //     permissions.appointments.view ||
  //     permissions.appointments.view ||
  //     permissions.appointments.edit ||
  //     permissions.appointments.cancel ||
  //     permissions.appointments.reschedule ||
  //     permissions.appointments.view_all_professionals
  //   )
  //   
  //   const hasProfessionalPermissions = permissions.manage_service_professionals && (
  //     permissions.manage_service_professionals.view_schedule ||
  //     permissions.manage_service_professionals.manage_schedule
  //   )
  //   
  //   return hasAppointmentPermissions || hasProfessionalPermissions
  // }

  // Filtrar funcionários (todos os funcionários, não apenas os ativos) - REMOVIDO TEMPORARIAMENTE
  // const currentManagers = employees.filter(emp => 
  //   emp.status === 'active' || emp.status === 'pending'
  // )
  const currentManagers: any[] = [] // REMOVIDO TEMPORARIAMENTE

  

  // Funções auxiliares - REMOVIDO TEMPORARIAMENTE
  // const getRoleLabel = (role: string, roleDescription?: string) => {
  //   if (roleDescription && roleDescription.trim()) {
  //     return roleDescription
  //   }
  //   
  //   const labels: Record<string, string> = {
  //     admin: 'Administrador',
  //     secretary: 'Secretária',
  //     manager: 'Gerente',
  //     receptionist: 'Recepcionista',
  //     cleaner: 'Limpeza',
  //     other: 'Outro',
  //     owner: 'Proprietário'
  //   }
  //   return labels[role] || role
  // }

  // const getRoleColor = (role: string) => {
  //   const colors: Record<string, string> = {
  //     admin: 'bg-red-100 text-blue-800',
  //     secretary: 'bg-blue-100 text-blue-800',
  //     manager: 'bg-green-100 text-green-800',
  //     receptionist: 'bg-purple-100 text-purple-800',
  //     cleaner: 'bg-gray-100 text-gray-800',
  //     other: 'bg-orange-100 text-orange-800',
  //     owner: 'bg-yellow-100 text-yellow-800'
  //   }
  //   return colors[role] || 'bg-gray-100 text-gray-800'
  // }

  // const getStatusColor = (status: string) => {
  //   const colors: Record<string, string> = {
  //     active: 'bg-green-100 text-green-800',
  //     pending: 'bg-yellow-100 text-yellow-800',
  //     inactive: 'bg-gray-100 text-gray-800',
  //     suspended: 'bg-orange-100 text-orange-800',
  //     rejected: 'bg-red-100 text-red-800'
  //   }
  //   return colors[status] || 'bg-gray-100 text-gray-800'
  // }

  // const getStatusLabel = (status: string) => {
  //   const labels: Record<string, string> = {
  //     active: 'Ativo',
  //     pending: 'Pendente',
  //     inactive: 'Inativo',
  //     suspended: 'Suspenso',
  //     rejected: 'Rejeitado'
  //   }
  //   return labels[status] || 'Desconhecido'
  // }

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'active':
  //       return <UserCheck className="h-3 w-3" />
  //     case 'pending':
  //       return <Clock className="h-3 w-3" />
  //     case 'rejected':
  //       return <UserX className="h-3 w-3" />
  //     case 'suspended':
  //       return <UserX className="h-3 w-3" />
  //     case 'inactive':
  //       return <UserX className="h-3 w-3" />
  //     default:
  //       return <UserX className="h-3 w-3" />
  //   }
  // }

  // Funções auxiliares temporárias para evitar erros
  const getRoleLabel = (role: string, roleDescription?: string) => roleDescription || role
  const getRoleColor = (role: string) => 'bg-gray-100 text-gray-800'
  const getStatusColor = (status: string) => 'bg-gray-100 text-gray-800'
  const getStatusLabel = (status: string) => status
  const getStatusIcon = (status: string) => <UserX className="h-3 w-3" />
  
  // Função temporária para evitar erros
  const handleEditEmployee = (employee: any) => {
    console.log('Funcionalidade de editar funcionário removida temporariamente')
  }

  // Se não pode acessar, mostrar mensagem
  if (!permissionsLoading && !canAccessAdminArea()) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Acesso Negado
              </CardTitle>
              <CardDescription>
                Você não tem permissão para acessar a área administrativa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Para acessar esta área, você precisa ser:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                <li>O proprietário do salão</li>
                <li>Um funcionário com permissões administrativas</li>
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Área Administrativa
            </h1>
          </div>
          <p className="text-muted-foreground">
                              Gerencie seu salão, profissionais e configurações
          </p>
        </div>

        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Resumo da Agenda */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Resumo da Agenda
                <Badge variant="secondary">Ativo</Badge>
              </CardTitle>
              <CardDescription>
                {appointmentsLoading ? 'Carregando...' : `${upcomingAppointments.length} agendamentos futuros`}
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
                    {appointmentsLoading ? '...' : upcomingAppointments.filter(apt => apt.status === 'confirmed').length}
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
                    {appointmentsLoading ? '...' : upcomingAppointments.filter(apt => apt.status === 'confirmed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Confirmados</div>
                </div>
                <div className="text-center">
                                     <div className="text-2xl font-bold text-accent">
                     {professionalsLoading ? '...' : professionals.filter(prof => 
                       prof.agenda_enabled || (userSalon?.owner_id || workplaceSalon?.owner_id) === prof.professional_id
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
        </div>

        {/* Ações Rápidas */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ações Rápidas
            </CardTitle>
            <CardDescription>
              Acesse rapidamente as principais funcionalidades administrativas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                             {/* Ver Agenda Completa */}
               {(hasPermission('appointments.view_all_professionals') || true) && (
                 <Button variant="hero" className="h-auto p-4 flex-col" asChild>
                   <Link to="/agenda-completa?from=admin">
                     <Calendar className="h-6 w-6 mb-2" />
                     <span className="text-sm">Ver Agenda Completa</span>
                   </Link>
                 </Button>
               )}
              
                             {/* Novo Agendamento */}
               {(hasPermission('appointments.create') || true) && (
                 <Button variant="outline" className="h-auto p-4 flex-col" asChild>
                   <Link to="/novo-agendamento?from=admin">
                     <Plus className="h-6 w-6 mb-2" />
                     <span className="text-sm">Novo Agendamento</span>
                   </Link>
                 </Button>
               )}
              
                             {/* Relatórios */}
               {(hasPermission('reports.view') || true) && (
                 <Button variant="outline" className="h-auto p-4 flex-col" asChild>
                   <Link to="/relatorios-agenda?from=admin">
                     <BarChart3 className="h-6 w-6 mb-2" />
                     <span className="text-sm">Relatórios</span>
                   </Link>
                 </Button>
               )}
              
                             {/* Configurações */}
               {(hasPermission('system_settings.edit') || true) && (
                 <Button variant="outline" className="h-auto p-4 flex-col" asChild>
                   <Link to="/configuracoes-agenda?from=admin">
                     <Settings className="h-6 w-6 mb-2" />
                     <span className="text-sm">Configurações</span>
                   </Link>
                 </Button>
               )}
            </div>
          </CardContent>
        </Card>

        {/* Profissionais da Equipe */}
        {(isOwner || (userPermissions?.manage_service_professionals?.view) || hasPermission('manage_service_professionals.view') || true) && (
          <Card className="mb-8">
                         <CardHeader>
               <div>
                 <CardTitle className="flex items-center gap-2">
                   <Users className="h-5 w-5" />
                   Profissionais da Equipe
                 </CardTitle>
                 <CardDescription>
                   Gerencie os profissionais vinculados ao seu salão
                 </CardDescription>
               </div>
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
                            <Badge variant={salonProfessional.professional?.agenda_enabled ? "default" : "outline"} className="text-xs">
                              {salonProfessional.professional?.agenda_enabled ? "Agenda Própria" : 
                               salonProfessional.agenda_enabled ? "Agenda Ativa" : "Agenda Inativa"}
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
                            {canControlAgenda(salonProfessional.professional_id, salonProfessional.professional) && (
                              <>
                                {salonProfessional.agenda_enabled ? (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 flex-1 sm:flex-none"
                                    onClick={() => handleToggleAgenda(salonProfessional.id, false)}
                                  >
                                    Desabilitar Agenda
                                  </Button>
                                ) : (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="text-xs border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 flex-1 sm:flex-none"
                                    onClick={() => handleToggleAgenda(salonProfessional.id, true)}
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
                      <p className="text-sm text-muted-foreground">
                        Adicione profissionais para começar
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Funcionários Administrativos - REMOVIDO TEMPORARIAMENTE */}
        {/* {(isOwner || (userPermissions?.manage_employees?.view) || hasPermission('manage_employees.view') || true) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Funcionários Administrativos
                </div>
                {(isOwner || (userPermissions?.manage_employees?.edit) || hasPermission('manage_employees.edit')) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={handleAddEmployee}
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
                       <AvatarImage src={(userSalon?.owner || workplaceSalon?.owner)?.profile_photo} />
                       <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                         {(userSalon?.owner || workplaceSalon?.owner)?.name?.charAt(0).toUpperCase() || 'P'}
                       </AvatarFallback>
                     </Avatar>
                     
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-2 flex-wrap">
                         <p className="font-medium truncate text-sm">
                           {(userSalon?.owner || workplaceSalon?.owner)?.name || 'Proprietário'}
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
                         @{(userSalon?.owner || workplaceSalon?.owner)?.email?.split('@')[0] || 'proprietario'}
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
                        {(isOwner || (userPermissions?.manage_employees?.edit) || hasPermission('manage_employees.edit')) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEmployee(manager)}
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
                  {/* {currentManagers.length === 0 && (
                    <div className="flex items-center justify-between p-3 rounded-lg border border-dashed">
                      <div className="text-center w-full text-muted-foreground">
                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum gestor adicional</p>
                        <p className="text-xs">Adicione funcionários como gestores da agenda</p>
                      </div>
                    </div>
                  )} */}
                {/* </div>
              )}
            </CardContent>
          </Card>
        )} */}



                 {/* Modal para Adicionar Funcionário - REMOVIDO TEMPORARIAMENTE */}
         {/* <AddEmployeeModal
           isOpen={showAddEmployeeModal}
           onClose={() => setShowAddEmployeeModal(false)}
           salonId={userSalon?.id || workplaceSalon?.id || ''}
           onEmployeeAdded={fetchEmployees}
         /> */}
      </div>
    </div>
  )
}

export default AreaAdministrativa
