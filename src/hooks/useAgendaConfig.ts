import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface AgendaConfig {
  id?: string
  professional_id: string
  salon_id: string | null // Permitir null para profissionais independentes
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
  auto_confirm_appointments: boolean
  require_confirmation: boolean
  max_appointments_per_day: number
  appointment_duration_default: number
  created_at?: string
  updated_at?: string
}

export interface AgendaConfigFormData {
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

export const useAgendaConfig = (professionalId?: string, salonId?: string) => {
  const [config, setConfig] = useState<AgendaConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Carregar configurações
  const loadConfig = useCallback(async () => {
    if (!professionalId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 useAgendaConfig - Carregando configurações:', {
        professionalId,
        salonId
      })

      let query = supabase
        .from('agenda_config')
        .select('*')
        .eq('professional_id', professionalId)
      
      // ✅ CORRIGIDO: Lógica melhorada para profissionais independentes
      // Se tem salonId, filtrar por salão, senão buscar configuração do profissional independente
      if (salonId) {
        query = query.eq('salon_id', salonId)
        console.log('🔍 Buscando configuração vinculada ao salão:', salonId)
      } else {
        // Para profissionais independentes (trial/assinatura), buscar configuração sem salon_id
        query = query.is('salon_id', null)
        console.log('🔍 Buscando configuração de profissional independente')
      }
      
      const { data, error: fetchError } = await query.single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Configuração não encontrada, criar uma padrão
          console.log('🔍 Configuração não encontrada, criando padrão...')
          await createDefaultConfig(professionalId, salonId || null)
          return
        }
        console.error('❌ Erro ao buscar configuração:', fetchError)
        throw fetchError
      }

      console.log('✅ Configuração encontrada:', data)
      setConfig(data)
    } catch (err) {
      console.error('Erro ao carregar configurações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [professionalId, salonId])

  // Criar configuração padrão
  const createDefaultConfig = async (profId: string, salonId: string | null) => {
    const defaultConfig: Omit<AgendaConfig, 'id' | 'created_at' | 'updated_at'> = {
      professional_id: profId,
      salon_id: salonId,
      opening_time: '08:00',
      closing_time: '18:00',
      lunch_break_enabled: true,
      lunch_start_time: '12:00',
      lunch_end_time: '13:00',
      working_days: {
        monday: true,
        tuesday: true,
        wednesday: true,
        thursday: true,
        friday: true,
        saturday: true,
        sunday: false
      },
      auto_confirm_appointments: false,
      require_confirmation: true,
      max_appointments_per_day: 20,
      appointment_duration_default: 60
    }

    const { data, error: createError } = await supabase
      .from('agenda_config')
      .insert(defaultConfig)
      .select()
      .single()

    if (createError) {
      throw createError
    }

    setConfig(data)
  }

  // Salvar configurações
  const saveConfig = useCallback(async (formData: AgendaConfigFormData) => {
    if (!professionalId) {
      throw new Error('ID do profissional não fornecido')
    }

    try {
      setSaving(true)
      setError(null)

      const configData = {
        ...formData,
        professional_id: professionalId,
        salon_id: salonId || null
      }

      let result

      if (config?.id) {
        // Atualizar configuração existente
        const { data, error: updateError } = await supabase
          .from('agenda_config')
          .update(configData)
          .eq('id', config.id)
          .select()
          .single()

        if (updateError) throw updateError
        result = data
      } else {
        // Criar nova configuração
        const { data, error: insertError } = await supabase
          .from('agenda_config')
          .insert(configData)
          .select()
          .single()

        if (insertError) throw insertError
        result = data
      }

      setConfig(result)
      return result
    } catch (err) {
      console.error('Erro ao salvar configurações:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setSaving(false)
    }
  }, [professionalId, salonId, config?.id])

  // Validar configurações
  const validateConfig = useCallback((formData: AgendaConfigFormData) => {
    const errors: string[] = []

    // Validar horários de funcionamento
    if (formData.opening_time >= formData.closing_time) {
      errors.push('Horário de abertura deve ser menor que o de fechamento')
    }

    // Validar intervalo de almoço
    if (formData.lunch_break_enabled) {
      if (formData.lunch_start_time >= formData.lunch_end_time) {
        errors.push('Início do almoço deve ser menor que o fim')
      }

      if (formData.lunch_start_time < formData.opening_time) {
        errors.push('Início do almoço deve ser após o horário de abertura')
      }

      if (formData.lunch_end_time > formData.closing_time) {
        errors.push('Fim do almoço deve ser antes do horário de fechamento')
      }
    }

    // Validar dias de funcionamento
    const hasWorkingDays = Object.values(formData.working_days).some(day => day)
    if (!hasWorkingDays) {
      errors.push('Pelo menos um dia da semana deve estar selecionado')
    }

    return errors
  }, [])

  // Converter dias da semana para formato do banco
  const convertWorkingDaysToDB = useCallback((diasFuncionamento: Record<string, boolean>) => {
    return {
      monday: diasFuncionamento.Segunda || false,
      tuesday: diasFuncionamento.Terça || false,
      wednesday: diasFuncionamento.Quarta || false,
      thursday: diasFuncionamento.Quinta || false,
      friday: diasFuncionamento.Sexta || false,
      saturday: diasFuncionamento.Sábado || false,
      sunday: diasFuncionamento.Domingo || false
    }
  }, [])

  // Converter dias da semana do banco para formato da interface
  const convertWorkingDaysFromDB = useCallback((workingDays: any) => {
    return {
      Segunda: workingDays.monday || false,
      Terça: workingDays.tuesday || false,
      Quarta: workingDays.wednesday || false,
      Quinta: workingDays.thursday || false,
      Sexta: workingDays.friday || false,
      Sábado: workingDays.saturday || false,
      Domingo: workingDays.sunday || false
    }
  }, [])

  // Carregar configurações quando os IDs mudarem
  useEffect(() => {
    loadConfig()
  }, [loadConfig])

  return {
    config,
    loading,
    error,
    saving,
    saveConfig,
    validateConfig,
    convertWorkingDaysToDB,
    convertWorkingDaysFromDB,
    reload: loadConfig
  }
}
