import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, Download, Filter, TrendingUp, Users, Calendar, ArrowLeft, DollarSign, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
import { useSalonPermissions } from "@/hooks/useSalonPermissions"

const RelatoriosAgenda = () => {
  const { user } = useAuthContext()
  const { userSalon } = useSalons(user?.id)
  const { hasPermission, loading: permissionsLoading } = useSalonPermissions(userSalon?.id)

  // Verificar se pode ver relatórios
  if (!permissionsLoading && !hasPermission('reports.view')) {
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
                <Link to="/agenda-profissional">Voltar para Agenda</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="mb-8">
          <Link to="/agenda-profissional" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Agenda Profissional
          </Link>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Relatórios da Agenda
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o desempenho da sua agenda profissional
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data-inicio">Data Início</Label>
                <Input id="data-inicio" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-fim">Data Fim</Label>
                <Input id="data-fim" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="joao">João Silva</SelectItem>
                    <SelectItem value="maria">Maria Santos</SelectItem>
                    <SelectItem value="carlos">Carlos Lima</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button className="w-full">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Agendamentos</p>
                  <p className="text-2xl font-bold text-primary">124</p>
                </div>
                <Calendar className="h-8 w-8 text-primary opacity-80" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-3 w-3 mr-1 text-secondary" />
                <span className="text-secondary">+12%</span>
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Clientes Atendidos</p>
                  <p className="text-2xl font-bold text-primary">89</p>
                </div>
                <Users className="h-8 w-8 text-primary opacity-80" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-3 w-3 mr-1 text-secondary" />
                <span className="text-secondary">+8%</span>
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Faturamento</p>
                  <p className="text-2xl font-bold text-primary">R$ 8.750</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary opacity-80" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-3 w-3 mr-1 text-secondary" />
                <span className="text-secondary">+15%</span>
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
                  <p className="text-2xl font-bold text-primary">87%</p>
                </div>
                <BarChart3 className="h-8 w-8 text-primary opacity-80" />
              </div>
              <div className="flex items-center mt-2 text-sm">
                <TrendingUp className="h-3 w-3 mr-1 text-secondary" />
                <span className="text-secondary">+5%</span>
                <span className="text-muted-foreground ml-1">vs mês anterior</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Relatório Detalhado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Desempenho por Profissional</CardTitle>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nome: "João Silva", agendamentos: 45, faturamento: "R$ 3.200", ocupacao: "92%" },
                  { nome: "Maria Santos", agendamentos: 38, faturamento: "R$ 2.850", ocupacao: "85%" },
                  { nome: "Carlos Lima", agendamentos: 41, faturamento: "R$ 2.700", ocupacao: "89%" }
                ].map((prof, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gradient-card">
                    <div>
                      <h4 className="font-semibold">{prof.nome}</h4>
                      <p className="text-sm text-muted-foreground">{prof.agendamentos} agendamentos</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{prof.faturamento}</p>
                      <Badge variant="secondary">{prof.ocupacao}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Serviços Mais Procurados</CardTitle>
              <CardDescription>Últimos 30 dias</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { servico: "Corte + Escova", quantidade: 28, porcentagem: "23%" },
                  { servico: "Manicure + Pedicure", quantidade: 24, porcentagem: "19%" },
                  { servico: "Coloração", quantidade: 18, porcentagem: "15%" },
                  { servico: "Barba + Bigode", quantidade: 15, porcentagem: "12%" },
                  { servico: "Sobrancelhas", quantidade: 12, porcentagem: "10%" }
                ].map((serv, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <h4 className="font-semibold">{serv.servico}</h4>
                      <p className="text-sm text-muted-foreground">{serv.quantidade} agendamentos</p>
                    </div>
                    <Badge variant="outline">{serv.porcentagem}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações */}
        <div className="mt-6 flex justify-end">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RelatoriosAgenda;