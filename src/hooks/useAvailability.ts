import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

// Interfaces TypeScript
export interface ProfessionalAvailability {
  id: string
  professional_id: string
  salon_id: string
  day_of_week: number // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  start_time: string
  end_time: string
  is_available: boolean
  break_start?: string
  break_end?: string
  created_at: string
  updated_at: string
}

export interface ScheduleBlock {
  id: string
  professional_id: string
  salon_id: string
  start_datetime: string
  end_datetime: string
  reason?: string
  is_recurring: boolean
  created_at: string
  updated_at: string
}

export interface CreateAvailabilityData {
  professional_id: string
  salon_id: string
  day_of_week: number
  start_time: string
  end_time: string
  is_available?: boolean
  break_start?: string
  break_end?: string
}

export interface CreateBlockData {
  professional_id: string
  salon_id: string
  start_datetime: string
  end_datetime: string
  reason?: string
  is_recurring?: boolean
}

export const useAvailability = () => {
  const { toast } = useToast()
  
  const [availability, setAvailability] = useState<ProfessionalAvailability[]>([])
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar disponibilidade de um profissional
  const fetchProfessionalAvailability = useCallback(async (professionalId: string, salonId?: string) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('professional_availability')
        .select('*')
        .eq('professional_id', professionalId)

      if (salonId) {
        query = query.eq('salon_id', salonId)
      }

      const { data, error } = await query
        .order('day_of_week', { ascending: true })

      if (error) throw error

      setAvailability(data || [])
      return data

    } catch (err) {
      console.error('❌ Erro ao buscar disponibilidade:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao buscar disponibilidade',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Buscar bloqueios de um profissional
  const fetchProfessionalBlocks = useCallback(async (professionalId: string, salonId?: string) => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('schedule_blocks')
        .select('*')
        .eq('professional_id', professionalId)

      if (salonId) {
        query = query.eq('salon_id', salonId)
      }

      const { data, error } = await query
        .order('start_datetime', { ascending: true })

      if (error) throw error

      setBlocks(data || [])
      return data

    } catch (err) {
      console.error('❌ Erro ao buscar bloqueios:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao buscar bloqueios',
        description: errorMessage,
        variant: 'destructive'
      })
      return null
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Criar disponibilidade
  const createAvailability = useCallback(async (availabilityData: CreateAvailabilityData) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('professional_availability')
        .insert({
          ...availabilityData,
          is_available: availabilityData.is_available ?? true
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Disponibilidade criada!',
        description: 'Horário de trabalho configurado com sucesso.',
        variant: 'default'
      })

      setAvailability(prev => [...prev, data])
      return { data, error: null }

    } catch (err) {
      console.error('❌ Erro ao criar disponibilidade:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao criar disponibilidade',
        description: errorMessage,
        variant: 'destructive'
      })
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Atualizar disponibilidade
  const updateAvailability = useCallback(async (availabilityId: string, updateData: Partial<CreateAvailabilityData>) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('professional_availability')
        .update(updateData)
        .eq('id', availabilityId)
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Disponibilidade atualizada!',
        description: 'Horário de trabalho atualizado com sucesso.',
        variant: 'default'
      })

      setAvailability(prev => prev.map(av => av.id === availabilityId ? data : av))
      return { data, error: null }

    } catch (err) {
      console.error('❌ Erro ao atualizar disponibilidade:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao atualizar disponibilidade',
        description: errorMessage,
        variant: 'destructive'
      })
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Deletar disponibilidade
  const deleteAvailability = useCallback(async (availabilityId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('professional_availability')
        .delete()
        .eq('id', availabilityId)

      if (error) throw error

      toast({
        title: 'Disponibilidade removida!',
        description: 'Horário de trabalho removido com sucesso.',
        variant: 'default'
      })

      setAvailability(prev => prev.filter(av => av.id !== availabilityId))
      return { error: null }

    } catch (err) {
      console.error('❌ Erro ao deletar disponibilidade:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao remover disponibilidade',
        description: errorMessage,
        variant: 'destructive'
      })
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Criar bloqueio de agenda
  const createBlock = useCallback(async (blockData: CreateBlockData) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('schedule_blocks')
        .insert({
          ...blockData,
          is_recurring: blockData.is_recurring ?? false
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: 'Bloqueio criado!',
        description: 'Período bloqueado na agenda com sucesso.',
        variant: 'default'
      })

      setBlocks(prev => [...prev, data])
      return { data, error: null }

    } catch (err) {
      console.error('❌ Erro ao criar bloqueio:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao criar bloqueio',
        description: errorMessage,
        variant: 'destructive'
      })
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Deletar bloqueio
  const deleteBlock = useCallback(async (blockId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('schedule_blocks')
        .delete()
        .eq('id', blockId)

      if (error) throw error

      toast({
        title: 'Bloqueio removido!',
        description: 'Período desbloqueado na agenda.',
        variant: 'default'
      })

      setBlocks(prev => prev.filter(block => block.id !== blockId))
      return { error: null }

    } catch (err) {
      console.error('❌ Erro ao deletar bloqueio:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      toast({
        title: 'Erro ao remover bloqueio',
        description: errorMessage,
        variant: 'destructive'
      })
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Verificar se um horário está disponível
  const checkTimeSlotAvailability = useCallback(async (
    professionalId: string,
    salonId: string,
    date: string,
    startTime: string,
    endTime: string
  ) => {
    try {
      // 1. Verificar se o profissional tem disponibilidade no dia da semana
      const dayOfWeek = new Date(date).getDay()
      const dayAvailability = availability.find(
        av => av.professional_id === professionalId && 
             av.salon_id === salonId && 
             av.day_of_week === dayOfWeek &&
             av.is_available
      )

      if (!dayAvailability) {
        return { available: false, reason: 'Profissional não trabalha neste dia' }
      }

      // 2. Verificar se o horário está dentro do período de trabalho
      if (startTime < dayAvailability.start_time || endTime > dayAvailability.end_time) {
        return { available: false, reason: 'Horário fora do período de trabalho' }
      }

      // 3. Verificar se há pausa no horário
      if (dayAvailability.break_start && dayAvailability.break_end) {
        if (startTime < dayAvailability.break_end && endTime > dayAvailability.break_start) {
          return { available: false, reason: 'Horário conflita com pausa do profissional' }
        }
      }

      // 4. Verificar se há bloqueios no período
      const conflictingBlocks = blocks.filter(block => {
        const blockStart = new Date(block.start_datetime)
        const blockEnd = new Date(block.end_datetime)
        const appointmentStart = new Date(`${date}T${startTime}`)
        const appointmentEnd = new Date(`${date}T${endTime}`)

        return blockStart < appointmentEnd && blockEnd > appointmentStart
      })

      if (conflictingBlocks.length > 0) {
        return { available: false, reason: 'Período bloqueado na agenda' }
      }

      return { available: true, reason: 'Horário disponível' }

    } catch (err) {
      console.error('❌ Erro ao verificar disponibilidade:', err)
      return { available: false, reason: 'Erro ao verificar disponibilidade' }
    }
  }, [availability, blocks])

  // Gerar horários disponíveis para uma data
  const generateAvailableTimeSlots = useCallback(async (
    professionalId: string,
    salonId: string,
    date: string,
    serviceDuration: number // em minutos
  ) => {
    try {
      const dayOfWeek = new Date(date).getDay()
      const dayAvailability = availability.find(
        av => av.professional_id === professionalId && 
             av.salon_id === salonId && 
             av.day_of_week === dayOfWeek &&
             av.is_available
      )

      if (!dayAvailability) {
        return []
      }

      const timeSlots: string[] = []
      const startTime = new Date(`2000-01-01T${dayAvailability.start_time}`)
      const endTime = new Date(`2000-01-01T${dayAvailability.end_time}`)
      const slotDuration = serviceDuration

      let currentTime = new Date(startTime)

      while (currentTime < endTime) {
        const slotStart = currentTime.toTimeString().slice(0, 5)
        const slotEnd = new Date(currentTime.getTime() + slotDuration * 60000).toTimeString().slice(0, 5)

        // Verificar se o slot não conflita com a pausa
        if (!dayAvailability.break_start || !dayAvailability.break_end ||
            slotEnd <= dayAvailability.break_start || slotStart >= dayAvailability.break_end) {
          
          // Verificar se não há bloqueios
          const hasBlock = blocks.some(block => {
            const blockStart = new Date(block.start_datetime)
            const blockEnd = new Date(block.end_datetime)
            const slotStartDate = new Date(`${date}T${slotStart}`)
            const slotEndDate = new Date(`${date}T${slotEnd}`)

            return blockStart < slotEndDate && blockEnd > slotStartDate
          })

          if (!hasBlock) {
            timeSlots.push(slotStart)
          }
        }

        // Avançar 30 minutos para o próximo slot
        currentTime.setMinutes(currentTime.getMinutes() + 30)
      }

      return timeSlots

    } catch (err) {
      console.error('❌ Erro ao gerar horários disponíveis:', err)
      return []
    }
  }, [availability, blocks])

  return {
    // Estado
    availability,
    blocks,
    loading,
    error,
    
    // Ações de disponibilidade
    fetchProfessionalAvailability,
    createAvailability,
    updateAvailability,
    deleteAvailability,
    
    // Ações de bloqueios
    fetchProfessionalBlocks,
    createBlock,
    deleteBlock,
    
    // Utilitários
    checkTimeSlotAvailability,
    generateAvailableTimeSlots,
    
    // Helpers
    getAvailabilityByDay: (dayOfWeek: number) => 
      availability.filter(av => av.day_of_week === dayOfWeek),
    
    getBlocksByDate: (date: string) => 
      blocks.filter(block => {
        const blockDate = new Date(block.start_datetime).toISOString().split('T')[0]
        return blockDate === date
      })
  }
}
