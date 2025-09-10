import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

// Interface para agendamento
interface Appointment {
  id: string
  client_id: string
  professional_id: string
  salon_id: string
  service_id: string
  date: string
  start_time: string
  end_time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  client?: {
    id: string
    name: string
    email: string
    profile_photo?: string
  }
  professional?: {
    id: string
    name: string
    email: string
    profile_photo?: string
  }
  service?: {
    id: string
    name: string
    duration_minutes: number
  }
  salon?: {
    id: string
    name: string
  }
}

// Mensagens de notificação
const NOTIFICATION_MESSAGES = {
  appointment_confirmed: {
    title: 'Agendamento confirmado!',
    message: 'Seu agendamento foi confirmado pelo profissional',
    priority: 'normal' as const
  },
  appointment_created: {
    title: 'Novo agendamento',
    message: 'Você tem um novo agendamento pendente de confirmação',
    priority: 'normal' as const
  },
  appointment_cancelled: {
    title: 'Agendamento cancelado pelo cliente',
    message: 'Um cliente cancelou um agendamento. A vaga foi liberada na sua agenda.',
    priority: 'high' as const
  },
  appointment_no_show: {
    title: 'Não comparecimento registrado',
    message: 'Seu agendamento foi marcado como não comparecimento',
    priority: 'high' as const
  },
  appointment_completed: {
    title: 'Agendamento concluído',
    message: 'Seu agendamento foi finalizado com sucesso',
    priority: 'normal' as const
  },
  appointment_pending: {
    title: 'Agendamento alterado',
    message: 'Seu agendamento foi alterado para pendente',
    priority: 'normal' as const
  },
  appointment_reminder_24h: {
    title: 'Lembrete de agendamento',
    message: 'Você tem um agendamento amanhã',
    priority: 'normal' as const
  },
  appointment_reminder_30min: {
    title: 'Agendamento em breve',
    message: 'Seu agendamento começa em 30 minutos',
    priority: 'urgent' as const
  }
}

