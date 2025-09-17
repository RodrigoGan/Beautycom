import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface WhatsAppCampaign {
  id: string
  name: string
  message_template: string
  template_id?: string
  target_user_type: 'profissional' | 'usuario' | 'all'
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'paused'
  sent_count: number
  total_count: number
  created_at: string
  updated_at: string
  success_rate: number
  total_logs: number
  successful_sends: number
  failed_sends: number
  pending_sends: number
  professional_sends: number
  user_sends: number
}

export interface WhatsAppMessageLog {
  id: string
  campaign_id: string
  user_id: string
  user_type: 'profissional' | 'usuario'
  user_name: string
  user_email?: string
  phone: string
  message_sent: string
  template_id?: string
  status: 'sent' | 'failed' | 'pending' | 'cancelled'
  sent_at?: string
  error_message?: string
}

export interface CampaignFilters {
  userType: 'all' | 'profissional' | 'usuario'
  status: 'all' | 'draft' | 'active' | 'completed' | 'cancelled' | 'paused'
  dateRange: {
    start: string
    end: string
  }
}

export const useWhatsAppHistory = () => {
  const [campaigns, setCampaigns] = useState<WhatsAppCampaign[]>([])
  const [messageLogs, setMessageLogs] = useState<WhatsAppMessageLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<CampaignFilters>({
    userType: 'all',
    status: 'all',
    dateRange: {
      start: '',
      end: ''
    }
  })

  // Buscar campanhas com estatísticas
  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Primeiro, buscar logs de mensagens para criar "campanhas virtuais"
      let query = supabase
        .from('whatsapp_message_logs')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros
      if (filters.userType !== 'all') {
        query = query.eq('user_type', filters.userType)
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.dateRange.start) {
        query = query.gte('created_at', filters.dateRange.start)
      }

      if (filters.dateRange.end) {
        query = query.lte('created_at', filters.dateRange.end)
      }

      const { data: logs, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      // Agrupar logs por template para criar campanhas virtuais
      const campaignMap = new Map()
      
      logs?.forEach(log => {
        const key = log.template_id || 'individual'
        if (!campaignMap.has(key)) {
          campaignMap.set(key, {
            id: key,
            name: log.template_id ? `Template: ${log.template_id}` : 'Mensagem Individual',
            message_template: log.message_sent,
            template_id: log.template_id,
            target_user_type: log.user_type,
            status: 'completed',
            sent_count: 0,
            total_count: 0,
            created_at: log.created_at,
            updated_at: log.created_at,
            success_rate: 0,
            total_logs: 0,
            successful_sends: 0,
            failed_sends: 0,
            pending_sends: 0,
            professional_sends: 0,
            user_sends: 0
          })
        }
        
        const campaign = campaignMap.get(key)
        campaign.total_count++
        campaign.total_logs++
        
        if (log.status === 'sent') {
          campaign.sent_count++
          campaign.successful_sends++
        } else if (log.status === 'failed') {
          campaign.failed_sends++
        } else if (log.status === 'pending') {
          campaign.pending_sends++
        }
        
        if (log.user_type === 'profissional') {
          campaign.professional_sends++
        } else if (log.user_type === 'usuario') {
          campaign.user_sends++
        }
        
        // Atualizar data mais recente
        if (new Date(log.created_at) > new Date(campaign.created_at)) {
          campaign.created_at = log.created_at
          campaign.updated_at = log.created_at
        }
      })
      
      // Calcular taxa de sucesso
      const campaigns = Array.from(campaignMap.values()).map(campaign => ({
        ...campaign,
        success_rate: campaign.total_count > 0 ? 
          Math.round((campaign.successful_sends / campaign.total_count) * 100) : 0
      }))

      setCampaigns(campaigns)
    } catch (err) {
      console.error('Erro ao buscar campanhas:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Buscar logs de uma campanha específica
  const fetchCampaignLogs = useCallback(async (campaignId: string) => {
    try {
      setLoading(true)
      setError(null)

      // Se for uma campanha individual (sem template_id), buscar por template_id null
      const query = campaignId === 'individual' 
        ? supabase
            .from('whatsapp_message_logs')
            .select('*')
            .is('template_id', null)
            .order('created_at', { ascending: false })
        : supabase
            .from('whatsapp_message_logs')
            .select('*')
            .eq('template_id', campaignId)
            .order('created_at', { ascending: false })

      const { data, error: fetchError } = await query

      if (fetchError) {
        throw fetchError
      }

      setMessageLogs(data || [])
    } catch (err) {
      console.error('Erro ao buscar logs da campanha:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Criar nova campanha
  const createCampaign = useCallback(async (campaignData: {
    name: string
    message_template: string
    template_id?: string
    target_user_type: 'profissional' | 'usuario' | 'all'
    target_filters?: any
  }) => {
    try {
      const { data, error: insertError } = await supabase
        .from('whatsapp_campaigns')
        .insert([{
          ...campaignData,
          status: 'draft',
          sent_count: 0,
          total_count: 0
        }])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Recarregar campanhas
      await fetchCampaigns()
      return data
    } catch (err) {
      console.error('Erro ao criar campanha:', err)
      setError(err instanceof Error ? err.message : 'Erro ao criar campanha')
      throw err
    }
  }, [fetchCampaigns])

  // Inserir log de mensagem
  const insertMessageLog = useCallback(async (logData: {
    campaign_id: string
    user_id: string
    user_type: 'profissional' | 'usuario'
    user_name: string
    user_email?: string
    phone: string
    message_sent: string
    template_id?: string
    status: 'sent' | 'failed' | 'pending' | 'cancelled'
  }) => {
    try {
      const { data, error: insertError } = await supabase
        .from('whatsapp_message_logs')
        .insert([{
          ...logData,
          sent_at: logData.status === 'sent' ? new Date().toISOString() : null
        }])
        .select()
        .single()

      if (insertError) {
        throw insertError
      }

      // Recarregar campanhas para atualizar estatísticas
      await fetchCampaigns()
      return data
    } catch (err) {
      console.error('Erro ao inserir log:', err)
      setError(err instanceof Error ? err.message : 'Erro ao inserir log')
      throw err
    }
  }, [fetchCampaigns])

  // Atualizar filtros
  const updateFilters = useCallback((newFilters: Partial<CampaignFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }, [])

  // Limpar filtros
  const clearFilters = useCallback(() => {
    setFilters({
      userType: 'all',
      status: 'all',
      dateRange: {
        start: '',
        end: ''
      }
    })
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    fetchCampaigns()
  }, [fetchCampaigns])

  return {
    campaigns,
    messageLogs,
    loading,
    error,
    filters,
    fetchCampaigns,
    fetchCampaignLogs,
    createCampaign,
    insertMessageLog,
    updateFilters,
    clearFilters
  }
}
