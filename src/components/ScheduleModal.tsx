import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Calendar, Clock, User, X, Loader2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { TimeSlotSelector } from './TimeSlotSelector'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'
import { useSalons } from '@/hooks/useSalons'
import { useAppointments } from '@/hooks/useAppointments'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface ScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onAppointmentCreated?: (appointment: any) => void
  professional: {
    id: string
    name: string
    profile_photo?: string
    salon_id?: string
  }
}

interface ProfessionalService {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({ 
  isOpen, 
  onClose, 
  onAppointmentCreated,
  professional 
}) => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const { userSalon } = useSalons(user?.id)
  const { createAppointment } = useAppointments()
  
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<ProfessionalService[]>([])
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')

  // Buscar serviços do profissional
  useEffect(() => {
    if (isOpen && professional.id) {
      fetchProfessionalServices()
    }
  }, [isOpen, professional.id])



  const fetchProfessionalServices = async () => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('professional_services')
        .select('*')
        .eq('professional_id', professional.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      
      setServices(data || [])
      
      // Selecionar primeiro serviço por padrão
      if (data && data.length > 0) {
        setSelectedService(data[0].id)
      }
      
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
      toast({
        title: 'Erro ao carregar serviços',
        description: 'Não foi possível carregar os serviços disponíveis.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }



  const handleSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !user) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      
      // Verificar se o usuário tem um salão (cliente) ou é o próprio profissional
      let salonId = professional.salon_id
      let clientId = user.id
      let professionalId = professional.id
      
      // Se o usuário logado é o próprio profissional, não pode agendar consigo mesmo
      if (user.id === professional.id) {
        toast({
          title: 'Agendamento inválido',
          description: 'Você não pode agendar um horário consigo mesmo.',
          variant: 'destructive'
        })
        return
      }

      // Se o usuário não tem salão, usar o salão do profissional
      if (!salonId && userSalon?.id) {
        salonId = userSalon.id
      }

      // Calcular horário de fim baseado na duração do serviço
      const selectedServiceData = services.find(s => s.id === selectedService)
      const serviceDuration = selectedServiceData?.duration_minutes || 30
      
      // Calcular end_time (subtrair 1 minuto para evitar conflitos)
      const [startHour, startMinute] = selectedTime.split(':').map(Number)
      const endTime = new Date(2000, 0, 1, startHour, startMinute + serviceDuration - 1, 0)
      const endTimeString = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
      

      
      // Criar o agendamento usando o hook (que inclui notificações)
      const result = await createAppointment({
        salon_id: salonId,
        client_id: clientId,
        professional_id: professionalId,
        service_id: selectedService,
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTimeString,
        duration_minutes: serviceDuration,
        price: selectedServiceData?.price || 0,
        notes: notes
      })

      if (result.error) throw new Error(result.error)

      // Chamar callback do componente pai com os dados do agendamento
      onAppointmentCreated?.(result.data)
      
      // Fechar modal de agendamento
      onClose()
      resetForm()
      
    } catch (error) {
      console.error('Erro ao criar agendamento:', error)
      toast({
        title: 'Erro ao agendar',
        description: 'Não foi possível criar o agendamento. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSelectedService('')
    setSelectedDate('')
    setSelectedTime('')
    setNotes('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  // Verificar se o usuário pode agendar
  const canSchedule = user && user.id !== professional.id

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Agendar com {professional.name}
          </DialogTitle>
          <DialogDescription>
            Escolha o serviço, data e horário para seu agendamento
          </DialogDescription>
        </DialogHeader>

        {!canSchedule ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {user ? 'Você não pode agendar um horário consigo mesmo.' : 'Faça login para agendar um horário.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Informações do Profissional */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={professional.profile_photo} alt={professional.name} />
                <AvatarFallback className="bg-gradient-primary text-white font-semibold">
                  {professional.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{professional.name}</p>
                <p className="text-sm text-muted-foreground">Profissional</p>
              </div>
            </div>

            {/* Seleção de Serviço */}
            <div className="space-y-2">
              <Label htmlFor="service">Serviço</Label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um serviço" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      <div className="flex justify-between items-center w-full">
                        <span>{service.name}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          R$ {service.price.toFixed(2).replace('.', ',')}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedService && (
                <p className="text-xs text-muted-foreground">
                  Duração: {services.find(s => s.id === selectedService)?.duration_minutes} minutos
                </p>
              )}
            </div>

            {/* Seleção de Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Seletor de Horários */}
            {selectedDate && selectedService ? (
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <div className="border rounded-lg p-4">
                  <TimeSlotSelector
                    professionalId={professional.id}
                    salonId={professional.salon_id || null}
                    selectedDate={selectedDate}
                    serviceDuration={services.find(s => s.id === selectedService)?.duration_minutes || 30}
                    onTimeSlotSelect={setSelectedTime}
                    selectedTimeSlot={selectedTime}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <div className="p-4 text-center text-sm text-muted-foreground border rounded-md">
                  {!selectedDate ? 'Selecione uma data primeiro' : 'Selecione um serviço primeiro'}
                </div>
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações (opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Alguma observação especial para o profissional..."
                rows={3}
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !selectedService || !selectedDate || !selectedTime}
                className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90 text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Agendando...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
      
    </Dialog>
  )
}
