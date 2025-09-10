import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Heart, Calendar, Search, Star, MessageCircle } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"
import featuresImage from "@/assets/features-beauty.jpg"

const userFeatures = [
  {
    icon: Search,
    title: "Encontre Profissionais",
    description: "Descubra os melhores profissionais da beleza próximos a você com filtros inteligentes"
  },
  {
    icon: Heart,
    title: "BeautyWall",
    description: "Explore um feed inspirador com os trabalhos mais incríveis da comunidade"
  },
  {
    icon: Star,
    title: "Avalie e Favorite",
    description: "Curta, comente e favorite os trabalhos que mais te inspiram"
  },
  {
    icon: Calendar,
    title: "Agende Facilmente",
    description: "Marque seus horários diretamente com os profissionais através do app"
  }
]

const professionalFeatures = [
  {
    icon: Users,
    title: "Divulgue seu Trabalho",
    description: "Compartilhe seus trabalhos no BeautyWall e ganhe visibilidade"
  },
  {
    icon: Calendar,
    title: "BeautyTime Agenda",
    description: "Sistema completo de agendamento online com notificações automáticas"
  },
  {
    icon: MessageCircle,
    title: "Conecte-se com Clientes",
    description: "Interaja diretamente com seus seguidores e potenciais clientes"
  },
  {
    icon: Star,
    title: "Sistema de Avaliações",
    description: "Receba feedback dos clientes e construa sua reputação"
  }
]

export function Features() {
  const [activeTab, setActiveTab] = useState<'usuario' | 'profissional'>('usuario')

  return (
    <section className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Como Funciona
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O Beautycom oferece experiências personalizadas para cada tipo de usuário
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex justify-center mb-12">
          <div className="bg-gradient-card rounded-xl p-1.5 sm:p-2 inline-flex gap-2 sm:gap-3 shadow-beauty-card">
            <Button
              variant={activeTab === 'usuario' ? 'hero' : 'outline'}
              size="default"
              onClick={() => setActiveTab('usuario')}
              className={`rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base ${
                activeTab === 'usuario' 
                  ? 'shadow-beauty-glow scale-105' 
                  : 'hover:bg-gradient-card hover:border-primary/40'
              }`}
            >
              <Users className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Sou Usuário</span>
              <span className="sm:hidden">Usuário</span>
            </Button>
            <Button
              variant={activeTab === 'profissional' ? 'hero' : 'outline'}
              size="default"
              onClick={() => setActiveTab('profissional')}
              className={`rounded-lg sm:rounded-xl transition-all duration-300 text-sm sm:text-base ${
                activeTab === 'profissional' 
                  ? 'shadow-beauty-glow scale-105' 
                  : 'hover:bg-gradient-card hover:border-primary/40'
              }`}
            >
              <Star className="mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden sm:inline">Sou Profissional</span>
              <span className="sm:hidden">Profissional</span>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {(activeTab === 'usuario' ? userFeatures : professionalFeatures).map((feature, index) => (
            <Card 
              key={index} 
              className="p-6 text-center hover:shadow-beauty-card transition-all duration-300 hover:-translate-y-2 bg-background/50 backdrop-blur-sm border-primary/10"
            >
              <div className="bg-gradient-primary rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </Card>
          ))}
        </div>

        {/* Visual Section */}
        <div className="mt-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-beauty">
              <img 
                src={featuresImage} 
                alt="Ferramentas e workspace de beleza profissional" 
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-primary opacity-10"></div>
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-4">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Tecnologia e Beleza
                </span>
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Unimos o melhor da tecnologia com a paixão pela beleza. Nossa plataforma 
                oferece ferramentas modernas para profissionais e uma experiência única 
                para quem busca serviços de qualidade.
              </p>
              {activeTab === 'usuario' ? (
                <Link to="/membros">
                  <Button variant="hero" size="xl">
                    Encontrar Profissionais
                  </Button>
                </Link>
              ) : (
                <Link to="/cadastro">
                  <Button variant="hero" size="xl">
                    Cadastrar como Profissional
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}