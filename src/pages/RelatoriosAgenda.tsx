import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BarChart3, Download, Filter, TrendingUp, Users, Calendar, ArrowLeft, DollarSign, AlertCircle, Inbox, UserCheck, TrendingDown, Package, FileText, FileSpreadsheet } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import { Header } from "@/components/Header"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
// import { useSalonPermissions } from "@/hooks/useSalonPermissions" // REMOVIDO TEMPORARIAMENTE
import { useAgendaReports } from "@/hooks/useAgendaReports"
import { useSalonProfessionals } from "@/hooks/useSalonProfessionals"
import { useEffect, useState } from "react"
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Componente para mensagens amigáveis com design melhorado
const EmptyStateMessage = ({ 
  icon: Icon, 
  title, 
  message, 
  variant = "default" 
}: {
  icon: any
  title: string
  message: string
  variant?: "default" | "success" | "warning" | "info"
}) => {
  const variantStyles = {
    default: "text-muted-foreground bg-muted/30",
    success: "text-green-600 bg-green-50",
    warning: "text-amber-600 bg-amber-50", 
    info: "text-blue-600 bg-blue-50"
  }

  return (
    <div className={`flex flex-col items-center justify-center py-8 px-4 rounded-lg ${variantStyles[variant]}`}>
      <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2 text-center">{title}</h3>
      <p className="text-sm text-center max-w-xs leading-relaxed">{message}</p>
    </div>
  )
}

const RelatoriosAgenda = () => {
  const { user } = useAuthContext()
  const { userSalon } = useSalons(user?.id)
  // const { hasPermission, loading: permissionsLoading } = useSalonPermissions(userSalon?.id) // REMOVIDO TEMPORARIAMENTE
  
  // Lógica de permissões simplificada
  const isOwner = user?.id === userSalon?.owner_id
  const isLinkedProfessional = user?.user_type === 'profissional' && userSalon?.id && !isOwner
  
  // Profissionais vinculados podem ver relatórios (apenas seus dados)
  // Donos podem ver todos os relatórios
  const canViewReports = isOwner || isLinkedProfessional
  
  const permissionsLoading = false // REMOVIDO TEMPORARIAMENTE
  
  // Detectar se veio da Área Administrativa
  const [searchParams] = useSearchParams()
  const fromAdmin = searchParams.get('from') === 'admin'
  
  // Estado para filtros de data
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    end: new Date().toISOString().split('T')[0] // Hoje
  })
  
  // Estado para profissional selecionado
  const [selectedProfessional, setSelectedProfessional] = useState(() => {
    // Se for profissional vinculado, sempre seleciona ele mesmo
    if (user?.user_type === 'profissional' && userSalon?.id && user?.id !== userSalon?.owner_id) {
      return user.id
    }
    return 'todos'
  })
  
  // Estado para modal de exportação
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)
  
  // Hook para relatórios
  const { reports, loading, error, fetchReports } = useAgendaReports(
    userSalon?.id || '', 
    dateRange
  )
  
  // Hook para profissionais do salão
  const { professionals: salonProfessionals, loading: professionalsLoading, fetchProfessionals } = useSalonProfessionals(
    userSalon?.id || ''
  )
  
  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Buscar relatórios quando componente montar ou datas mudarem
  useEffect(() => {
    if (userSalon?.id) {
      fetchReports(selectedProfessional)
    }
  }, [userSalon?.id, dateRange, selectedProfessional, fetchReports])
  
  // Buscar profissionais quando componente montar
  useEffect(() => {
    if (userSalon?.id) {
      fetchProfessionals()
    }
  }, [userSalon?.id, fetchProfessionals])

  // Atualizar relatórios quando profissional selecionado mudar
  useEffect(() => {
    if (userSalon?.id && selectedProfessional) {
      fetchReports(selectedProfessional)
    }
  }, [selectedProfessional, userSalon?.id, fetchReports])

  // Garantir que profissionais vinculados sempre vejam seus próprios dados
  useEffect(() => {
    if (user?.user_type === 'profissional' && userSalon?.id && user?.id !== userSalon?.owner_id) {
      setSelectedProfessional(user.id)
    }
  }, [user?.id, user?.user_type, userSalon?.id, userSalon?.owner_id])

  // Verificar se pode ver relatórios
  if (!permissionsLoading && !canViewReports) {
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
                Você não tem permissão para visualizar relatórios.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Entre em contato com o administrador do salão para solicitar esta permissão.
              </p>
              <Button asChild className="w-full">
                <Link to={fromAdmin ? "/area-administrativa" : "/agenda-profissional"}>
                  {fromAdmin ? "Voltar para Área Administrativa" : "Voltar para Agenda"}
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Função para formatar valor monetário
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  // Função para renderizar valor ou mensagem amigável
  const renderValueOrMessage = (value: number, config: {
    icon: any
    title: string
    message: string
    variant?: "default" | "success" | "warning" | "info"
  }) => {
    if (value === 0) {
      return <EmptyStateMessage {...config} />
    }
    return (
      <div className="text-2xl font-bold text-primary">
        {value}
      </div>
    )
  }

  // Função para exportar relatório em CSV - CORRIGIDA
  const exportToCSV = async () => {
    setExportLoading(true)
    try {
      // Formatação melhorada do CSV - SEPARANDO CORRETAMENTE AS COLUNAS
      const csvData = [
        ['Relatório da Agenda - Beautycom'],
        ['Período', `${dateRange.start} a ${dateRange.end}`],
        [''],
        ['Métricas Gerais'],
        ['Métrica', 'Valor'],
        ['Total de Agendamentos', reports.metrics?.total_agendamentos || 0],
        ['Clientes Únicos', reports.metrics?.clientes_unicos || 0],
        ['Faturamento Total', formatCurrency(reports.metrics?.faturamento_total || 0)],
        ['Profissionais Ativos', reports.metrics?.profissionais_ativos || 0],
        [''],
        ['Desempenho por Profissional'],
        ['Nome', 'Agendamentos', 'Faturamento', 'Ocupação (%)'],
        ...(reports.professionalPerformance?.map(prof => [
          prof.nome_profissional,
          prof.total_agendamentos,
          formatCurrency(prof.faturamento),
          prof.porcentagem_ocupacao
        ]) || []),
        [''],
        ['Serviços Mais Procurados'],
        ['Serviço', 'Quantidade', 'Porcentagem (%)'],
        ...(reports.topServices?.map(serv => [
          serv.nome_servico,
          serv.quantidade_agendamentos,
          serv.porcentagem
        ]) || [])
      ]

      // CORREÇÃO: Usar ponto e vírgula como separador para Excel brasileiro
      const csvContent = csvData.map(row => 
        row.map(cell => `"${cell}"`).join(';')
      ).join('\n')
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `relatorio-agenda-${dateRange.start}-${dateRange.end}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Erro ao exportar CSV:', error)
    } finally {
      setExportLoading(false)
      setExportModalOpen(false)
    }
  }

  // Função para exportar relatório em PDF - MELHORADA
  const exportToPDF = async () => {
    setExportLoading(true)
    try {
      const doc = new jsPDF()
      
      // Configurações de fonte e cores
      doc.setFont('helvetica')
      
      // Cabeçalho centralizado e limpo - SEM TARJA COLORIDA
      
      // Adicionar logotipo real da Beautycom
      try {
        // Carregar o logotipo da pasta public
        const logoUrl = '/image/logotipobeautycom.png'
        
        // Criar uma imagem temporária para obter dimensões
        const img = new Image()
        img.onload = () => {
          // Calcular proporções para o logotipo
          const logoWidth = 25 // Reduzido de 40 para 25
          const logoHeight = (img.height * logoWidth) / img.width
          const logoX = 92.5 // Centralizado: (210 - 25) / 2
          const logoY = 10
          
          // Adicionar o logotipo
          doc.addImage(img, 'PNG', logoX, logoY, logoWidth, logoHeight)
          
          // Título principal centralizado ABAIXO do logotipo
          doc.setTextColor(0, 0, 0) // Texto preto
          doc.setFontSize(24) // Reduzido de 28 para 24
          doc.setFont('helvetica', 'bold')
          doc.text('Beautycom', 105, logoY + logoHeight + 15, { align: 'center' })
          
          // Subtítulo centralizado
          doc.setFontSize(18)
          doc.setFont('helvetica', 'normal')
          doc.text('Relatório da Agenda', 105, logoY + logoHeight + 30, { align: 'center' })
          
          // Período centralizado
          doc.setFontSize(14)
          doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, 105, logoY + logoHeight + 55, { align: 'center' })
          
          // Traço separador simples
          doc.setDrawColor(147, 51, 234) // Roxo Beautycom
          doc.setLineWidth(1)
          doc.line(20, logoY + logoHeight + 70, 190, logoY + logoHeight + 70)
          
          // Continuar com o resto do PDF
          continuePDFGeneration(doc)
        }
        
        img.src = logoUrl
      } catch (logoError) {
        console.warn('Erro ao carregar logotipo, usando texto:', logoError)
        // Fallback para texto se o logotipo falhar
        fallbackPDFHeader(doc)
      }
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error)
      setExportLoading(false)
      setExportModalOpen(false)
    }
  }

  // Função para continuar a geração do PDF após carregar o logotipo
  const continuePDFGeneration = (doc: jsPDF) => {
    try {
      // Reset para conteúdo
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      
      let yPosition = 100 // Ajustado para não sobrepor o cabeçalho
      
      // Declarar variáveis no início para evitar erros de escopo
      let profData: string[][] = []
      let serviceData: string[][] = []
      
      // Métricas Gerais - SEM TARJA ESCURA
      
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(147, 51, 234)
      doc.text('Métricas Gerais', 20, yPosition)
      yPosition += 15
      
      // Adicionar nome do profissional selecionado
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(128, 128, 128) // Cor cinza
      const professionalText = selectedProfessional === 'todos' ? 'Todos os Profissionais' : `Profissional: ${selectedProfessional}`
      doc.text(professionalText, 20, yPosition)
      yPosition += 10
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(12)
      doc.setTextColor(0, 0, 0)
      
      const metrics = [
        ['Total de Agendamentos', reports.metrics?.total_agendamentos || 0],
        ['Clientes Únicos', reports.metrics?.clientes_unicos || 0],
        ['Faturamento Total', formatCurrency(reports.metrics?.faturamento_total || 0)],
        ['Profissionais Ativos', reports.metrics?.profissionais_ativos || 0]
      ]
      
      metrics.forEach(([label, value], index) => {
        const rowY = yPosition + (index * 8)
        doc.text(`${label}:`, 25, rowY)
        doc.setFont('helvetica', 'bold')
        doc.text(`${value}`, 140, rowY)
        doc.setFont('helvetica', 'normal')
      })
      
      yPosition += 50
      
      // Desempenho por Profissional - SEM TARJA ESCURA
      if (reports.professionalPerformance && reports.professionalPerformance.length > 0) {
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(147, 51, 234)
        doc.text('Desempenho por Profissional', 20, yPosition)
        yPosition += 15
        
        profData = (reports.professionalPerformance || []).map(prof => [
          prof.nome_profissional,
          prof.total_agendamentos.toString(),
          formatCurrency(prof.faturamento),
          `${prof.porcentagem_ocupacao}%`
        ]) as string[][]
        
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Nome', 'Agendamentos', 'Faturamento', 'Ocupação (%)']],
          body: profData,
          theme: 'grid',
          headStyles: { 
            fillColor: [147, 51, 234],
            textColor: [255, 255, 255],
            fontSize: 12,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 11
          },
          margin: { left: 20, right: 20 },
          styles: {
            cellPadding: 5
          }
        })
        
        yPosition = (doc as any).lastAutoTable.finalY + 15
      }
      
      // Serviços Mais Procurados - SEM TARJA ESCURA
      if (reports.topServices && reports.topServices.length > 0) {
        
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(18)
        doc.setTextColor(147, 51, 234)
        doc.text('Serviços Mais Procurados', 20, yPosition)
        yPosition += 15
        
        serviceData = (reports.topServices || []).map(serv => [
          serv.nome_servico,
          serv.quantidade_agendamentos.toString(),
          `${serv.porcentagem}%`
        ]) as string[][]
        
        (doc as any).autoTable({
          startY: yPosition,
          head: [['Serviço', 'Quantidade', 'Porcentagem (%)']],
          body: serviceData,
          theme: 'grid',
          headStyles: { 
            fillColor: [147, 51, 234],
            textColor: [255, 255, 255],
            fontSize: 12,
            fontStyle: 'bold'
          },
          bodyStyles: {
            fontSize: 11
          },
          margin: { left: 20, right: 20 },
          styles: {
            cellPadding: 5
          }
        })
      }
      
      // Rodapé melhorado
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        
        // Linha decorativa
        doc.setDrawColor(147, 51, 234)
        doc.setLineWidth(0.5)
        doc.line(20, 280, 190, 280)
        
        // Informações do rodapé
        doc.setFontSize(10)
        doc.setTextColor(128, 128, 128)
        doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' })
        doc.text('Gerado em ' + new Date().toLocaleDateString('pt-BR'), 105, 295, { align: 'center' })
        doc.text('Beautycom - Sistema de Gestão para Salões', 105, 300, { align: 'center' })
      }
      
      // Download do PDF
      doc.save(`relatorio-agenda-${dateRange.start}-${dateRange.end}.pdf`)
      setExportLoading(false)
      setExportModalOpen(false)
      
    } catch (error) {
      console.error('Erro ao continuar geração do PDF:', error)
      setExportLoading(false)
      setExportModalOpen(false)
    }
  }

  // Função fallback para cabeçalho do PDF
  const fallbackPDFHeader = (doc: jsPDF) => {
    // Título principal
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text('Beautycom', 105, 25, { align: 'center' })
    
    // Subtítulo
    doc.setFontSize(18)
    doc.setFont('helvetica', 'normal')
    doc.text('Relatório da Agenda', 105, 40, { align: 'center' })
    
    // Período
    doc.setFontSize(14)
    doc.text(`Período: ${dateRange.start} a ${dateRange.end}`, 105, 55, { align: 'center' })
    
    // Traço separador simples
    doc.setDrawColor(147, 51, 234) // Roxo Beautycom
    doc.setLineWidth(1)
    doc.line(20, 70, 190, 70)
    
    // Continuar com o resto do PDF
    continuePDFGeneration(doc)
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="mb-8">
          <Link to={fromAdmin ? "/area-administrativa" : "/agenda-profissional"} className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {fromAdmin ? "Voltar para Área Administrativa" : "Voltar para Agenda Profissional"}
          </Link>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Relatórios da Agenda
          </h1>
          <p className="text-muted-foreground">
            {isOwner 
              ? "Analise o desempenho e métricas da agenda do salão"
              : "Analise o desempenho e métricas da sua agenda profissional"
            }
          </p>
          {/* Mostrar qual profissional está sendo visualizado */}
          {!isOwner && selectedProfessional !== 'todos' && (
            <div className="mt-2 p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
              <p className="text-sm text-muted-foreground">
                Visualizando dados de: <span className="font-semibold text-primary">Você mesmo</span>
              </p>
            </div>
          )}
        </div>

        {/* Filtros - LAYOUT REORGANIZADO com Mobile-First */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Filtros</span>
            </div>
            
            {/* Layout Mobile-First: Datas sempre lado a lado, layout completo no desktop */}
            <div className="space-y-3 sm:space-y-0 sm:flex sm:items-end sm:gap-3">
              {/* Grupo de Datas - Sempre lado a lado para aproveitar o espaço */}
              <div className="flex flex-row gap-3 flex-1">
                <div className="space-y-1 flex-1">
                  <Label htmlFor="data-inicio" className="text-xs">Data Início</Label>
                  <Input 
                    id="data-inicio" 
                    type="date" 
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
                <div className="space-y-1 flex-1">
                  <Label htmlFor="data-fim" className="text-xs">Data Fim</Label>
                  <Input 
                    id="data-fim" 
                    type="date" 
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
              
              {/* Profissional - Só para donos */}
              {isOwner && (
                <div className="space-y-1 w-full sm:w-48">
                  <Label htmlFor="profissional" className="text-xs">Profissional</Label>
                  <Select value={selectedProfessional} onValueChange={setSelectedProfessional}>
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder={professionalsLoading ? "Carregando..." : "Todos"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      {salonProfessionals.map((prof) => (
                        <SelectItem key={prof.id} value={prof.professional?.name || prof.professional_id}>
                          {prof.professional?.name || 'Profissional'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Botão - Full width no mobile, tamanho automático no desktop */}
              <div className="w-full sm:w-auto">
                <Button 
                  variant="hero"
                  onClick={() => fetchReports(selectedProfessional)}
                  disabled={loading}
                  className="w-full h-7 text-xs sm:w-auto sm:px-4"
                >
                  <BarChart3 className="h-3 w-3 mr-1" />
                  {loading ? "Carregando..." : "Gerar Relatório"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Total de Agendamentos</span>
                </div>
              </div>
              {loading ? (
                <div className="h-8 flex items-center">
                  <div className="text-muted-foreground">...</div>
                </div>
              ) : (
                renderValueOrMessage(
                  reports.metrics?.total_agendamentos || 0,
                  {
                    icon: Inbox,
                    title: "Nenhum Agendamento",
                    message: "Não encontramos agendamentos para o período selecionado. Comece a agendar seus serviços!",
                    variant: "info"
                  }
                )
              )}
              <div className="flex items-center mt-2 text-sm">
                <span className="text-muted-foreground">Período selecionado</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Clientes Atendidos</span>
                </div>
              </div>
              {loading ? (
                <div className="h-8 flex items-center">
                  <div className="text-muted-foreground">...</div>
                </div>
              ) : (
                renderValueOrMessage(
                  reports.metrics?.clientes_unicos || 0,
                  {
                    icon: UserCheck,
                    title: "Sem Clientes Ainda",
                    message: "Ainda não há clientes atendidos neste período. Seus primeiros clientes estão por vir!",
                    variant: "warning"
                  }
                )
              )}
              <div className="flex items-center mt-2 text-sm">
                <span className="text-muted-foreground">Clientes únicos</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Faturamento</span>
                </div>
              </div>
              {loading ? (
                <div className="h-8 flex items-center">
                  <div className="text-muted-foreground">...</div>
                </div>
              ) : (
                renderValueOrMessage(
                  reports.metrics?.faturamento_total || 0,
                  {
                    icon: TrendingDown,
                    title: "Sem Faturamento",
                    message: "Nenhum faturamento registrado para o período. Os primeiros ganhos estão chegando!",
                    variant: "warning"
                  }
                )
              )}
              <div className="flex items-center mt-2 text-sm">
                <span className="text-muted-foreground">Total faturado</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Profissionais Ativos</span>
                </div>
              </div>
              {loading ? (
                <div className="h-8 flex items-center">
                  <div className="text-muted-foreground">...</div>
                </div>
              ) : (
                renderValueOrMessage(
                  reports.metrics?.profissionais_ativos || 0,
                  {
                    icon: Users,
                    title: "Sem Profissionais Ativos",
                    message: "Nenhum profissional teve agendamentos neste período. A equipe está pronta para começar!",
                    variant: "info"
                  }
                )
              )}
              <div className="flex items-center mt-2 text-sm">
                <span className="text-muted-foreground">Profissionais com agendamentos</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relatório Detalhado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Desempenho por Profissional</span>
                </div>
              </div>
              {loading ? (
                <div className="h-8 flex items-center">
                  <div className="text-muted-foreground">...</div>
                </div>
              ) : reports.professionalPerformance.length > 0 ? (
                <div className="space-y-4">
                  {reports.professionalPerformance.map((prof, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-card">
                      <div>
                        <h4 className="font-semibold">{prof.nome_profissional}</h4>
                        <p className="text-sm text-muted-foreground">{prof.total_agendamentos} agendamentos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatCurrency(prof.faturamento)}</p>
                        <Badge variant="secondary">{prof.porcentagem_ocupacao}%</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateMessage
                  icon={Users}
                  title="Sem Desempenho Registrado"
                  message="Nenhum profissional teve agendamentos neste período. A equipe está pronta para começar a trabalhar!"
                  variant="info"
                />
              )}
              <div className="flex items-center mt-2 text-sm">
                <span className="text-muted-foreground">Período selecionado</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">Serviços Mais Procurados</span>
                </div>
              </div>
              {loading ? (
                <div className="h-8 flex items-center">
                  <div className="text-muted-foreground">...</div>
                </div>
              ) : reports.topServices.length > 0 ? (
                <div className="space-y-4">
                  {reports.topServices.map((serv, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div>
                        <h4 className="font-semibold">{serv.nome_servico}</h4>
                        <p className="text-sm text-muted-foreground">{serv.quantidade_agendamentos} agendamentos</p>
                      </div>
                      <Badge variant="outline">{serv.porcentagem}%</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyStateMessage
                  icon={Package}
                  title="Sem Serviços Agendados"
                  message="Nenhum serviço foi agendado neste período. Os clientes estão ansiosos para conhecer seus serviços!"
                  variant="warning"
                />
              )}
              <div className="flex items-center mt-2 text-sm">
                <span className="text-muted-foreground">Período selecionado</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="mt-6 flex justify-end">
          <Dialog open={exportModalOpen} onOpenChange={setExportModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-primary" />
                  Exportar Relatório
                </DialogTitle>
                <DialogDescription>
                  Escolha o formato para exportar o relatório da agenda
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  variant="outline"
                  onClick={exportToCSV}
                  disabled={exportLoading}
                  className="h-12 justify-start"
                >
                  <FileSpreadsheet className="h-5 w-5 mr-3 text-green-600" />
                  <div className="text-left">
                    <div className="font-semibold">Exportar como CSV</div>
                    <div className="text-sm text-muted-foreground">Planilha Excel compatível</div>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToPDF}
                  disabled={exportLoading}
                  className="h-12 justify-start"
                >
                  <FileText className="h-5 w-5 mr-3 text-red-600" />
                  <div className="text-left">
                    <div className="font-semibold">Exportar como PDF</div>
                    <div className="text-sm text-muted-foreground">Documento para impressão</div>
                  </div>
                </Button>
              </div>
              {exportLoading && (
                <div className="text-center text-sm text-muted-foreground">
                  Preparando arquivo para download...
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosAgenda;