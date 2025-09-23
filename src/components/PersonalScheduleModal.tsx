import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Calendar, Clock, User, X, Loader2 } from 'lucide-react'
import { TimeSlotSelector } from './TimeSlotSelector'
import { ProfessionalSearchInput } from './ProfessionalSearchInput'
import { AppointmentSuccessModal } from './AppointmentSuccessModal'
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

interface PersonalScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onAppointmentCreated?: (appointment: any) => void
}

interface Professional {
  id: string
  name: string
  profile_photo?: string
  salon_id: string | null
}

interface ProfessionalService {
  id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  professional_id: string
}

export const PersonalScheduleModal: React.FC<PersonalScheduleModalProps> = ({ 
  isOpen, 
  onClose,
  onAppointmentCreated
}) => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const { userSalon } = useSalons(user?.id)
  const { createAppointment } = useAppointments()
  
  const [loading, setLoading] = useState(false)
  const [services, setServices] = useState<ProfessionalService[]>([])
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [selectedService, setSelectedService] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [notes, setNotes] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdAppointment, setCreatedAppointment] = useState<any>(null)

  // Buscar serviços quando um profissional é selecionado
  useEffect(() => {
    if (selectedProfessional) {
      fetchProfessionalServices()
      // Limpar seleções dependentes
      setSelectedService('')
      setSelectedDate('')
      setSelectedTime('')
    } else {
      setServices([])
      setSelectedService('')
      setSelectedDate('')
      setSelectedTime('')
    }
  }, [selectedProfessional])


  const fetchProfessionalServices = async () => {
    if (!selectedProfessional) return
    
    try {
      setLoading(true)
      
      const { data, error } = await supabase
        .from('professional_services')
        .select('*')
        .eq('professional_id', selectedProfessional.id)
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      
      setServices(data || [])
      
    } catch (error) {
      console.error('Erro ao buscar serviços:', error)
      toast({
        title: 'Erro ao carregar serviços',
        description: 'Não foi possível carregar os serviços do profissional.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedProfessional || !selectedService || !selectedDate || !selectedTime || !user) {
      toast({
        title: 'Dados incompletos',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive'
      })
      return
    }

    try {
      setLoading(true)
      
      // Verificar se o usuário logado é o próprio profissional
      if (user.id === selectedProfessional.id) {
        toast({
          title: 'Agendamento inválido',
          description: 'Você não pode agendar um horário consigo mesmo.',
          variant: 'destructive'
        })
        return
      }

      // Calcular horário de fim baseado na duração do serviço
      const selectedServiceData = services.find(s => s.id === selectedService)
      const serviceDuration = selectedServiceData?.duration_minutes || 30
      
      // Calcular end_time
      const [startHour, startMinute] = selectedTime.split(':').map(Number)
      const endTime = new Date(2000, 0, 1, startHour, startMinute + serviceDuration - 1, 0)
      const endTimeString = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`
      
      // Dados do agendamento para debug
      const appointmentData = {
        salon_id: selectedProfessional.salon_id || null, // Pode ser null para profissionais independentes
        client_id: user.id,
        professional_id: selectedProfessional.id,
        service_id: selectedService,
        date: selectedDate,
        start_time: selectedTime,
        end_time: endTimeString,
        duration_minutes: serviceDuration,
        price: selectedServiceData?.price || 0,
        notes: notes
      }
      
      // console.log('🔍 PersonalScheduleModal - Dados do agendamento:', appointmentData)
      // console.log('🔍 PersonalScheduleModal - Usuário logado:', user.id)
      // console.log('🔍 PersonalScheduleModal - Profissional selecionado:', selectedProfessional)
      // console.log('🔍 PersonalScheduleModal - Salon ID sendo enviado:', appointmentData.salon_id)

      // Criar o agendamento usando o hook (que inclui notificações)
      const result = await createAppointment(appointmentData)

      if (result.error) throw new Error(result.error)

      // Se há callback do componente pai, usar ele
      if (onAppointmentCreated) {
        onAppointmentCreated(result.data)
        onClose()
        resetForm()
      } else {
        // Senão, mostrar modal de sucesso interno
        setCreatedAppointment(result.data)
        setShowSuccessModal(true)
        onClose()
        resetForm()
      }
      
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
    setSelectedProfessional(null)
    setSelectedService('')
    setSelectedDate('')
    setSelectedTime('')
    setNotes('')
    setCreatedAppointment(null)
    setShowSuccessModal(false)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[95vw] max-w-md sm:max-w-lg md:max-w-2xl mx-2 sm:mx-4 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Novo Agendamento
          </DialogTitle>
          <DialogDescription>
            Escolha o profissional, serviço, data e horário para seu agendamento
          </DialogDescription>
        </DialogHeader>

        {!user ? (
          <div className="text-center py-8">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Faça login para agendar um horário.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {/* Informações do Cliente */}
            <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 bg-muted/30 rounded-lg">
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={user.profile_photo} alt={user.name} />
                <AvatarFallback>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">Cliente</p>
              </div>
            </div>

            {/* Seleção de Profissional */}
            <div className="space-y-2">
              <Label htmlFor="professional">Profissional</Label>
              <ProfessionalSearchInput
                onProfessionalSelect={setSelectedProfessional}
                selectedProfessional={selectedProfessional}
                placeholder="Digite o nome do profissional..."
                disabled={false}
              />
            </div>

            {/* Seleção de Serviço */}
            {!selectedProfessional ? (
              <div className="space-y-2">
                <Label htmlFor="service">Serviço</Label>
                <div className="p-3 sm:p-4 text-center border border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Selecione um profissional primeiro para ver os serviços disponíveis
                  </p>
                </div>
              </div>
            ) : (
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
            )}

            {/* Seleção de Data */}
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                disabled={!selectedProfessional}
                className={!selectedProfessional ? "opacity-50 cursor-not-allowed" : ""}
                placeholder={!selectedProfessional ? "Selecione um profissional primeiro" : ""}
              />
              {!selectedProfessional && (
                <p className="text-xs text-muted-foreground">
                  Selecione um profissional primeiro para escolher a data
                </p>
              )}
            </div>

            {/* Seletor de Horários */}
            {selectedDate && selectedService && selectedProfessional ? (
              <div className="space-y-2">
                <Label htmlFor="time">Horário</Label>
                <div className="border rounded-lg p-3 sm:p-4">
                  <TimeSlotSelector
                    professionalId={selectedProfessional.id}
                    salonId={selectedProfessional.salon_id || null}
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
                <div className="p-3 sm:p-4 text-center border border-dashed border-gray-300 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    {!selectedProfessional
                      ? "Selecione um profissional primeiro"
                      : !selectedService
                      ? "Selecione um serviço primeiro"
                      : !selectedDate
                      ? "Selecione uma data primeiro"
                      : "Preencha os campos anteriores para ver os horários disponíveis"
                    }
                  </p>
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
            <div className="flex gap-2 pt-3 sm:pt-4">
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
                disabled={loading || !selectedProfessional || !selectedService || !selectedDate || !selectedTime}
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
      
      {/* Modal de Sucesso */}
      <AppointmentSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        appointment={createdAppointment}
        onSend={() => {
          console.log('Mensagem enviada com sucesso!')
        }}
      />
    </Dialog>
  )
}
