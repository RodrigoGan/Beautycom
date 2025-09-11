import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Settings, Save, ArrowLeft, Clock, Bell, Calendar, Trash2, Plus, AlertCircle, X, Package } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { Header } from "@/components/Header"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"

import { useAgendaConfig } from "@/hooks/useAgendaConfig"
import { useProfessionalServices } from "@/hooks/useProfessionalServices"
import { useCategories } from "@/hooks/useCategories"
import { useAgendaStatus } from "@/hooks/useAgendaStatus"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import { compressImage } from "@/utils/compression"
import { translateError } from "@/utils/errorTranslations"
import { AgendaActivationCard } from "@/components/AgendaActivationCard"

const ConfiguracoesAgenda = () => {
  const { user } = useAuthContext()
  const { userSalon } = useSalons(user?.id)
  
  // Hook para verificar status da agenda
  const { hasActiveAgenda, loading: agendaStatusLoading } = useAgendaStatus(user?.id)
  
  // Lógica de permissões simplificada
  const canManageSettings = user?.user_type === 'profissional' && hasActiveAgenda
  
  const permissionsLoading = agendaStatusLoading
  
  const { toast } = useToast()
  
  // Detectar se veio da Área Administrativa
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'
  
  // Tratamento de erro global
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('❌ Erro global capturado:', event.error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente recarregar a página.",
        variant: "destructive"
      })
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('❌ Promise rejeitada não tratada:', event.reason)
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [toast])
  
  // Hook para configurações de agenda
  const {
    config,
    loading: configLoading,
    error: configError,
    saving,
    saveConfig,
    validateConfig,
    convertWorkingDaysToDB,
    convertWorkingDaysFromDB
  } = useAgendaConfig(user?.id, null) // Profissionais independentes não têm salon_id

  // Hook para categorias
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError
  } = useCategories()

  // Hook para serviços profissionais
  const {
    services,
    loading: servicesLoading,
    error: servicesError,
    saving: servicesSaving,
    uploading,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    validateService
  } = useProfessionalServices(user?.id, null) // Profissionais independentes não têm salon_id
  
  // Estados locais para o formulário
  const [intervaloAlmoco, setIntervaloAlmoco] = useState(true)
  const [horarioAbertura, setHorarioAbertura] = useState("08:00")
  const [horarioFechamento, setHorarioFechamento] = useState("18:00")
  const [almocoInicio, setAlmocoInicio] = useState("12:00")
  const [almocoFim, setAlmocoFim] = useState("13:00")
  const [diasFuncionamento, setDiasFuncionamento] = useState({
    Segunda: true,
    Terça: true,
    Quarta: true,
    Quinta: true,
    Sexta: true,
    Sábado: true,
    Domingo: false
  })
  const [maxServicosPorDia, setMaxServicosPorDia] = useState(20)

  // Estados para modal de serviços
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    duration_minutes: 60,
    price: 0,
    category: '',
    is_active: true,
    requires_confirmation: true
  })
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  
  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Carregar dados do banco quando config estiver disponível
  useEffect(() => {
    if (config) {
      setHorarioAbertura(config.opening_time)
      setHorarioFechamento(config.closing_time)
      setIntervaloAlmoco(config.lunch_break_enabled)
      setAlmocoInicio(config.lunch_start_time)
      setAlmocoFim(config.lunch_end_time)
      setDiasFuncionamento(convertWorkingDaysFromDB(config.working_days))
      setMaxServicosPorDia(config.max_appointments_per_day)
    }
  }, [config, convertWorkingDaysFromDB])

  // Função para validar se o horário de almoço está dentro do horário de funcionamento
  const validarHorarioAlmoco = () => {
    if (!intervaloAlmoco) return true
    
    const abertura = new Date(`2000-01-01T${horarioAbertura}`)
    const fechamento = new Date(`2000-01-01T${horarioFechamento}`)
    const inicioAlmoco = new Date(`2000-01-01T${almocoInicio}`)
    const fimAlmoco = new Date(`2000-01-01T${almocoFim}`)
    
    return inicioAlmoco >= abertura && fimAlmoco <= fechamento && inicioAlmoco < fimAlmoco
  }

  // Função para alternar dia de funcionamento
  const alternarDia = (dia: string) => {
    setDiasFuncionamento(prev => ({
      ...prev,
      [dia]: !prev[dia as keyof typeof prev]
    }))
  }

  const isHorarioAlmocoValido = validarHorarioAlmoco()

  // Funções para gerenciar serviços
  const handleAddService = () => {
    setEditingService(null)
    setServiceForm({
      name: '',
      description: '',
      duration_minutes: 60,
      price: 0,
      category: '',
      is_active: true,
      requires_confirmation: true
    })
    setSelectedPhoto(null)
    setPhotoPreview(null)
    setShowServiceModal(true)
  }

  const handleEditService = (service: any) => {
    setEditingService(service)
    setServiceForm({
      name: service.name,
      description: service.description || '',
      duration_minutes: service.duration_minutes,
      price: service.price,
      category: service.category,
      is_active: service.is_active,
      requires_confirmation: service.requires_confirmation
    })
    setSelectedPhoto(null)
    setPhotoPreview(null)
    setShowServiceModal(true)
  }

  const handleSaveService = async () => {
    console.log('🔄 ===== INICIANDO SALVAMENTO =====')
    console.log('📋 Dados do formulário:', serviceForm)
    console.log('📸 Foto selecionada:', selectedPhoto ? selectedPhoto.name : 'Nenhuma')
    console.log('🆔 Editing service:', editingService?.id || 'Novo serviço')
    console.log('👤 User ID:', user?.id)
    console.log('🏢 Salon ID:', userSalon?.id)
    console.log('🔐 User autenticado:', !!user)
    console.log('🏢 Salon encontrado:', !!userSalon)
    
    // Verificar se tem os dados necessários
    if (!user?.id) {
      console.error('❌ Usuário não autenticado')
      toast({
        title: "Erro",
        description: "Usuário não autenticado. Faça login novamente.",
        variant: "destructive"
      })
      return
    }
    
    // Removida validação de salão obrigatório - profissionais independentes podem criar serviços
    
    // Timeout de segurança para evitar travamento
    const timeoutId = setTimeout(() => {
      console.error('❌ Timeout no salvamento - forçando reset')
      toast({
        title: "Erro",
        description: "Tempo limite excedido. Tente novamente.",
        variant: "destructive"
      })
    }, 15000) // Reduzido para 15 segundos

    try {
      const formData = {
        ...serviceForm,
        photo_file: selectedPhoto || undefined,
        max_daily_bookings: 10 // Valor padrão
      }
      
      console.log('📤 FormData preparado:', formData)

      // Validações adicionais
      const validationErrors: string[] = []
      
      if (!formData.name.trim()) {
        validationErrors.push('Nome do serviço é obrigatório')
      }
      
      if (!formData.category) {
        validationErrors.push('Categoria é obrigatória')
      } else {
        // Verificar se a categoria existe na lista de categorias válidas
        const validCategories = categories.map(cat => cat.name)
        if (!validCategories.includes(formData.category)) {
          validationErrors.push(`Categoria "${formData.category}" não é válida. Selecione uma categoria da lista.`)
        }
      }
      
      if (formData.duration_minutes <= 0) {
        validationErrors.push('Duração deve ser maior que zero')
      }
      
      if (formData.price < 0) {
        validationErrors.push('Preço não pode ser negativo')
      }

      if (validationErrors.length > 0) {
        toast({
          title: "Erro de Validação",
          description: validationErrors.join(', '),
          variant: "destructive"
        })
        return
      }

      if (editingService) {
        console.log('🔄 Atualizando serviço existente...')
        await updateService(editingService.id, formData)
        console.log('✅ Serviço atualizado com sucesso')
        toast({
          title: "Sucesso!",
          description: "Serviço atualizado com sucesso",
          variant: "default"
        })
      } else {
        console.log('🔄 Criando novo serviço...')
        await createService(formData)
        console.log('✅ Serviço criado com sucesso')
        toast({
          title: "Sucesso!",
          description: "Serviço criado com sucesso",
          variant: "default"
        })
      }

      // Limpar formulário e fechar modal
      setShowServiceModal(false)
      setSelectedPhoto(null)
      setPhotoPreview(null)
      setPreviewLoading(false)
        } catch (error) {
      console.error('❌ Erro ao salvar serviço:', error)
      
      let errorMessage = "Erro ao salvar serviço"
      
      if (error instanceof Error) {
        errorMessage = translateError(error.message)
        console.error('❌ Tipo do erro:', error.constructor.name)
        console.error('❌ Stack trace:', error.stack)
      }
      
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      // Garantir que o estado de loading seja limpo
      clearTimeout(timeoutId)
      console.log('🔄 Finalizando salvamento...')
    }
  }

  const handleDeleteService = async (serviceId: string) => {
    if (confirm('Tem certeza que deseja deletar este serviço?')) {
      try {
        await deleteService(serviceId)
        toast({
          title: "Sucesso!",
          description: "Serviço deletado com sucesso",
          variant: "default"
        })
      } catch (error) {
        console.error('Erro ao deletar serviço:', error)
        toast({
          title: "Erro",
          description: error instanceof Error ? translateError(error.message) : "Erro ao deletar serviço",
          variant: "destructive"
        })
      }
    }
  }



  // Versão com compressão de imagem
  const handlePhotoChangeSimple = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      console.log('📸 Arquivo selecionado:', file.name, file.size, file.type)
      
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Erro",
          description: "Por favor, selecione apenas arquivos de imagem",
          variant: "destructive"
        })
        return
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "A imagem deve ter no máximo 5MB",
          variant: "destructive"
        })
        return
      }

      setPreviewLoading(true)
      
      try {
        console.log('🔧 Comprimindo imagem do serviço...')
        console.log('📏 Tamanho original:', (file.size / 1024 / 1024).toFixed(2), 'MB')
        
        // Comprimir imagem usando as configurações específicas de serviço
        const compressedFile = await compressImage(file, {
          maxWidth: 800,      // Largura máxima para serviços
          maxHeight: 800,     // Altura máxima para serviços
          quality: 0.8,       // Qualidade alta para serviços
          format: 'webp'      // Formato otimizado
        })
        
        console.log('✅ Imagem comprimida com sucesso')
        console.log('📏 Tamanho comprimido:', (compressedFile.size / 1024 / 1024).toFixed(2), 'MB')
        console.log('📊 Redução:', ((file.size - compressedFile.size) / file.size * 100).toFixed(1), '%')
        
        // Usar arquivo comprimido
        setSelectedPhoto(compressedFile)
        
        // Criar preview do arquivo comprimido
        const reader = new FileReader()
        
        reader.onload = (e) => {
          if (e.target?.result) {
            console.log('✅ Preview criado com sucesso')
            setPhotoPreview(e.target.result as string)
          }
          setPreviewLoading(false)
        }
        
        reader.onerror = () => {
          console.log('⚠️ Erro no preview, mas arquivo selecionado')
          setPhotoPreview(null)
          setPreviewLoading(false)
        }
        
        // Timeout de segurança
        const timeout = setTimeout(() => {
          console.log('⚠️ Timeout no preview, mas arquivo selecionado')
          setPhotoPreview(null)
          setPreviewLoading(false)
        }, 5000)
        
        reader.onloadend = () => {
          clearTimeout(timeout)
          setPreviewLoading(false)
        }
        
        reader.readAsDataURL(compressedFile)
        
      } catch (error) {
        console.error('❌ Erro ao comprimir imagem:', error)
        
        // Fallback: usar arquivo original se a compressão falhar
        console.log('⚠️ Usando arquivo original como fallback')
        setSelectedPhoto(file)
        
        // Criar preview do arquivo original
        const reader = new FileReader()
        
        reader.onload = (e) => {
          if (e.target?.result) {
            setPhotoPreview(e.target.result as string)
          }
          setPreviewLoading(false)
        }
        
        reader.onerror = () => {
          setPhotoPreview(null)
          setPreviewLoading(false)
        }
        
        reader.readAsDataURL(file)
      }
    }
  }

  // Função para salvar configurações
  const salvarConfiguracoes = async () => {
    try {
      const formData = {
        opening_time: horarioAbertura,
        closing_time: horarioFechamento,
        lunch_break_enabled: intervaloAlmoco,
        lunch_start_time: almocoInicio,
        lunch_end_time: almocoFim,
        working_days: convertWorkingDaysToDB(diasFuncionamento),
        max_appointments_per_day: maxServicosPorDia
      }

      // Validar configurações
      const errors = validateConfig(formData)
      if (errors.length > 0) {
        toast({
          title: "Erro de Validação",
          description: errors.join(', '),
          variant: "destructive"
        })
        return
      }

      await saveConfig(formData)
      
      toast({
        title: "Sucesso!",
        description: "Configurações salvas com sucesso",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? translateError(error.message) : "Erro ao salvar configurações",
        variant: "destructive"
      })
    }
  }

  // Verificar se pode gerenciar configurações
  if (!permissionsLoading && !canManageSettings) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Permissão Insuficiente
              </CardTitle>
              <CardDescription>
                Você não tem permissão para gerenciar configurações.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Entre em contato com o administrador do salão para solicitar esta permissão.
              </p>
              <Button asChild className="w-full">
                <Link to="/agenda-profissional">Voltar para Agenda</Link>
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pt-20 pb-8">
        <div className="mb-8">
          <Link to={fromAdmin ? "/area-administrativa" : "/agenda-profissional"} className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromAdmin ? "Voltar para Área Administrativa" : "Voltar para Agenda Profissional"}
          </Link>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Configurações da Agenda
          </h1>
          <p className="text-muted-foreground">
            Configure sua agenda profissional e serviços
          </p>
        </div>

        {/* Loading e Error States */}
        {configLoading && (
          <Card className="mb-6">
            <CardContent className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-muted-foreground">Carregando configurações...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {configError && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                Erro ao Carregar Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {configError}
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Status da Agenda Online */}
          <AgendaActivationCard 
            professionalId={user?.id}
            onAgendaActivated={() => {
              // Recarregar dados após ativação
              window.location.reload()
            }}
          />

          {/* Horário de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>
                Configure os horários de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Horários de Abertura e Fechamento */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Horários de Funcionamento</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="abertura">Horário de Abertura</Label>
                    <Input 
                      id="abertura" 
                      type="time" 
                      value={horarioAbertura}
                      onChange={(e) => setHorarioAbertura(e.target.value)}
                      disabled={configLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fechamento">Horário de Fechamento</Label>
                    <Input 
                      id="fechamento" 
                      type="time" 
                      value={horarioFechamento}
                      onChange={(e) => setHorarioFechamento(e.target.value)}
                      disabled={configLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Intervalo para Almoço */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Intervalo para Almoço</h4>
                    <p className="text-sm text-muted-foreground">Configure o horário de pausa para almoço</p>
                  </div>
                  <Switch 
                    id="intervalo-almoco" 
                    checked={intervaloAlmoco}
                    onCheckedChange={setIntervaloAlmoco}
                    disabled={configLoading}
                  />
                </div>
                
                {intervaloAlmoco && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4 border-l-2 border-muted">
                      <div className="space-y-2">
                        <Label htmlFor="almoco-inicio">Início do Almoço</Label>
                        <Input 
                          id="almoco-inicio" 
                          type="time" 
                          value={almocoInicio}
                          onChange={(e) => setAlmocoInicio(e.target.value)}
                          disabled={configLoading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="almoco-fim">Fim do Almoço</Label>
                        <Input 
                          id="almoco-fim" 
                          type="time" 
                          value={almocoFim}
                          onChange={(e) => setAlmocoFim(e.target.value)}
                          disabled={configLoading}
                        />
                      </div>
                    </div>
                    
                    {/* Validação do horário de almoço */}
                    {!isHorarioAlmocoValido && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">
                          O horário de almoço deve estar dentro do horário de funcionamento
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Dias de Funcionamento */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Dias de Funcionamento</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Switch 
                        id={dia} 
                        checked={diasFuncionamento[dia as keyof typeof diasFuncionamento]}
                        onCheckedChange={() => alternarDia(dia)}
                        disabled={configLoading}
                      />
                      <Label htmlFor={dia}>{dia}</Label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Máximo de Serviços por Dia */}
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Limite de Agendamentos</h4>
                <div className="space-y-2">
                  <Label htmlFor="max-servicos">Máximo de Agendamentos por Dia</Label>
                  <Input
                    id="max-servicos"
                    type="number"
                    value={maxServicosPorDia || ''}
                    onChange={(e) => setMaxServicosPorDia(parseInt(e.target.value) || 0)}
                    min="1"
                    placeholder="20"
                    disabled={configLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Limite máximo de agendamentos que podem ser feitos por dia
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Serviços Oferecidos
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddService}
                  disabled={servicesLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </CardTitle>
              <CardDescription>
                Gerencie os serviços oferecidos na sua agenda
              </CardDescription>
            </CardHeader>
            <CardContent>
              {categoriesError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    Erro ao carregar categorias: {categoriesError}
                  </p>
                </div>
              )}
              {servicesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-sm text-muted-foreground">Carregando serviços...</p>
                  </div>
                </div>
              ) : servicesError ? (
                <div className="text-center py-8">
                  <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                  <p className="text-sm text-destructive">{servicesError}</p>
                </div>
              ) : services.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum serviço cadastrado</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddService}
                    className="mt-2"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Primeiro Serviço
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-card">
                      <div className="flex items-center gap-3">
                        {service.photo_url && (
                          <img 
                            src={service.photo_url} 
                            alt={service.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{service.name}</h4>
                            <div className={`px-2 py-1 rounded-full text-xs ${
                              service.is_active 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {service.is_active ? 'Ativo' : 'Inativo'}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {service.duration_minutes}min • R$ {service.price.toFixed(2)} • {service.category}
                          </p>
                          {service.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditService(service)}
                        >
                          Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => toggleServiceStatus(service.id!)}
                        >
                          {service.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteService(service.id!)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure as notificações da agenda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notif-email">Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">Receba notificações de novos agendamentos por e-mail</p>
                  </div>
                  <Switch id="notif-email" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notif-push">Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">Receba notificações push no aplicativo</p>
                  </div>
                  <Switch id="notif-push" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notif-whatsapp">Integração WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">Envie lembretes via WhatsApp para clientes</p>
                  </div>
                  <Switch id="notif-whatsapp" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integração Google Calendar - Em Breve */}
          <Card className="opacity-60 bg-muted/30">
            <CardHeader>
              <CardTitle className="flex items-center text-muted-foreground">
                <Calendar className="h-5 w-5 mr-2" />
                Integração Google Calendar
                <Badge variant="secondary" className="ml-2 text-xs">
                  Em Breve
                </Badge>
              </CardTitle>
              <CardDescription>
                Sincronize sua agenda com o Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="google-sync" className="text-muted-foreground">Sincronização Automática</Label>
                    <p className="text-sm text-muted-foreground">Sincronize agendamentos automaticamente com Google Calendar</p>
                  </div>
                  <Switch id="google-sync" disabled />
                </div>
                <Button variant="outline" disabled className="w-full">
                  <Calendar className="h-4 w-4 mr-2" />
                  Conectar com Google Calendar
                </Button>
                <div className="text-center p-4 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    🚀 <strong>Em breve!</strong> Estamos trabalhando para trazer a integração com Google Calendar. 
                    Em breve você poderá sincronizar sua agenda automaticamente!
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-4">
            <Button 
              className="bg-gradient-primary hover:bg-gradient-primary/90 text-white"
              onClick={salvarConfiguracoes}
              disabled={!isHorarioAlmocoValido || saving || configLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Salvando..." : "Salvar Configurações"}
            </Button>
            <Button variant="outline" asChild>
              <Link to="/agenda-profissional">Cancelar</Link>
            </Button>
          </div>
        </div>

        {/* Modal para Criar/Editar Serviço */}
        {showServiceModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {editingService ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
                
                <div className="space-y-4">
                  {/* Nome do Serviço */}
                  <div>
                    <Label htmlFor="service-name">Nome do Serviço *</Label>
                    <Input
                      id="service-name"
                      value={serviceForm.name}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Corte Feminino"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="service-description">Descrição</Label>
                    <Textarea
                      id="service-description"
                      value={serviceForm.description}
                      onChange={(e) => setServiceForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Descreva o serviço..."
                      rows={3}
                    />
                  </div>

                  {/* Duração e Preço */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="service-duration">Duração (min) *</Label>
                      <Input
                        id="service-duration"
                        type="number"
                        value={serviceForm.duration_minutes || ''}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, duration_minutes: parseInt(e.target.value) || 0 }))}
                        min="1"
                        placeholder="60"
                      />
                    </div>
                    <div>
                      <Label htmlFor="service-price">Preço (R$) *</Label>
                      <Input
                        id="service-price"
                        type="number"
                        step="0.01"
                        value={serviceForm.price || ''}
                        onChange={(e) => setServiceForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Categoria */}
                  <div>
                    <Label htmlFor="service-category">Categoria</Label>
                    <Select
                      value={serviceForm.category}
                      onValueChange={(value) => setServiceForm(prev => ({ ...prev, category: value }))}
                      disabled={categoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={categoriesLoading ? "Carregando..." : "Selecione uma categoria"} />
                      </SelectTrigger>
                      <SelectContent>
                        {categoriesLoading ? (
                          <SelectItem value="loading">Carregando categorias...</SelectItem>
                        ) : categories.length > 0 ? (
                          categories.map((category) => (
                            <SelectItem key={category.id} value={category.name}>
                              <div className="flex items-center gap-2">
                                {category.icon && (
                                  <span className="text-lg">{category.icon}</span>
                                )}
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-categories">Nenhuma categoria disponível</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Foto do Serviço */}
                  <div>
                    <Label htmlFor="service-photo">Foto do Serviço (opcional)</Label>
                    <Input
                      id="service-photo"
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChangeSimple}
                    />
                    {selectedPhoto && (
                      <div className="mt-2">
                        {/* Preview da imagem */}
                        {previewLoading ? (
                          <div className="mt-3">
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto mb-1"></div>
                                  <div className="text-gray-400 text-xs">Carregando...</div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPhoto(null)
                                  setPhotoPreview(null)
                                  setPreviewLoading(false)
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        ) : photoPreview ? (
                          <div className="mt-3">
                            <div className="relative inline-block">
                              <img 
                                src={photoPreview} 
                                alt="Preview" 
                                className="w-32 h-32 object-cover rounded-lg border shadow-sm"
                                onError={() => {
                                  console.log('❌ Erro ao carregar preview')
                                  setPhotoPreview(null)
                                }}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                                onClick={() => {
                                  setSelectedPhoto(null)
                                  setPhotoPreview(null)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-3">
                            <div className="flex items-center gap-2">
                              <div className="w-32 h-32 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                                <div className="text-center">
                                  <div className="text-gray-400 text-xs">Sem preview</div>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedPhoto(null)
                                  setPhotoPreview(null)
                                  setPreviewLoading(false)
                                }}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Remover
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Configurações */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="service-active">Serviço Ativo</Label>
                        <p className="text-sm text-muted-foreground">Disponível para agendamento</p>
                      </div>
                      <Switch
                        id="service-active"
                        checked={serviceForm.is_active}
                        onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, is_active: checked }))}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="service-confirmation">Requer Confirmação</Label>
                        <p className="text-sm text-muted-foreground">Agendamento precisa ser confirmado</p>
                      </div>
                      <Switch
                        id="service-confirmation"
                        checked={serviceForm.requires_confirmation}
                        onCheckedChange={(checked) => setServiceForm(prev => ({ ...prev, requires_confirmation: checked }))}
                      />
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={handleSaveService}
                    disabled={servicesSaving || uploading}
                    className="bg-gradient-primary hover:bg-gradient-primary/90 text-white flex-1"
                  >
                    {servicesSaving || uploading ? "Salvando..." : "Salvar Serviço"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowServiceModal(false)}
                    disabled={servicesSaving || uploading}
                  >
                    Cancelar
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

export default ConfiguracoesAgenda;