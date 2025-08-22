import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Save, ArrowLeft, Clock, Bell, Calendar, Trash2, Plus, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
import { useSalonPermissions } from "@/hooks/useSalonPermissions"

const ConfiguracoesAgenda = () => {
  const { user } = useAuthContext()
  const { userSalon } = useSalons(user?.id)
  const { hasPermission, loading: permissionsLoading } = useSalonPermissions(userSalon?.id)

  // Verificar se pode gerenciar configurações
  if (!permissionsLoading && !hasPermission('system_settings.edit')) {
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
                Você não tem permissão para gerenciar configurações.
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl pt-20 pb-8">
        <div className="mb-8">
          <Link to="/agenda-profissional" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Agenda Profissional
          </Link>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Configurações da Agenda
          </h1>
          <p className="text-muted-foreground">
            Configure sua agenda profissional e serviços
          </p>
        </div>

        <div className="space-y-6">
          {/* Horário de Funcionamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Horário de Funcionamento
              </CardTitle>
              <CardDescription>
                Configure os horários de atendimento
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="abertura">Horário de Abertura</Label>
                  <Input id="abertura" type="time" defaultValue="08:00" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fechamento">Horário de Fechamento</Label>
                  <Input id="fechamento" type="time" defaultValue="18:00" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dias de Funcionamento</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"].map((dia) => (
                    <div key={dia} className="flex items-center space-x-2">
                      <Switch id={dia} defaultChecked={dia !== "Domingo"} />
                      <Label htmlFor={dia}>{dia}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notificações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notificações
              </CardTitle>
              <CardDescription>
                Configure as notificações da agenda
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notif-email">Notificações por E-mail</Label>
                    <p className="text-sm text-muted-foreground">Receba notificações de novos agendamentos por e-mail</p>
                  </div>
                  <Switch id="notif-email" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notif-push">Notificações Push</Label>
                    <p className="text-sm text-muted-foreground">Receba notificações push no aplicativo</p>
                  </div>
                  <Switch id="notif-push" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="notif-whatsapp">Integração WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">Envie lembretes via WhatsApp para clientes</p>
                  </div>
                  <Switch id="notif-whatsapp" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Settings className="h-5 w-5 mr-2" />
                  Serviços Oferecidos
                </span>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Serviço
                </Button>
              </CardTitle>
              <CardDescription>
                Gerencie os serviços oferecidos na sua agenda
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { nome: "Corte + Escova", duracao: "1h 30min", preco: "R$ 80,00" },
                  { nome: "Manicure", duracao: "45min", preco: "R$ 35,00" },
                  { nome: "Pedicure", duracao: "1h", preco: "R$ 40,00" },
                  { nome: "Barba + Bigode", duracao: "30min", preco: "R$ 25,00" }
                ].map((servico, index) => (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gradient-card">
                    <div>
                      <h4 className="font-semibold">{servico.nome}</h4>
                      <p className="text-sm text-muted-foreground">{servico.duracao} • {servico.preco}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">Editar</Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integração Google Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Integração Google Calendar
              </CardTitle>
              <CardDescription>
                Sincronize sua agenda com o Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="google-sync">Sincronização Automática</Label>
                    <p className="text-sm text-muted-foreground">Sincronize agendamentos automaticamente com Google Calendar</p>
                  </div>
                  <Switch id="google-sync" />
                </div>
                <Button variant="outline">
                  Conectar com Google Calendar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex gap-4 pt-4">
            <Button className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
            <Button variant="outline" asChild>
              <Link to="/agenda-profissional">Cancelar</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracoesAgenda;