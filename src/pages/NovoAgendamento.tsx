import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, ArrowLeft, Search, Check, ChevronDown, Package } from "lucide-react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { Header } from "@/components/Header"
import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useAppointments } from "@/hooks/useAppointments"
import { useSalons } from "@/hooks/useSalons"
import { useAuthContext } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { TimeSlotSelector } from "@/components/TimeSlotSelector"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const NovoAgendamento = () => {
  console.log('NovoAgendamento - Componente iniciado')

  // Estados do formulário
  const [formData, setFormData] = useState({
    cliente: '',
    telefone: '',
    servico: '',
    profissional: '',
    data: '',
    horario: '',
    observacoes: ''
  })

  // Hooks
  const { user } = useAuthContext()
  console.log('NovoAgendamento - User:', user?.id)
  
  const { userSalon } = useSalons(user?.id)
  console.log('NovoAgendamento - UserSalon:', userSalon?.id)
  
  const { createAppointment } = useAppointments()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Detectar se veio da Área Administrativa
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'

  // Estados para loading
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para profissionais
  const [profissionais, setProfissionais] = useState<any[]>([])
  const [loadingProfissionais, setLoadingProfissionais] = useState(false)
  const [showProfissionaisDropdown, setShowProfissionaisDropdown] = useState(false)

  // Refs
  const clientesDropdownRef = useRef<HTMLDivElement>(null)

  // Inicializar profissional com o usuário atual se ele for profissional
  useEffect(() => {
    if (user?.user_type === 'profissional' && userSalon?.id) {
      setFormData(prev => ({ ...prev, profissional: user.id }))
    }
  }, [user?.id, user?.user_type, userSalon?.id])

  // Auto-selecionar profissional quando há apenas um disponível
  useEffect(() => {
    if (profissionais.length === 1 && user?.user_type === 'profissional' && !formData.profissional) {
      const unicoProfissional = profissionais[0]
      if (unicoProfissional.id === user.id) {
        setFormData(prev => ({ ...prev, profissional: user.id }))
        console.log('✅ Auto-selecionando profissional único:', user.name)
      }
    }
  }, [profissionais, user?.id, user?.user_type, formData.profissional])

  // Estado para horário selecionado
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('')

  // Estado para modal de confirmação
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  // Estados para autocomplete de clientes
  const [clientes, setClientes] = useState<any[]>([])
  const [clientesFiltrados, setClientesFiltrados] = useState<any[]>([])
  const [showClientesDropdown, setShowClientesDropdown] = useState(false)
  const [clienteSelecionado, setClienteSelecionado] = useState<any>(null)
  const [loadingClientes, setLoadingClientes] = useState(false)

  // Estados para serviços
  const [servicos, setServicos] = useState<any[]>([])
  const [loadingServicos, setLoadingServicos] = useState(false)

  // Estados para validação
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Scroll para o topo quando a página carregar
  useEffect(() => {
    console.log('NovoAgendamento - useEffect scroll')
    window.scrollTo(0, 0)
  }, [])

  // Carregar clientes do banco de dados
  useEffect(() => {
    console.log('NovoAgendamento - useEffect clientes')
    const fetchClientes = async () => {
      try {
        setLoadingClientes(true)
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, phone, profile_photo')
          .order('name')

        if (error) throw error
        setClientes(data || [])
        console.log('NovoAgendamento - Clientes carregados:', data?.length)
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      } finally {
        setLoadingClientes(false)
      }
    }

    fetchClientes()
  }, [])

  // Carregar serviços baseados no profissional selecionado
  useEffect(() => {
    if (!userSalon?.id || !formData.profissional) {
      setServicos([])
      return
    }

    console.log('NovoAgendamento - Carregando serviços para profissional:', formData.profissional)
    const fetchServicos = async () => {
      try {
        setLoadingServicos(true)
        
        // Limpar serviço selecionado quando mudar o profissional
        if (formData.servico) {
          setFormData(prev => ({ ...prev, servico: '' }))
        }
        
        const query = supabase
          .from('professional_services')
          .select('id, name, description, duration_minutes, price, category, professional_id')
          .eq('is_active', true)
          .eq('salon_id', userSalon.id)
          .eq('professional_id', formData.profissional) // Filtrar por profissional selecionado
          .order('name')
        
        const { data, error } = await query

        if (error) throw error
        setServicos(data || [])
        console.log('NovoAgendamento - Serviços carregados para profissional:', data?.length)
      } catch (error) {
        console.error('Erro ao carregar serviços:', error)
      } finally {
        setLoadingServicos(false)
      }
    }

    fetchServicos()
  }, [userSalon?.id, formData.profissional])

  // Carregar profissionais do salão
  useEffect(() => {
    if (!userSalon?.id) return
    
    const fetchProfissionais = async () => {
      try {
        setLoadingProfissionais(true)
        console.log('NovoAgendamento - Carregando profissionais do salão:', userSalon.id)
        
        // VERIFICAR SE O USUÁRIO É DONO DO SALÃO
        const isUserOwner = userSalon.owner_id === user?.id
        
        if (isUserOwner) {
          // SE É DONO: Buscar todos os profissionais ativos do salão
          console.log('NovoAgendamento - Usuário é dono, buscando profissionais ativos do salão')
          
          // Buscar profissionais ativos vinculados ao salão
          const { data: salonProfessionals, error: salonError } = await supabase
            .from('salon_professionals')
            .select(`
              professional_id,
              professional:users!salon_professionals_professional_id_fkey(
                id,
                name,
                email,
                profile_photo,
                user_type,
                agenda_enabled
              )
            `)
            .eq('salon_id', userSalon.id)
            .eq('status', 'accepted')
            .eq('professional.agenda_enabled', true) // ✅ Filtrar apenas com agenda ativa
        
          if (salonError) {
            console.error('Erro ao carregar profissionais do salão:', salonError)
            return
          }
          
          // Processar dados dos profissionais
          let profissionaisData = salonProfessionals
            ?.filter(item => item.professional)
            .map(item => item.professional)
            .filter(Boolean) || []
          
          // Adicionar o dono do salão se ele for profissional e tiver agenda ativa
          if (userSalon.owner && userSalon.owner.user_type === 'profissional') {
            const ownerExists = profissionaisData.some((prof: any) => prof.id === userSalon.owner_id)
            if (!ownerExists) {
              // Verificar se o dono tem agenda ativa
              const { data: ownerData } = await supabase
                .from('users')
                .select('id, name, email, profile_photo, user_type, agenda_enabled')
                .eq('id', userSalon.owner_id)
                .eq('agenda_enabled', true)
                .single()
              
              if (ownerData) {
                profissionaisData.push(ownerData as any)
              }
            }
          }
          
          setProfissionais(profissionaisData)
          console.log('NovoAgendamento - Profissionais ativos carregados:', profissionaisData.length)
          
        } else {
          // SE NÃO É DONO: Só pode ver a si mesmo (se tiver agenda ativa)
          console.log('NovoAgendamento - Usuário não é dono, verificando se tem agenda ativa')
          
          if (user && user.user_type === 'profissional') {
            // Verificar se o usuário tem agenda ativa
            const { data: userData } = await supabase
              .from('users')
              .select('id, name, email, profile_photo, user_type, agenda_enabled')
              .eq('id', user.id)
              .eq('agenda_enabled', true)
              .single()
            
            setProfissionais(userData ? [userData as any] : [])
            console.log('NovoAgendamento - Usuário tem agenda ativa:', !!userData)
          } else {
            setProfissionais([])
          }
        }
        
      } catch (error) {
        console.error('Erro ao carregar profissionais:', error)
      } finally {
        setLoadingProfissionais(false)
      }
    }
    
    fetchProfissionais()
  }, [userSalon?.id, user?.user_type])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientesDropdownRef.current && !clientesDropdownRef.current.contains(event.target as Node)) {
        setShowClientesDropdown(false)
      }
      
      // Fechar dropdown de profissionais também
      if (!event.target || !(event.target as Element).closest('[data-profissional-dropdown]')) {
        setShowProfissionaisDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filtrar clientes baseado no input
  const handleClienteInputChange = (value: string) => {
    setFormData(prev => ({ ...prev, cliente: value }))
    setClienteSelecionado(null)

    if (value.trim().length >= 2) {
      const filtrados = clientes.filter(cliente =>
        cliente.name.toLowerCase().includes(value.toLowerCase()) ||
        cliente.email.toLowerCase().includes(value.toLowerCase())
      )
      setClientesFiltrados(filtrados)
      setShowClientesDropdown(true)
    } else {
      setClientesFiltrados([])
      setShowClientesDropdown(false)
    }
  }

  // Selecionar profissional
  const handleProfissionalSelect = (profissional: any) => {
    setFormData(prev => ({ ...prev, profissional: profissional.id }))
    setShowProfissionaisDropdown(false)
  }

  // Selecionar cliente do dropdown
  const handleClienteSelect = (cliente: any) => {
    setClienteSelecionado(cliente)
    setFormData(prev => ({ 
      ...prev, 
      cliente: cliente.name,
      telefone: cliente.phone || ''
    }))
    setShowClientesDropdown(false)
  }

  // Formatar telefone
  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '')
    
    // Aplica máscara baseada no número de dígitos
    if (numbers.length <= 2) {
      return `(${numbers}`
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`
    }
  }

  // Validar telefone
  const validatePhone = (phone: string) => {
    const numbers = phone.replace(/\D/g, '')
    if (numbers.length < 10 || numbers.length > 11) {
      return 'Telefone deve ter 10 ou 11 dígitos'
    }
    return ''
  }

  // Handle input changes
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Formatar telefone
    if (field === 'telefone') {
      const formatted = formatPhoneNumber(value)
      setFormData(prev => ({ ...prev, telefone: formatted }))
    }

    // Limpar horário selecionado quando data ou serviço mudar
    if (field === 'data' || field === 'servico') {
      setSelectedTimeSlot('')
    }
  }

  // Validar formulário
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.cliente.trim()) {
      newErrors.cliente = 'Nome do cliente é obrigatório'
    }

    if (!formData.telefone.trim()) {
      newErrors.telefone = 'Telefone é obrigatório'
    } else {
      const phoneError = validatePhone(formData.telefone)
      if (phoneError) {
        newErrors.telefone = phoneError
      }
    }

    if (!formData.profissional) {
      newErrors.profissional = 'Selecione um profissional'
    }

    if (!formData.servico) {
      newErrors.servico = 'Selecione um serviço'
    }

    if (!formData.data) {
      newErrors.data = 'Data é obrigatória'
    }

    if (!selectedTimeSlot) {
      newErrors.horario = 'Horário é obrigatório'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!canCreateAppointments()) {
      setErrors(prev => ({ ...prev, general: 'Você não tem permissão para criar agendamentos' }))
      return
    }

    if (!clienteSelecionado?.id) {
      setErrors(prev => ({ ...prev, cliente: 'Selecione um cliente válido' }))
      return
    }

    if (!formData.profissional) {
      setErrors(prev => ({ ...prev, profissional: 'Selecione um profissional' }))
      return
    }

      // Abrir modal de confirmação em vez de criar diretamente
  setShowConfirmationModal(true)
}

// Função para confirmar e criar o agendamento
const confirmAppointment = async () => {
  setIsSubmitting(true)
  setShowConfirmationModal(false)

  try {
    console.log('🔄 NovoAgendamento - Iniciando criação do agendamento')
    
    // Encontrar o serviço selecionado
    const servicoSelecionado = servicos.find(s => s.name === formData.servico)
    console.log('🔄 NovoAgendamento - Serviço selecionado:', servicoSelecionado)
    
    if (!servicoSelecionado) {
      console.error('❌ NovoAgendamento - Serviço não encontrado')
      setErrors(prev => ({ ...prev, servico: 'Serviço não encontrado' }))
      return
    }

    // Calcular horário de fim baseado na duração do serviço
    // SUBTRAIR 1 MINUTO para não "pegar" o slot do próximo horário
    const startTime = new Date(`2000-01-01T${selectedTimeSlot}`)
    const adjustedDuration = Math.max(servicoSelecionado.duration_minutes - 1, 1) // Mínimo 1 minuto
    const endTime = new Date(startTime.getTime() + adjustedDuration * 60 * 1000)
    const endTimeString = endTime.toTimeString().slice(0, 5)
    console.log('🔄 NovoAgendamento - Horários calculados:', { start: selectedTimeSlot, end: endTimeString })

    // CORRIGIR PROBLEMA DE FUSO HORÁRIO
    // O problema é que a data está sendo convertida automaticamente pelo JavaScript
    // Vamos garantir que a data seja tratada como data local sem conversão
    const dataFormatada = formData.data
    console.log('🔄 NovoAgendamento - Data original:', formData.data)
    console.log('🔄 NovoAgendamento - Data formatada:', dataFormatada)
    
    // Verificar se a data está no formato correto
    if (!dataFormatada || !/^\d{4}-\d{2}-\d{2}$/.test(dataFormatada)) {
      console.error('❌ NovoAgendamento - Formato de data inválido:', dataFormatada)
      setErrors(prev => ({ ...prev, data: 'Formato de data inválido' }))
      return
    }
    
    // CORRIGIR PROBLEMA DE FUSO HORÁRIO - USAR DATA ORIGINAL SEM CONVERSÃO
    // O problema é que toISOString() converte para UTC, causando mudança de data
    // Vamos usar a data original diretamente, que já está no formato correto
    const dataLocalFormatada = dataFormatada // Usar a data original sem conversão
    
    console.log('🔄 NovoAgendamento - Data original (sem conversão):', dataFormatada)
    console.log('🔄 NovoAgendamento - Data que será enviada:', dataLocalFormatada)

    // Determinar status inicial baseado no tipo de usuário
    const initialStatus = user?.user_type === 'profissional' ? 'confirmed' : 'pending'
    console.log('🔄 NovoAgendamento - Status inicial:', initialStatus, 'Tipo de usuário:', user?.user_type)

    // Preparar dados do agendamento
    const appointmentData = {
      salon_id: userSalon.id,
      client_id: clienteSelecionado.id,
      professional_id: formData.profissional || user?.id || '', // Usar profissional selecionado ou usuário atual
      service_id: servicoSelecionado.id,
      date: dataLocalFormatada, // Usar a data corrigida
      start_time: selectedTimeSlot,
      end_time: endTimeString,
              duration_minutes: servicoSelecionado.duration_minutes,
      price: servicoSelecionado.price,
      status: initialStatus, // Status baseado no tipo de usuário
      notes: formData.observacoes || undefined
    }
    
    console.log('🔄 NovoAgendamento - Dados finais do agendamento:', {
      ...appointmentData,
      dateOriginal: formData.data,
      dateFinal: dataLocalFormatada
    })

    console.log('🔄 NovoAgendamento - Dados do agendamento:', appointmentData)
    console.log('🔄 NovoAgendamento - Verificando dados obrigatórios:', {
      salon_id: !!appointmentData.salon_id,
      client_id: !!appointmentData.client_id,
      professional_id: !!appointmentData.professional_id,
      service_id: !!appointmentData.service_id,
      date: !!appointmentData.date,
      start_time: !!appointmentData.start_time,
      end_time: !!appointmentData.end_time
    })
    
    // Verificar se todos os dados obrigatórios estão presentes
    const requiredFields = ['client_id', 'professional_id', 'service_id', 'salon_id', 'date', 'start_time', 'end_time']
    const missingFields = requiredFields.filter(field => !appointmentData[field])
    
    if (missingFields.length > 0) {
      console.error('❌ NovoAgendamento - Campos obrigatórios faltando:', missingFields)
      setErrors(prev => ({
        ...prev,
        general: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
      }))
      return
    }

    console.log('🔄 NovoAgendamento - Chamando createAppointment...')
    const result = await createAppointment(appointmentData)
    console.log('🔄 NovoAgendamento - Resultado do createAppointment:', result)

    if (result.error) {
      console.error('❌ NovoAgendamento - Erro retornado:', result.error)
      setErrors(prev => ({ ...prev, general: result.error }))
      toast({
        title: 'Erro ao criar agendamento',
        description: result.error,
        variant: 'destructive'
      })
      return
    }

    console.log('✅ NovoAgendamento - Agendamento criado com sucesso:', result.data)

    // Toast de sucesso com informação do status
    const statusMessage = initialStatus === 'confirmed' 
      ? 'O agendamento foi criado e confirmado automaticamente.'
      : 'O agendamento foi criado e aguarda confirmação do profissional.'
    
    toast({
      title: 'Agendamento criado!',
      description: statusMessage,
      variant: 'default'
    })

    // Sucesso - redirecionar para agenda profissional
    console.log('✅ NovoAgendamento - Redirecionando para agenda profissional')
    navigate('/agenda-completa?refresh=true', { replace: true })

  } catch (error) {
    console.error('❌ NovoAgendamento - Erro detalhado:', error)
    console.error('❌ NovoAgendamento - Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('❌ NovoAgendamento - Stack trace:', error instanceof Error ? error.stack : 'N/A')
    
    let errorMessage = 'Erro ao criar agendamento. Tente novamente.'
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Tratamento específico para erros de limite
      if (error.message.includes('limit') || error.message.includes('rate') || error.message.includes('quota')) {
        errorMessage = 'Limite de uso do Supabase excedido. Tente novamente em alguns minutos.'
      }
      
      // Tratamento específico para erros de permissão
      if (error.message.includes('permission') || error.message.includes('policy')) {
        errorMessage = 'Erro de permissão. Verifique se você tem acesso para criar agendamentos.'
      }
      
      // Tratamento específico para erros de foreign key
      if (error.message.includes('foreign key') || error.message.includes('constraint')) {
        errorMessage = 'Dados inválidos. Verifique se o cliente e serviço selecionados existem.'
      }
    }
    
    setErrors(prev => ({ 
      ...prev, 
      general: errorMessage 
    }))
    
    toast({
      title: 'Erro ao criar agendamento',
      description: errorMessage,
      variant: 'destructive'
    })
  } finally {
    setIsSubmitting(false)
  }
}

  console.log('NovoAgendamento - Renderizando...')

  // Verificar se o usuário tem um salão
  console.log('NovoAgendamento - Verificando salão:', { 
    userSalon: userSalon, 
    hasId: !!userSalon?.id,
    salonId: userSalon?.id 
  })
  
  // Verificar se o usuário pode criar agendamentos
  const canCreateAppointments = () => {
    // Se tem salão, pode criar agendamentos
    if (userSalon?.id) {
      return true
    }
    
    // Se é profissional independente, verificar se tem agenda trial ativa
    if (user?.user_type === 'profissional' && !userSalon?.id) {
      // Verificar se tem agenda trial ativa
      return (user as any)?.agenda_enabled === true
    }
    
    return false
  }

  if (!canCreateAppointments()) {
    console.log('NovoAgendamento - Sem permissão para criar agendamentos, mostrando tela de erro')
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl pt-20 pb-8">
          <div className="mb-8">
            <Link to={fromAdmin ? "/area-administrativa" : "/agenda-profissional"} className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {fromAdmin ? "Voltar para Área Administrativa" : "Voltar para Agenda Profissional"}
            </Link>
            <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Novo Agendamento
            </h1>
          </div>
          
          <Card>
            <CardContent className="p-8 text-center">
              <div className="mb-4">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h2 className="text-xl font-semibold mb-2">Agenda não disponível</h2>
                <p className="text-muted-foreground mb-6">
                  {user?.user_type === 'profissional' 
                    ? "Sua agenda trial expirou ou não está ativa. Entre em contato com o suporte."
                    : "Você precisa ter um salão cadastrado para criar agendamentos."
                  }
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                {user?.user_type === 'profissional' ? (
                  <Button variant="outline" asChild>
                    <Link to={fromAdmin ? "/area-administrativa" : "/agenda-profissional"}>
                      {fromAdmin ? "Voltar para Área Administrativa" : "Voltar"}
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild>
                      <Link to="/criar-salao">Criar Salão</Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to={fromAdmin ? "/area-administrativa" : "/agenda-profissional"}>
                        {fromAdmin ? "Voltar para Área Administrativa" : "Voltar"}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  console.log('NovoAgendamento - Renderizando formulário')

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl pt-20 pb-8">
        <div className="mb-8">
          <Link to={fromAdmin ? "/area-administrativa" : "/agenda-profissional"} className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromAdmin ? "Voltar para Área Administrativa" : "Voltar para Agenda Profissional"}
          </Link>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Novo Agendamento
          </h1>
          <p className="text-muted-foreground">
            Crie um novo agendamento para seus clientes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Dados do Agendamento</CardTitle>
            <CardDescription>
              Preencha as informações do cliente e do serviço
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cliente */}
              <div className="space-y-2">
                <Label htmlFor="cliente">Nome do Cliente</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="cliente"
                      placeholder="Digite o nome do cliente..."
                      value={formData.cliente}
                      onChange={(e) => handleClienteInputChange(e.target.value)}
                      className="pl-10"
                    />
                    {clienteSelecionado && (
                      <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
                    )}
                  </div>
                  
                  {/* Dropdown de clientes */}
                  {showClientesDropdown && clientesFiltrados.length > 0 && (
                    <div 
                      ref={clientesDropdownRef}
                      className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                    >
                      {clientesFiltrados.map((cliente) => (
                        <div
                          key={cliente.id}
                          onClick={() => handleClienteSelect(cliente)}
                          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        >
                          <Avatar className="h-8 w-8 mr-3">
                            <AvatarImage src={cliente.profile_photo} />
                            <AvatarFallback>{cliente.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="font-medium text-sm">{cliente.name}</p>
                            <p className="text-xs text-muted-foreground">{cliente.email}</p>
                          </div>
                          {cliente.phone && (
                            <Badge variant="secondary" className="text-xs">
                              {cliente.phone}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.cliente && (
                  <p className="text-sm text-red-600">{errors.cliente}</p>
                )}
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input 
                  id="telefone" 
                  placeholder="(11) 99999-9999"
                  value={formData.telefone}
                  onChange={(e) => handleInputChange('telefone', e.target.value)}
                />
                {errors.telefone && (
                  <p className="text-sm text-red-600">{errors.telefone}</p>
                )}
              </div>

              {/* Profissional */}
              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional</Label>
                <div className="relative">
                  <Input 
                    id="profissional" 
                    value={profissionais.find(p => p.id === formData.profissional)?.name || user?.name || 'Selecione um profissional'}
                    onClick={() => setShowProfissionaisDropdown(!showProfissionaisDropdown)}
                    readOnly
                    className="cursor-pointer bg-background"
                    placeholder="Clique para selecionar um profissional"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  
                  {/* Dropdown de profissionais */}
                  {showProfissionaisDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto" data-profissional-dropdown>
                      {loadingProfissionais ? (
                        <div className="p-3 text-center text-muted-foreground">
                          Carregando profissionais...
                        </div>
                      ) : profissionais.length > 0 ? (
                        profissionais.map((profissional) => (
                          <div
                            key={profissional.id}
                            className="px-3 py-2 hover:bg-accent cursor-pointer flex items-center gap-3"
                            onClick={() => handleProfissionalSelect(profissional)}
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={profissional.profile_photo} alt={profissional.name} />
                              <AvatarFallback>{profissional.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{profissional.name}</p>
                              <p className="text-xs text-muted-foreground truncate">{profissional.email}</p>
                            </div>
                            {profissional.id === user?.id && (
                              <Badge variant="secondary" className="text-xs">Você</Badge>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-muted-foreground">
                          Nenhum profissional encontrado
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formData.profissional === user?.id 
                    ? 'O agendamento será criado para você como profissional'
                    : 'Selecione o profissional que realizará o serviço'
                  }
                </p>
                {errors.profissional && (
                  <p className="text-sm text-red-600">{errors.profissional}</p>
                )}
              </div>

              {/* Serviço */}
              <div className="space-y-2">
                <Label htmlFor="servico">Serviço</Label>
                {!formData.profissional ? (
                  <div className="p-4 text-center border border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Selecione um profissional primeiro para ver os serviços disponíveis
                    </p>
                  </div>
                ) : (
                  <Select 
                    value={formData.servico} 
                    onValueChange={(value) => handleInputChange('servico', value)}
                    disabled={!formData.profissional}
                  >
                    <SelectTrigger className={!formData.profissional ? "opacity-50 cursor-not-allowed" : ""}>
                      <SelectValue placeholder={!formData.profissional ? "Selecione um profissional primeiro" : "Selecione um serviço..."} />
                    </SelectTrigger>
                    <SelectContent>
                    {loadingServicos ? (
                      <SelectItem value="loading" disabled>Carregando serviços...</SelectItem>
                    ) : servicos.length > 0 ? (
                      servicos.map((servico) => (
                        <SelectItem key={servico.id} value={servico.name}>
                          <div className="flex flex-col">
                            <span className="font-medium">{servico.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {servico.duration_minutes}min • R$ {servico.price.toFixed(2)}
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-4 text-center">
                        <div className="text-muted-foreground mb-2">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">Nenhum serviço cadastrado</p>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {userSalon?.owner_id === user?.id 
                            ? 'Você precisa cadastrar serviços antes de criar agendamentos.'
                            : 'Você precisa cadastrar seus serviços antes de criar agendamentos.'
                          }
                        </p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => window.open('/configuracoes-agenda', '_blank')}
                        >
                          Cadastrar Serviços
                        </Button>
                      </div>
                    )}
                  </SelectContent>
                </Select>
                )}
                {errors.servico && (
                  <p className="text-sm text-red-600">{errors.servico}</p>
                )}
              </div>

              {/* Data */}
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input 
                  id="data" 
                  type="date" 
                  value={formData.data}
                  onChange={(e) => handleInputChange('data', e.target.value)}
                  disabled={!formData.profissional}
                  className={!formData.profissional ? "opacity-50 cursor-not-allowed" : ""}
                  placeholder={!formData.profissional ? "Selecione um profissional primeiro" : ""}
                />
                {!formData.profissional && (
                  <p className="text-xs text-muted-foreground">
                    Selecione um profissional primeiro para escolher a data
                  </p>
                )}
                {errors.data && (
                  <p className="text-sm text-red-600">{errors.data}</p>
                )}
              </div>

              {/* Seletor de Horários */}
              {formData.data && formData.servico && formData.profissional ? (
                <TimeSlotSelector
                  professionalId={formData.profissional}
                  salonId={userSalon?.id || ''}
                  selectedDate={formData.data}
                  serviceDuration={servicos.find(s => s.name === formData.servico)?.duration_minutes || 60}
                  onTimeSlotSelect={setSelectedTimeSlot}
                  selectedTimeSlot={selectedTimeSlot}
                />
              ) : (
                <div className="space-y-2">
                  <Label>Horário</Label>
                  <div className="p-4 text-center border border-dashed border-gray-300 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      {!formData.profissional 
                        ? "Selecione um profissional primeiro"
                        : !formData.servico 
                        ? "Selecione um serviço primeiro"
                        : !formData.data
                        ? "Selecione uma data primeiro"
                        : "Preencha os campos anteriores para ver os horários disponíveis"
                      }
                    </p>
                  </div>
                </div>
              )}
              {errors.horario && (
                <p className="text-sm text-red-600">{errors.horario}</p>
              )}

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea 
                  id="observacoes" 
                  placeholder="Observações adicionais sobre o agendamento..."
                  rows={3}
                  value={formData.observacoes}
                  onChange={(e) => handleInputChange('observacoes', e.target.value)}
                />
              </div>

              {/* Mensagem de erro geral */}
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}


              {/* Botões */}
              <div className="flex gap-4 pt-4">
                <Button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0 shadow-lg" 
                  disabled={isSubmitting || !formData.profissional || !formData.servico || !formData.data || !selectedTimeSlot}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Criando...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Criar Agendamento
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate(-1)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Modal de Confirmação */}
        <Dialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Confirmar Agendamento
              </DialogTitle>
              <DialogDescription>
                Revise os detalhes do agendamento antes de confirmar
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Resumo do Agendamento */}
              <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={clienteSelecionado?.profile_photo} />
                    <AvatarFallback>{clienteSelecionado?.name?.charAt(0) || 'C'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{clienteSelecionado?.name || 'Cliente'}</p>
                    <p className="text-sm text-muted-foreground">{formData.telefone}</p>
                  </div>
                </div>
                
                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Serviço:</span>
                    <span className="font-medium">{formData.servico}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Data:</span>
                    <span className="font-medium">
                      {new Date(formData.data).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Horário:</span>
                    <span className="font-medium">{selectedTimeSlot}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Duração:</span>
                    <span className="font-medium">
                      {servicos.find(s => s.name === formData.servico)?.duration_minutes || 60} min
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Valor:</span>
                    <span className="font-medium text-primary">
                      R$ {servicos.find(s => s.name === formData.servico)?.price?.toFixed(2).replace('.', ',') || '0,00'}
                    </span>
                  </div>
                  
                  {formData.observacoes && (
                    <div className="border-t pt-2">
                      <span className="text-sm text-muted-foreground">Observações:</span>
                      <p className="text-sm mt-1">{formData.observacoes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmationModal(false)}
                disabled={isSubmitting}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmAppointment}
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0 shadow-lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

export default NovoAgendamento