export const useAppointmentNotifications = (salonId?: string) => {
  const { user } = useAuthContext()
  const [salonSettings, setSalonSettings] = useState<any>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const checkInterval = 5 * 60 * 1000 // 5 minutos

  // Função para criar notificação de agendamento
  const createAppointmentNotification = useCallback(async (
    appointment: Appointment,
    type: keyof typeof NOTIFICATION_MESSAGES,
    targetUserId: string
  ) => {
    console.log('🔔 createAppointmentNotification - Iniciando criação de notificação:', { type, targetUserId })
    
    if (!user?.id) {
      console.error('❌ createAppointmentNotification - user não autenticado')
      return false
    }

    try {
      const message = NOTIFICATION_MESSAGES[type]
      const appointmentDate = new Date(appointment.date)
      const formattedDate = appointmentDate.toLocaleDateString('pt-BR')
      const formattedTime = appointment.start_time?.substring(0, 5) || ''

      const notificationData = {
        user_id: targetUserId,
        type: 'appointment',
        category: 'booking',
        priority: message.priority,
        title: message.title,
        message: `${message.message} - ${appointment.service?.name || 'Serviço'} em ${formattedDate} às ${formattedTime}`,
        status: 'unread',
        data: {
          appointment_id: appointment.id,
          appointment_type: type,
          service_name: appointment.service?.name,
          service_duration: appointment.service?.duration_minutes,
          date: appointment.date,
          start_time: appointment.start_time,
          end_time: appointment.end_time,
          salon_name: appointment.salon?.name,
          professional_name: appointment.professional?.name,
          professional_photo: appointment.professional?.profile_photo,
          client_name: appointment.client?.name,
          client_photo: appointment.client?.profile_photo
        },
        salon_id: appointment.salon_id
      }

      console.log('🔔 createAppointmentNotification - Dados da notificação:', notificationData)


      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single()

      if (error) {
        console.error(`❌ Erro ao criar notificação ${type}:`, error)
        console.error(`❌ Detalhes do erro:`, {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        throw error
      }

      console.log(`✅ Notificação ${type} criada com sucesso:`, {
        notificationId: data.id,
        userId: data.user_id,
        title: data.title
      })
      return true

    } catch (err) {
      console.error(`❌ Erro ao criar notificação ${type}:`, err)
      return false
    }
  }, [user?.id])

  // Função para criar notificação quando agendamento é confirmado
  const notifyAppointmentConfirmed = useCallback(async (appointment: Appointment) => {
    if (!appointment.client_id) {
      console.error('❌ notifyAppointmentConfirmed - client_id não encontrado:', appointment)
      return false
    }

    
    const result = await createAppointmentNotification(
      appointment,
      'appointment_confirmed',
      appointment.client_id
    )

    return result
  }, [createAppointmentNotification])

  // Função para criar notificação quando agendamento é criado
  const notifyAppointmentCreated = useCallback(async (appointment: Appointment) => {
    console.log('🔔 notifyAppointmentCreated - Iniciando notificação para profissional:', appointment.professional_id)
    console.log('🔔 notifyAppointmentCreated - Dados do agendamento:', appointment)
    
    if (!appointment.professional_id) {
      console.error('❌ notifyAppointmentCreated - professional_id não encontrado:', appointment)
      return false
    }

    const result = await createAppointmentNotification(
      appointment,
      'appointment_created',
      appointment.professional_id
    )
    
    console.log('🔔 notifyAppointmentCreated - Resultado:', result)
    return result
  }, [createAppointmentNotification])

  // Função para criar notificação quando agendamento é cancelado
  const notifyAppointmentCancelled = useCallback(async (appointment: Appointment) => {
    console.log('🔔 notifyAppointmentCancelled - Iniciando notificação de cancelamento')
    console.log('🔔 notifyAppointmentCancelled - Dados do agendamento:', appointment)
    
    // Quando cliente cancela, notificar o profissional
    // Quando profissional cancela, notificar o cliente
    const targetUserId = appointment.professional_id
    if (!targetUserId) {
      console.error('❌ notifyAppointmentCancelled - professional_id não encontrado:', appointment)
      return false
    }

    console.log('🔔 notifyAppointmentCancelled - Enviando notificação para profissional:', targetUserId)
    
    const result = await createAppointmentNotification(
      appointment,
      'appointment_cancelled',
      targetUserId
    )
    
    console.log('🔔 notifyAppointmentCancelled - Resultado:', result)
    return result
  }, [createAppointmentNotification])

  // Função para criar notificação quando agendamento é marcado como não comparecimento
  const notifyAppointmentNoShow = useCallback(async (appointment: Appointment) => {
    if (!appointment.client_id) return false

    
    return await createAppointmentNotification(
      appointment,
      'appointment_no_show',
      appointment.client_id
    )
  }, [createAppointmentNotification])

  // Função para criar notificação quando agendamento é concluído
  const notifyAppointmentCompleted = useCallback(async (appointment: Appointment) => {
    if (!appointment.client_id) return false

    
    return await createAppointmentNotification(
      appointment,
      'appointment_completed',
      appointment.client_id
    )
  }, [createAppointmentNotification])

  // Função para criar notificação quando agendamento é alterado para pendente
  const notifyAppointmentPending = useCallback(async (appointment: Appointment) => {
    if (!appointment.client_id) return false

    
    return await createAppointmentNotification(
      appointment,
      'appointment_pending',
      appointment.client_id
    )
  }, [createAppointmentNotification])

  // Função para verificar e criar notificações de lembrete
  const checkAndCreateReminders = useCallback(async () => {
    if (!salonId || !user?.id) return

    try {
      console.log('🔍 Verificando lembretes de agendamentos...')

      const now = new Date()
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
      const in30Minutes = new Date(now.getTime() + 30 * 60 * 1000)

      // Buscar agendamentos confirmados para lembretes
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          *,
          client:users!appointments_client_id_fkey(id, name, email, profile_photo),
          professional:users!appointments_professional_id_fkey(id, name, email, profile_photo),
          service:professional_services(id, name, duration_minutes),
          salon:salons_studios(id, name)
        `)
        .eq('salon_id', salonId)
        .eq('status', 'confirmed')
        .gte('date', now.toISOString().split('T')[0])
        .lte('date', tomorrow.toISOString().split('T')[0])

      if (error) {
        console.error('❌ Erro ao buscar agendamentos para lembretes:', error)
        return
      }

      if (!appointments || appointments.length === 0) {
        console.log('ℹ️ Nenhum agendamento para lembrete encontrado')
        return
      }

      console.log(`📅 ${appointments.length} agendamentos para verificar lembretes`)

      // Processar cada agendamento
      for (const appointment of appointments) {
        const appointmentDateTime = new Date(`${appointment.date}T${appointment.start_time}`)
        const timeDiff = appointmentDateTime.getTime() - now.getTime()

        // Lembrete de 24 horas
        if (timeDiff > 0 && timeDiff <= 25 * 60 * 60 * 1000 && timeDiff > 23 * 60 * 60 * 1000) {
          await createAppointmentNotification(
            appointment,
            'appointment_reminder_24h',
            appointment.client_id
          )
        }

        // Lembrete de 30 minutos
        if (timeDiff > 0 && timeDiff <= 35 * 60 * 1000 && timeDiff > 25 * 60 * 1000) {
          await createAppointmentNotification(
            appointment,
            'appointment_reminder_30min',
            appointment.client_id
          )
        }
      }

    } catch (err) {
      console.error('❌ Erro ao verificar lembretes:', err)
    }
  }, [salonId, user?.id, createAppointmentNotification])

  // Iniciar verificação automática de lembretes
  useEffect(() => {
    if (!salonId || !user?.id) return


    // Verificação inicial
    checkAndCreateReminders()

    // Configurar verificação periódica
    intervalRef.current = setInterval(checkAndCreateReminders, checkInterval)

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [salonId, user?.id, checkAndCreateReminders, checkInterval])

  // Parar verificação automática
  const stopAutomaticReminders = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
      console.log('🛑 Sistema de lembretes automáticos parado')
    }
  }, [])

  return {
    // Funções de notificação
    notifyAppointmentConfirmed,
    notifyAppointmentCreated,
    notifyAppointmentCancelled,
    notifyAppointmentNoShow,
    notifyAppointmentCompleted,
    notifyAppointmentPending,
    createAppointmentNotification,
    
    // Sistema de lembretes
    checkAndCreateReminders,
    stopAutomaticReminders
  }
}