import React, { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Calendar, Clock, CheckCircle, AlertCircle, Gift } from 'lucide-react'
import { useAgendaActivation } from '@/hooks/useAgendaActivation'
import { useAuthContext } from '@/contexts/AuthContext'

interface AgendaActivationCardProps {
  professionalId?: string
  onAgendaActivated?: () => void
}

export const AgendaActivationCard: React.FC<AgendaActivationCardProps> = ({
  professionalId,
  onAgendaActivated
}) => {
  const { user } = useAuthContext()
  const {
    loading,
    trialInfo,
    subscriptionInfo,
    canActivateAgenda,
    checkAgendaActivationStatus,
    activateAgenda
  } = useAgendaActivation(professionalId || user?.id)

  useEffect(() => {
    if (professionalId || user?.id) {
      checkAgendaActivationStatus()
    }
  }, [professionalId, user?.id, checkAgendaActivationStatus])

  const handleActivateAgenda = async () => {
    const result = await activateAgenda()
    if (result.success && onAgendaActivated) {
      onAgendaActivated()
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diffTime = end.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.max(0, diffDays)
  }

  // Se não é profissional, não mostrar nada
  if (user?.user_type !== 'profissional') {
    return null
  }

  // Se já tem agenda ativa
  if (user?.agenda_enabled) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Agenda Online Ativa
          </CardTitle>
          <CardDescription className="text-green-600">
            Sua agenda está ativa e você pode receber agendamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3 mr-1" />
              Ativa
            </Badge>
            <span className="text-sm text-green-600">
              Você está recebendo agendamentos
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Se tem trial ativo
  if (trialInfo && trialInfo.status === 'active') {
    const daysRemaining = getDaysRemaining(trialInfo.end_date)
    
    return (
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-blue-700">
            <Gift className="h-5 w-5" />
            Trial Gratuito Ativo
          </CardTitle>
          <CardDescription className="text-blue-600">
            Você tem {daysRemaining} dias restantes no seu trial gratuito
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-600">
                Válido até {formatDate(trialInfo.end_date)}
              </span>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
              {daysRemaining} dias restantes
            </Badge>
          </div>
          
          {canActivateAgenda && (
            <Button 
              onClick={handleActivateAgenda}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Ativando...' : 'Ativar Agenda Online'}
            </Button>
          )}
          
          <p className="text-xs text-blue-500">
            Após ativar, você poderá receber agendamentos de clientes
          </p>
        </CardContent>
      </Card>
    )
  }

  // Se tem assinatura ativa
  if (subscriptionInfo) {
    return (
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-purple-700">
            <CheckCircle className="h-5 w-5" />
            Assinatura Ativa
          </CardTitle>
          <CardDescription className="text-purple-600">
            Plano: {subscriptionInfo.plan.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-purple-600" />
              <span className="text-sm text-purple-600">
                Válido até {formatDate(subscriptionInfo.current_period_end)}
              </span>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
              {subscriptionInfo.plan.max_professionals} profissionais
            </Badge>
          </div>
          
          {canActivateAgenda && (
            <Button 
              onClick={handleActivateAgenda}
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Ativando...' : 'Ativar Agenda Online'}
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  // Se trial expirado e sem assinatura
  if (trialInfo && trialInfo.status === 'expired') {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <AlertCircle className="h-5 w-5" />
            Trial Expirado
          </CardTitle>
          <CardDescription className="text-orange-600">
            Seu trial gratuito de 30 dias expirou
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-orange-600" />
            <span className="text-sm text-orange-600">
              Expirou em {formatDate(trialInfo.end_date)}
            </span>
          </div>
          
          <Button 
            onClick={() => window.open('/planos', '_blank')}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Ver Planos de Assinatura
          </Button>
          
          <p className="text-xs text-orange-500">
            Assine um plano para continuar usando a agenda online
          </p>
        </CardContent>
      </Card>
    )
  }

  // Se não tem trial nem assinatura
  return (
    <Card className="border-gray-200 bg-gray-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-gray-700">
          <Clock className="h-5 w-5" />
          Agenda Online
        </CardTitle>
        <CardDescription className="text-gray-600">
          Ative sua agenda para receber agendamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <p className="text-sm text-gray-600 mb-4">
            Para ativar sua agenda online, você precisa de:
          </p>
          <ul className="text-sm text-gray-500 space-y-2">
            <li>• Trial gratuito de 30 dias</li>
            <li>• Ou uma assinatura ativa</li>
          </ul>
        </div>
        
        <Button 
          onClick={() => window.open('/planos', '_blank')}
          className="w-full"
        >
          Ver Planos Disponíveis
        </Button>
      </CardContent>
    </Card>
  )
}
