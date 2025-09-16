import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface AgendaConfigurationStatus {
  isComplete: boolean
  missingItems: string[]
  loading: boolean
  error: string | null
}

export const useAgendaConfigurationStatus = (professionalId?: string) => {
  const [status, setStatus] = useState<AgendaConfigurationStatus>({
    isComplete: true,
    missingItems: [],
    loading: true,
    error: null
  })

  const checkConfigurationStatus = useCallback(async (): Promise<AgendaConfigurationStatus> => {
    if (!professionalId) {
      return {
        isComplete: true,
        missingItems: [],
        loading: false,
        error: null
      }
    }

    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }))

      const missingItems: string[] = []

      // 1. Verificar se tem serviços cadastrados
      try {
        const { data: servicesData, error: servicesError } = await supabase
          .from('professional_services')
          .select('id')
          .eq('professional_id', professionalId)
          .limit(1)

        if (servicesError && servicesError.code !== 'PGRST116') {
          console.warn('⚠️ Erro ao verificar serviços (ignorando):', servicesError)
        } else if (!servicesData || servicesData.length === 0) {
          missingItems.push('Serviços oferecidos')
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar serviços (ignorando):', error)
      }

      // 2. Verificar se tem horários e dias configurados (na tabela agenda_config)
      try {
        const { data: configData, error: configError } = await supabase
          .from('agenda_config')
          .select('opening_time, closing_time, working_days')
          .eq('professional_id', professionalId)
          .limit(1)

        if (configError && configError.code !== 'PGRST116') {
          console.warn('⚠️ Erro ao verificar configuração (ignorando):', configError)
        } else if (!configData || configData.length === 0) {
          missingItems.push('Horários de funcionamento')
          missingItems.push('Dias de atendimento')
        } else {
          const config = configData[0]
          
          // Verificar se tem horários configurados
          if (!config.opening_time || !config.closing_time) {
            missingItems.push('Horários de funcionamento')
          }
          
          // Verificar se tem dias de funcionamento configurados
          if (!config.working_days || Object.values(config.working_days).every(day => !day)) {
            missingItems.push('Dias de atendimento')
          }
        }
      } catch (error) {
        console.warn('⚠️ Erro ao verificar configuração (ignorando):', error)
      }

      const isComplete = missingItems.length === 0

      const result: AgendaConfigurationStatus = {
        isComplete,
        missingItems,
        loading: false,
        error: null
      }

      setStatus(result)
      return result

    } catch (error) {
      console.error('Erro ao verificar status da configuração:', error)
      const errorResult: AgendaConfigurationStatus = {
        isComplete: true, // Assume completo em caso de erro para não bloquear
        missingItems: [],
        loading: false,
        error: 'Erro ao verificar configuração'
      }
      setStatus(errorResult)
      return errorResult
    }
  }, [professionalId])

  return {
    ...status,
    checkConfigurationStatus
  }
}
