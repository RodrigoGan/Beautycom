import React, { useState, useEffect } from 'react'
import { Header } from "@/components/Header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, MapPin, Star, X, Plus, User, Settings, BarChart3, Trash2, ChevronDown, ChevronUp, Phone, MessageCircle } from "lucide-react"
import { Link } from "react-router-dom"
import { useAppointments } from '@/hooks/useAppointments'
import { CalendarView } from '@/components/agenda/CalendarView'
import { Appointment } from '@/hooks/useAppointments'
import { format, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PersonalScheduleModal } from '@/components/PersonalScheduleModal'
import { AppointmentSuccessModal } from '@/components/AppointmentSuccessModal'
import { useToast } from '@/hooks/use-toast'

const AgendaPessoal = () => {
  const {
    appointments,
    loading,
    pendingAppointments,
    confirmedAppointments,
    todayAppointments,
    upcomingAppointments,
    cancelAppointment,
    fetchAppointments
  } = useAppointments()

  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<Appointment | null>(null)
  const [cancellationReason, setCancellationReason] = useState('')
  const [expandedAppointments, setExpandedAppointments] = useState<Set<string>>(new Set())
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)
  
  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Carregar agendamentos do usuário (apenas como cliente)
  useEffect(() => {
    fetchAppointments(undefined, true) // asClientOnly = true
  }, [fetchAppointments])

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
  }

  const handleCancelAppointment = (appointment: Appointment) => {
    setAppointmentToDelete(appointment)
    setCancellationReason('') // Limpar motivo anterior
    setIsDeleteModalOpen(true)
  }

  const confirmDeleteAppointment = async () => {
    if (!appointmentToDelete) return
    
    // Validar se o motivo foi preenchido
    if (!cancellationReason.trim()) {
      toast({
        title: "Motivo obrigatório",
        description: "Por favor, informe o motivo do cancelamento.",
        variant: "destructive"
      })
      return
    }
    
    try {
      const result = await cancelAppointment(appointmentToDelete.id, cancellationReason.trim())
      
      if (result?.error) {
        throw new Error(result.error)
      }
      
      // Recarregar agendamentos para atualizar a lista
      await fetchAppointments(undefined, true) // asClientOnly = true
      
      toast({
        title: "Agendamento cancelado",
        description: "O agendamento foi cancelado e o profissional foi notificado.",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao cancelar agendamento:', error)
      toast({
        title: "Erro ao cancelar",
        description: "Não foi possível cancelar o agendamento. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsDeleteModalOpen(false)
      setAppointmentToDelete(null)
      setCancellationReason('')
    }
  }


  const handleDisabledFeature = (featureName: string) => {
    console.log('Botão clicado:', featureName) // Debug
    
    // Mostrar toast bonito
    toast({
      title: "Funcionalidade em Desenvolvimento",
      description: `Breve: ${featureName} estará disponível em breve!`,
      variant: "default"
    })
  }

  const toggleAppointmentExpansion = (appointmentId: string) => {
    setExpandedAppointments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(appointmentId)) {
        newSet.delete(appointmentId)
      } else {
        newSet.add(appointmentId)
      }
      return newSet
    })
  }

  const openWhatsApp = (phone: string, message?: string) => {
    const cleanPhone = phone.replace(/\D/g, '')
    const defaultMessage = message || 'Olá! Gostaria de falar sobre meu agendamento.'
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`
    window.open(whatsappUrl, '_blank')
  }

  // Obter agendamentos do dia selecionado
  const getSelectedDayAppointments = () => {
    if (!selectedDate) return []
    
    const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')
    return appointments.filter(appointment => 
      appointment.date === selectedDateStr && 
      appointment.status !== 'cancelled' // Não mostrar agendamentos cancelados
    )
  }

  const selectedDayAppointments = getSelectedDayAppointments()

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
          <Button 
            variant="hero" 
            className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm"
            onClick={() => setIsScheduleModalOpen(true)}
          >
            <Plus className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
            <span className="hidden sm:inline">Novo Agendamento</span>
            <span className="sm:hidden text-center leading-tight">Novo Agendamento</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm opacity-50 cursor-pointer hover:opacity-70"
            onClick={() => handleDisabledFeature('Ver Calendário')}
          >
            <Calendar className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
            <span className="hidden sm:inline">Ver Calendário</span>
            <span className="sm:hidden text-center leading-tight whitespace-pre-line">Ver{'\n'}Calendário</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm opacity-50 cursor-pointer hover:opacity-70"
            onClick={() => handleDisabledFeature('Meus Favoritos')}
          >
            <Star className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
            <span className="hidden sm:inline">Meus Favoritos</span>
            <span className="sm:hidden text-center leading-tight whitespace-pre-line">Meus{'\n'}Favoritos</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-auto p-3 sm:p-4 flex-col text-xs sm:text-sm opacity-50 cursor-pointer hover:opacity-70"
            onClick={() => handleDisabledFeature('Relatórios')}
          >
            <BarChart3 className="h-4 w-4 sm:h-6 sm:w-6 mb-1 sm:mb-2" />
            <span className="hidden sm:inline">Relatórios</span>
            <span className="sm:hidden text-center leading-tight">Relatórios</span>
          </Button>
        </div>

        <div className="flex flex-col items-center gap-4 sm:gap-6">
          {/* Calendário - Centralizado */}
          <div className="w-full max-w-4xl">
            <CalendarView
              appointments={appointments}
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              onAppointmentClick={handleAppointmentClick}
              loading={loading}
            />
          </div>

          {/* Card do Dia Selecionado */}
          <div className="w-full max-w-4xl">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {format(selectedDate, "EEEE, dd/MM/yyyy", { locale: ptBR })}
                  {isToday(selectedDate) && (
                    <Badge variant="secondary" className="ml-2">Hoje</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {selectedDayAppointments.length > 0 
                    ? `${selectedDayAppointments.length} agendamento(s) para este dia`
                    : 'Nenhum agendamento para este dia'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedDayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayAppointments.map((appointment) => {
                      const isExpanded = expandedAppointments.has(appointment.id)
                      return (
                        <div key={appointment.id} className="p-4 rounded-lg border bg-card">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage 
                                  src={appointment.professional?.profile_photo} 
                                  alt={appointment.professional?.name}
                                />
                                <AvatarFallback>
                                  {appointment.professional?.name?.charAt(0) || 'P'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="font-medium">
                                  {appointment.professional?.name || 'Profissional'}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.service?.name || 'Serviço'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge 
                                variant={
                                  appointment.status === 'pending' ? 'secondary' :
                                  appointment.status === 'confirmed' ? 'default' :
                                  appointment.status === 'completed' ? 'outline' : 'destructive'
                                }
                              >
                                {appointment.status === 'pending' && 'Pendente'}
                                {appointment.status === 'confirmed' && 'Confirmado'}
                                {appointment.status === 'completed' && 'Concluído'}
                                {appointment.status === 'cancelled' && 'Cancelado'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAppointmentExpansion(appointment.id)}
                                className="h-8 w-8 p-0"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(new Date(`${appointment.date}T${appointment.start_time}`), 'HH:mm', { locale: ptBR })} - 
                              {format(new Date(`${appointment.date}T${appointment.end_time}`), 'HH:mm', { locale: ptBR })}
                            </span>
                            <span className="mx-2">•</span>
                            <span>{appointment.duration_minutes} min</span>
                            <span className="mx-2">•</span>
                            <span>R$ {appointment.price?.toFixed(2) || '0,00'}</span>
                          </div>

                          {/* Informações expandidas */}
                          {isExpanded && (
                            <div className="border-t pt-3 mt-3 space-y-3">
                              {/* Endereço do Salão */}
                              {appointment.salon && (
                                <div className="flex items-start gap-2">
                                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                  <div className="text-sm">
                                    <p className="font-medium">{appointment.salon.name}</p>
                                    <p className="text-muted-foreground">
                                      {appointment.salon.logradouro}, {appointment.salon.numero}
                                    </p>
                                    <p className="text-muted-foreground">
                                      {appointment.salon.bairro} - {appointment.salon.cidade}/{appointment.salon.uf}
                                    </p>
                                  </div>
                                </div>
                              )}

                              {/* Contato do Profissional */}
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {appointment.professional?.phone || 'Telefone não informado'}
                                </span>
                              </div>

                              {/* WhatsApp */}
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    if (appointment.professional?.phone) {
                                      openWhatsApp(
                                        appointment.professional.phone,
                                        `Olá ${appointment.professional?.name}! Gostaria de falar sobre meu agendamento de ${appointment.service?.name} no dia ${format(new Date(`${appointment.date}T${appointment.start_time}`), 'dd/MM/yyyy às HH:mm', { locale: ptBR })}.`
                                      )
                                    } else {
                                      toast({
                                        title: "Telefone não disponível",
                                        description: "O telefone do profissional não está cadastrado.",
                                        variant: "destructive"
                                      })
                                    }
                                  }}
                                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                  disabled={!appointment.professional?.phone}
                                >
                                  <MessageCircle className="h-4 w-4 mr-2" />
                                  Enviar WhatsApp
                                </Button>
                              </div>
                            </div>
                          )}

                          {appointment.status === 'pending' && (
                            <div className="flex flex-col gap-2">
                              <div className="text-xs text-muted-foreground text-center">
                                Aguardando confirmação do profissional
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleCancelAppointment(appointment)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancelar Agendamento
                              </Button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <Calendar className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">
                      Nenhum agendamento para este dia
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

        </div>
      </div>

      {/* Modal de Novo Agendamento */}
      <PersonalScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onAppointmentCreated={(appointment) => {
          setCreatedAppointment(appointment)
          setShowSuccessModal(true)
        }}
      />

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Agendamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar este agendamento? O profissional será notificado sobre o cancelamento.
            </DialogDescription>
          </DialogHeader>
          
          {appointmentToDelete && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage 
                    src={appointmentToDelete.professional?.profile_photo} 
                    alt={appointmentToDelete.professional?.name}
                  />
                  <AvatarFallback>
                    {appointmentToDelete.professional?.name?.charAt(0) || 'P'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h4 className="font-medium">
                    {appointmentToDelete.professional?.name || 'Profissional'}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {appointmentToDelete.service?.name || 'Serviço'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(`${appointmentToDelete.date}T${appointmentToDelete.start_time}`), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                </div>
              </div>
              
              {/* Campo de motivo do cancelamento */}
              <div className="mt-4">
                <label htmlFor="cancellation-reason" className="block text-sm font-medium mb-2">
                  Motivo do cancelamento *
                </label>
                <Textarea
                  id="cancellation-reason"
                  placeholder="Informe o motivo do cancelamento..."
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  className="min-h-[80px]"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {cancellationReason.length}/500 caracteres
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteAppointment}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sim, Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Sucesso do Agendamento */}
      <AppointmentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        appointment={createdAppointment}
        onSend={() => {
          console.log('Mensagem enviada com sucesso!')
        }}
      />
    </div>
  )
}

export default AgendaPessoal