import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BackButton } from "@/components/ui/back-button"
import { Check, Star, Calendar, Bell, Users, BarChart3, Smartphone } from "lucide-react"
import plansImage from "@/assets/plans-beauty.jpg"

const Planos = () => {
  const planos = [
    {
      id: "start",
      nome: "BeautyTime Start",
      preco: "39,90",
      periodo: "mês",
      descricao: "Perfeito para profissionais autônomos",
      profissionais: "1 profissional",
      destaque: false,
      recursos: [
        "Notificação por e-mail para o cliente",
        "Notificações push 24h, 1h e 20min antes",
        "Notificação push para o profissional",
        "Sistema de avaliação completo",
        "Possibilidade de colocar um gestor",
        "Relatório de atendimento",
        "Integração com Google Agenda"
      ]
    },
    {
      id: "pro",
      nome: "BeautyTime Pro",
      preco: "49,90", 
      periodo: "mês",
      descricao: "Ideal para pequenos salões",
      profissionais: "Até 5 profissionais",
      destaque: true,
      recursos: [
        "Tudo do BeautyTime Start",
        "Gerenciar múltiplos profissionais",
        "Verificar agenda de todos os profissionais",
        "Relatórios consolidados",
        "Gestão centralizada"
      ]
    },
    {
      id: "plus",
      nome: "BeautyTime Plus",
      preco: "69,90",
      periodo: "mês", 
      descricao: "Para salões estabelecidos",
      profissionais: "Até 10 profissionais",
      destaque: false,
      recursos: [
        "Tudo do BeautyTime Pro",
        "Até 10 profissionais inclusos",
        "Possibilidade de adicionar mais profissionais",
        "Relatórios avançados",
        "Suporte prioritário"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle pt-20 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Botão Voltar */}
        <div className="mb-6">
          <BackButton 
            variant="outline" 
            size="sm"
            className="hover:bg-gradient-card hover:border-primary/40"
          />
        </div>
        
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Planos BeautyTime
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Transforme sua agenda em uma ferramenta profissional
          </p>
          <div className="relative rounded-2xl overflow-hidden max-w-4xl mx-auto mb-8">
            <img 
              src={plansImage} 
              alt="Agenda profissional da beleza" 
              className="w-full h-64 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-hero opacity-20"></div>
          </div>
        </div>

        {/* Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {planos.map((plano) => (
            <Card key={plano.id} className={`relative ${plano.destaque ? 'ring-2 ring-primary shadow-beauty' : ''}`}>
              {plano.destaque && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary">
                  <Star className="h-3 w-3 mr-1" />
                  Mais Popular
                </Badge>
              )}
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{plano.nome}</CardTitle>
                <CardDescription>{plano.descricao}</CardDescription>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-primary">R$ {plano.preco}</span>
                  <span className="text-muted-foreground">/{plano.periodo}</span>
                </div>
                <Badge variant="secondary" className="mt-2">{plano.profissionais}</Badge>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plano.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{recurso}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant={plano.destaque ? "hero" : "outline"} 
                  className="w-full"
                >
                  Assinar Agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Plano Adicional */}
        <Card className="max-w-2xl mx-auto mb-12">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">BeautyTime Ad</CardTitle>
            <CardDescription>Adicione mais profissionais ao seu plano Plus</CardDescription>
            <div className="mt-4">
              <span className="text-3xl font-bold text-primary">R$ 9,90</span>
              <span className="text-muted-foreground">/profissional adicional</span>
            </div>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              Disponível apenas para assinantes do BeautyTime Plus
            </p>
            <Badge variant="outline" className="mb-4">Sem limite de profissionais</Badge>
            <br />
            <Button variant="outline" className="mt-4">
              Adicionar Profissionais
            </Button>
          </CardContent>
        </Card>

        {/* Funcionalidades em Destaque */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardContent className="p-6">
              <Calendar className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Agenda Inteligente</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie todos os agendamentos em um só lugar
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Bell className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Notificações Automáticas</h3>
              <p className="text-sm text-muted-foreground">
                Lembre seus clientes automaticamente
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Múltiplos Profissionais</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie toda sua equipe facilmente
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Relatórios Detalhados</h3>
              <p className="text-sm text-muted-foreground">
                Acompanhe o desempenho do seu negócio
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Planos;