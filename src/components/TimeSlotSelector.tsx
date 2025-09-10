import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, AlertCircle, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Funções utilitárias para timezone local
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getLocalTimeString = (date: Date) => {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

const isTimeInPast = (timeSlot: string, currentTime: string) => {
  return timeToMinutes(timeSlot) <= timeToMinutes(currentTime)
}

interface TimeSlotSelectorProps {
  professionalId: string
  salonId: string | null
  selectedDate: string
  serviceDuration: number // em minutos
  onTimeSlotSelect: (timeSlot: string) => void
  selectedTimeSlot?: string
}

interface AgendaConfig {
  id: string
  professional_id: string
  salon_id: string | null
  opening_time: string
  closing_time: string
  lunch_break_enabled: boolean
  lunch_start_time: string
  lunch_end_time: string
  working_days: {
    monday: boolean
    tuesday: boolean
    wednesday: boolean
    thursday: boolean
    friday: boolean
    saturday: boolean
    sunday: boolean
  }
}

interface Appointment {
  id: string
  start_time: string
  end_time: string
  duration_minutes: number
}

export const TimeSlotSelector = ({
  professionalId,
  salonId,
  selectedDate,
  serviceDuration,
  onTimeSlotSelect,
  selectedTimeSlot
}: TimeSlotSelectorProps) => {
  const [agendaConfig, setAgendaConfig] = useState<AgendaConfig | null>(null)
  const [existingAppointments, setExistingAppointments] = useState<Appointment[]>([])
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Buscar configuração de agenda do profissional
  const fetchAgendaConfig = useCallback(async () => {
    if (!professionalId) {
      return null
    }

    try {
      console.log('🔍 TimeSlotSelector - Verificando se profissional tem agenda ativa:', professionalId)
      
      // ✅ SIMPLIFICADO: Verificar apenas se o profissional tem agenda habilitada
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('agenda_enabled')
        .eq('id', professionalId)
        .single()
      
      if (userError) {
        console.error('❌ Erro ao verificar agenda_enabled:', userError)
        return null
      }
      
      if (!userData?.agenda_enabled) {
        console.log('❌ Profissional sem agenda habilitada:', professionalId)
        return null
      }
      
      console.log('✅ Profissional com agenda ativa:', professionalId)
      
      // Buscar configuração de agenda baseada APENAS no professional_id
      // Não importa se é agenda própria ou habilitada por salão
      console.log('🔍 Buscando configuração de agenda para professional_id:', professionalId)
      
      const { data, error } = await supabase
        .from('agenda_config')
        .select('*')
        .eq('professional_id', professionalId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar configuração de agenda:', error)
        console.error('❌ Código do erro:', error.code)
        console.error('❌ Mensagem:', error.message)
        console.error('❌ Detalhes:', error.details)
        console.error('❌ Hint:', error.hint)
        
        // Se não encontrou configuração, retornar configuração padrão
        console.log('⚠️ Configuração não encontrada, usando configuração padrão')
        return {
          id: 'default',
          professional_id: professionalId,
          monday_start: '08:00',
          monday_end: '18:00',
          tuesday_start: '08:00',
          tuesday_end: '18:00',
          wednesday_start: '08:00',
          wednesday_end: '18:00',
          thursday_start: '08:00',
          thursday_end: '18:00',
          friday_start: '08:00',
          friday_end: '18:00',
          saturday_start: '08:00',
          saturday_end: '18:00',
          sunday_start: '08:00',
          sunday_end: '18:00',
          break_start: '12:00',
          break_end: '13:00',
          slot_duration: 30,
          working_days: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: false
          },
          is_default: true
        }
      }

      console.log('✅ Configuração de agenda encontrada:', data)
      return data
    } catch (error) {
      console.error('❌ Erro ao buscar configuração de agenda:', error)
      return null
    }
  }, [professionalId])

  // Buscar agendamentos existentes para a data
  const fetchExistingAppointments = useCallback(async () => {
    try {
      // console.log('🔍 TimeSlotSelector - Buscando agendamentos para:', professionalId, 'data:', selectedDate)
      
      const { data, error } = await supabase
        .from('appointments')
        .select('id, start_time, end_time, duration_minutes, date')
        .eq('professional_id', professionalId)
        .eq('date', selectedDate)
        .not('status', 'eq', 'cancelled')

      if (error) {
        console.error('❌ Erro ao buscar agendamentos existentes:', error)
        return []
      }
      
      console.log('✅ Agendamentos encontrados:', data?.length || 0, data)
      return data || []
    } catch (error) {
      console.error('❌ Erro ao buscar agendamentos existentes:', error)
      return []
    }
  }, [professionalId, selectedDate])

  // Verificar se um horário está disponível
  const isTimeSlotAvailable = useCallback((timeSlot: string): { available: boolean; reason?: string } => {
    if (!agendaConfig) {
      return { available: false, reason: 'Configuração de agenda não encontrada' }
    }

    // Calcular o dia da semana da data selecionada
    const dateParts = selectedDate.split('-')
    const yearVal = parseInt(dateParts[0])
    const monthVal = parseInt(dateParts[1]) - 1 // getMonth() é 0-indexed
    const dayVal = parseInt(dateParts[2])
    const localDate = new Date(yearVal, monthVal, dayVal)
    const dayOfWeek = localDate.getDay()
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayName = dayNames[dayOfWeek]

    // Verificar se o profissional trabalha neste dia da semana
    if (!agendaConfig.working_days || !agendaConfig.working_days[dayName as keyof typeof agendaConfig.working_days]) {
      return { available: false, reason: 'Profissional não trabalha neste dia' }
    }

    // Se for hoje, verificar se o horário já passou
    const today = new Date()
    const todayStr = getLocalDateString(today)
    const isToday = selectedDate === todayStr
    
    if (isToday) {
      const currentTime = getLocalTimeString(today)
      
      // Se o horário já passou, não está disponível
      if (isTimeInPast(timeSlot, currentTime)) {
        return { available: false, reason: 'Horário já passou' }
      }
    }

    // Calcular horário de fim do agendamento
    // CONSIDERAR 1 MINUTO A MENOS PARA EVITAR JANELAS
    // Exemplo: serviço de 60 min → considerar 59 min → 14:00-14:59 (em vez de 14:00-15:00)
    const adjustedDuration = Math.max(serviceDuration - 1, 1) // Mínimo 1 minuto
    const startTime = new Date(`2000-01-01T${timeSlot}`)
    const endTime = new Date(startTime.getTime() + adjustedDuration * 60 * 1000)
    const endTimeString = endTime.toTimeString().slice(0, 5)
    
    // Debug removido para otimização

    // Verificar se está dentro do horário de funcionamento
    if (timeSlot < agendaConfig.opening_time || endTimeString > agendaConfig.closing_time) {
      return { available: false, reason: 'Horário fora do período de trabalho' }
    }

    // Verificar conflito com intervalo de almoço
    if (agendaConfig.lunch_break_enabled) {
      // Considerar 1 minuto a menos no intervalo de almoço para permitir agendamento imediatamente após
      const lunchEndAdjusted = new Date(`2000-01-01T${agendaConfig.lunch_end_time}`)
      lunchEndAdjusted.setMinutes(lunchEndAdjusted.getMinutes() - 1)
      const lunchEndAdjustedString = lunchEndAdjusted.toTimeString().slice(0, 5)
      
      if (timeSlot < lunchEndAdjustedString && endTimeString > agendaConfig.lunch_start_time) {
        return { available: false, reason: 'Horário conflita com intervalo de almoço' }
      }
    }

    // Verificar conflitos com agendamentos existentes
    for (const appointment of existingAppointments) {
      const appointmentStart = appointment.start_time
      const appointmentEnd = appointment.end_time

      // Verificar se há sobreposição real
      const hasOverlap = timeSlot < appointmentEnd && endTimeString > appointmentStart
      
      if (hasOverlap) {
        return { available: false, reason: 'Horário já ocupado' }
      }
    }

    return { available: true }
  }, [agendaConfig, selectedDate, serviceDuration, existingAppointments])

  // Gerar horários disponíveis
  const generateAvailableTimeSlots = useCallback(() => {
    if (!agendaConfig) {
      console.log('⚠️ TimeSlotSelector - Sem configuração de agenda para gerar horários')
      return []
    }

    // console.log('🕐 TimeSlotSelector - Gerando horários disponíveis...')
    // console.log('🕐 Configuração:', agendaConfig.opening_time, 'até', agendaConfig.closing_time)

    const slots: string[] = []
    const startTime = new Date(`2000-01-01T${agendaConfig.opening_time}`)
    const endTime = new Date(`2000-01-01T${agendaConfig.closing_time}`)
    
    // Intervalo de 30 minutos
    const intervalMinutes = 30
    let currentTime = new Date(startTime)

    while (currentTime < endTime) {
      const timeSlot = currentTime.toTimeString().slice(0, 5)
      const availability = isTimeSlotAvailable(timeSlot)
      
      if (availability.available) {
        slots.push(timeSlot)
      }

      currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes)
    }

    // console.log('✅ TimeSlotSelector - Horários gerados:', slots.length, slots)
    return slots
  }, [agendaConfig, isTimeSlotAvailable])

  // Verificar se a data selecionada é no passado (antes de hoje)
  const today = new Date()
  const todayStr = getLocalDateString(today)
  const isDateInPast = selectedDate < todayStr

  // Carregar dados quando mudar a data ou profissional
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      try {
        const [config, appointments] = await Promise.all([
          fetchAgendaConfig(),
          fetchExistingAppointments()
        ])

        setAgendaConfig(config)
        setExistingAppointments(appointments)
      } catch (error) {
        console.error('Erro ao carregar dados:', error)
        toast({
          title: 'Erro',
          description: 'Erro ao carregar horários disponíveis',
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedDate, professionalId, fetchAgendaConfig, fetchExistingAppointments, toast])

  // Gerar horários disponíveis quando os dados mudarem
  useEffect(() => {
    // Só gerar horários se não for uma data passada
    if (!isDateInPast) {
      const slots = generateAvailableTimeSlots()
      setAvailableTimeSlots(slots)
    } else {
      setAvailableTimeSlots([])
    }
  }, [generateAvailableTimeSlots, isDateInPast])
  
  // Debug removido para otimização

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Escolha o horário</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-sm text-muted-foreground">Carregando horários disponíveis...</div>
        </div>
      </div>
    )
  }

  if (isDateInPast) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Escolha o horário</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Não é possível agendar para datas passadas</p>
          </div>
        </div>
      </div>
    )
  }

  if (!agendaConfig) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Escolha o horário</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Configuração de agenda não encontrada</p>
          </div>
        </div>
      </div>
    )
  }

  // Verificar se o profissional trabalha neste dia
  // CORRIGIR PROBLEMA DE TIMEZONE: usar componentes locais da data
  const dateParts = selectedDate.split('-')
  const yearVal = parseInt(dateParts[0])
  const monthVal = parseInt(dateParts[1]) - 1 // getMonth() é 0-indexed
  const dayVal = parseInt(dateParts[2])
  const localDate = new Date(yearVal, monthVal, dayVal)
  const dayOfWeek = localDate.getDay()
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayName = dayNames[dayOfWeek]
  const worksOnThisDay = agendaConfig.working_days && agendaConfig.working_days[dayName as keyof typeof agendaConfig.working_days]

  if (!worksOnThisDay) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-medium">Escolha o horário</span>
        </div>
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Profissional não trabalha neste dia</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span className="text-sm font-medium">Escolha o horário</span>
      </div>
      <div>
        {availableTimeSlots.length === 0 ? (
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Nenhum horário disponível para esta data</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {availableTimeSlots.map((timeSlot) => {
              const isSelected = selectedTimeSlot === timeSlot
              const availability = isTimeSlotAvailable(timeSlot)
              
              return (
                <Button
                  key={timeSlot}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  className={`h-12 ${
                    isSelected 
                      ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white border-0 shadow-lg' 
                      : availability.available 
                        ? 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  onClick={() => {
                    if (availability.available) {
                      onTimeSlotSelect(timeSlot)
                    }
                  }}
                  disabled={!availability.available}
                >
                  <div className="flex items-center gap-1">
                    {isSelected && <Check className="h-3 w-3" />}
                    {timeSlot}
                  </div>
                </Button>
              )
            })}
          </div>
        )}
        
        {/* Informações adicionais */}
        <div className="mt-3 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
          <p><strong>Funcionamento:</strong> {agendaConfig.opening_time.slice(0, 5)} - {agendaConfig.closing_time.slice(0, 5)}</p>
          {agendaConfig.lunch_break_enabled && (
            <p><strong>Almoço:</strong> {agendaConfig.lunch_start_time.slice(0, 5)} - {agendaConfig.lunch_end_time.slice(0, 5)}</p>
          )}
          <p><strong>Duração:</strong> {serviceDuration} min</p>
        </div>
      </div>
    </div>
  )
}
