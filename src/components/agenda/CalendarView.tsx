import React, { useState, useMemo } from 'react'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Appointment } from '@/hooks/useAppointments'

interface CalendarViewProps {
  appointments: Appointment[]
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
  onAppointmentClick?: (appointment: Appointment) => void
  loading?: boolean
  className?: string
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  appointments,
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  loading = false,
  className = ''
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Agrupar agendamentos por data
  const appointmentsByDate = useMemo(() => {
    const grouped: Record<string, Appointment[]> = {}
    
    appointments.forEach(appointment => {
      const dateKey = appointment.date
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(appointment)
    })
    
    return grouped
  }, [appointments])

  // Obter agendamentos para uma data específica
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return appointmentsByDate[dateKey] || []
  }

  // Contar agendamentos por status para uma data
  const getAppointmentCounts = (date: Date) => {
    const dayAppointments = getAppointmentsForDate(date)
    return {
      pending: dayAppointments.filter(apt => apt.status === 'pending').length,
      confirmed: dayAppointments.filter(apt => apt.status === 'confirmed').length,
      completed: dayAppointments.filter(apt => apt.status === 'completed').length,
      cancelled: dayAppointments.filter(apt => apt.status === 'cancelled').length
    }
  }

  // Navegar para o mês anterior
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() - 1)
      return newMonth
    })
  }

  // Navegar para o próximo mês
  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev)
      newMonth.setMonth(prev.getMonth() + 1)
      return newMonth
    })
  }

  // Ir para hoje
  const goToToday = () => {
    setCurrentMonth(new Date())
    onDateSelect?.(new Date())
  }

  // Renderizar indicadores de agendamento para cada dia
  const renderDayContent = (date: Date) => {
    const counts = getAppointmentCounts(date)
    const totalAppointments = counts.pending + counts.confirmed + counts.completed + counts.cancelled
    
    if (totalAppointments === 0) return null

    return (
      <div className="flex flex-col items-center gap-1 p-1">
        <div className="text-xs font-medium">{totalAppointments}</div>
        <div className="flex gap-0.5">
          {counts.pending > 0 && (
            <div className="w-1 h-1 bg-yellow-500 rounded-full" />
          )}
          {counts.confirmed > 0 && (
            <div className="w-1 h-1 bg-green-500 rounded-full" />
          )}
          {counts.completed > 0 && (
            <div className="w-1 h-1 bg-blue-500 rounded-full" />
          )}
          {counts.cancelled > 0 && (
            <div className="w-1 h-1 bg-red-500 rounded-full" />
          )}
        </div>
      </div>
    )
  }

  // Obter agendamentos do dia selecionado
  const selectedDateAppointments = selectedDate ? getAppointmentsForDate(selectedDate) : []

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header do Calendário */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <CalendarIcon className="h-5 w-5" />
              Agenda
            </CardTitle>
            <div className="flex items-center justify-center sm:justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                disabled={loading}
                className="text-xs sm:text-sm"
              >
                Hoje
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                disabled={loading}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-base sm:text-lg font-semibold text-center">
            {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateSelect?.(date)}
            month={currentMonth}
            onMonthChange={setCurrentMonth}
            className="w-full"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-xs sm:text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-6 w-6 sm:h-7 sm:w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-8 sm:w-9 font-normal text-[0.7rem] sm:text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-8 w-8 sm:h-9 sm:w-9 text-center text-xs sm:text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "h-8 w-8 sm:h-9 sm:w-9 p-0 font-normal aria-selected:opacity-100",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              DayContent: ({ date }) => (
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="text-sm">
                    {format(date, 'd')}
                  </span>
                  {renderDayContent(date)}
                </div>
              )
            }}
          />
        </CardContent>
      </Card>

      {/* Agendamentos do Dia Selecionado */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              {format(selectedDate, 'EEEE, dd/MM/yyyy', { locale: ptBR })}
              {isToday(selectedDate) && (
                <Badge variant="secondary">Hoje</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum agendamento para este dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedDateAppointments
                  .sort((a, b) => a.start_time.localeCompare(b.start_time))
                  .map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-3 sm:p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => onAppointmentClick?.(appointment)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                          <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                            <AvatarImage 
                              src={appointment.professional?.profile_photo} 
                              alt={appointment.professional?.name}
                            />
                            <AvatarFallback>
                              {appointment.professional?.name?.charAt(0) || 'P'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm sm:text-base truncate">
                              {appointment.professional?.name || 'Profissional'}
                            </h4>
                            <p className="text-xs sm:text-sm text-muted-foreground truncate">
                              {appointment.service?.name || 'Serviço'}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={
                            appointment.status === 'confirmed' ? 'default' :
                            appointment.status === 'pending' ? 'secondary' :
                            appointment.status === 'completed' ? 'outline' :
                            'destructive'
                          }
                          className="text-xs flex-shrink-0"
                        >
                          {appointment.status === 'pending' && 'Pendente'}
                          {appointment.status === 'confirmed' && 'Confirmado'}
                          {appointment.status === 'completed' && 'Concluído'}
                          {appointment.status === 'cancelled' && 'Cancelado'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {appointment.start_time} - {appointment.end_time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{appointment.client?.name || 'Cliente'}</span>
                        </div>
                        {appointment.salon?.address && (
                          <div className="flex items-center gap-2 md:col-span-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="truncate">{appointment.salon.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legenda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full" />
              <span>Pendente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Confirmado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Concluído</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Cancelado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
