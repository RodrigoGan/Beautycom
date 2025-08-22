import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles, Users, Calendar, Home, User, Image } from "lucide-react"
import { Link } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import heroImage from "@/assets/hero-beauty.jpg"

export function Hero() {
  const { user } = useAuthContext()
  const isLoggedIn = !!user
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 animate-bounce delay-100">
        <Sparkles className="h-8 w-8 text-primary/30" />
      </div>
      <div className="absolute top-40 right-20 animate-bounce delay-300">
        <Users className="h-6 w-6 text-secondary/30" />
      </div>
      <div className="absolute bottom-40 left-20 animate-bounce delay-500">
        <Calendar className="h-7 w-7 text-accent/30" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Conteúdo do lado esquerdo */}
          <div className="text-center lg:text-left">
            {/* Logo principal */}
            <div className="flex justify-center lg:justify-start mb-8">
              <img 
                src="/image/logotipobeautycom.png" 
                alt="Beautycom" 
                className="h-20 w-20 drop-shadow-lg"
              />
            </div>

            {/* Título principal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              {isLoggedIn ? (
                <>
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    Bem-vindo de volta,
                  </span>
                  <br />
                  <span className="text-foreground">
                    {user?.name || user?.nickname || 'Usuário'}!
                  </span>
                </>
              ) : (
                <>
                  <span className="bg-gradient-hero bg-clip-text text-transparent">
                    A Rede Social
                  </span>
                  <br />
                  <span className="text-foreground">
                    da Beleza
                  </span>
                </>
              )}
            </h1>

            {/* Subtítulo */}
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl lg:max-w-none leading-relaxed">
              {isLoggedIn 
                ? "Explore nossa comunidade, descubra novos profissionais e mantenha-se atualizado com as últimas tendências da beleza"
                : "Conecte-se com profissionais talentosos, descubra tendências e transforme sua paixão pela beleza em uma experiência única"
              }
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center mb-12">
              {isLoggedIn ? (
                <>
                  <Link to="/membros">
                    <Button variant="hero" size="xl" className="group">
                      Explorar Membros
                      <Users className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/beautywall">
                    <Button variant="outline" size="xl">
                      <Image className="mr-2 h-5 w-5" />
                      BeautyWall
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/cadastro">
                    <Button variant="hero" size="xl" className="group">
                      Começar Agora
                      <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/membros">
                    <Button variant="outline" size="xl">
                      Explorar sem Cadastro
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl lg:max-w-none">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-primary mb-2">1000+</div>
                <div className="text-sm text-muted-foreground">Profissionais</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-secondary mb-2">5000+</div>
                <div className="text-sm text-muted-foreground">Posts Compartilhados</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-accent mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">Disponível</div>
              </div>
            </div>
          </div>

          {/* Imagem do lado direito */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-beauty">
              <img 
                src={heroImage} 
                alt="Profissionais da beleza trabalhando" 
                className="w-full h-[500px] lg:h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
            </div>
            {/* Elemento decorativo */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-primary rounded-full opacity-20 animate-pulse"></div>
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-hero rounded-full opacity-15 animate-pulse delay-1000"></div>
          </div>
        </div>
      </div>
    </section>
  )
}