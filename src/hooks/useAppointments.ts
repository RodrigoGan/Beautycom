import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'

// Interfaces TypeScript
export interface Appointment {
  id: string
  salon_id: string
  client_id: string
  professional_id: string
  service_id: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show'
  payment_status: 'pending' | 'paid' | 'refunded'
  price: number
  confirmation_code?: string
  notes?: string
  cancellation_reason?: string
  created_at: string
  updated_at: string
  // Relacionamentos
  salon?: {
    id: string
    name: string
    address?: string
  }
  client?: {
    id: string
    name: string
    email: string
    phone?: string
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
    description?: string
    duration: number
    price: number
  }
}

export interface CreateAppointmentData {
  salon_id: string
  client_id: string
  professional_id: string
  service_id: string
  date: string
  start_time: string
  end_time: string
  duration_minutes: number
  price: number
  notes?: string
}

export interface UpdateAppointmentData {
  status?: Appointment['status']
  payment_status?: Appointment['payment_status']
  notes?: string
  cancellation_reason?: string
}

export const useAppointments = () => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Sistema de segurança contra loops
  const [lastFetchSalonId, setLastFetchSalonId] = useState<string | null>(null)
  const [isFetchingSalon, setIsFetchingSalon] = useState(false)

  // Buscar agendamentos do usuário
  const fetchAppointments = useCallback(async (userId?: string) => {
    if (!userId && !user?.id) return

    try {
      setLoading(true)
      setError(null)

      const targetUserId = userId || user?.id

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          salon:salons_studios(id, name, address),
          client:users(id, name, email, phone),
          professional:users(id, name, email, profile_photo),
          service:services(id, name, description, duration, price)
        `)
        .or(`client_id.eq.${targetUserId},professional_id.eq.${targetUserId}`)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      setAppointments(data || [])
      return data

    } catch (err) {
      console.error('❌ Erro ao buscar agendamentos:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao buscar agendamentos',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [user?.id, toast])

  // Buscar agendamentos de um salão específico
  const fetchSalonAppointments = useCallback(async (salonId: string, date?: string) => {
    // Sistema de segurança contra loops
    if (!salonId || salonId.trim() === '') {
      console.log('⚠️ SalonId vazio, ignorando busca')
      return null
    }
    
    if (isFetchingSalon) {
      console.log('⚠️ Busca já em andamento, ignorando')
      return null
    }
    
    if (lastFetchSalonId === salonId && !date) {
      console.log('⚠️ Dados já carregados para este salão, ignorando')
      return null
    }
    
    try {
      setIsFetchingSalon(true)
      setLoading(true)
      setError(null)
      
      console.log('🔍 Buscando agendamentos para salão:', salonId)

      let query = supabase
        .from('appointments')
        .select(`
          *,
          salon:salons_studios(id, name, address),
          client:users(id, name, email, phone),
          professional:users(id, name, email, profile_photo),
          service:services(id, name, description, duration, price)
        `)
        .eq('salon_id', salonId)

      if (date) {
        query = query.eq('date', date)
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      console.log('📊 Resultado da busca:', { data: data?.length || 0, error })

      if (error) throw error

      // Atualizar estado de segurança
      setLastFetchSalonId(salonId)
      
      return data

    } catch (err) {
      console.error('❌ Erro ao buscar agendamentos do salão:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      
      // TEMPORARIAMENTE DESABILITADO - Debug de loop
      // toast({
      //   title: 'Erro ao buscar agendamentos',
      //   description: errorMessage,
      //   variant: 'destructive'
      // })
      
      return null
    } finally {
      setLoading(false)
      setIsFetchingSalon(false)
    }
  }, [toast, isFetchingSalon, lastFetchSalonId])

  // Criar novo agendamento
  const createAppointment = useCallback(async (appointmentData: CreateAppointmentData) => {
    try {
      setLoading(true)
      setError(null)

      // Gerar código de confirmação único
      const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          status: 'pending',
          payment_status: 'pending',
          confirmation_code: confirmationCode
        })
        .select(`
          *,
          salon:salons_studios(id, name, address),
          client:users(id, name, email, phone),
          professional:users(id, name, email, profile_photo),
          service:services(id, name, description, duration, price)
        `)
        .single()

      if (error) throw error

      toast({
        title: 'Agendamento criado!',
        description: `Código de confirmação: ${confirmationCode}`,
        variant: 'default'
      })

      // Atualizar lista local
      setAppointments(prev => [data, ...prev])

      return { data, error: null }

    } catch (err) {
      console.error('❌ Erro ao criar agendamento:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao criar agendamento',
        description: errorMessage,
        variant: 'destructive'
      })
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Atualizar agendamento
  const updateAppointment = useCallback(async (appointmentId: string, updateData: UpdateAppointmentData) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select(`
          *,
          salon:salons_studios(id, name, address),
          client:users(id, name, email, phone),
          professional:users(id, name, email, profile_photo),
          service:services(id, name, description, duration, price)
        `)
        .single()

      if (error) throw error

      toast({
        title: 'Agendamento atualizado!',
        description: 'As alterações foram salvas com sucesso.',
        variant: 'default'
      })

      // Atualizar lista local
      setAppointments(prev => prev.map(apt => apt.id === appointmentId ? data : apt))

      return { data, error: null }

    } catch (err) {
      console.error('❌ Erro ao atualizar agendamento:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao atualizar agendamento',
        description: errorMessage,
        variant: 'destructive'
      })
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Cancelar agendamento
  const cancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    return updateAppointment(appointmentId, {
      status: 'cancelled',
      cancellation_reason: reason
    })
  }, [updateAppointment])

  // Confirmar agendamento
  const confirmAppointment = useCallback(async (appointmentId: string) => {
    return updateAppointment(appointmentId, {
      status: 'confirmed'
    })
  }, [updateAppointment])

  // Finalizar agendamento
  const completeAppointment = useCallback(async (appointmentId: string) => {
    return updateAppointment(appointmentId, {
      status: 'completed'
    })
  }, [updateAppointment])

  // Buscar agendamentos por código de confirmação
  const getAppointmentByCode = useCallback(async (confirmationCode: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          salon:salons_studios(id, name, address),
          client:users(id, name, email, phone),
          professional:users(id, name, email, profile_photo),
          service:services(id, name, description, duration, price)
        `)
        .eq('confirmation_code', confirmationCode.toUpperCase())
        .single()

      if (error) throw error

      return { data, error: null }

    } catch (err) {
      console.error('❌ Erro ao buscar agendamento por código:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  }, [])

  // Buscar agendamentos por data
  const getAppointmentsByDate = useCallback(async (date: string, salonId?: string) => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          salon:salons_studios(id, name, address),
          client:users(id, name, email, phone),
          professional:users(id, name, email, profile_photo),
          service:services(id, name, description, duration, price)
        `)
        .eq('date', date)

      if (salonId) {
        query = query.eq('salon_id', salonId)
      }

      const { data, error } = await query
        .order('start_time', { ascending: true })

      if (error) throw error

      return { data, error: null }

    } catch (err) {
      console.error('❌ Erro ao buscar agendamentos por data:', err)
      return { data: null, error: err instanceof Error ? err.message : 'Erro desconhecido' }
    }
  }, [])

  // Carregar agendamentos do usuário atual
  useEffect(() => {
    if (user?.id) {
      fetchAppointments()
    }
  }, [user?.id]) // Removida a dependência fetchAppointments que causa loop

  return {
    // Estado
    appointments,
    loading,
    error,
    
    // Ações
    fetchAppointments,
    fetchSalonAppointments,
    createAppointment,
    updateAppointment,
    cancelAppointment,
    confirmAppointment,
    completeAppointment,
    getAppointmentByCode,
    getAppointmentsByDate,
    
    // Utilitários
    pendingAppointments: appointments.filter(apt => apt.status === 'pending'),
    confirmedAppointments: appointments.filter(apt => apt.status === 'confirmed'),
    completedAppointments: appointments.filter(apt => apt.status === 'completed'),
    cancelledAppointments: appointments.filter(apt => apt.status === 'cancelled'),
    
    todayAppointments: appointments.filter(apt => apt.date === new Date().toISOString().split('T')[0]),
    upcomingAppointments: appointments.filter(apt => apt.date > new Date().toISOString().split('T')[0])
  }
}
