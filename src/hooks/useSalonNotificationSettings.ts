import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export interface SalonNotificationSettings {
  id: string
  salon_id: string
  reminder_48h_enabled: boolean
  reminder_24h_enabled: boolean
  reminder_30min_enabled: boolean
  check_interval_minutes: number
  max_days_ahead: number
  created_at: string
  updated_at: string
}

export interface NotificationSettingsFormData {
  reminder_48h_enabled: boolean
  reminder_24h_enabled: boolean
  reminder_30min_enabled: boolean
  check_interval_minutes?: number
  max_days_ahead?: number
}

export const useSalonNotificationSettings = (salonId?: string) => {
  const { user } = useAuthContext()
  const [settings, setSettings] = useState<SalonNotificationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar configurações do salão
  const fetchSettings = useCallback(async () => {
    if (!salonId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando configurações de notificação para salão:', salonId)

      const { data, error: fetchError } = await supabase
        .from('salon_notification_settings')
        .select('*')
        .eq('salon_id', salonId)
        .single()

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Configuração não encontrada, criar uma padrão
          console.log('⚠️ Configurações não encontradas, criando padrão...')
          await createDefaultSettings(salonId)
          return
        }
        throw fetchError
      }

      console.log('✅ Configurações carregadas:', data)
      setSettings(data)

    } catch (err) {
      console.error('❌ Erro ao buscar configurações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [salonId])

  // Criar configurações padrão
  const createDefaultSettings = async (salonId: string) => {
    try {
      console.log('🏗️ Criando configurações padrão para salão:', salonId)

      const defaultSettings = {
        salon_id: salonId,
        reminder_48h_enabled: true,
        reminder_24h_enabled: true,
        reminder_30min_enabled: true,
        check_interval_minutes: 5,
        max_days_ahead: 7
      }

      const { data, error: createError } = await supabase
        .from('salon_notification_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (createError) {
        console.error('❌ Erro ao criar configurações padrão:', createError)
        throw createError
      }

      console.log('✅ Configurações padrão criadas:', data)
      setSettings(data)

    } catch (err) {
      console.error('❌ Erro ao criar configurações padrão:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }

  // Atualizar configurações
  const updateSettings = useCallback(async (updates: Partial<NotificationSettingsFormData>) => {
    if (!settings?.id || !user?.id) {
      throw new Error('Configurações ou usuário não disponível')
    }

    try {
      setSaving(true)
      setError(null)

      console.log('⚙️ Atualizando configurações de notificação:', updates)

      const { data, error: updateError } = await supabase
        .from('salon_notification_settings')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)
        .select()
        .single()

      if (updateError) {
        console.error('❌ Erro ao atualizar configurações:', updateError)
        throw updateError
      }

      console.log('✅ Configurações atualizadas:', data)
      setSettings(data)
      return { success: true, data }

    } catch (err) {
      console.error('❌ Erro ao atualizar configurações:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setSaving(false)
    }
  })

  // Toggle individual de lembretes
  const toggleReminder = useCallback(async (type: '48h' | '24h' | '30min') => {
    if (!settings) return { success: false, error: 'Configurações não carregadas' }

    const fieldMap = {
      '48h': 'reminder_48h_enabled',
      '24h': 'reminder_24h_enabled',
      '30min': 'reminder_30min_enabled'
    }

    const field = fieldMap[type]
    const currentValue = settings[field as keyof SalonNotificationSettings] as boolean

    console.log(`🔄 Alternando lembrete ${type}: ${currentValue} → ${!currentValue}`)

    return await updateSettings({
      [field]: !currentValue
    })
  }, [settings, updateSettings])

  // Toggle múltiplos lembretes
  const toggleMultipleReminders = useCallback(async (updates: Partial<NotificationSettingsFormData>) => {
    return await updateSettings(updates)
  }, [updateSettings])



  // Carregar configurações quando o salão mudar
  useEffect(() => {
    if (salonId) {
      fetchSettings()
    }
  }, [salonId, fetchSettings])

  return {
    // Estado
    settings,
    loading,
    saving,
    error,
    
    // Ações
    fetchSettings,
    updateSettings,
    toggleReminder,
    toggleMultipleReminders,
    
    // Utilitários
    is48hEnabled: settings?.reminder_48h_enabled ?? true,
    is24hEnabled: settings?.reminder_24h_enabled ?? true,
    is30minEnabled: settings?.reminder_30min_enabled ?? true,
    checkInterval: settings?.check_interval_minutes ?? 5,
    maxDaysAhead: settings?.max_days_ahead ?? 7
  }
}
