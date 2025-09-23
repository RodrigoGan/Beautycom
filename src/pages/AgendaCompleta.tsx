import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, User, Search, Filter, ArrowLeft, Plus, Edit, Trash2, AlertCircle, ChevronDown, ChevronUp, X, List, Grid3X3, ChevronLeft, ChevronRight, MessageSquare } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { Header } from "@/components/Header"
import { useAuthContext } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { useSalons } from "@/hooks/useSalons"
// import { useSalonPermissions } from "@/hooks/useSalonPermissions" // REMOVIDO TEMPORARIAMENTE
import { useAppointments } from "@/hooks/useAppointments"
import { useState, useEffect, useCallback } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast"
import { WhatsAppTemplateSelector } from "@/components/WhatsAppTemplateSelector"

const AgendaCompleta = () => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const { userSalon } = useSalons(user?.id)
  
  // Estado para salão onde trabalha (se não for proprietário)
  const [workplaceSalon, setWorkplaceSalon] = useState<any>(null)
  const [workplaceLoading, setWorkplaceLoading] = useState(false)
  
  // const { hasPermission, isOwner, isEmployee, loading: permissionsLoading, userPermissions, userRole } = useSalonPermissions(userSalon?.id || workplaceSalon?.id) // REMOVIDO TEMPORARIAMENTE
  
  // Simplificação temporária - apenas verificar se é dono
  const isOwner = user?.id === userSalon?.owner_id
  const hasPermission = (permission: string) => {
    // Se é dono, tem todas as permissões
    if (isOwner) return true
    // Se é profissional, tem permissões básicas
    if (user?.user_type === 'profissional') return true
    // Por enquanto, permitir acesso para todos os usuários logados
    return true
  }
  const isEmployee = false // REMOVIDO TEMPORARIAMENTE
  const permissionsLoading = false // REMOVIDO TEMPORARIAMENTE
  const userPermissions = null // REMOVIDO TEMPORARIAMENTE
  const userRole = null // REMOVIDO TEMPORARIAMENTE
  const { appointments: originalAppointments, loading: appointmentsLoading, fetchSalonAppointments, fetchAppointments, confirmAppointment, cancelAppointment, updateAppointment } = useAppointments()
  
  // Detectar se veio da Área Administrativa
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'
  
  // Estado local para agendamentos (para controle direto)
  const [appointments, setAppointments] = useState<any[]>([])
  
  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    professional: 'todos',
    status: 'todos'
  })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [lastLoadedSalonId, setLastLoadedSalonId] = useState<string | null>(null)

  // Profissionais do salão (inclui sem agendamento)
  const [allProfessionals, setAllProfessionals] = useState<any[]>([])
  
  // Estados para controle de permissões e visibilidade
  const [canViewAllProfessionals, setCanViewAllProfessionals] = useState(false)
  const [canCreateForOthers, setCanCreateForOthers] = useState(false)
  const [isProfessionalWithoutSalon, setIsProfessionalWithoutSalon] = useState(false)

  // Estados para navegação de datas e filtros
  // Estado para gerenciar a data selecionada
  // Sempre iniciar com a data de hoje
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today
  })
  const [selectedProfessional, setSelectedProfessional] = useState<string>('todos')

  // Estados para autopreenchimento
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  // Estados para modal de edição
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<any>(null)
  const [editFormData, setEditFormData] = useState({
    status: '',
    notes: '',
    start_time: '',
    end_time: '',
    date: ''
  })
  const [editLoading, setEditLoading] = useState(false)

  // Estado para cards expansíveis
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  
  // Estado para appointment expandido no calendário
  const [expandedAppointment, setExpandedAppointment] = useState<string | null>(null)
  const [selectedAppointmentDetails, setSelectedAppointmentDetails] = useState<any>(null)
  
  // Estados para modal de confirmação de exclusão
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null)
  
  // Estados para modal WhatsApp
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false)
  const [selectedAppointmentForWhatsApp, setSelectedAppointmentForWhatsApp] = useState<any>(null)

  // Função para buscar salão onde trabalha - REMOVIDO TEMPORARIAMENTE
  // const fetchWorkplaceSalon = useCallback(async () => {
  //   if (!user?.id || userSalon?.id) return
  //   
  //   try {
  //     setWorkplaceLoading(true)
  //     
  //     // Buscar na tabela salon_employees
  //     const { data: employeeData, error: employeeError } = await supabase
  //       .from('salon_employees')
  //       .select(`
  //         salon_id,
  //         name,
  //         owner_id,
  //         owner:users!inner(
  //           id,
  //           name,
  //           email,
  //           profile_photo
  //         )
  //       `)
  //       .eq('user_id', user.id)
  //       .maybeSingle()
  //   
  //   if (employeeError) return
  //   
  //   if (employeeData) {
  //       setWorkplaceSalon(employeeData.salons_studios)
  //   }
  // } catch (error) {
  //     console.error('Erro ao buscar salão onde trabalha:', error)
  // } finally {
  //     setWorkplaceLoading(false)
  //   }
  // }, [user?.id, userSalon?.id])

  // Determinar permissões e visibilidade baseado no tipo de usuário
  useEffect(() => {
    const determineUserPermissions = () => {
      // Se é proprietário do salão
      if (userSalon?.owner_id === user?.id) {
        setIsProfessionalWithoutSalon(false)
        setCanViewAllProfessionals(true)
        setCanCreateForOthers(true)
        return
      }
      
      // Se não tem salão, definir como profissional independente
      if (!userSalon?.id) {
        setIsProfessionalWithoutSalon(true)
        setCanViewAllProfessionals(false)
        setCanCreateForOthers(false)
        return
      }

      // Se é profissional com salão mas sem permissões especiais
      setIsProfessionalWithoutSalon(false)
      // Por enquanto, permitir visualização para todos os profissionais
      setCanViewAllProfessionals(true)
      setCanCreateForOthers(true)
    }

    determineUserPermissions()
  }, [userSalon?.id, user?.id, isEmployee, hasPermission])

  // Determinar permissões quando encontrar salão onde trabalha - REMOVIDO TEMPORARIAMENTE
  // useEffect(() => {
  //   if (!workplaceSalon?.id || userSalon?.id) return
  //   
  //   console.log('🔍 Debug - determineWorkplacePermissions executado')
  //   console.log('🔍 Debug - workplaceSalon:', workplaceSalon)
  //   console.log('🔍 Debug - isEmployee:', isEmployee)
  //   console.log('🔍 Debug - hasPermission:', hasPermission)
  //   
  //   const determineWorkplacePermissions = () => {
  //     // Se é funcionário com permissões
  //     if (isEmployee && hasPermission) {
  //       console.log('🔍 Debug - É funcionário com permissões (workplace)')
  //       const canViewAll = hasPermission('appointments.view_all_professionals')
  //       const canCreate = hasPermission('appointments.create')
  //       console.log('🔍 Debug - canViewAllProfessionals (workplace):', canViewAll)
  //       console.log('🔍 Debug - canCreateForOthers (workplace):', canViewAll)
  //       
  //       setIsProfessionalWithoutSalon(false)
  //       setCanViewAllProfessionals(canViewAll)
  //       setCanCreateForOthers(canCreate)
  //       return
  //     }

  //     // Se é profissional com salão mas sem permissões especiais
  //       console.log('🔍 Debug - Profissional sem permissões especiais (workplace)')
  //       setIsProfessionalWithoutSalon(false)
  //       // TEMPORÁRIO: Forçar permissões para testar
  //       setCanViewAllProfessionals(true)
  //       setCanCreateForOthers(true)
  //     }

  //     determineWorkplacePermissions()
  //   }, [workplaceSalon?.id, userSalon?.id, isEmployee, hasPermission])

  // Buscar todos os profissionais do salão uma vez quando o salão estiver disponível
  useEffect(() => {
    const fetchAllProfessionals = async () => {
      const salonId = userSalon?.id || workplaceSalon?.id
      
      if (!salonId) {
        // Se não tem salão, definir o usuário como único profissional
        if (user?.id) {
          const userAsProfessional = [{
            id: user.id,
            name: user.name,
            email: user.email,
            profile_photo: user.profile_photo,
            user_type: user.user_type
          }]
          setAllProfessionals(userAsProfessional)
        }
        return
      }
      
      try {
        // Buscar profissionais vinculados ao salão via salon_professionals
        // Usar a relação específica para evitar erro PGRST201
        
        let { data, error } = await supabase
          .from('salon_professionals')
          .select(`
            professional_id,
            status,
            salon_id,
            professional:users!salon_professionals_professional_id_fkey(
              id,
              name,
              email,
              profile_photo,
              user_type
            )
          `)
          .eq('salon_id', salonId)
          .eq('status', 'accepted')

        // Se não encontrou nada, tentar buscar com outros status
        if (!data || data.length === 0) {
          // Buscar profissionais vinculados ao salão via salon_professionals (incluindo outros status)
          const { data: directData, error: directError } = await supabase
            .from('salon_professionals')
            .select(`
              professional_id,
              status,
              salon_id,
              professional:users!salon_professionals_professional_id_fkey(
                id,
                name,
                email,
                profile_photo,
                user_type
              )
            `)
            .eq('salon_id', salonId)
          
          if (directError) {
            console.error('❌ Erro na busca alternativa:', directError)
          }
          
          // Usar dados da busca alternativa se disponível
          data = directData
        }

        // Processar dados encontrados (da busca principal ou alternativa)
        const professionals: any[] = []
        
        if (data && data.length > 0) {
          // Extrair dados dos profissionais
          data.forEach(item => {
            if (item.professional) {
              if (Array.isArray(item.professional)) {
                professionals.push(...item.professional)
              } else {
                professionals.push(item.professional)
              }
            }
          })
        }
        
        // Sempre adicionar o proprietário do salão se ele for profissional
        if (userSalon?.owner_id) {
          try {
            const { data: ownerData, error: ownerError } = await supabase
              .from('users')
              .select('id, name, email, profile_photo, user_type')
              .eq('id', userSalon.owner_id)
              .eq('user_type', 'profissional')
              .single()
            
            if (!ownerError && ownerData) {
              // Verificar se o proprietário já não está na lista
              const ownerExists = professionals.some(prof => prof.id === ownerData.id)
              if (!ownerExists) {
                professionals.push(ownerData)
              }
            }
          } catch (ownerErr) {
            console.log('⚠️ Erro ao verificar proprietário:', ownerErr)
          }
        }
        
        // Se ainda não há profissionais e o usuário atual é profissional, adicionar ele
        if (professionals.length === 0 && user?.id && user?.user_type === 'profissional') {
          professionals.push({
            id: user.id,
            name: user.name,
            email: user.email,
            profile_photo: user.profile_photo,
            user_type: user.user_type
          })
        }
        
        setAllProfessionals(professionals)
      } catch (error) {
        console.error('❌ Erro ao buscar profissionais:', error)
      }
    }

    fetchAllProfessionals()
  }, [userSalon?.id, workplaceSalon?.id, user?.id])

  // Funções de manipulação de agendamentos
  const handleConfirmAppointment = async (appointmentId: string) => {
    try {
      const result = await confirmAppointment(appointmentId)
      if (result.error) {
        toast({
          title: 'Erro ao confirmar agendamento',
          description: result.error,
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Agendamento confirmado!',
          description: 'O agendamento foi confirmado com sucesso.',
          variant: 'default'
        })
      }
    } catch (error) {
      console.error('Erro ao confirmar agendamento:', error)
      toast({
        title: 'Erro ao confirmar agendamento',
        description: 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      })
    }
  }

  const handleCancelAppointment = (appointmentId: string) => {
    setAppointmentToDelete(appointmentId)
    setShowDeleteDialog(true)
  }


  // Função para abrir modal de edição
  const handleEditAppointment = (appointment: any) => {
    setEditingAppointment(appointment)
    setEditFormData({
      status: appointment.status || '',
      notes: appointment.notes || '',
      start_time: appointment.start_time || '',
      end_time: appointment.end_time || '',
      date: appointment.date || ''
    })
    setEditModalOpen(true)
  }

  // Função para salvar edição do agendamento
  const handleSaveEdit = async () => {
    if (!editingAppointment || !editFormData.status) return

    try {
      setEditLoading(true)
      

      // Usar o hook useAppointments que tem notificações integradas
      const result = await updateAppointment(editingAppointment.id, {
        status: editFormData.status,
        notes: editFormData.notes,
        start_time: editFormData.start_time,
        end_time: editFormData.end_time,
        date: editFormData.date
      })

      if (result.error) {
        throw new Error(result.error)
      }


      // Fechar modal e recarregar dados
      setEditModalOpen(false)
      setEditingAppointment(null)
      
      // Recarregar dados baseado no tipo de profissional
      const salonId = userSalon?.id || workplaceSalon?.id
      if (salonId) {
        await fetchSalonAppointments(salonId)
      } else if (user?.id) {
        await fetchAppointments(user.id)
      }

    } catch (error) {
      console.error('❌ Erro ao atualizar agendamento:', error)
      toast({
        title: 'Erro ao atualizar',
        description: error instanceof Error ? error.message : 'Erro ao atualizar o agendamento.',
        variant: 'destructive'
      })
    } finally {
      setEditLoading(false)
    }
  }

  // Função para fechar modal de edição
  const handleCloseEdit = () => {
    setEditModalOpen(false)
    setEditingAppointment(null)
    setEditFormData({
      status: '',
      notes: '',
      start_time: '',
      end_time: '',
      date: ''
    })
  }

  const handleAppointmentClick = (appointment: any) => {
    setSelectedAppointmentDetails(appointment)
    setExpandedAppointment(appointment.id)
  }

  const handleSendReminder = async (appointmentId: string) => {
    try {
      // Aqui você implementaria a lógica para enviar o lembrete
      toast({
        title: "Lembrete enviado!",
        description: "O cliente receberá uma notificação sobre o agendamento.",
      })
    } catch (error) {
      toast({
        title: "Erro ao enviar lembrete",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      })
    }
  }

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return
    
    try {
      console.log('🗑️ Iniciando exclusão do agendamento:', appointmentToDelete)
      
      // Exclusão direta no Supabase
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentToDelete)
      
      if (deleteError) {
        console.error('❌ Erro na exclusão:', deleteError)
        throw new Error(deleteError.message)
      }
      
      
      // Forçar recarregamento dos agendamentos
      const salonId = userSalon?.id || workplaceSalon?.id
      if (salonId) {
        console.log('🔄 Forçando recarregamento dos agendamentos do salão...')
        
        // Buscar agendamentos diretamente
        const { data: freshData, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            *,
            salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
            client:users!appointments_client_id_fkey(id, name, email, phone, profile_photo),
            professional:users!appointments_professional_id_fkey(id, name, email, profile_photo),
            service:professional_services(id, name, description, duration_minutes, price)
          `)
          .eq('salon_id', salonId)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
        
        if (fetchError) {
          console.error('❌ Erro ao buscar agendamentos atualizados:', fetchError)
        } else {
          // Atualizar o estado diretamente
          setAppointments(freshData || [])
        }
      } else if (user?.id) {
        console.log('🔄 Forçando recarregamento dos agendamentos do profissional independente...')
        
        // Buscar agendamentos do profissional independente
        const { data: freshData, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            *,
            salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
            client:users!appointments_client_id_fkey(id, name, email, phone, profile_photo),
            professional:users!appointments_professional_id_fkey(id, name, email, profile_photo),
            service:professional_services(id, name, description, duration_minutes, price)
          `)
          .eq('professional_id', user.id)
          .order('date', { ascending: true })
          .order('start_time', { ascending: true })
        
        if (fetchError) {
          console.error('❌ Erro ao buscar agendamentos atualizados:', fetchError)
        } else {
          // Atualizar o estado diretamente
          setAppointments(freshData || [])
        }
      }
      
      toast({
        title: 'Agendamento excluído!',
        description: 'O agendamento foi excluído com sucesso.',
        variant: 'default'
      })
      
    } catch (error) {
      console.error('❌ Erro ao excluir agendamento:', error)
      toast({
        title: 'Erro ao excluir agendamento',
        description: error instanceof Error ? error.message : 'Ocorreu um erro inesperado.',
        variant: 'destructive'
      })
    } finally {
      setShowDeleteDialog(false)
      setAppointmentToDelete(null)
    }
  }

  // Verificar se pode acessar a agenda completa
  const canAccessCompleteAgenda = () => {
    if (!user) {
      return false
    }
    
    // Proprietário sempre pode acessar
    if (isOwner) {
      return true
    }
    
    // Profissionais sempre podem acessar (simplificado)
    if (user.user_type === 'profissional') {
      return true
    }
    
    // Usuários com salão podem acessar
    if (userSalon?.id) {
      return true
    }
    
    // Fallback: se chegou até aqui, permitir acesso para usuários logados
    if (user.id) {
      return true
    }
    
    return false
  }

  // Sincronizar estado local com dados do hook
  useEffect(() => {
    setAppointments(originalAppointments)
  }, [originalAppointments])

  // Carregar agendamentos do salão ou do profissional independente
  useEffect(() => {
    const salonId = userSalon?.id || workplaceSalon?.id
    
    if (salonId) {
      // Profissional vinculado a salão - usar fetchSalonAppointments
      if (lastLoadedSalonId !== salonId) {
        setLastLoadedSalonId(salonId)
        fetchSalonAppointments(salonId)
      }
    } else if (user?.id) {
      // Profissional independente - usar fetchAppointments
      if (lastLoadedSalonId !== 'independent') {
        setLastLoadedSalonId('independent')
        fetchAppointments(user.id)
      }
    }
  }, [userSalon?.id, workplaceSalon?.id, user?.id, lastLoadedSalonId, fetchSalonAppointments, fetchAppointments]) // Controle de estado para evitar loops

  // Função para obter a data atual no formato correto
  const getCurrentDate = () => {
    // Usar timezone local para evitar problemas de fuso horário
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const formattedDate = `${year}-${month}-${day}`
    
    return formattedDate
  }

  // Debug reduzido para evitar re-renderizações
  const currentDateStr = getCurrentDate()
  
  // Filtrar agendamentos
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !filters.search || 
      appointment.client?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      appointment.service?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      appointment.professional?.name?.toLowerCase().includes(filters.search.toLowerCase())
    
    // Filtro de datas - usar currentDateStr já calculado
    let matchesDateRange = true
    
    // Se estamos na visualização de lista, usar selectedDate
    if (viewMode === 'list') {
      const appointmentDate = appointment.date
      matchesDateRange = appointmentDate === currentDateStr
    } else {
      // Se estamos no calendário, também usar selectedDate para mostrar apenas agendamentos do dia selecionado
      const appointmentDate = appointment.date
      matchesDateRange = appointmentDate === currentDateStr
      
      // Se houver filtros manuais de data, aplicá-los também
      if (filters.startDate || filters.endDate) {
        if (filters.startDate) {
          matchesDateRange = matchesDateRange && appointmentDate >= filters.startDate
        }
        if (filters.endDate) {
          matchesDateRange = matchesDateRange && appointmentDate <= filters.endDate
        }
      }
    }
    
    // Filtro de profissional baseado nas permissões do usuário
    let matchesProfessional = true
    
    if (isProfessionalWithoutSalon) {
      // Profissional sem salão só vê seus próprios agendamentos
      matchesProfessional = appointment.professional?.id === user?.id
    } else if (selectedProfessional !== 'todos') {
      // Se um profissional específico foi selecionado
      matchesProfessional = appointment.professional?.id === selectedProfessional
    } else if (!canViewAllProfessionals) {
      // Se não pode ver todos os profissionais, só vê os próprios
      matchesProfessional = appointment.professional?.id === user?.id
    }
    
    const matchesStatus = filters.status === 'todos' || 
      appointment.status === filters.status
    
    return matchesSearch && matchesDateRange && matchesProfessional && matchesStatus
  })


  // Obter lista única de profissionais do salão
  const professionals = allProfessionals?.map(prof => prof.id) || []

    // Função para buscar configurações de agenda dos profissionais
  const [agendaConfigs, setAgendaConfigs] = useState<any[]>([])
  const [configsLoading, setConfigsLoading] = useState(false)

  // Buscar configurações de agenda
  const fetchAgendaConfigs = useCallback(async () => {
    if (!userSalon?.id || !allProfessionals?.length) {
      return
    }

    try {
      setConfigsLoading(true)
      
      const professionalIds = allProfessionals.map(p => p.id)
      
      const { data, error } = await supabase
        .from('agenda_config')
        .select('*')
        .eq('salon_id', userSalon.id)
        .in('professional_id', professionalIds)

      if (error) {
        console.error('❌ Erro ao buscar configurações de agenda:', error)
        return
      }

      setAgendaConfigs(data || [])
    } catch (err) {
      console.error('❌ Erro ao buscar configurações:', err)
    } finally {
      setConfigsLoading(false)
    }
  }, [userSalon?.id, allProfessionals])

  // Buscar configurações quando profissionais mudam
  useEffect(() => {
    fetchAgendaConfigs()
  }, [fetchAgendaConfigs])

  // Função para calcular range de horários baseado nas configurações
  const calculateWorkingHours = () => {
    if (!agendaConfigs?.length) {
      // Fallback: horário padrão se não houver configurações
      return { start: '08:00', end: '18:00' }
    }

    let earliestStart = '23:59'
    let latestEnd = '00:00'

    agendaConfigs.forEach(config => {
      if (config.opening_time < earliestStart) {
        earliestStart = config.opening_time
      }
      if (config.closing_time > latestEnd) {
        latestEnd = config.closing_time
      }
    })

    return { start: earliestStart, end: latestEnd }
  }

  // Funções para o layout de calendário
  const generateTimeSlots = () => {
    try {
      const { start, end } = calculateWorkingHours()
      const slots = []
      
      // Converter horários para minutos para facilitar iteração
      const startMinutes = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1])
      const endMinutes = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1])
      
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const hour = Math.floor(minutes / 60)
        const minute = minutes % 60
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
      
      return slots
    } catch (error) {
      console.error('❌ Erro ao gerar slots de horário:', error)
      // Fallback: slots padrão
      return ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00']
    }
  }

  // Funções para navegação de datas
  const goToToday = () => {
    const today = new Date()
    setSelectedDate(today)
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const handleDateChange = (date: string) => {
    // Criar uma nova data no timezone local para evitar problemas de fuso horário
    const [year, month, day] = date.split('-').map(Number)
    const newDate = new Date(year, month - 1, day) // month - 1 porque getMonth() retorna 0-11
    setSelectedDate(newDate)
  }

  // Função para filtrar por profissional
  const handleProfessionalFilter = (professionalId: string) => {
    setSelectedProfessional(professionalId)
  }

  // Função para alternar expansão dos cards
  const toggleCardExpansion = (appointmentId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId)
      } else {
        newSet.add(appointmentId)
      }
      return newSet
    })
  }

  // Função para gerar sugestões de busca
  const generateSearchSuggestions = (searchTerm: string) => {
    if (!searchTerm.trim()) return []
    
    const suggestions = new Set<string>()
    
    // Sugestões de clientes
    if (appointments && appointments.length > 0) {
      appointments.forEach(apt => {
        if (apt.client?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
          suggestions.add(apt.client.name)
        }
      })
    }
    
    // Sugestões de serviços
    if (appointments && appointments.length > 0) {
      appointments.forEach(apt => {
        if (apt.service?.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
          suggestions.add(apt.service.name)
        }
      })
    }
    
    // Sugestões de profissionais
    if (allProfessionals && allProfessionals.length > 0) {
      allProfessionals.forEach(prof => {
        if (prof.name?.toLowerCase().includes(searchTerm.toLowerCase())) {
          suggestions.add(prof.name)
        }
      })
    }
    
    return Array.from(suggestions).slice(0, 5)
  }

  const getAppointmentsForTimeSlot = (timeSlot: string, date: string) => {
    try {
      if (!appointments?.length) {
        return []
      }
      
      // Aplicar filtros baseados nas permissões do usuário
      let filtered = (appointments || []).filter(apt => apt.date === date && apt.start_time?.substring(0, 5) === timeSlot)
      
      // Filtro de profissional baseado nas permissões
      if (isProfessionalWithoutSalon) {
        // Profissional sem salão só vê seus próprios agendamentos
        filtered = filtered.filter(apt => apt.professional?.id === user?.id)
      } else if (selectedProfessional !== 'todos') {
        // Se um profissional específico foi selecionado
        filtered = filtered.filter(apt => apt.professional?.id === selectedProfessional)
      } else if (!canViewAllProfessionals) {
        // Se não pode ver todos os profissionais, só vê os próprios
        filtered = filtered.filter(apt => apt.professional?.id === user?.id)
      }
      
      // Aplicar filtro de busca
      if (filters.search) {
        filtered = filtered.filter(apt => 
          apt.client?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          apt.service?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
          apt.professional?.name?.toLowerCase().includes(filters.search.toLowerCase())
        )
      }
      
      return filtered
    } catch (error) {
      console.error('❌ Erro em getAppointmentsForTimeSlot:', error)
      return []
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 border-blue-200 text-blue-800'
      case 'pending': return 'bg-orange-100 border-orange-200 text-orange-800'
      case 'completed': return 'bg-green-100 border-green-200 text-green-800'
      case 'cancelled': return 'bg-red-100 border-red-200 text-red-800'
      case 'no_show': return 'bg-gray-100 border-gray-200 text-gray-800'
      default: return 'bg-purple-100 border-purple-200 text-purple-800'
    }
  }

  // Função para obter cor baseada no tipo de serviço
  const getServiceColor = (serviceName: string) => {
    const service = serviceName?.toLowerCase() || ''
    
    if (service.includes('corte masculino')) {
      return 'bg-blue-100 border-blue-300 text-blue-800'
    } else if (service.includes('corte feminino')) {
      return 'bg-pink-100 border-pink-300 text-pink-800'
    } else if (service.includes('corte') || service.includes('hair')) {
      return 'bg-indigo-100 border-indigo-300 text-indigo-800'
    } else if (service.includes('limpeza') || service.includes('facial') || service.includes('peeling')) {
      return 'bg-green-100 border-green-300 text-green-800'
    } else if (service.includes('coloração') || service.includes('tintura') || service.includes('pintura')) {
      return 'bg-purple-100 border-purple-300 text-purple-800'
    } else if (service.includes('hidratação') || service.includes('tratamento')) {
      return 'bg-yellow-100 border-yellow-300 text-yellow-800'
    } else if (service.includes('escova') || service.includes('finalização')) {
      return 'bg-rose-100 border-rose-300 text-rose-800'
    } else if (service.includes('manicure') || service.includes('pedicure')) {
      return 'bg-orange-100 border-orange-300 text-orange-800'
    } else {
      return 'bg-gray-100 border-gray-300 text-gray-800'
    }
  }

  // Função para calcular quantos slots um appointment deve ocupar baseado na duração
  const getAppointmentDurationSlots = (appointment: any) => {
    const durationMinutes = appointment.service?.duration || 60
    
    // Calcular quantos slots de 30 minutos o serviço deve ocupar
    // Um serviço de 60 minutos deve ocupar 2 slots (11:30-12:00 e 12:00-12:30)
    const slots = Math.ceil(durationMinutes / 30)
    
    // Calcular slots baseado na duração
    
    return slots
  }

  // Função para calcular o horário final de um appointment
  const getAppointmentEndTime = (appointment: any) => {
    const durationMinutes = appointment.service?.duration || 60
    
    // Calcular o horário final real do serviço
    const startTime = new Date(`2000-01-01T${appointment.start_time}`)
    const endTime = new Date(startTime.getTime() + durationMinutes * 60 * 1000)
    
    // Calcular horário final baseado na duração
    
    return endTime.toTimeString().slice(0, 5)
  }

  // Função para verificar se um appointment deve ser renderizado em um slot específico
  const shouldRenderAppointmentInSlot = (appointment: any, currentTimeSlot: string) => {
    try {
      const appointmentStartTime = appointment.start_time?.substring(0, 5)
      const durationSlots = getAppointmentDurationSlots(appointment)
      
      // Encontrar o índice do slot de início
      const timeSlots = generateTimeSlots()
      const startSlotIndex = timeSlots.indexOf(appointmentStartTime)
      const currentSlotIndex = timeSlots.indexOf(currentTimeSlot)
      
      // Verificar se o slot atual está dentro do intervalo do appointment
      const shouldRender = startSlotIndex <= currentSlotIndex && currentSlotIndex < startSlotIndex + durationSlots
      
      // Verificar se o slot atual está dentro do intervalo do appointment
      
      return shouldRender
    } catch (error) {
      console.error('❌ Erro em shouldRenderAppointmentInSlot:', error)
      return false
    }
  }

  // Nova função para renderizar appointments de forma mais inteligente
  const renderAppointmentInSlot = (appointment: any, timeSlot: string, isFirstSlot: boolean) => {
    try {
      const durationSlots = getAppointmentDurationSlots(appointment)
      const endTime = getAppointmentEndTime(appointment)
      
      // Calcular altura baseada na duração real do serviço
      // Cada slot é de 30 minutos, então multiplicar por 30 para obter a altura em pixels
      const appointmentHeight = Math.max(durationSlots * 30, 50)
      
      // Renderizar appointment com altura calculada
      
      return (
        <div
          key={appointment.id}
          className={`p-2 rounded-md border text-xs mb-1 transition-all cursor-pointer hover:shadow-md ${getServiceColor(appointment.service?.name)} ${
            !isFirstSlot ? 'opacity-60' : ''
          }`}
          onClick={() => handleAppointmentClick(appointment)}
          style={{
            // Ajustar altura baseado na duração real do serviço
            minHeight: isFirstSlot ? `${appointmentHeight}px` : 'auto',
            // Para slots subsequentes, usar altura mínima para manter alinhamento
            height: isFirstSlot ? `${appointmentHeight}px` : '30px'
          }}
          title={`${appointment.service?.name} - ${appointment.start_time?.substring(0, 5)} às ${endTime}`}
        >
          {isFirstSlot && (
            <>
              <div className="flex items-center gap-1 mb-1">
                <Avatar className="w-4 h-4">
                  <AvatarFallback className="text-xs">
                    {appointment.client?.name?.charAt(0) || 'C'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium truncate text-xs">
                  {appointment.client?.name?.split(' ')[0] || 'Cliente'}
                </span>
              </div>
              <div className="text-xs opacity-80 truncate">
                {appointment.service?.name || 'Serviço'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {appointment.start_time?.substring(0, 5)} - {endTime}
              </div>
            </>
          )}
        </div>
      )
    } catch (error) {
      console.error('❌ Erro em renderAppointmentInSlot:', error)
      return (
        <div className="p-2 rounded-md border text-xs mb-1 bg-red-100 text-red-800">
          Erro ao renderizar
        </div>
      )
    }
  }

  // Verificar permissão após todos os hooks
  
  // Simplificar a verificação de permissões - permitir acesso para todos os usuários logados
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Carregando...
              </CardTitle>
              <CardDescription>
                Verificando suas permissões...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
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
        <div className="mb-6">
          <Link to={fromAdmin ? "/area-administrativa" : "/agenda-profissional"} className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromAdmin ? "Voltar para Área Administrativa" : "Voltar para Agenda Profissional"}
          </Link>
          
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Agenda Completa
              </h1>
              <p className="text-muted-foreground">
                {isProfessionalWithoutSalon 
                  ? 'Gerencie sua agenda pessoal' 
                  : canViewAllProfessionals 
                    ? 'Visualize e gerencie todos os agendamentos'
                    : 'Gerencie sua agenda profissional'
                }
              </p>
              
              {/* Indicador de permissões */}
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {isProfessionalWithoutSalon 
                    ? 'Profissional Independente' 
                    : userSalon?.owner_id === user?.id 
                      ? 'Proprietário do Salão'
                      : isEmployee 
                        ? 'Funcionário'
                        : 'Profissional do Salão'
                  }
                </Badge>
                {!canViewAllProfessionals && (
                  <Badge variant="secondary" className="text-xs">
                    Agenda Pessoal
                  </Badge>
                )}
                {canViewAllProfessionals && (
                  <Badge variant="default" className="text-xs">
                    Agenda Completa
                  </Badge>
                )}
              </div>
            </div>
            {hasPermission('appointments.create') && (
              <Button asChild>
                <Link to="/novo-agendamento">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Link>
              </Button>
            )}
          </div>

          {/* Mobile Header */}
          <div className="md:hidden space-y-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Agenda Completa
              </h1>
              <p className="text-sm text-muted-foreground">
                {isProfessionalWithoutSalon 
                  ? 'Gerencie sua agenda pessoal' 
                  : canViewAllProfessionals 
                    ? 'Visualize e gerencie todos os agendamentos'
                    : 'Gerencie sua agenda profissional'
                }
              </p>
              
              {/* Indicador de permissões mobile */}
              <div className="flex flex-wrap items-center gap-1 mt-2">
                <Badge variant="outline" className="text-xs">
                  {isProfessionalWithoutSalon 
                    ? 'Profissional Independente' 
                    : userSalon?.owner_id === user?.id 
                      ? 'Proprietário'
                      : isEmployee 
                        ? 'Funcionário'
                        : 'Profissional'
                  }
                </Badge>
                {!canViewAllProfessionals && (
                  <Badge variant="secondary" className="text-xs">
                    Agenda Pessoal
                  </Badge>
                )}
                {canViewAllProfessionals && (
                  <Badge variant="default" className="text-xs">
                    Agenda Completa
                  </Badge>
                )}
              </div>
            </div>
            {hasPermission('appointments.create') && (
              <Button asChild className="w-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0 shadow-lg">
                <Link to="/novo-agendamento">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Link>
              </Button>
            )}
          </div>
        </div>



        {/* Controles de Layout */}
        <div className="mb-4">
          {/* Desktop: Layout horizontal */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Agendamentos</h2>
              <Badge variant="secondary" className="text-xs">
                {appointmentsLoading ? 'Carregando...' : `${filteredAppointments.length} encontrados`}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 ${
                  viewMode === 'calendar' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg' 
                    : 'bg-white border border-gray-200'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Calendário
              </Button>
            </div>
          </div>

          {/* Mobile: Layout vertical */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Agendamentos</h2>
              <Badge variant="secondary" className="text-xs">
                {appointmentsLoading ? 'Carregando...' : `${filteredAppointments.length} encontrados`}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 flex-1 ${
                  viewMode === 'list' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg' 
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                <List className="h-4 w-4" />
                Lista
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-2 flex-1 ${
                  viewMode === 'calendar' 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg' 
                    : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
                Calendário
              </Button>
            </div>
          </div>
        </div>

        {/* Layout de Lista */}
        {viewMode === 'list' && (
          <Card>
            {/* Navegação de Datas e Busca para Lista */}
            <div className="p-4 border-b bg-muted/30">
              {/* Desktop */}
              <div className="hidden md:block space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="font-medium"
                      onClick={goToToday}
                    >
                      HOJE
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={goToPreviousDay}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Input
                        type="date"
                        value={selectedDate.toISOString().split('T')[0]}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="w-auto text-sm"
                      />
                      <Button variant="ghost" size="sm" onClick={goToNextDay}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {/* Filtro de profissionais - só mostrar se o usuário pode ver todos */}
                  {canViewAllProfessionals && (allProfessionals || []).length > 0 && (
                    <Select value={selectedProfessional} onValueChange={handleProfessionalFilter}>
                      <SelectTrigger className="w-auto min-w-[150px]">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {(allProfessionals || [])?.map(prof => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  
                  {/* Indicador de permissões para usuários sem acesso a todos os profissionais */}
                  {!canViewAllProfessionals && (
                    <div className="text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-md">
                      {isProfessionalWithoutSalon 
                        ? 'Sua agenda pessoal' 
                        : 'Sua agenda profissional'
                      }
                    </div>
                  )}
                </div>
                
                {/* Busca */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Buscar por cliente, serviço, profissional..." 
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => {
                      const value = e.target.value
                      setFilters(prev => ({ ...prev, search: value }))
                      setSearchSuggestions(generateSearchSuggestions(value))
                      setShowSuggestions(value.length > 0)
                    }}
                    onFocus={() => setShowSuggestions(filters.search.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  
                  {/* Sugestões de Autopreenchimento */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => {
                            setFilters(prev => ({ ...prev, search: suggestion }))
                            setShowSuggestions(false)
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile */}
              <div className="md:hidden space-y-3">
                <div className="flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="font-medium text-xs"
                    onClick={goToToday}
                  >
                    HOJE
                  </Button>
                  <Input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-auto text-xs h-8"
                  />
                                          {/* Filtro de profissionais mobile - só mostrar se o usuário pode ver todos */}
                        {canViewAllProfessionals && (allProfessionals || []).length > 0 ? (
                    <Select value={selectedProfessional} onValueChange={handleProfessionalFilter}>
                      <SelectTrigger className="w-auto text-xs h-8">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {(allProfessionals || [])?.map(prof => (
                          <SelectItem key={prof.id} value={prof.id}>
                            {prof.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded text-center">
                      {isProfessionalWithoutSalon 
                        ? 'Sua agenda' 
                        : 'Sua agenda'
                      }
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={goToPreviousDay}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={goToNextDay}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Busca no Mobile */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    placeholder="Buscar agendamentos..." 
                    className="pl-10 h-9 text-sm"
                    value={filters.search}
                    onChange={(e) => {
                      const value = e.target.value
                      setFilters(prev => ({ ...prev, search: value }))
                      setSearchSuggestions(generateSearchSuggestions(value))
                      setShowSuggestions(value.length > 0)
                    }}
                    onFocus={() => setShowSuggestions(filters.search.length > 0)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  
                  {/* Sugestões de Autopreenchimento */}
                  {showSuggestions && searchSuggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                      {searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                          onClick={() => {
                            setFilters(prev => ({ ...prev, search: suggestion }))
                            setShowSuggestions(false)
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <CardContent className="p-0">
              {appointmentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Carregando agendamentos...</div>
                </div>
              ) : filteredAppointments.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                    <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAppointments.map((appointment) => {
                    const isExpanded = expandedCards.has(appointment.id)
                    
                    return (
                      <div key={appointment.id} className="bg-card border rounded-lg transition-colors">
                        {/* Card Compacto - Sempre Visível */}
                        <div 
                          className="p-3 cursor-pointer"
                          onClick={() => toggleCardExpansion(appointment.id)}
                        >
                          <div className="flex items-center gap-3">
                            {/* Barra colorida lateral */}
                            <div className={`w-1 h-12 rounded-full ${getStatusColor(appointment.status).replace('bg-', 'bg-').replace('border-', 'border-')}`}></div>
                            
                            {/* Horário */}
                            <div className="text-center min-w-[60px] flex-shrink-0">
                              <div className="font-semibold text-primary text-sm">
                                {appointment.start_time.substring(0, 5)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {appointment.date.split('-').slice(1).reverse().join('/')}
                              </div>
                            </div>
                            
                            {/* Cliente e Status */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold truncate">
                                  {appointment.client?.name?.split(' ')[0] || 'Cliente'}
                                </h4>
                                <Badge variant={
                                  appointment.status === "confirmed" ? "secondary" :
                                  appointment.status === "pending" ? "outline" :
                                  appointment.status === "completed" ? "default" :
                                  appointment.status === "cancelled" ? "destructive" : "secondary"
                                } className="flex-shrink-0 text-xs">
                                  {appointment.status === "pending" ? "Pendente" :
                                   appointment.status === "confirmed" ? "Confirmado" :
                                   appointment.status === "completed" ? "Concluído" :
                                   appointment.status === "cancelled" ? "Cancelado" :
                                   appointment.status === "no_show" ? "Não Compareceu" : appointment.status}
                                </Badge>
                              </div>
                            </div>
                            
                            {/* Ícone de expansão */}
                            <div className="flex-shrink-0">
                              <ChevronDown 
                                className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                              />
                            </div>
                          </div>
                        </div>
                        
                        {/* Detalhes Expandidos */}
                        {isExpanded && (
                          <div className="px-3 pb-3 border-t bg-muted/20">
                            <div className="pt-3 space-y-3">
                              {/* Avatar e Informações Detalhadas */}
                              <div className="flex items-start gap-3">
                                <Avatar className="w-12 h-12 flex-shrink-0">
                                  <AvatarImage src={appointment.client?.profile_photo} />
                                  <AvatarFallback className="text-sm">
                                    {appointment.client?.name?.charAt(0) || 'C'}
                                  </AvatarFallback>
                                </Avatar>
                                
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-semibold text-sm mb-1">
                                    {appointment.client?.name || 'Cliente não informado'}
                                  </h5>
                                  <p className="text-sm text-muted-foreground mb-1">
                                    {appointment.service?.name || 'Serviço não informado'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    com {appointment.professional?.name || 'Profissional não informado'}
                                  </p>
                                </div>
                                
                                {/* Preço */}
                                <div className="text-right flex-shrink-0">
                                  <div className="font-semibold text-primary text-lg">
                                    R$ {appointment.price?.toFixed(2).replace('.', ',') || '0,00'}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Ações */}
                              <div className="flex gap-2 pt-2 border-t">
                                <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="flex-1"
                                  onClick={() => {
                                    setSelectedAppointmentForWhatsApp(appointment)
                                    setShowWhatsAppModal(true)
                                  }}
                                >
                                  <MessageSquare className="h-4 w-4 mr-2" />
                                  WhatsApp
                                </Button>
                                
                                {appointment.status === 'pending' && hasPermission('appointments.edit') && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => handleConfirmAppointment(appointment.id)}
                                  >
                                    Confirmar
                                  </Button>
                                )}
                                
                                {hasPermission('appointments.edit') && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1"
                                    onClick={() => handleEditAppointment(appointment)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </Button>
                                )}
                                
                                {appointment.status !== 'cancelled' && hasPermission('appointments.cancel') && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="flex-1 text-destructive"
                                    onClick={() => handleCancelAppointment(appointment.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Layout de Calendário */}
        {viewMode === 'calendar' && (
          <Card>
            <CardContent className="p-0">
              {/* Controles do Calendário - Sempre visíveis */}
              <div className="p-4 border-b bg-muted/30">
                    {/* Desktop */}
                    <div className="hidden md:flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="font-medium"
                          onClick={goToToday}
                        >
                          HOJE
                        </Button>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={goToPreviousDay}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={goToNextDay}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                        <Input
                          type="date"
                          value={selectedDate.toISOString().split('T')[0]}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-auto text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Filtro de profissionais no calendário - só mostrar se o usuário pode ver todos */}
                        {canViewAllProfessionals && (allProfessionals || []).length > 0 ? (
                          <Select value={selectedProfessional} onValueChange={handleProfessionalFilter}>
                            <SelectTrigger className="w-auto">
                              <SelectValue placeholder="Todos os profissionais" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos os profissionais</SelectItem>
                              {(allProfessionals || [])?.map(prof => (
                                <SelectItem key={prof.id} value={prof.id}>
                                  {prof.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-sm text-muted-foreground px-3 py-2 bg-muted/50 rounded-md">
                            {isProfessionalWithoutSalon 
                              ? 'Sua agenda pessoal' 
                              : 'Sua agenda profissional'
                            }
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Mobile */}
                    <div className="md:hidden space-y-3">
                      <div className="flex items-center justify-between">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="font-medium text-xs"
                          onClick={goToToday}
                        >
                          HOJE
                        </Button>
                        <Input
                          type="date"
                          value={selectedDate.toISOString().split('T')[0]}
                          onChange={(e) => handleDateChange(e.target.value)}
                          className="w-auto text-xs h-8"
                        />
                        {/* Filtro de profissionais mobile no calendário - só mostrar se o usuário pode ver todos */}
                        {canViewAllProfessionals && (allProfessionals || []).length > 0 ? (
                          <Select value={selectedProfessional} onValueChange={handleProfessionalFilter}>
                            <SelectTrigger className="w-auto text-xs h-8">
                              <SelectValue placeholder="Todos" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todos">Todos</SelectItem>
                              {(allProfessionals || [])?.map(prof => (
                                <SelectItem key={prof.id} value={prof.id}>
                                  {prof.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded text-center">
                            {isProfessionalWithoutSalon 
                              ? 'Sua agenda' 
                              : 'Sua agenda'
                            }
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={goToPreviousDay}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={goToNextDay}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Busca no Calendário */}
                      <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input 
                          placeholder="Buscar agendamentos..." 
                          className="pl-10 h-9 text-sm"
                          value={filters.search}
                          onChange={(e) => {
                            const value = e.target.value
                            setFilters(prev => ({ ...prev, search: value }))
                            setSearchSuggestions(generateSearchSuggestions(value))
                            setShowSuggestions(value.length > 0)
                          }}
                          onFocus={() => setShowSuggestions(filters.search.length > 0)}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                        />
                        
                        {/* Sugestões de Autopreenchimento */}
                        {showSuggestions && searchSuggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                            {searchSuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                onClick={() => {
                                  setFilters(prev => ({ ...prev, search: suggestion }))
                                  setShowSuggestions(false)
                                }}
                              >
                                {suggestion}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Conteúdo do Calendário - Condicional */}
                  {appointmentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-muted-foreground">Carregando agendamentos...</div>
                    </div>
                  ) : filteredAppointments.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                        <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {/* Versão Desktop - Layout por Profissionais */}
                  <div className="hidden lg:block">
                    <div className="overflow-x-auto">
                      <div className="min-w-[1200px]">
                        {/* Cabeçalho com profissionais */}
                        <div className="grid grid-cols-[120px_repeat(auto-fit,minmax(180px,1fr))] gap-0 border-b bg-white">
                          <div className="p-3 font-medium text-sm border-r bg-gray-50 flex items-center justify-center">
                            Horário
                          </div>
                          {(selectedProfessional === 'todos' ? (allProfessionals || []) : (allProfessionals || [])?.filter(p => p.id === selectedProfessional))?.map((professional) => (
                            <div key={professional.id} className="p-3 text-center border-r bg-gray-50">
                              <div className="flex flex-col items-center gap-2">
                                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                  <AvatarImage src={professional.profile_photo} />
                                  <AvatarFallback className="text-sm font-medium">
                                    {professional.name?.charAt(0) || 'P'}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="font-medium text-sm text-gray-700">
                                  {professional.name || 'Profissional'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Grade de horários por profissional */}
                        <div className="divide-y divide-gray-200 relative">
                          {/* Linha do horário atual */}
                          {(() => {
                            const now = new Date()
                            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
                            const currentSlot = generateTimeSlots().find(slot => slot >= currentTime)
                            if (currentSlot) {
                              const slotIndex = generateTimeSlots().indexOf(currentSlot)
                              return (
                                <div 
                                  className="absolute left-0 right-0 bg-red-500 h-0.5 z-10"
                                  style={{ top: `${slotIndex * 30}px` }}
                                />
                              )
                            }
                            return null
                          })()}
                          
                          {generateTimeSlots().map((timeSlot) => (
                            <div key={timeSlot} className="grid grid-cols-[120px_repeat(auto-fit,minmax(180px,1fr))] gap-0 min-h-[30px] relative">
                              <div className="p-2 text-sm text-gray-600 border-r bg-gray-50 flex items-center justify-center font-medium h-full">
                                {timeSlot}
                              </div>
                                                            {(selectedProfessional === 'todos' ? (allProfessionals || []) : (allProfessionals || [])?.filter(p => p.id === selectedProfessional))?.map((professional) => {
                                // Buscar todos os appointments do profissional para esta data
                                const allProfessionalAppointments = getAppointmentsForTimeSlot(timeSlot, currentDateStr).filter(apt => 
                                  apt.professional?.id === professional.id
                                )
                                
                                // Filtrar apenas os appointments que devem ser renderizados neste slot específico
                                const appointmentsToRender = allProfessionalAppointments.filter(appointment => {
                                  return shouldRenderAppointmentInSlot(appointment, timeSlot)
                                })
                                
                                return (
                                  <div key={professional.id} className="p-1 border-r min-h-[30px] bg-white relative">
                                    {appointmentsToRender.map((appointment) => {
                                      const isFirstSlot = appointment.start_time?.substring(0, 5) === timeSlot
                                      const durationSlots = getAppointmentDurationSlots(appointment)
                                      const endTime = getAppointmentEndTime(appointment)
                                      
                                      // Se for o primeiro slot, renderizar com altura completa
                                      if (isFirstSlot) {
                                        const appointmentHeight = Math.max(durationSlots * 30, 50)
                                        
                                        return (
                                          <div
                                            key={appointment.id}
                                            className={`p-2 rounded-md border text-xs mb-1 transition-all cursor-pointer hover:shadow-md ${getServiceColor(appointment.service?.name)}`}
                                            onClick={() => handleAppointmentClick(appointment)}
                                            style={{
                                              minHeight: `${appointmentHeight}px`,
                                              height: `${appointmentHeight}px`
                                            }}
                                            title={`${appointment.service?.name} - ${appointment.start_time?.substring(0, 5)} às ${endTime}`}
                                          >
                                            <div className="flex items-center gap-1 mb-1">
                                              <Avatar className="w-4 h-4">
                                                <AvatarImage src={appointment.client?.profile_photo} />
                                                <AvatarFallback className="text-xs">
                                                  {appointment.client?.name?.charAt(0) || 'C'}
                                                </AvatarFallback>
                                              </Avatar>
                                              <span className="font-medium truncate text-xs">
                                                {appointment.client?.name?.split(' ')[0] || 'Cliente'}
                                            </span>
                                            </div>
                                            <div className="text-xs opacity-80 truncate">
                                              {appointment.service?.name || 'Serviço'}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                              {appointment.start_time?.substring(0, 5)} - {endTime}
                                            </div>
                                          </div>
                                        )
                                      } else {
                                        // Para slots subsequentes, renderizar apenas um indicador visual
                                        return (
                                          <div
                                            key={appointment.id}
                                            className={`p-1 rounded border text-xs transition-all cursor-pointer hover:shadow-sm ${getServiceColor(appointment.service?.name)} opacity-60`}
                                            onClick={() => handleAppointmentClick(appointment)}
                                            style={{
                                              height: '30px'
                                            }}
                                            title={`Continuação: ${appointment.service?.name}`}
                                          />
                                        )
                                      }
                                    })}
                                  </div>
                                )
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Versão Mobile - Layout em Grid Compacto */}
                  <div className="lg:hidden">
                    <div className="relative">
                      {/* Coluna de horários fixa */}
                      <div className="absolute left-0 top-0 z-20 bg-white border-r border-gray-200 w-20">
                        {/* Cabeçalho fixo */}
                        <div className="p-2 font-medium text-xs bg-gray-50 flex items-center justify-center h-24 border-b">
                          Hora
                        </div>
                        {/* Horários fixos */}
                        <div className="divide-y divide-gray-200">
                          {generateTimeSlots().map((timeSlot) => (
                            <div key={timeSlot} className="p-1 text-xs text-gray-600 bg-gray-50 flex items-center justify-center font-medium h-12 border-b border-gray-200">
                              {timeSlot}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {/* Conteúdo com scroll horizontal */}
                      <div className="overflow-x-auto ml-20">
                        <div className="min-w-[500px]">
                          {/* Cabeçalho com profissionais */}
                          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-0 border-b bg-white h-24">
                            {(selectedProfessional === 'todos' ? (allProfessionals || []) : (allProfessionals || [])?.filter(p => p.id === selectedProfessional))?.map((professional) => (
                              <div key={professional.id} className="p-2 text-center border-r bg-gray-50">
                                <div className="flex flex-col items-center gap-1">
                                  <Avatar className="w-8 h-8 border border-white shadow-sm">
                                    <AvatarImage src={professional.profile_photo} />
                                    <AvatarFallback className="text-xs font-medium">
                                      {professional.name?.charAt(0) || 'P'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="font-medium text-xs text-gray-700 truncate w-full">
                                    {professional.name?.split(' ')[0] || 'Prof'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Grade de horários compacta */}
                          <div className="relative">
                            {/* Linha do horário atual */}
                            {(() => {
                              const now = new Date()
                              const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
                              const currentSlot = generateTimeSlots().find(slot => slot >= currentTime)
                              if (currentSlot) {
                                const slotIndex = generateTimeSlots().indexOf(currentSlot)
                                return (
                                  <div 
                                    className="absolute left-0 right-0 bg-red-500 h-0.5 z-10"
                                    style={{ top: `${slotIndex * 48}px` }}
                                  />
                                )
                              }
                              return null
                            })()}
                            
                                                        {generateTimeSlots().map((timeSlot) => (
                              <div key={timeSlot} className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-0 h-12 border-b border-gray-200">
                                {(selectedProfessional === 'todos' ? (allProfessionals || []) : (allProfessionals || [])?.filter(p => p.id === selectedProfessional))?.map((professional) => {
                                  // Buscar todos os appointments do profissional para esta data
                                  const allProfessionalAppointments = getAppointmentsForTimeSlot(timeSlot, currentDateStr).filter(apt => 
                                    apt.professional?.id === professional.id
                                  )
                                  
                                  // Filtrar apenas os appointments que devem ser renderizados neste slot específico
                                  const appointmentsToRender = allProfessionalAppointments.filter(appointment => {
                                    return shouldRenderAppointmentInSlot(appointment, timeSlot)
                                  })
                                  
                                  return (
                                    <div key={professional.id} className="p-0.5 border-r border-b border-gray-200 h-12 bg-white relative">
                                      {appointmentsToRender.map((appointment) => {
                                        const isFirstSlot = appointment.start_time?.substring(0, 5) === timeSlot
                                        const durationSlots = getAppointmentDurationSlots(appointment)
                                        const endTime = getAppointmentEndTime(appointment)
                                        
                                        // Se for o primeiro slot, renderizar com altura completa
                                        if (isFirstSlot) {
                                          const appointmentHeight = Math.max(durationSlots * 24, 48) // 24px por slot (h-6), mínimo 48px
                                          
                                          return (
                                            <div
                                              key={appointment.id}
                                              className={`p-1 rounded border text-xs transition-all cursor-pointer hover:shadow-sm ${getServiceColor(appointment.service?.name)}`}
                                              onClick={() => handleAppointmentClick(appointment)}
                                              style={{
                                                minHeight: `${appointmentHeight}px`,
                                                height: `${appointmentHeight}px`
                                              }}
                                              title={`${appointment.service?.name} - ${appointment.start_time?.substring(0, 5)} às ${endTime}`}
                                            >
                                              <div className="flex items-center gap-1 mb-1">
                                                <Avatar className="w-3 h-3">
                                                  <AvatarImage src={appointment.client?.profile_photo} />
                                                  <AvatarFallback className="text-xs">
                                                    {appointment.client?.name?.charAt(0) || 'C'}
                                                  </AvatarFallback>
                                                </Avatar>
                                                <span className="font-medium truncate text-xs">
                                                  {appointment.client?.name?.split(' ')[0] || 'Cliente'}
                                                </span>
                                              </div>
                                              <div className="text-xs opacity-80 truncate">
                                                {appointment.service?.name?.split(' ')[0] || 'Serviço'}
                                              </div>
                                              <div className="text-xs text-muted-foreground mt-1">
                                                {appointment.start_time?.substring(0, 5)} - {endTime}
                                              </div>
                                            </div>
                                          )
                                        } else {
                                          // Para slots subsequentes, renderizar apenas um indicador visual
                                          return (
                                            <div
                                              key={appointment.id}
                                              className={`p-1 rounded border text-xs transition-all cursor-pointer hover:shadow-sm ${getServiceColor(appointment.service?.name)} opacity-60`}
                                              onClick={() => handleAppointmentClick(appointment)}
                                              style={{
                                                height: '48px'
                                              }}
                                              title={`Continuação: ${appointment.service?.name}`}
                                            />
                                          )
                                        }
                                      })}
                                    </div>
                                  )
                                })}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Detalhes do Agendamento */}
        <AlertDialog open={!!expandedAppointment} onOpenChange={(open) => !open && setExpandedAppointment(null)}>
          <AlertDialogContent className="w-[95vw] max-w-2xl mx-4">
            {selectedAppointmentDetails && (
              <div className="space-y-4">
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Detalhes do Agendamento
                  </AlertDialogTitle>
                </AlertDialogHeader>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Informações do Cliente */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selectedAppointmentDetails.client?.profile_photo} />
                        <AvatarFallback className="text-lg">
                          {selectedAppointmentDetails.client?.name?.charAt(0) || 'C'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedAppointmentDetails.client?.name || 'Cliente'}</h3>
                        <p className="text-sm text-muted-foreground">{selectedAppointmentDetails.client?.phone || 'Telefone não informado'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informações do Profissional */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={selectedAppointmentDetails.professional?.profile_photo} />
                        <AvatarFallback className="text-lg">
                          {selectedAppointmentDetails.professional?.name?.charAt(0) || 'P'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{selectedAppointmentDetails.professional?.name || 'Profissional'}</h3>
                        <p className="text-sm text-muted-foreground">Profissional responsável</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalhes do Serviço */}
                <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Detalhes do Serviço
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Serviço</p>
                      <p className="font-semibold">{selectedAppointmentDetails.service?.name || 'Serviço não informado'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Data e Hora</p>
                      <p className="font-semibold">
                        {new Date(selectedAppointmentDetails.date).toLocaleDateString('pt-BR')} das {selectedAppointmentDetails.start_time?.substring(0, 5)} às {selectedAppointmentDetails.end_time?.substring(0, 5)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Valor</p>
                      <p className="font-semibold text-green-600">
                        R$ {selectedAppointmentDetails.price?.toFixed(2).replace('.', ',') || '0,00'}
                      </p>
                    </div>
                  </div>
                  {selectedAppointmentDetails.notes && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Observações</p>
                      <p className="text-sm">{selectedAppointmentDetails.notes}</p>
                    </div>
                  )}
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Status:</p>
                  <Badge variant={
                    selectedAppointmentDetails.status === "confirmed" ? "secondary" :
                    selectedAppointmentDetails.status === "pending" ? "outline" :
                    selectedAppointmentDetails.status === "completed" ? "default" :
                    selectedAppointmentDetails.status === "cancelled" ? "destructive" : "secondary"
                  }>
                    {selectedAppointmentDetails.status === "pending" ? "Pendente" :
                     selectedAppointmentDetails.status === "confirmed" ? "Confirmado" :
                     selectedAppointmentDetails.status === "completed" ? "Concluído" :
                     selectedAppointmentDetails.status === "cancelled" ? "Cancelado" :
                     selectedAppointmentDetails.status === "no_show" ? "Não Compareceu" : selectedAppointmentDetails.status}
                  </Badge>
                </div>

                {/* Ações */}
                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                  <Button
                    onClick={() => {
                      setSelectedAppointmentForWhatsApp(selectedAppointmentDetails)
                      setShowWhatsAppModal(true)
                    }}
                    className="flex-1"
                    variant="outline"
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    WhatsApp
                  </Button>
                  <Button
                    onClick={() => handleSendReminder(selectedAppointmentDetails.id)}
                    className="flex-1"
                    variant="outline"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Enviar Lembrete
                  </Button>
                  <Button
                    onClick={() => {
                      setExpandedAppointment(null)
                      handleEditAppointment(selectedAppointmentDetails)
                    }}
                    className="flex-1"
                    variant="outline"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  {selectedAppointmentDetails.status !== 'cancelled' && hasPermission('appointments.cancel') && (
                    <Button
                      onClick={() => {
                        setExpandedAppointment(null)
                        handleCancelAppointment(selectedAppointmentDetails.id)
                      }}
                      className="flex-1"
                      variant="destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  )}
                </div>
                
                {/* Botão Fechar */}
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setExpandedAppointment(null)}>
                    Fechar
                  </AlertDialogCancel>
                </AlertDialogFooter>
              </div>
            )}
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Edição de Agendamento */}
        <AlertDialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <AlertDialogContent className="w-[95vw] max-w-2xl mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Editar Agendamento
              </AlertDialogTitle>
            </AlertDialogHeader>
            
            {editingAppointment && (
              <div className="space-y-4">
                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={editFormData.status} 
                    onValueChange={(value) => setEditFormData(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="confirmed">Confirmado</SelectItem>
                      <SelectItem value="completed">Concluído</SelectItem>
                      <SelectItem value="cancelled">Cancelado</SelectItem>
                      <SelectItem value="no_show">Não Compareceu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <Label htmlFor="date">Data</Label>
                  <Input
                    type="date"
                    value={editFormData.date}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
                  />
                </div>

                {/* Horário de Início */}
                <div className="space-y-2">
                  <Label htmlFor="start_time">Horário de Início</Label>
                  <Input
                    type="time"
                    value={editFormData.start_time}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>

                {/* Horário de Fim */}
                <div className="space-y-2">
                  <Label htmlFor="end_time">Horário de Fim</Label>
                  <Input
                    type="time"
                    value={editFormData.end_time}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, end_time: e.target.value }))}
                  />
                </div>

                {/* Observações */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações</Label>
                  <Input
                    value={editFormData.notes}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Observações sobre o agendamento..."
                  />
                </div>

                {/* Informações do Cliente e Serviço (Somente Leitura) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Cliente</p>
                    <p className="font-semibold">{editingAppointment.client?.name || 'Cliente'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Serviço</p>
                    <p className="font-semibold">{editingAppointment.service?.name || 'Serviço'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Botões de Ação */}
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel onClick={handleCloseEdit} className="w-full sm:w-auto">
                Cancelar
              </AlertDialogCancel>
              <Button
                onClick={handleSaveEdit}
                disabled={editLoading || !editFormData.status}
                className="w-full sm:w-auto bg-gradient-primary hover:bg-gradient-primary/90 text-white"
              >
                {editLoading ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal de Confirmação de Exclusão */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent className="w-[90vw] max-w-md mx-4">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Trash2 className="h-4 w-4 sm:h-5 sm:w-5 text-destructive" />
                Confirmar Exclusão
              </AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Tem certeza que deseja <strong>EXCLUIR</strong> este agendamento?
                <br />
                <span className="text-xs sm:text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita e o agendamento será removido permanentemente.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel className="w-full sm:w-auto">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteAppointment}
                className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir Agendamento
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Modal WhatsApp */}
        <WhatsAppTemplateSelector
          isOpen={showWhatsAppModal}
          onClose={() => {
            setShowWhatsAppModal(false)
            setSelectedAppointmentForWhatsApp(null)
          }}
          appointment={selectedAppointmentForWhatsApp}
          onSend={() => {
            console.log('✅ WhatsApp enviado com sucesso')
          }}
        />
      </div>
    </div>
  )
}

export default AgendaCompleta;