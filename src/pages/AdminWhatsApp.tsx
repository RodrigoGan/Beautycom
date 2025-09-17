import React, { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MessageSquare, 
  Users, 
  Send, 
  Settings, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Filter,
  Eye,
  Play,
  RotateCcw,
  Square
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
// Removido: useWhatsAppAutomation e WhatsAppMessage (sistema Puppeteer)
import { whatsappTemplates, getTemplatesByCategory, WhatsAppTemplate } from '@/data/whatsappTemplates'

/**
 * Página de administração para campanhas WhatsApp
 * Acesso restrito a super admins com verificação de palavra-chave
 */
const AdminWhatsApp: React.FC = () => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const [professionals, setProfessionals] = useState<any[]>([])
  const [filteredProfessionals, setFilteredProfessionals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedProfessionals, setSelectedProfessionals] = useState<Set<string>>(new Set())
  const [selectedTemplate, setSelectedTemplate] = useState<string>('')
  const [templateCategory, setTemplateCategory] = useState<'profissional' | 'usuario' | 'geral' | 'all'>('all')
  const [nameFilter, setNameFilter] = useState('')
  
  // Sistema simplificado - sem Puppeteer
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [filters, setFilters] = useState({
    userType: 'profissional',
    hasPhone: true,
    dateRange: {
      start: '',
      end: ''
    },
    location: {
      city: '',
      state: ''
    },
    subscriptionPlan: '',
    trialStatus: 'all' // all, active, expired
  })
  
  // Template de mensagem padrão
  const defaultMessage = `🎉 Olá [NOME]!

Bem-vindo(a) à Beautycom, a Rede Social da Beleza com o melhor agendador eletrônico do Brasil!
E você se cadastrou gratuitamente!
Desfrute desse Rede Social que é dedicada à área da beleza, publique seus trabalhos para ser facilmente encontrado, e aproveite, pois você tem [DIAS_RESTANTES] dias restantes no seu trial gratuito para experimentar nossa agenda online.

✨ Durante este período você pode:
• Configurar sua agenda profissional
• Receber agendamentos de clientes
• Testar todas as funcionalidades

⏰ Não perca esta oportunidade! Configure sua agenda agora e comece a receber seus primeiros agendamentos.

🔗 Acesse: [LINK_AGENDA]

Precisa de ajuda? Estamos aqui para você!

Equipe Beautycom ✨`

  // Carregar profissionais
  useEffect(() => {
    loadProfessionals()
  }, [])
  
  // Aplicar filtros
  useEffect(() => {
    applyFilters()
  }, [professionals, filters, nameFilter])
  
  const loadProfessionals = async () => {
    try {
      setLoading(true)
      
      // Buscar profissionais com dados completos incluindo trial
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          user_type,
          created_at,
          cidade,
          uf,
          subscription_status,
          subscription_plan,
          professional_trials(
            id,
            status,
            end_date,
            converted_to_paid
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error('Erro ao carregar profissionais:', error)
        return
      }
      
      setProfessionals(data || [])
    } catch (error) {
      console.error('Erro inesperado:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const applyFilters = () => {
    let filtered = [...professionals]
    
    // Filtro por nome
    if (nameFilter.trim()) {
      filtered = filtered.filter(p => 
        p.nome?.toLowerCase().includes(nameFilter.toLowerCase()) ||
        p.email?.toLowerCase().includes(nameFilter.toLowerCase())
      )
    }
    
    // Filtro por tipo de usuário
    if (filters.userType) {
      filtered = filtered.filter(p => p.user_type === filters.userType)
    }
    
    // Filtro por telefone
    if (filters.hasPhone) {
      filtered = filtered.filter(p => p.phone && p.phone.trim() !== '')
    }
    
    // Filtro por data de registro
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start)
      filtered = filtered.filter(p => new Date(p.created_at) >= startDate)
    }
    
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end)
      endDate.setHours(23, 59, 59, 999) // Incluir todo o dia
      filtered = filtered.filter(p => new Date(p.created_at) <= endDate)
    }
    
    // Filtro por cidade
    if (filters.location.city) {
      filtered = filtered.filter(p => 
        p.cidade && p.cidade.toLowerCase().includes(filters.location.city.toLowerCase())
      )
    }
    
    // Filtro por estado
    if (filters.location.state) {
      filtered = filtered.filter(p => 
        p.uf && p.uf.toLowerCase().includes(filters.location.state.toLowerCase())
      )
    }
    
    // Filtro por plano de assinatura
    if (filters.subscriptionPlan) {
      if (filters.subscriptionPlan === 'trial') {
        // Trial gratuito = tem trial ativo E não tem assinatura ativa
        filtered = filtered.filter(p => {
          const hasActiveTrial = p.professional_trials && p.professional_trials.length > 0 && 
            p.professional_trials[0].status === 'active' && 
            new Date(p.professional_trials[0].end_date) > new Date()
          const hasActiveSubscription = p.subscription_status === 'active'
          return hasActiveTrial && !hasActiveSubscription
        })
      } else {
        // Outros planos = verificar subscription_plan
        filtered = filtered.filter(p => p.subscription_plan === filters.subscriptionPlan)
      }
    }
    
    // Filtro por status do trial
    if (filters.trialStatus === 'active') {
      filtered = filtered.filter(p => {
        // Verificar se tem trial ativo na tabela professional_trials
        if (p.professional_trials && p.professional_trials.length > 0) {
          const trial = p.professional_trials[0]
          return trial.status === 'active' && new Date(trial.end_date) > new Date()
        }
        return false
      })
    } else if (filters.trialStatus === 'expired') {
      filtered = filtered.filter(p => {
        // Verificar se tem trial expirado ou convertido
        if (p.professional_trials && p.professional_trials.length > 0) {
          const trial = p.professional_trials[0]
          return trial.status === 'active' && new Date(trial.end_date) <= new Date()
        }
        // Se não tem trial, considerar como "expirado" (já tem assinatura)
        return p.subscription_status === 'active'
      })
    }
    
    setFilteredProfessionals(filtered)
  }
  
  const personalizeMessage = (template: string, professional: any) => {
    // Calcular dias restantes do trial
    let daysRemaining = 0
    if (professional.professional_trials && professional.professional_trials.length > 0) {
      const trial = professional.professional_trials[0]
      // Considerar trials 'active' e 'converted' que ainda não expiraram
      if ((trial.status === 'active' || trial.status === 'converted') && new Date(trial.end_date) > new Date()) {
        const endDate = new Date(trial.end_date)
        const now = new Date()
        const diffTime = endDate.getTime() - now.getTime()
        daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
      }
    }
    
    // Personalizar mensagem com todas as variáveis disponíveis
    let personalizedMessage = template
      .replace(/\[NOME\]/g, professional.name || professional.email.split('@')[0] || 'Usuário')
      .replace(/\[DIAS_RESTANTES\]/g, daysRemaining.toString())
      .replace(/\[LINK_AGENDA\]/g, `https://www.beautycom.com.br/configuracoes-agenda`)
      .replace(/\[LINK_BUSCA\]/g, `https://www.beautycom.com.br/buscar-profissionais`)
      .replace(/\[LINK_PLANOS\]/g, `https://www.beautycom.com.br/planos`)
      .replace(/\[EMAIL\]/g, professional.email || '')
      .replace(/\[TELEFONE\]/g, professional.phone || '')
      .replace(/\[CIDADE\]/g, professional.cidade || '')
      .replace(/\[ESTADO\]/g, professional.uf || '')
    
    return personalizedMessage
  }
  
  const handleSelectAll = () => {
    if (selectedProfessionals.size === filteredProfessionals.length) {
      setSelectedProfessionals(new Set())
    } else {
      setSelectedProfessionals(new Set(filteredProfessionals.map(p => p.id)))
    }
  }
  
  const handleSelectProfessional = (id: string) => {
    const newSelected = new Set(selectedProfessionals)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedProfessionals(newSelected)
  }
  
  // Contar filtros ativos
  const getActiveFiltersCount = () => {
    let count = 0
    if (nameFilter.trim()) count++
    if (filters.userType) count++
    if (filters.dateRange.start || filters.dateRange.end) count++
    if (filters.location.city || filters.location.state) count++
    if (filters.subscriptionPlan) count++
    if (filters.trialStatus !== 'all') count++
    if (filters.hasPhone) count++
    return count
  }

  // Funções para gerenciar templates
  const handleTemplateSelect = (templateId: string) => {
    const template = whatsappTemplates.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setMessage(template.content)
    }
  }

  const handleTemplateCategoryChange = (category: 'profissional' | 'usuario' | 'geral' | 'all') => {
    setTemplateCategory(category)
    setSelectedTemplate('')
  }

  const getFilteredTemplates = () => {
    return getTemplatesByCategory(templateCategory)
  }

  // Função para abrir WhatsApp com mensagem personalizada
  const openWhatsAppWithMessage = (professional: any) => {
    if (!professional.phone) {
      toast({
        title: "Erro",
        description: "Profissional não possui telefone cadastrado",
        variant: "destructive"
      })
      return
    }

    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem antes de enviar",
        variant: "destructive"
      })
      return
    }

    // Personalizar mensagem
    const personalizedMessage = personalizeMessage(message, professional)
    
    // Formatar telefone (remover caracteres especiais e adicionar código do país)
    const formattedPhone = professional.phone.replace(/\D/g, '')
    const phoneWithCountryCode = formattedPhone.startsWith('55') ? formattedPhone : `55${formattedPhone}`
    
    // Criar URL do WhatsApp
    const whatsappUrl = `https://wa.me/${phoneWithCountryCode}?text=${encodeURIComponent(personalizedMessage)}`
    
    // Abrir WhatsApp em nova aba
    window.open(whatsappUrl, '_blank')
    
    toast({
      title: "WhatsApp Aberto",
      description: `Mensagem preparada para ${professional.name}`,
      variant: "default"
    })
  }

  // Função para enviar para múltiplos clientes (abre um por vez)
  const handleSendToSelected = () => {
    if (selectedProfessionals.size === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um profissional",
        variant: "destructive"
      })
      return
    }
    
    if (!message.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem",
        variant: "destructive"
      })
      return
    }

    const selectedList = Array.from(selectedProfessionals)
    const selectedData = filteredProfessionals.filter(p => selectedList.includes(p.id))
    
    // Abrir WhatsApp para o primeiro cliente selecionado
    const firstClient = selectedData[0]
    if (firstClient) {
      openWhatsAppWithMessage(firstClient)
      
      // Remover o primeiro da seleção
      const newSelected = new Set(selectedProfessionals)
      newSelected.delete(firstClient.id)
      setSelectedProfessionals(newSelected)
      
      toast({
        title: "Próximo Cliente",
        description: `Envie a mensagem e volte para o próximo cliente (${newSelected.size} restantes)`,
        variant: "default"
      })
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="pt-20 pb-8 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando profissionais...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="pt-20 pb-8 container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📱 Campanhas WhatsApp</h1>
          <p className="text-muted-foreground">
            Gerencie e envie mensagens em massa para profissionais
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estatísticas */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total de Profissionais</p>
                      <p className="text-2xl font-bold">{professionals.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Filter className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Filtrados</p>
                      <p className="text-2xl font-bold">{filteredProfessionals.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <Send className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Selecionados</p>
                      <p className="text-2xl font-bold">{selectedProfessionals.size}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Seletor de Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Templates de Mensagem
              </CardTitle>
              <CardDescription>
                Escolha um template pré-definido ou crie sua própria mensagem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Categoria de Templates */}
              <div>
                <Label>Categoria de Template</Label>
                <select
                  value={templateCategory}
                  onChange={(e) => handleTemplateCategoryChange(e.target.value as any)}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="all">Todos os Templates</option>
                  <option value="profissional">Para Profissionais</option>
                  <option value="usuario">Para Usuários</option>
                  <option value="geral">Geral</option>
                </select>
              </div>

              {/* Lista de Templates */}
              <div>
                <Label>Selecionar Template</Label>
                <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                  {getFilteredTemplates().map(template => (
                    <div
                      key={template.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedTemplate === template.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                          <div className="flex gap-1 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {template.category}
                            </Badge>
                            {template.variables.map(variable => (
                              <Badge key={variable} variant="secondary" className="text-xs">
                                {variable}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="ml-2">
                          <Button
                            size="sm"
                            variant={selectedTemplate === template.id ? "default" : "outline"}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleTemplateSelect(template.id)
                            }}
                          >
                            {selectedTemplate === template.id ? 'Selecionado' : 'Usar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão para limpar seleção */}
              {selectedTemplate && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setSelectedTemplate('')
                    setMessage('')
                  }}
                  className="w-full"
                >
                  Limpar Seleção
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Editor de Mensagem */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Editor de Mensagem
                {selectedTemplate && (
                  <Badge variant="secondary" className="ml-2">
                    Template Selecionado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                Personalize sua mensagem. Use [NOME], [DIAS_RESTANTES] e [LINK_AGENDA] como variáveis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Digite sua mensagem aqui ou selecione um template acima..."
                  rows={12}
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMessage('')}
                >
                  Limpar
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const template = whatsappTemplates.find(t => t.id === 'profissional_trial_boas_vindas')
                    if (template) {
                      setMessage(template.content)
                      setSelectedTemplate(template.id)
                    }
                  }}
                >
                  Template Padrão
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Instruções de Uso */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Como Usar
              </CardTitle>
              <CardDescription>
                📱 Sistema Simplificado - Abertura direta do WhatsApp Web
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <strong>Selecione os clientes</strong> que deseja enviar mensagem
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <strong>Escolha um template</strong> ou digite sua mensagem personalizada
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <strong>Clique em "Enviar"</strong> - o WhatsApp Web abrirá automaticamente
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold">4</div>
                  <div>
                    <strong>Confirme e envie</strong> a mensagem no WhatsApp
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Para múltiplos clientes, o sistema abrirá um por vez. 
                  Envie a mensagem e volte para o próximo cliente.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Controles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Filtros Avançados
                {getActiveFiltersCount() > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {getActiveFiltersCount()} ativo{getActiveFiltersCount() > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Usuário */}
              <div>
                <Label>Tipo de Usuário</Label>
                <select
                  value={filters.userType}
                  onChange={(e) => setFilters(prev => ({ ...prev, userType: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Todos</option>
                  <option value="profissional">Profissional</option>
                  <option value="usuario">Usuário</option>
                </select>
              </div>

              {/* Data de Registro */}
              <div>
                <Label>Data de Registro</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    type="date"
                    placeholder="Data inicial"
                    value={filters.dateRange.start}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, start: e.target.value }
                    }))}
                  />
                  <Input
                    type="date"
                    placeholder="Data final"
                    value={filters.dateRange.end}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      dateRange: { ...prev.dateRange, end: e.target.value }
                    }))}
                  />
                </div>
              </div>

              {/* Localização */}
              <div>
                <Label>Localização</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Input
                    placeholder="Cidade"
                    value={filters.location.city}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, city: e.target.value }
                    }))}
                  />
                  <Input
                    placeholder="Estado (UF)"
                    value={filters.location.state}
                    onChange={(e) => setFilters(prev => ({ 
                      ...prev, 
                      location: { ...prev.location, state: e.target.value }
                    }))}
                  />
                </div>
              </div>

              {/* Plano de Assinatura */}
              <div>
                <Label>Plano de Assinatura</Label>
                <select
                  value={filters.subscriptionPlan}
                  onChange={(e) => setFilters(prev => ({ ...prev, subscriptionPlan: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Todos</option>
                  <option value="trial">Trial Gratuito</option>
                  <option value="basic">BeautyTime Start</option>
                  <option value="premium">BeautyTime Pro</option>
                  <option value="enterprise">BeautyTime Plus</option>
                </select>
              </div>

              {/* Status do Trial */}
              <div>
                <Label>Status do Trial</Label>
                <select
                  value={filters.trialStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, trialStatus: e.target.value }))}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="all">Todos</option>
                  <option value="active">Trial Ativo</option>
                  <option value="expired">Trial Expirado</option>
                </select>
              </div>

              {/* Filtros Básicos */}
              <div>
                <Label>Filtros Básicos</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="hasPhone"
                      checked={filters.hasPhone}
                      onChange={(e) => setFilters(prev => ({ ...prev, hasPhone: e.target.checked }))}
                    />
                    <Label htmlFor="hasPhone" className="text-sm">Apenas com telefone</Label>
                  </div>
                </div>
              </div>

              {/* Botão Limpar Filtros */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setFilters({
                    userType: 'profissional',
                    hasPhone: true,
                    dateRange: { start: '', end: '' },
                    location: { city: '', state: '' },
                    subscriptionPlan: '',
                    trialStatus: 'all'
                  })
                  setNameFilter('')
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
              
              <div className="pt-4 border-t">
                <Button 
                  onClick={handleSelectAll}
                  variant="outline"
                  className="w-full mb-2"
                >
                  {selectedProfessionals.size === filteredProfessionals.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                </Button>
                
                <Button 
                  onClick={handleSendToSelected}
                  disabled={
                    selectedProfessionals.size === 0 || 
                    !message.trim()
                  }
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {selectedProfessionals.size === 0
                    ? 'Selecione Clientes'
                    : `Abrir WhatsApp (${selectedProfessionals.size} selecionados)`
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Lista de Profissionais */}
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Profissionais ({filteredProfessionals.length})</CardTitle>
                  <CardDescription>
                    Selecione os profissionais que receberão a mensagem
                  </CardDescription>
                </div>
                <div className="w-64 flex gap-2">
                  <Input
                    placeholder="🔍 Buscar por nome ou email..."
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    className="flex-1"
                  />
                  {nameFilter && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setNameFilter('')}
                      className="px-2"
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredProfessionals.map((professional) => (
                  <div
                    key={professional.id}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedProfessionals.has(professional.id)
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectProfessional(professional.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedProfessionals.has(professional.id)}
                        onChange={() => handleSelectProfessional(professional.id)}
                        className="rounded"
                      />
                      <div>
                        <p className="font-medium">{professional.name}</p>
                        <p className="text-sm text-muted-foreground">{professional.email}</p>
                        <p className="text-sm text-muted-foreground">{professional.phone}</p>
                        <div className="flex gap-2 mt-1">
                          {professional.cidade && professional.uf && (
                            <Badge variant="outline" className="text-xs">
                              {professional.cidade}, {professional.uf}
                            </Badge>
                          )}
                          {professional.subscription_plan && (
                            <Badge variant="secondary" className="text-xs">
                              {professional.subscription_plan}
                            </Badge>
                          )}
                          {(() => {
                            // Determinar status baseado no trial
                            if (professional.professional_trials && professional.professional_trials.length > 0) {
                              const trial = professional.professional_trials[0]
                              const isTrialActive = trial.status === 'active' && new Date(trial.end_date) > new Date()
                              const isTrialExpired = trial.status === 'active' && new Date(trial.end_date) <= new Date()
                              
                              if (isTrialActive) {
                                return (
                                  <Badge variant="default" className="text-xs bg-green-500">
                                    Trial Ativo
                                  </Badge>
                                )
                              } else if (isTrialExpired) {
                                return (
                                  <Badge variant="destructive" className="text-xs">
                                    Trial Expirado
                                  </Badge>
                                )
                              }
                            }
                            
                            // Se não tem trial, verificar se é assinante
                            if (professional.subscription_status === 'active') {
                              return (
                                <Badge variant="default" className="text-xs">
                                  Assinante
                                </Badge>
                              )
                            }
                            
                            return (
                              <Badge variant="outline" className="text-xs">
                                Sem Trial
                              </Badge>
                            )
                          })()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">
                        {new Date(professional.created_at).toLocaleDateString('pt-BR')}
                      </Badge>
                      {selectedProfessionals.has(professional.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                      {professional.phone && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            openWhatsAppWithMessage(professional)
                          }}
                          className="ml-2"
                        >
                          <Send className="h-3 w-3 mr-1" />
                          WhatsApp
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminWhatsApp
