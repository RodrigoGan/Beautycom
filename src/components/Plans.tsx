import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Users, Zap, Crown } from "lucide-react"
import { Link } from "react-router-dom"
import plansImage from "@/assets/plans-beauty.jpg"

const plans = [
  {
    name: "BeautyTime Start",
    price: "R$ 39,90",
    icon: Users,
    description: "Perfeito para profissionais individuais",
    badge: null,
    features: [
      "1 Profissional",
      "Notificações por e-mail",
      "Notificações Push (24h, 1h, 20min)",
      "Sistema de avaliações",
      "Relatório de atendimento",
      "Integração Google Agenda",
      "Possibilidade de gestor"
    ]
  },
  {
    name: "BeautyTime Pro",
    price: "R$ 49,90",
    icon: Star,
    description: "Ideal para pequenas equipes",
    badge: "Mais Popular",
    features: [
      "Até 5 Profissionais",
      "Tudo do plano Start",
      "Visualizar múltiplas agendas",
      "Gestão centralizada",
      "Relatórios por profissional"
    ]
  },
  {
    name: "BeautyTime Plus",
    price: "R$ 89,90",
    icon: Crown,
    description: "Para salões e estúdios maiores",
    badge: "Recomendado",
    features: [
      "Até 10 Profissionais",
      "Tudo do plano Pro",
      "Gestão avançada",
      "Múltiplos gestores",
      "Relatórios detalhados",
      "Suporte prioritário"
    ]
  },
  {
    name: "BeautyTime Ad",
    price: "R$ 29,90",
    icon: Zap,
    description: "Adicione mais profissionais",
    badge: "Complementar",
    features: [
      "Apenas para plano Plus",
      "Profissionais adicionais",
      "Preço por unidade",
      "Sem limite de quantidade",
      "Flexibilidade total"
    ]
  }
]

export function Plans() {
  return (
    <section className="py-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Planos BeautyTime
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para sua agenda profissional e transforme sua forma de trabalhar
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={index} 
              className={`relative p-6 text-center hover:shadow-beauty-card transition-all duration-300 hover:-translate-y-2 ${
                plan.badge === 'Mais Popular' ? 'border-primary shadow-beauty-card scale-105' : 'border-primary/10'
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white"
                >
                  {plan.badge}
                </Badge>
              )}

              {/* Icon */}
              <div className={`rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 ${
                plan.badge === 'Mais Popular' ? 'bg-gradient-hero' : 'bg-gradient-primary'
              }`}>
                <plan.icon className="h-6 w-6 text-white" />
              </div>

              {/* Plan name */}
              <h3 className="font-bold text-xl mb-2">{plan.name}</h3>
              
              {/* Price */}
              <div className="mb-4">
                <span className="text-3xl font-bold text-primary">{plan.price}</span>
                <span className="text-muted-foreground">/mês</span>
              </div>

              {/* Description */}
              <p className="text-muted-foreground text-sm mb-6">{plan.description}</p>

              {/* Features */}
              <ul className="space-y-3 mb-8 text-left">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <Check className="h-4 w-4 text-primary mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <Link to="/planos">
                <Button 
                  variant={plan.badge === 'Mais Popular' ? 'hero' : 'beauty'} 
                  className="w-full"
                >
                  {index === 3 ? 'Adicionar' : 'Escolher Plano'}
                </Button>
              </Link>
            </Card>
          ))}
        </div>

        {/* Visual Section */}
        <div className="mt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  BeautyTime em Ação
                </span>
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Simplifique sua agenda profissional com nossa tecnologia intuitiva. 
                Notificações automáticas, relatórios detalhados e integração com suas 
                ferramentas favoritas. Foque no que você faz de melhor: criar beleza.
              </p>
              <div className="text-center lg:text-left">
                <p className="text-muted-foreground text-sm mb-4">
                  ✨ Teste gratuito de 7 dias • Cancele quando quiser
                </p>
                <Link to="/cadastro">
                  <Button variant="hero" size="xl">
                    Começar Teste Grátis
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative rounded-2xl overflow-hidden shadow-beauty lg:order-first">
              <img 
                src={plansImage} 
                alt="Agenda profissional de beleza no smartphone" 
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-secondary opacity-10"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}