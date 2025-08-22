import React, { useState } from 'react'
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Clock, MapPin, Star, X, Plus, User, Settings, BarChart3 } from "lucide-react"
import { Link } from "react-router-dom"
import { useAppointments } from '@/hooks/useAppointments'
import { CalendarView } from '@/components/agenda/CalendarView'
import { Appointment } from '@/hooks/useAppointments'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const AgendaPessoal = () => {
  const {
    appointments,
    loading,
    pendingAppointments,
    confirmedAppointments,
    todayAppointments,
    upcomingAppointments,
    cancelAppointment,
    confirmAppointment
  } = useAppointments()

  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
  }

  const handleCancelAppointment = async (appointmentId: string) => {
    await cancelAppointment(appointmentId, 'Cancelado pelo cliente')
  }

  const handleConfirmAppointment = async (appointmentId: string) => {
    await confirmAppointment(appointmentId)
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-20 pb-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Minha Agenda Pessoal
          </h1>
          <p className="text-muted-foreground">
            Acompanhe seus agendamentos e histórico de serviços
          </p>
        </div>

        {/* Ações Rápidas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <Button variant="hero" className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm" asChild>
            <Link to="/novo-agendamento">
              <Plus className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
              <span className="hidden sm:inline">Novo Agendamento</span>
              <span className="sm:hidden">Novo</span>
            </Link>
          </Button>
          <Button variant="outline" className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm">
            <Calendar className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
            <span className="hidden sm:inline">Ver Calendário</span>
            <span className="sm:hidden">Calendário</span>
          </Button>
          <Button variant="outline" className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm">
            <Star className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
            <span className="hidden sm:inline">Meus Favoritos</span>
            <span className="sm:hidden">Favoritos</span>
          </Button>
          <Button variant="outline" className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm">
            <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden">Relatórios</span>
          </Button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Calendário */}
          <div className="xl:col-span-2">
            <CalendarView
              appointments={appointments}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onAppointmentClick={handleAppointmentClick}
              loading={loading}
            />
          </div>

          {/* Sidebar com Resumos */}
          <div className="space-y-4 sm:space-y-6">
            {/* Resumo Rápido */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Hoje</span>
                  <Badge variant="secondary">{todayAppointments.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Pendentes</span>
                  <Badge variant="outline">{pendingAppointments.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Confirmados</span>
                  <Badge variant="default">{confirmedAppointments.length}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Próximos</span>
                  <Badge variant="secondary">{upcomingAppointments.length}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Próximos Agendamentos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Agendamentos</CardTitle>
                <CardDescription>Seus próximos serviços</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : upcomingAppointments.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Nenhum agendamento futuro</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingAppointments.slice(0, 3).map((appointment) => (
                      <div key={appointment.id} className="p-3 rounded-lg border bg-card">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={appointment.professional?.profile_photo} 
                                alt={appointment.professional?.name}
                              />
                              <AvatarFallback>
                                {appointment.professional?.name?.charAt(0) || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium text-sm">
                                {appointment.professional?.name || 'Profissional'}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {appointment.service?.name || 'Serviço'}
                              </p>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              appointment.status === 'confirmed' ? 'default' :
                              appointment.status === 'pending' ? 'secondary' :
                              'outline'
                            }
                            className="text-xs"
                          >
                            {appointment.status === 'pending' && 'Pendente'}
                            {appointment.status === 'confirmed' && 'Confirmado'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(`${appointment.date}T${appointment.start_time}`), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agendamentos Pendentes */}
            {pendingAppointments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pendentes de Confirmação</CardTitle>
                  <CardDescription>Agendamentos aguardando confirmação</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingAppointments.slice(0, 2).map((appointment) => (
                      <div key={appointment.id} className="p-3 rounded-lg border bg-yellow-50">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage 
                                src={appointment.professional?.profile_photo} 
                                alt={appointment.professional?.name}
                              />
                              <AvatarFallback>
                                {appointment.professional?.name?.charAt(0) || 'P'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="font-medium text-sm">
                                {appointment.professional?.name || 'Profissional'}
                              </h4>
                              <p className="text-xs text-muted-foreground">
                                {appointment.service?.name || 'Serviço'}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Pendente
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                          <Clock className="h-3 w-3" />
                          <span>
                            {format(new Date(`${appointment.date}T${appointment.start_time}`), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 text-xs"
                            onClick={() => handleConfirmAppointment(appointment.id)}
                          >
                            Confirmar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs"
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgendaPessoal