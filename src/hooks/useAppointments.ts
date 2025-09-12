import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'
import { useSalons } from '@/hooks/useSalons'
import { useAppointmentNotifications } from './useAppointmentNotifications'

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
  const { userSalon } = useSalons(user?.id)
  const { 
    notifyAppointmentConfirmed, 
    notifyAppointmentCreated, 
    notifyAppointmentCancelled,
    notifyAppointmentNoShow,
    notifyAppointmentCompleted,
    notifyAppointmentPending
  } = useAppointmentNotifications(userSalon?.id)
  
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Sistema de segurança contra loops
  const [lastFetchSalonId, setLastFetchSalonId] = useState<string | null>(null)
  const [isFetchingSalon, setIsFetchingSalon] = useState(false)

  // Buscar agendamentos do usuário
  const fetchAppointments = useCallback(async (userId?: string, asClientOnly?: boolean) => {
    if (!userId && !user?.id) return

    try {
      setLoading(true)
      setError(null)

      const targetUserId = userId || user?.id

      let query = supabase
        .from('appointments')
        .select(`
          *,
          salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
          client:users!appointments_client_id_fkey(id, name, email, phone, profile_photo),
          professional:users!appointments_professional_id_fkey(id, name, email, phone, profile_photo),
          service:professional_services(id, name, description, duration_minutes, price)
        `)

      // Se asClientOnly=true, buscar apenas agendamentos como cliente
      if (asClientOnly) {
        query = query.eq('client_id', targetUserId)
      } else {
        // Comportamento padrão: buscar agendamentos como cliente E como profissional
        query = query.or(`client_id.eq.${targetUserId},professional_id.eq.${targetUserId}`)
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error


      // ✅ SIMPLIFICADO: Filtrar apenas agendamentos de profissionais com agenda ativa
      
      const filteredData = []
      for (const appointment of data || []) {
        try {
          // Verificar se o profissional tem agenda habilitada OU se é o dono do salão
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('agenda_enabled')
            .eq('id', appointment.professional_id)
            .single()
          
          if (userError) {
            console.warn('⚠️ Erro ao verificar agenda_enabled para profissional:', appointment.professional_id, userError)
            // Em caso de erro, incluir o agendamento para não perder dados
            filteredData.push(appointment)
            continue
          }
          
          // Verificar se é dono do salão (apenas se tiver salon_id)
          let isSalonOwner = false
          if (appointment.salon_id) {
            const { data: salonData } = await supabase
              .from('salons_studios')
              .select('owner_id')
              .eq('id', appointment.salon_id)
              .single()
            
            isSalonOwner = salonData?.owner_id === appointment.professional_id
          }
          
          // LÓGICA CORRIGIDA: 
          // - Se é dono do salão → pode ver seus agendamentos (independente de agenda_enabled)
          // - Se é profissional com agenda habilitada → pode ver seus agendamentos
          // - Se é profissional independente (sem salon_id) → pode ver seus agendamentos
          const shouldInclude = isSalonOwner || userData?.agenda_enabled || !appointment.salon_id
          
          if (shouldInclude) {
            filteredData.push(appointment)
          }
        } catch (err) {
          console.warn('⚠️ Erro ao verificar agenda_enabled:', err)
          // Em caso de erro, incluir o agendamento para não perder dados
          filteredData.push(appointment)
        }
      }


      setAppointments(filteredData)
      return filteredData

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
  const fetchSalonAppointments = useCallback(async (salonId: string, date?: string, professionalId?: string) => {
    // Sistema de segurança contra loops
    if (!salonId || salonId.trim() === '') {
      console.log('⚠️ SalonId vazio, ignorando busca')
      return null
    }
    
    if (isFetchingSalon) {
      console.log('⚠️ Busca já em andamento, ignorando')
      return null
    }
    
    if (lastFetchSalonId === salonId && !date && !professionalId) {
      console.log('⚠️ Dados já carregados para este salão, ignorando')
      return null
    }
    
    try {
      setIsFetchingSalon(true)
      setLoading(true)
      setError(null)
      
      let query = supabase
        .from('appointments')
        .select(`
          *,
          salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
          client:users!appointments_client_id_fkey(id, name, email, phone, profile_photo),
          professional:users!appointments_professional_id_fkey(id, name, email, phone, profile_photo),
          service:professional_services(id, name, description, duration_minutes, price)
        `)
        .or(`salon_id.eq.${salonId},and(salon_id.is.null,professional_id.eq.${user?.id})`) // ✅ Incluir apenas agendamentos como profissional independente do usuário atual

      // Se for um profissional vinculado, filtrar apenas seus agendamentos
      if (professionalId) {
        query = query.eq('professional_id', professionalId)
      }

      if (date) {
        query = query.eq('date', date)
      }

      const { data, error } = await query
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error

      // ✅ SIMPLIFICADO: Filtrar apenas agendamentos de profissionais com agenda ativa
      
      const filteredData = []
      for (const appointment of data || []) {
        try {
          // Verificar se o profissional tem agenda habilitada OU se é o dono do salão
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('agenda_enabled')
            .eq('id', appointment.professional_id)
            .single()
          
          if (userError) {
            console.warn('⚠️ Erro ao verificar agenda_enabled para profissional:', appointment.professional_id, userError)
            // Em caso de erro, incluir o agendamento para não perder dados
            filteredData.push(appointment)
            continue
          }
          
          // Verificar se é dono do salão (apenas se tiver salon_id)
          let isSalonOwner = false
          if (appointment.salon_id) {
            const { data: salonData } = await supabase
              .from('salons_studios')
              .select('owner_id')
              .eq('id', appointment.salon_id)
              .single()
            
            isSalonOwner = salonData?.owner_id === appointment.professional_id
          }
          
          // LÓGICA CORRIGIDA: 
          // - Se é dono do salão → pode ver seus agendamentos (independente de agenda_enabled)
          // - Se é profissional com agenda habilitada → pode ver seus agendamentos
          // - Se é profissional independente (sem salon_id) → pode ver seus agendamentos
          const shouldInclude = isSalonOwner || userData?.agenda_enabled || !appointment.salon_id
          
          if (shouldInclude) {
            filteredData.push(appointment)
          }
        } catch (err) {
          console.warn('⚠️ Erro ao verificar agenda_enabled:', err)
          // Em caso de erro, incluir o agendamento para não perder dados
          filteredData.push(appointment)
        }
      }


      // Atualizar estado de segurança
      setLastFetchSalonId(salonId)
      
      // Atualizar o estado de appointments com dados filtrados
      setAppointments(filteredData)
      
      return filteredData

    } catch (err) {
      console.error('❌ fetchSalonAppointments: Erro ao buscar agendamentos do salão:', err)
      console.error('❌ fetchSalonAppointments: Tipo do erro:', err instanceof Error ? err.constructor.name : typeof err)
      
      // Log detalhado para erros do Supabase
      if (err && typeof err === 'object' && 'code' in err) {
        console.error('❌ fetchSalonAppointments: Código do erro Supabase:', (err as any).code)
        console.error('❌ fetchSalonAppointments: Mensagem do erro Supabase:', (err as any).message)
        console.error('❌ fetchSalonAppointments: Detalhes do erro Supabase:', (err as any).details)
        console.error('❌ fetchSalonAppointments: Dica do erro Supabase:', (err as any).hint)
      }
      
      let errorMessage = 'Erro desconhecido'
      
      if (err instanceof Error) {
        errorMessage = err.message
        
        // Tratamento específico para erros de limite
        if (err.message.includes('limit') || err.message.includes('rate') || err.message.includes('quota')) {
          errorMessage = 'Limite de uso do Supabase excedido. Tente novamente em alguns minutos.'
        }
        
        // Tratamento específico para erros de permissão
        if (err.message.includes('permission') || err.message.includes('policy')) {
          errorMessage = 'Erro de permissão. Verifique se você tem acesso para visualizar agendamentos.'
        }
      }
      
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
  }, [isFetchingSalon, lastFetchSalonId]) // Removida dependência toast para evitar loops

  // Criar novo agendamento
  const createAppointment = useCallback(async (appointmentData: CreateAppointmentData) => {
    
    // Sistema de retry para lidar com limites excedidos
    let attempts = 0
    const maxAttempts = 3
    
    while (attempts < maxAttempts) {
      try {
        attempts++
        
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
            salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
            client:users!appointments_client_id_fkey(id, name, email, phone, profile_photo),
            professional:users!appointments_professional_id_fkey(id, name, email, phone, profile_photo),
            service:professional_services(id, name, description, duration_minutes, price)
          `)
          .single()

        if (error) {
          console.error(`❌ createAppointment - Erro na tentativa ${attempts}:`, error)
          console.error(`❌ createAppointment - Detalhes do erro:`, {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          })
          
          // Verificar se é erro de limite
          if (error.message.includes('rate') || error.message.includes('limit') || error.message.includes('quota')) {
            if (attempts < maxAttempts) {
              const delay = Math.pow(2, attempts) * 1000 // Backoff exponencial: 2s, 4s, 8s
              console.log(`⏳ createAppointment - Aguardando ${delay}ms antes da próxima tentativa...`)
              await new Promise(resolve => setTimeout(resolve, delay))
              continue
            } else {
              throw new Error('Limite de uso do Supabase excedido. Tente novamente em alguns minutos.')
            }
          }
          
          // Verificar se é erro de RLS
          if (error.message.includes('permission') || error.message.includes('policy') || error.message.includes('RLS')) {
            throw new Error('Erro de permissão. Verifique se você tem acesso para criar agendamentos.')
          }
          
          // Verificar se é erro de constraint NOT NULL
          if (error.message.includes('null value') && error.message.includes('not-null constraint')) {
            throw new Error('Erro de estrutura do banco. Contate o administrador.')
          }
          
          // Verificar se é erro de foreign key
          if (error.message.includes('foreign key') || (error.message.includes('constraint') && !error.message.includes('not-null'))) {
            throw new Error('Dados inválidos. Verifique se o cliente e serviço selecionados existem.')
          }
          
          throw error
        }

        console.log('✅ createAppointment - Agendamento criado com sucesso:', data)
        console.log('✅ createAppointment - Lista anterior:', appointments.length, 'agendamentos')
        console.log('✅ createAppointment - Atualizando lista local...')

        // Atualizar lista local
        setAppointments(prev => {
          const newList = [data, ...prev]
          console.log('✅ createAppointment - Nova lista:', newList.length, 'agendamentos')
          return newList
        })

        // Criar notificação se o agendamento foi criado como pending (cliente criou)
        if (data.status === 'pending' && data.professional_id) {
          console.log('🔔 Criando notificação de novo agendamento para profissional')
          notifyAppointmentCreated(data).catch(err => 
            console.error('❌ Erro ao criar notificação de novo agendamento:', err)
          )
        }

        return { data, error: null }

      } catch (err) {
        console.error(`❌ createAppointment - Erro na tentativa ${attempts}:`, err)
        
        // Se é a última tentativa, retornar erro
        if (attempts >= maxAttempts) {
          console.error('❌ createAppointment - Todas as tentativas falharam')
          console.error('❌ createAppointment - Tipo do erro:', err instanceof Error ? err.constructor.name : typeof err)
          console.error('❌ createAppointment - Stack trace:', err instanceof Error ? err.stack : 'N/A')
          
          let errorMessage = 'Erro desconhecido'
          
          if (err instanceof Error) {
            errorMessage = err.message
            
            // Tratamento específico para erros de limite
            if (err.message.includes('limit') || err.message.includes('rate') || err.message.includes('quota')) {
              errorMessage = 'Limite de uso do Supabase excedido. Tente novamente em alguns minutos.'
            }
            
            // Tratamento específico para erros de permissão
            if (err.message.includes('permission') || err.message.includes('policy')) {
              errorMessage = 'Erro de permissão. Verifique se você tem acesso para criar agendamentos.'
            }
            
            // Tratamento específico para erros de foreign key
            if (err.message.includes('foreign key') || err.message.includes('constraint')) {
              errorMessage = 'Dados inválidos. Verifique se o cliente e serviço selecionados existem.'
            }
            
            // Tratamento específico para erros de RLS
            if (err.message.includes('RLS') || err.message.includes('row level security')) {
              errorMessage = 'Erro de segurança. Verifique as políticas de acesso.'
            }
          }
          
          setError(errorMessage)
          return { data: null, error: errorMessage }
        }
        
        // Continuar para próxima tentativa
      } finally {
        if (attempts >= maxAttempts) {
          setLoading(false)
        }
      }
    }
    
    // Nunca deve chegar aqui, mas por segurança
    return { data: null, error: 'Erro inesperado' }
  }, []) // Removida dependência toast para evitar loops

  // Atualizar agendamento
  const updateAppointment = useCallback(async (appointmentId: string, updateData: UpdateAppointmentData) => {
    try {
      setLoading(true)
      setError(null)

      // Buscar o agendamento atual para comparar status
      const currentAppointment = appointments.find(apt => apt.id === appointmentId)
      const oldStatus = currentAppointment?.status


      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId)
        .select(`
          *,
          salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
          client:users!appointments_client_id_fkey(id, name, email, phone, profile_photo),
          professional:users!appointments_professional_id_fkey(id, name, email, phone, profile_photo),
          service:professional_services(id, name, description, duration_minutes, price)
        `)
        .single()

      if (error) throw error

      // Verificar se o status mudou e criar notificação apropriada
      if (oldStatus !== updateData.status) {
        // Criar notificação específica para cada status
        if (updateData.status === 'confirmed') {
          notifyAppointmentConfirmed(data).catch(err =>
            console.error('❌ Erro ao criar notificação de confirmação:', err)
          )
        } else if (updateData.status === 'cancelled') {
          notifyAppointmentCancelled(data).catch(err =>
            console.error('❌ Erro ao criar notificação de cancelamento:', err)
          )
        } else if (updateData.status === 'no_show') {
          notifyAppointmentNoShow(data).catch(err =>
            console.error('❌ Erro ao criar notificação de não comparecimento:', err)
          )
        } else if (updateData.status === 'completed') {
          notifyAppointmentCompleted(data).catch(err =>
            console.error('❌ Erro ao criar notificação de conclusão:', err)
          )
        } else if (updateData.status === 'pending') {
          notifyAppointmentPending(data).catch(err =>
            console.error('❌ Erro ao criar notificação de alteração:', err)
          )
        }
      }

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
  }, [toast, appointments, notifyAppointmentConfirmed, notifyAppointmentCancelled])

  // Cancelar agendamento (excluir completamente)
  const cancelAppointment = useCallback(async (appointmentId: string, reason?: string) => {
    try {
      setLoading(true)
      setError(null)

      // Primeiro, buscar o agendamento para obter dados para notificação
      const { data: appointmentData, error: fetchError } = await supabase
        .from('appointments')
        .select(`
          *,
          salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
          client:users!appointments_client_id_fkey(id, name, email, phone, profile_photo),
          professional:users!appointments_professional_id_fkey(id, name, email, phone, profile_photo),
          service:professional_services(id, name, description, duration_minutes, price)
        `)
        .eq('id', appointmentId)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar agendamento:', fetchError)
        throw fetchError
      }

      // Excluir o agendamento completamente
      const { error: deleteError } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (deleteError) {
        console.error('❌ Erro ao excluir agendamento:', deleteError)
        throw deleteError
      }

      // Criar notificação de cancelamento para o profissional
      if (appointmentData) {
        console.log('🔔 Criando notificação de cancelamento')
        console.log('🔔 Dados do agendamento para notificação:', appointmentData)
        console.log('🔔 Professional ID:', appointmentData.professional_id)
        console.log('🔔 Client ID:', appointmentData.client_id)
        
        const notificationResult = await notifyAppointmentCancelled(appointmentData)
        console.log('🔔 Resultado da notificação:', notificationResult)
      } else {
        console.error('❌ appointmentData não encontrado para notificação')
      }

      // Atualizar lista local removendo o agendamento
      setAppointments(prev => prev.filter(apt => apt.id !== appointmentId))

      toast({
        title: 'Agendamento cancelado!',
        description: 'O agendamento foi cancelado e a vaga liberada.',
        variant: 'default'
      })

      return { data: null, error: null }

    } catch (err) {
      console.error('❌ Erro ao cancelar agendamento:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao cancelar agendamento',
        description: errorMessage,
        variant: 'destructive'
      })
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [notifyAppointmentCancelled, toast])

  // Confirmar agendamento
  const confirmAppointment = useCallback(async (appointmentId: string) => {
    const result = await updateAppointment(appointmentId, {
      status: 'confirmed'
    })

    // Notificação já é criada dentro do updateAppointment
    return result
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
          salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
          client:users!appointments_client_id_fkey(id, name, email, phone, profile_photo),
          professional:users!appointments_professional_id_fkey(id, name, email, phone, profile_photo),
          service:professional_services(id, name, description, duration_minutes, price)
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
          salon:salons_studios(id, name, logradouro, numero, bairro, cidade, uf),
          client:users!appointments_client_id_fkey(id, name, email, phone),
          professional:users!appointments_professional_id_fkey(id, name, email, phone, profile_photo),
          service:professional_services(id, name, description, duration_minutes, price)
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

  // Carregar agendamentos do usuário atual automaticamente
  useEffect(() => {
    if (user?.id) {
      fetchAppointments(user.id, false)
    }
  }, [user?.id, fetchAppointments])

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
