import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Check, X, CreditCard, Gift, Crown, Zap, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  max_professionals: number
  price_monthly: number
  price_yearly: number
  features: string[]
  is_popular?: boolean
  icon?: React.ReactNode
}

interface SubscriptionPlansModalProps {
  isOpen: boolean
  onClose: () => void
  currentSubscription?: any
  onSubscriptionChange?: () => void
}

export const SubscriptionPlansModal: React.FC<SubscriptionPlansModalProps> = ({
  isOpen,
  onClose,
  currentSubscription,
  onSubscriptionChange
}) => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  // Removido billingCycle - apenas mensal por enquanto

  // Carregar planos disponíveis
  useEffect(() => {
    if (isOpen) {
      fetchPlans()
    }
  }, [isOpen])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      
      // Usar valores fixos da página de Planos para garantir consistência
      const fixedPlans: SubscriptionPlan[] = [
        {
          id: 'start',
          name: 'BeautyTime Start',
          description: 'Agenda online para 1 profissional',
          max_professionals: 1,
          price_monthly: 39.90,
          price_yearly: 39.90,
          features: [
            'Notificação por e-mail para o cliente',
            'Notificações push 24h, 1h e 20min antes',
            'Notificação push para o profissional',
            'Sistema de avaliação completo',
            'Possibilidade de colocar um gestor',
            'Relatório de atendimento',
            'Integração com Google Agenda'
          ],
          icon: getPlanIcon('BeautyTime Start'),
          is_popular: false
        },
        {
          id: 'pro',
          name: 'BeautyTime Pro',
          description: 'Agenda online para até 5 profissionais',
          max_professionals: 5,
          price_monthly: 49.90,
          price_yearly: 49.90,
          features: [
            'Tudo do BeautyTime Start',
            'Gerenciar múltiplos profissionais',
            'Verificar agenda de todos os profissionais',
            'Relatórios consolidados',
            'Gestão centralizada'
          ],
          icon: getPlanIcon('BeautyTime Pro'),
          is_popular: true
        },
        {
          id: 'plus',
          name: 'BeautyTime Plus',
          description: 'Agenda online para até 10 profissionais',
          max_professionals: 10,
          price_monthly: 89.90,
          price_yearly: 89.90,
          features: [
            'Tudo do BeautyTime Pro',
            'Até 10 profissionais inclusos',
            'Possibilidade de adicionar mais profissionais',
            'Relatórios avançados',
            'Suporte prioritário'
          ],
          icon: getPlanIcon('BeautyTime Plus'),
          is_popular: false
        },
        {
          id: 'ad',
          name: 'BeautyTime Ad',
          description: 'Adiciona +1 profissional',
          max_professionals: 1,
          price_monthly: 29.90,
          price_yearly: 29.90,
          features: [
            '+1 profissional adicional',
            'Sem limite de profissionais',
            'Disponível apenas para assinantes do BeautyTime Plus'
          ],
          icon: getPlanIcon('BeautyTime Ad'),
          is_popular: false
        }
      ]

      setPlans(fixedPlans)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      toast({
        title: 'Erro ao carregar planos',
        description: 'Não foi possível carregar os planos disponíveis.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case 'BeautyTime Start':
        return <Gift className="h-6 w-6" />
      case 'BeautyTime Pro':
        return <Crown className="h-6 w-6" />
      case 'BeautyTime Plus':
        return <Zap className="h-6 w-6" />
      case 'BeautyTime Ad':
        return <CreditCard className="h-6 w-6" />
      default:
        return <CreditCard className="h-6 w-6" />
    }
  }

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case 'BeautyTime Start':
        return 'border-blue-200 bg-blue-50'
      case 'BeautyTime Pro':
        return 'border-purple-200 bg-purple-50'
      case 'BeautyTime Plus':
        return 'border-orange-200 bg-orange-50'
      case 'BeautyTime Ad':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const handleSelectPlan = async (planId: string) => {
    if (!user) {
      toast({
        title: 'Erro',
        description: 'Você precisa estar logado para assinar um plano.',
        variant: 'destructive'
      })
      return
    }

    try {
      setSelectedPlan(planId)
      
      // TODO: Integrar com Stripe aqui
      // Por enquanto, vamos simular o processo
      
      toast({
        title: 'Redirecionando para pagamento...',
        description: 'Você será redirecionado para o Stripe para finalizar o pagamento.',
        variant: 'default'
      })

      // Simular redirecionamento para Stripe
      setTimeout(() => {
        toast({
          title: 'Integração Stripe',
          description: 'Esta funcionalidade será implementada em breve. Por enquanto, você pode testar o sistema com o trial gratuito.',
          variant: 'default'
        })
        onClose()
      }, 2000)

    } catch (error) {
      console.error('Erro ao selecionar plano:', error)
      toast({
        title: 'Erro ao processar',
        description: 'Não foi possível processar a seleção do plano.',
        variant: 'destructive'
      })
    } finally {
      setSelectedPlan(null)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getDiscount = (monthlyPrice: number, yearlyPrice: number) => {
    const monthlyTotal = monthlyPrice * 12
    const discount = ((monthlyTotal - yearlyPrice) / monthlyTotal) * 100
    return Math.round(discount)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Escolha seu Plano
          </DialogTitle>
          <DialogDescription className="text-center">
            Selecione o plano ideal para seu negócio e comece a receber agendamentos online
          </DialogDescription>
        </DialogHeader>

        {/* Informação sobre cobrança mensal */}
        <div className="flex justify-center mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-800">
              💳 <strong>Cobrança mensal</strong> - Cancele a qualquer momento
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Planos principais: Start, Pro, Plus */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {plans.filter(plan => plan.name !== 'BeautyTime Ad').map((plan) => {
              const price = plan.price_monthly // Apenas mensal por enquanto
              const isPopular = plan.is_popular
              const isSelected = selectedPlan === plan.id
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isPopular ? 'ring-2 ring-purple-500 scale-105' : ''
                  } ${isSelected ? 'ring-2 ring-primary' : ''} ${getPlanColor(plan.name)}`}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white">
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-4">
                    <div className="flex justify-center mb-2">
                      {plan.icon}
                    </div>
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <CardDescription className="text-sm">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="mb-4">
                      <div className="text-3xl font-bold">
                        {formatPrice(price)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        por mês
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-6">
                      <div className="text-sm font-medium">
                        Até {plan.max_professionals} profissional{plan.max_professionals > 1 ? 'is' : ''}
                      </div>
                      {plan.features && plan.features.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {plan.features.slice(0, 2).join(' • ')}
                        </div>
                      )}
                    </div>
                    
                    <Button 
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      disabled={isSelected}
                    >
                      {isSelected ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Assinar
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
            </div>

            {/* BeautyTime Ad - linha separada */}
            {plans.filter(plan => plan.name === 'BeautyTime Ad').map((plan) => {
              const price = plan.price_monthly
              const isSelected = selectedPlan === plan.id
              
              return (
                <div key={plan.id} className="flex justify-center">
                  <Card 
                    className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg max-w-sm w-full ${
                      isSelected ? 'ring-2 ring-primary' : ''
                    } ${getPlanColor(plan.name)}`}
                    onClick={() => handleSelectPlan(plan.id)}
                  >
                    <CardHeader className="text-center pb-4">
                      <div className="flex justify-center mb-2">
                        {plan.icon}
                      </div>
                      <CardTitle className="text-lg">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {plan.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent className="text-center">
                      <div className="mb-4">
                        <div className="text-3xl font-bold">
                          {formatPrice(price)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          por mês
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-6">
                        <div className="text-sm font-medium">
                          +{plan.max_professionals} profissional{plan.max_professionals > 1 ? 'is' : ''} adicional{plan.max_professionals > 1 ? 'is' : ''}
                        </div>
                        {plan.features && plan.features.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {plan.features.slice(0, 2).join(' • ')}
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        className="w-full"
                        variant="outline"
                        disabled={isSelected}
                      >
                        {isSelected ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          <>
                            <CreditCard className="h-4 w-4 mr-2" />
                            Adicionar
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}

        {/* Informações adicionais */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Garantia de 30 dias:</strong> Cancele a qualquer momento sem taxas
            </p>
            <p>
              Todos os planos incluem suporte 24/7 e atualizações automáticas
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
