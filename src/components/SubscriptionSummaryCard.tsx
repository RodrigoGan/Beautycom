import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Calendar, Users, Clock, CreditCard, AlertCircle, Gift, ExternalLink, Settings } from 'lucide-react'
import { useSubscriptionInfo } from '@/hooks/useSubscriptionInfo'
import { useAuthContext } from '@/contexts/AuthContext'
import { SubscriptionPlansModal } from './SubscriptionPlansModal'

interface SubscriptionSummaryCardProps {
  userId?: string
  onSubscriptionChange?: () => void
}

export const SubscriptionSummaryCard: React.FC<SubscriptionSummaryCardProps> = ({
  userId,
  onSubscriptionChange
}) => {
  const { user } = useAuthContext()
  const { loading, subscriptionSummary, error, refetch } = useSubscriptionInfo(userId)
  const [showPlansModal, setShowPlansModal] = useState(false)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }


  const handleTestUpgrade = async () => {
    const targetUserId = userId || user?.id
    if (!targetUserId || !subscriptionSummary?.subscriptionInfo) return

    try {
      setUpgradeLoading(true)
      console.log('🧪 Testando upgrade de plano para BeautyTime Pro...')

      // Simular upgrade de BeautyTime Start (1 agenda) para BeautyTime Pro (5 agendas)
      const { supabase } = await import('@/lib/supabase')
      
      // 1. Buscar o plano BeautyTime Pro
      const { data: proPlan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('name', 'BeautyTime Pro')
        .single()

      if (planError || !proPlan) {
        console.error('❌ Erro ao buscar plano BeautyTime Pro:', planError)
        return
      }

      console.log('✅ Plano BeautyTime Pro encontrado:', proPlan)

      // 2. Atualizar a assinatura para o novo plano
      const { error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          plan_id: proPlan.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionSummary.subscriptionInfo.id)

      if (updateError) {
        console.error('❌ Erro ao atualizar assinatura:', updateError)
        return
      }

      console.log('✅ Assinatura atualizada para BeautyTime Pro')

      // 3. Atualizar informações de assinatura
      await refetch()
      onSubscriptionChange?.()

      console.log('🎉 Upgrade de teste concluído com sucesso!')
      console.log('📊 Agora o Rodrigo tem direito a 5 agendas em vez de 1')

    } catch (error) {
      console.error('❌ Erro no upgrade de teste:', error)
    } finally {
      setUpgradeLoading(false)
    }
  }

  const getStatusBadge = () => {
    if (!subscriptionSummary) return null

    switch (subscriptionSummary.type) {
      case 'trial':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            <Gift className="h-3 w-3 mr-1" />
            Trial
          </Badge>
        )
      case 'subscription':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
            <CreditCard className="h-3 w-3 mr-1" />
            Ativa
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-orange-600 border-orange-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Expirada
          </Badge>
        )
    }
  }

  const getDescription = () => {
    if (!subscriptionSummary) return 'Carregando informações...'

    const daysRemaining = subscriptionSummary.daysRemaining
    const daysText = daysRemaining !== undefined && !isNaN(daysRemaining) ? daysRemaining : 0

    switch (subscriptionSummary.type) {
      case 'trial':
        return `Trial Gratuito • ${daysText} dias restantes`
      case 'subscription':
        return `${subscriptionSummary.planName} • Renovação em ${daysText} dias`
      default:
        return 'Sem assinatura ativa'
    }
  }

  const getActionButton = () => {
    if (!subscriptionSummary) return null

    switch (subscriptionSummary.type) {
      case 'trial':
        if (subscriptionSummary.isActive) {
          return (
            <div className="flex gap-2">
              <Button 
                onClick={() => setShowPlansModal(true)}
                size="sm"
                className="bg-gradient-primary hover:bg-gradient-primary/90 text-white"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Assinar Agora
              </Button>
            </div>
          )
        }
        return (
          <Button 
            onClick={() => setShowPlansModal(true)}
            size="sm"
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver Planos
          </Button>
        )
      case 'subscription':
        if (subscriptionSummary.status === 'active') {
                  return (
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowPlansModal(true)}
              size="sm"
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Gerenciar
            </Button>
          </div>
        )
        }
        return (
          <Button 
            onClick={() => setShowPlansModal(true)}
            size="sm"
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Reativar
          </Button>
        )
      default:
        return (
          <Button 
            onClick={() => setShowPlansModal(true)}
            size="sm"
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Assinar
          </Button>
        )
    }
  }

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Resumo da Assinatura
            <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
          </CardTitle>
          <CardDescription>
            <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 sm:hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="text-center">
                <div className="h-6 w-8 bg-gray-200 rounded animate-pulse mx-auto mb-1"></div>
                <div className="h-3 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-6 border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            Erro ao Carregar Assinatura
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Resumo da Assinatura
            {getStatusBadge()}
          </CardTitle>
          <CardDescription asChild>
            <div>
              {getDescription()}
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Mobile: Apenas 3 métricas essenciais */}
          <div className="grid grid-cols-3 gap-4 sm:hidden">
            <div className="text-center">
              <div className="text-lg font-bold text-accent">
                {subscriptionSummary?.currentProfessionals || 0}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Profissionais
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {subscriptionSummary?.currentProfessionals || 0}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Agendas Ativas
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {subscriptionSummary?.maxProfessionals ? 
                  Math.max(0, subscriptionSummary.maxProfessionals - (subscriptionSummary.currentProfessionals || 0)) : 
                  '∞'
                }
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
              <div className="text-lg font-bold text-accent">
                {subscriptionSummary?.currentProfessionals || 0}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Users className="h-3 w-3" />
                Profissionais
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">
                {subscriptionSummary?.currentProfessionals || 0}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Clock className="h-3 w-3" />
                Agendas Ativas
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {subscriptionSummary?.maxProfessionals ? 
                  Math.max(0, subscriptionSummary.maxProfessionals - (subscriptionSummary.currentProfessionals || 0)) : 
                  '∞'
                }
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                Vagas Restantes
              </div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {subscriptionSummary?.daysRemaining !== undefined && !isNaN(subscriptionSummary.daysRemaining) 
                  ? subscriptionSummary.daysRemaining 
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Calendar className="h-3 w-3" />
                Dias Restantes
              </div>
            </div>
          </div>

          {/* Botão de ação */}
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {subscriptionSummary?.expirationDate && (
                  <>
                    {subscriptionSummary.type === 'trial' ? 'Trial expira em' : 'Renovação em'}{' '}
                    <span className="font-medium">
                      {formatDate(subscriptionSummary.expirationDate)}
                    </span>
                  </>
                )}
              </div>
              {getActionButton()}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Planos */}
      <SubscriptionPlansModal
        isOpen={showPlansModal}
        onClose={() => setShowPlansModal(false)}
        currentSubscription={subscriptionSummary}
        onSubscriptionChange={onSubscriptionChange}
      />
    </>
  )
}
