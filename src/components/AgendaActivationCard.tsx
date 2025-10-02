import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Calendar, Clock, CheckCircle, AlertCircle, Gift } from 'lucide-react'
import { useAgendaActivation } from '@/hooks/useAgendaActivation'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { ShareAgendaCard } from './ShareAgendaCard'

interface AgendaActivationCardProps {
  professionalId?: string
  onAgendaActivated?: () => void
  showShareCard?: boolean
}

export const AgendaActivationCard: React.FC<AgendaActivationCardProps> = ({
  professionalId,
  onAgendaActivated,
  showShareCard = false
}) => {
  const { user, refreshUser } = useAuthContext()
  const {
    loading,
    trialInfo,
    subscriptionInfo,
    canActivateAgenda,
    checkAgendaActivationStatus,
    activateAgenda,
    deactivateAgenda
  } = useAgendaActivation(professionalId || user?.id)

  // Estado local para controlar se a agenda está ativa (baseado no banco, não no contexto)
  const [isAgendaActive, setIsAgendaActive] = useState(false)
  const [isSalonOwner, setIsSalonOwner] = useState(false)
  const [salonName, setSalonName] = useState<string | null>(null)

  useEffect(() => {
    if (professionalId || user?.id) {
      checkAgendaActivationStatus()
    }
  }, [professionalId, user?.id, checkAgendaActivationStatus])

  // Verificar status da agenda diretamente do banco
  useEffect(() => {
    const checkAgendaStatus = async () => {
      if (!professionalId && !user?.id) return
      
      const userId = professionalId || user?.id
      
      try {
        // Verificar agenda profissional
        const { data: userData, error } = await supabase
          .from('users')
          .select('agenda_enabled')
          .eq('id', userId)
          .single()
        
        if (!error && userData) {
          setIsAgendaActive(userData.agenda_enabled || false)
        }

        // Verificar se é dono de salão com agenda ativa
        const { data: salonData, error: salonError } = await supabase
          .from('salons_studios')
          .select('id, name')
          .eq('owner_id', userId)
          .single()

        if (!salonError && salonData) {
          setIsSalonOwner(true)
          setSalonName(salonData.name)

          // Verificar se tem agenda ativa no salão
          const { data: salonProfessionalData, error: salonProfessionalError } = await supabase
            .from('salon_professionals')
            .select('agenda_enabled')
            .eq('professional_id', userId)
            .eq('salon_id', salonData.id)
            .eq('status', 'accepted')
            .single()

          if (!salonProfessionalError && salonProfessionalData?.agenda_enabled) {
            // Se é dono de salão com agenda ativa, considerar como agenda ativa
            setIsAgendaActive(true)
          }
        } else {
          setIsSalonOwner(false)
          setSalonName(null)
        }
      } catch (err) {
        console.warn('Erro ao verificar status da agenda:', err)
      }
    }

    checkAgendaStatus()
  }, [professionalId, user?.id, loading]) // Re-executar quando loading muda

  const handleActivateAgenda = async () => {
    const result = await activateAgenda()
    if (result.success) {
      // Atualizar o contexto do usuário PRIMEIRO
      await refreshUser()
      // Aguardar um pouco para garantir que o contexto foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100))
      // Recarregar status após ativação
      await checkAgendaActivationStatus()
      // Chamar callback
      if (onAgendaActivated) {
        onAgendaActivated()
      }
    }
  }

  const handleDeactivateAgenda = async () => {
    const result = await deactivateAgenda()
    if (result.success) {
      // Atualizar o contexto do usuário PRIMEIRO
      await refreshUser()
      // Aguardar um pouco para garantir que o contexto foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100))
      // Recarregar status após desativação
      await checkAgendaActivationStatus()
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

  // Se é dono de salão com agenda ativa, mostrar card especial
  if (isSalonOwner && isAgendaActive && salonName) {
    const userId = professionalId || user?.id
    const userName = user?.name

    return (
      <div className="space-y-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Agenda do Salão Ativa
            </CardTitle>
            <CardDescription className="text-green-600">
              Você é dono do salão "{salonName}" e sua agenda está ativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Salão Ativo
              </Badge>
              <span className="text-sm text-green-600">
                Agenda do salão está funcionando
              </span>
            </div>
            
            <Button 
              onClick={handleDeactivateAgenda}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Desativando...' : 'Desativar Agenda do Salão'}
            </Button>
            
            <p className="text-xs text-green-500">
              ✅ Como dono do salão, sua agenda profissional está ativa e você pode receber agendamentos
            </p>
          </CardContent>
        </Card>

        {/* Card de Compartilhamento - Apenas quando showShareCard é true */}
        {showShareCard && userId && userName && (
          <ShareAgendaCard
            professionalId={userId}
            professionalName={userName}
          />
        )}
      </div>
    )
  }

  // Se é dono de salão mas agenda está desativada
  if (isSalonOwner && !isAgendaActive && salonName) {
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Clock className="h-5 w-5" />
            Agenda do Salão Pausada
          </CardTitle>
          <CardDescription className="text-orange-600">
            Você é dono do salão "{salonName}" mas a agenda está pausada
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              <Clock className="h-3 w-3 mr-1" />
              Salão Pausado
            </Badge>
            <span className="text-sm text-orange-600">
              Agenda do salão está pausada
            </span>
          </div>
          
          <Button 
            onClick={handleActivateAgenda}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Ativando...' : 'Ativar Agenda do Salão'}
          </Button>
          
          <p className="text-xs text-orange-500">
            Reative a agenda profissional do salão para voltar a receber agendamentos
          </p>
        </CardContent>
      </Card>
    )
  }

  // Se tem assinatura ativa (PRIORIDADE MÁXIMA)
  if (subscriptionInfo) {
    const userId = professionalId || user?.id
    const userName = user?.name

    return (
      <div className="space-y-6">
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
            
            {isAgendaActive ? (
              <Button 
                onClick={handleDeactivateAgenda}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Desativando...' : 'Desativar Agenda'}
              </Button>
            ) : canActivateAgenda ? (
              <Button 
                onClick={handleActivateAgenda}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {loading ? 'Ativando...' : 'Ativar Agenda Online'}
              </Button>
            ) : null}
            
            <p className="text-xs text-purple-500">
              {isAgendaActive 
                ? "✅ Sua agenda está ativa e você pode receber agendamentos de clientes"
                : "Ative sua agenda para começar a receber agendamentos"
              }
            </p>
          </CardContent>
        </Card>

        {/* Card de Compartilhamento - Apenas quando showShareCard é true E agenda está ativa */}
        {showShareCard && isAgendaActive && userId && userName && (
          <ShareAgendaCard
            professionalId={userId}
            professionalName={userName}
          />
        )}
      </div>
    )
  }

  // Se tem trial ativo (sem assinatura)
  if (trialInfo && trialInfo.status === 'active') {
    const daysRemaining = getDaysRemaining(trialInfo.end_date)
    const userId = professionalId || user?.id
    const userName = user?.name
    
    return (
      <div className="space-y-6">
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
            
            {isAgendaActive ? (
              <Button 
                onClick={handleDeactivateAgenda}
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                {loading ? 'Desativando...' : 'Desativar Agenda'}
              </Button>
            ) : canActivateAgenda ? (
              <Button 
                onClick={handleActivateAgenda}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {loading ? 'Ativando...' : 'Ativar Agenda Online'}
              </Button>
            ) : null}
            
            <p className="text-xs text-blue-500">
              {isAgendaActive 
                ? "✅ Sua agenda está ativa e você pode receber agendamentos de clientes"
                : "Após ativar, você poderá receber agendamentos de clientes"
              }
            </p>
          </CardContent>
        </Card>

        {/* Card de Compartilhamento - Apenas quando showShareCard é true E agenda está ativa */}
        {showShareCard && isAgendaActive && userId && userName && (
          <ShareAgendaCard
            professionalId={userId}
            professionalName={userName}
          />
        )}
      </div>
    )
  }

  // Se já tem agenda ativa (sem trial nem assinatura ativos)
  if (isAgendaActive) {
    const userId = professionalId || user?.id
    const userName = user?.name

    return (
      <div className="space-y-6">
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
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativa
              </Badge>
              <span className="text-sm text-green-600">
                Você está recebendo agendamentos
              </span>
            </div>
            
            <Button 
              onClick={handleDeactivateAgenda}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {loading ? 'Desativando...' : 'Desativar Agenda'}
            </Button>
          </CardContent>
        </Card>

        {/* Card de Compartilhamento - Apenas quando showShareCard é true */}
        {showShareCard && userId && userName && (
          <ShareAgendaCard
            professionalId={userId}
            professionalName={userName}
          />
        )}
      </div>
    )
  }

  // Se agenda está desativada mas tem trial ativo
  if (trialInfo && trialInfo.status === 'active' && !isAgendaActive) {
    const daysRemaining = getDaysRemaining(trialInfo.end_date)
    
    return (
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-orange-700">
            <Clock className="h-5 w-5" />
            Agenda Pausada
          </CardTitle>
          <CardDescription className="text-orange-600">
            Sua agenda está pausada. Você tem {daysRemaining} dias restantes no seu trial
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-orange-600" />
              <span className="text-sm text-orange-600">
                Válido até {formatDate(trialInfo.end_date)}
              </span>
            </div>
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {daysRemaining} dias restantes
            </Badge>
          </div>
          
          <Button 
            onClick={handleActivateAgenda}
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            {loading ? 'Ativando...' : 'Ativar Agenda Online'}
          </Button>
          
          <p className="text-xs text-orange-500">
            Reative sua agenda para voltar a receber agendamentos
          </p>
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