import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, Search, Filter, ArrowLeft, Plus, Edit, Trash2, AlertCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "@/components/Header"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
import { useSalonPermissions } from "@/hooks/useSalonPermissions"
import { useAppointments } from "@/hooks/useAppointments"
import { useState, useEffect } from "react"

const AgendaCompleta = () => {
  const { user } = useAuthContext()
  const { userSalon } = useSalons(user?.id)
  const { hasPermission, isOwner, isEmployee, loading: permissionsLoading } = useSalonPermissions(userSalon?.id)
  const { appointments, loading: appointmentsLoading, fetchSalonAppointments } = useAppointments()
  
  // Estados para filtros
  const [filters, setFilters] = useState({
    search: '',
    startDate: '',
    endDate: '',
    professional: 'todos',
    status: 'todos'
  })

  // Verificar se pode acessar a agenda completa
  const canAccessCompleteAgenda = () => {
    if (!user) return false
    
    // Proprietário sempre pode acessar
    if (isOwner()) return true
    
    // Profissionais podem ver sua própria agenda e de outros se tiverem permissão
    if (user.user_type === 'profissional') return true
    
    // Funcionários com permissão podem acessar
    if (isEmployee() && hasPermission('appointments.view')) return true
    
    return false
  }

  if (!permissionsLoading && !canAccessCompleteAgenda()) {
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
                Você não tem permissão para acessar a agenda completa.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Para acessar a agenda completa, você precisa ser proprietário, profissional ou funcionário com permissão de visualização.
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

  // Carregar agendamentos do salão
  useEffect(() => {
    if (userSalon?.id) {
      fetchSalonAppointments(userSalon.id)
    }
  }, [userSalon?.id, fetchSalonAppointments])

  // Filtrar agendamentos
  const filteredAppointments = appointments.filter(appointment => {
    const matchesSearch = !filters.search || 
      appointment.client?.name?.toLowerCase().includes(filters.search.toLowerCase()) ||
      appointment.service?.name?.toLowerCase().includes(filters.search.toLowerCase())
    
    const matchesDateRange = (!filters.startDate || appointment.date >= filters.startDate) &&
                           (!filters.endDate || appointment.date <= filters.endDate)
    
    const matchesProfessional = filters.professional === 'todos' || 
      appointment.professional?.id === filters.professional
    
    const matchesStatus = filters.status === 'todos' || 
      appointment.status === filters.status
    
    return matchesSearch && matchesDateRange && matchesProfessional && matchesStatus
  })

  // Obter lista única de profissionais
  const professionals = [...new Set(appointments.map(apt => apt.professional?.id).filter(Boolean))]

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="mb-8">
          <Link to="/agenda-profissional" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Agenda Profissional
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Agenda Completa
              </h1>
              <p className="text-muted-foreground">
                Visualize e gerencie todos os agendamentos
              </p>
            </div>
            {hasPermission('appointments.create') && (
              <Button asChild>
                <Link to="/novo-agendamento">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Agendamento
                </Link>
              </Button>
            )}
          </div>
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
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="busca">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input 
                    id="busca" 
                    placeholder="Cliente, serviço..." 
                    className="pl-10"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-inicio">Data Início</Label>
                <Input 
                  id="data-inicio" 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="data-fim">Data Fim</Label>
                <Input 
                  id="data-fim" 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profissional">Profissional</Label>
                <Select value={filters.professional} onValueChange={(value) => setFilters(prev => ({ ...prev, professional: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    {appointments
                      .filter(apt => apt.professional)
                      .map(apt => apt.professional!)
                      .filter((prof, index, arr) => arr.findIndex(p => p.id === prof.id) === index)
                      .map(prof => (
                        <SelectItem key={prof.id} value={prof.id}>
                          {prof.name}
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                    <SelectItem value="no_show">Não Compareceu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Agendamentos */}
        <Card>
          <CardHeader>
            <CardTitle>Agendamentos</CardTitle>
            <CardDescription>
              {appointmentsLoading ? 'Carregando...' : `${filteredAppointments.length} agendamentos encontrados`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Carregando agendamentos...</div>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Nenhum agendamento encontrado</p>
                  <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-gradient-card transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-center min-w-[80px]">
                        <div className="font-semibold text-primary">{appointment.start_time}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(appointment.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          {appointment.client?.name || 'Cliente não informado'}
                          <Badge variant={
                            appointment.status === "confirmed" ? "secondary" :
                            appointment.status === "pending" ? "outline" :
                            appointment.status === "completed" ? "default" :
                            appointment.status === "cancelled" ? "destructive" : "secondary"
                          }>
                            {appointment.status === "pending" ? "Pendente" :
                             appointment.status === "confirmed" ? "Confirmado" :
                             appointment.status === "completed" ? "Concluído" :
                             appointment.status === "cancelled" ? "Cancelado" :
                             appointment.status === "no_show" ? "Não Compareceu" : appointment.status}
                          </Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground">{appointment.service?.name || 'Serviço não informado'}</p>
                        <p className="text-xs text-muted-foreground">
                          com {appointment.professional?.name || 'Profissional não informado'}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-primary">
                          R$ {appointment.price?.toFixed(2).replace('.', ',') || '0,00'}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {hasPermission('appointments.edit') && (
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {hasPermission('appointments.cancel') && (
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Paginação */}
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-muted-foreground">
                {appointmentsLoading ? 'Carregando...' : `Mostrando ${filteredAppointments.length} agendamentos`}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Próximo
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AgendaCompleta;