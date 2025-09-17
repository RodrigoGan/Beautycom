import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table'
import { ScrollArea } from './ui/scroll-area'
import { 
  Calendar, 
  Users, 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { useWhatsAppHistory, type WhatsAppCampaign, type WhatsAppMessageLog } from '@/hooks/useWhatsAppHistory'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface WhatsAppHistoryCardProps {
  onCampaignSelect?: (campaign: WhatsAppCampaign) => void
}

export const WhatsAppHistoryCard: React.FC<WhatsAppHistoryCardProps> = ({ onCampaignSelect }) => {
  const {
    campaigns,
    messageLogs,
    loading,
    error,
    filters,
    fetchCampaigns,
    fetchCampaignLogs,
    updateFilters,
    clearFilters
  } = useWhatsAppHistory()

  const [selectedCampaign, setSelectedCampaign] = useState<WhatsAppCampaign | null>(null)
  const [showLogsModal, setShowLogsModal] = useState(false)

  const handleCampaignClick = async (campaign: WhatsAppCampaign) => {
    setSelectedCampaign(campaign)
    await fetchCampaignLogs(campaign.id)
    setShowLogsModal(true)
    onCampaignSelect?.(campaign)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'active': return 'bg-blue-100 text-blue-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluída'
      case 'active': return 'Ativa'
      case 'draft': return 'Rascunho'
      case 'cancelled': return 'Cancelada'
      case 'paused': return 'Pausada'
      default: return status
    }
  }

  const getUserTypeText = (userType: string) => {
    switch (userType) {
      case 'profissional': return 'Profissionais'
      case 'usuario': return 'Usuários'
      case 'all': return 'Todos'
      default: return userType
    }
  }

  const getLogStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'cancelled': return <XCircle className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getLogStatusText = (status: string) => {
    switch (status) {
      case 'sent': return 'Enviada'
      case 'failed': return 'Falhou'
      case 'pending': return 'Pendente'
      case 'cancelled': return 'Cancelada'
      default: return status
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Carregando campanhas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Histórico de Campanhas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchCampaigns} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Histórico de Campanhas
              </CardTitle>
              <CardDescription>
                {campaigns.length} campanha(s) encontrada(s)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchCampaigns} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="userType">Tipo de Usuário</Label>
              <Select
                value={filters.userType}
                onValueChange={(value) => updateFilters({ userType: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="profissional">Profissionais</SelectItem>
                  <SelectItem value="usuario">Usuários</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilters({ status: value as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="draft">Rascunho</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="cancelled">Cancelada</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">Data Início</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => updateFilters({ 
                  dateRange: { ...filters.dateRange, start: e.target.value }
                })}
              />
            </div>

            <div>
              <Label htmlFor="endDate">Data Fim</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => updateFilters({ 
                  dateRange: { ...filters.dateRange, end: e.target.value }
                })}
              />
            </div>
          </div>

          {/* Lista de Campanhas */}
          <div className="space-y-4">
            {campaigns.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhuma campanha encontrada</p>
              </div>
            ) : (
              campaigns.map((campaign) => (
                <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg">{campaign.name}</h3>
                          <Badge className={getStatusColor(campaign.status)}>
                            {getStatusText(campaign.status)}
                          </Badge>
                          <Badge variant="outline">
                            {getUserTypeText(campaign.target_user_type)}
                          </Badge>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {campaign.message_template}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span>{campaign.sent_count}/{campaign.total_count} enviadas</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>{campaign.success_rate}% sucesso</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4 text-gray-500" />
                            <span>{format(new Date(campaign.created_at), 'dd/MM/yyyy', { locale: ptBR })}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4 text-purple-500" />
                            <span>{campaign.total_logs} mensagens</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          onClick={() => handleCampaignClick(campaign)}
                          variant="outline"
                          size="sm"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal de Logs Detalhados */}
      <Dialog open={showLogsModal} onOpenChange={setShowLogsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Logs da Campanha: {selectedCampaign?.name}
            </DialogTitle>
            <DialogDescription>
              {messageLogs.length} mensagem(ns) encontrada(s)
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {messageLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.user_name}</div>
                        {log.user_email && (
                          <div className="text-sm text-gray-500">{log.user_email}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getUserTypeText(log.user_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.phone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getLogStatusIcon(log.status)}
                        <span>{getLogStatusText(log.status)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.sent_at ? (
                        format(new Date(log.sent_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
