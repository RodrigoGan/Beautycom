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

export const CalendarView: React.FC<CalendarViewProps> = (props) => {
  const {
    appointments,
    selectedDate,
    onDateSelect,
    onAppointmentClick,
    loading = false,
    className = ''
  } = props
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

  // Verificar se uma data tem agendamentos
  const hasAppointments = (date: Date) => {
    const counts = getAppointmentCounts(date)
    return counts.pending + counts.confirmed + counts.completed + counts.cancelled > 0
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
              DayContent: ({ date }) => {
                const isOutsideMonth = date.getMonth() !== currentMonth.getMonth()
                const isToday = isSameDay(date, new Date())
                const isSelected = selectedDate && isSameDay(date, selectedDate)
                const hasAppointmentsOnDay = hasAppointments(date)
                
                return (
                  <div className={`
                    relative w-full h-full flex items-center justify-center rounded-md
                    ${isOutsideMonth ? 'text-muted-foreground opacity-50' : ''}
                    ${isToday ? 'bg-accent text-accent-foreground' : ''}
                    ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                    ${hasAppointmentsOnDay && !isSelected ? 'bg-green-100 text-green-800 hover:bg-green-200' : ''}
                    hover:bg-accent hover:text-accent-foreground cursor-pointer
                  `}>
                    <span className="text-sm">
                      {format(date, 'd')}
                    </span>
                    {renderDayContent(date)}
                  </div>
                )
              }
            }}
          />
        </CardContent>
      </Card>

    </div>
  )
}
