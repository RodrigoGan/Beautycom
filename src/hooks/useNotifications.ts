import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

// Interface para notificações
export interface Notification {
  id: string
  user_id: string
  salon_id?: string
  type: string
  category: string
  title: string
  message: string
  data: Record<string, any>
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: 'unread' | 'read'
  read_at?: string
  created_at: string
  scheduled_for?: string
  expires_at?: string
  metadata: Record<string, any>
}

// Interface para preferências de notificação
export interface NotificationPreferences {
  id: string
  user_id: string
  salon_id?: string
  email_enabled: boolean
  push_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  created_at: string
  updated_at: string
}

export const useNotifications = (salonId?: string) => {
  const { user } = useAuthContext()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now())

  // Buscar notificações do usuário
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)


      let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Filtrar por salão se especificado
      if (salonId) {
        query = query.eq('salon_id', salonId)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('❌ Erro ao buscar notificações:', fetchError)
        throw fetchError
      }

      console.log('✅ Notificações encontradas:', data?.length || 0)
      setNotifications(data || [])

    } catch (err) {
      console.error('❌ Erro ao buscar notificações:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [user?.id, salonId])

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return false

    try {
      console.log('📖 Marcando notificação como lida:', notificationId)

      const { error } = await supabase.rpc('mark_notification_as_read', {
        p_notification_id: notificationId
      })

      if (error) {
        console.error('❌ Erro ao marcar como lida:', error)
        throw error
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, status: 'read', read_at: new Date().toISOString() }
            : notif
        )
      )

      console.log('✅ Notificação marcada como lida')
      return true

    } catch (err) {
      console.error('❌ Erro ao marcar como lida:', err)
      return false
    }
  }, [user?.id])

  // Marcar todas as notificações como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return 0

    try {
      console.log('📖 Marcando todas as notificações como lidas')

      const { data, error } = await supabase.rpc('mark_all_notifications_as_read', {
        p_user_id: user.id
      })

      if (error) {
        console.error('❌ Erro ao marcar todas como lidas:', error)
        throw error
      }

      // Atualizar estado local
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, status: 'read', read_at: new Date().toISOString() }))
      )

      console.log('✅ Notificações marcadas como lidas:', data)
      return data || 0

    } catch (err) {
      console.error('❌ Erro ao marcar todas como lidas:', err)
      return 0
    }
  }, [user?.id])

  // Buscar preferências de notificação
  const fetchPreferences = useCallback(async () => {
    if (!user?.id) return

    try {
      console.log('⚙️ Buscando preferências de notificação')

      let query = supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)

      if (salonId) {
        query = query.eq('salon_id', salonId)
      }

      const { data, error } = await query

      if (error) {
        console.error('❌ Erro ao buscar preferências:', error)
        throw error
      }

      // Se não existir, criar preferências padrão
      if (!data || data.length === 0) {
        console.log('ℹ️ Criando preferências padrão')
        await createDefaultPreferences()
      } else {
        setPreferences(data[0])
      }

    } catch (err) {
      console.error('❌ Erro ao buscar preferências:', err)
    }
  }, [user?.id, salonId])

  // Criar preferências padrão
  const createDefaultPreferences = useCallback(async () => {
    if (!user?.id) return

    try {
      const defaultPrefs: Partial<NotificationPreferences> = {
        user_id: user.id,
        salon_id: salonId || null,
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        frequency: 'immediate'
      }

      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPrefs)
        .select()
        .single()

      if (error) throw error

      setPreferences(data)
      console.log('✅ Preferências padrão criadas')

    } catch (err) {
      console.error('❌ Erro ao criar preferências padrão:', err)
    }
  }, [user?.id, salonId])

  // Atualizar preferências
  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    if (!preferences?.id) return false

    try {
      console.log('⚙️ Atualizando preferências de notificação')

      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('id', preferences.id)

      if (error) throw error

      // Atualizar estado local
      setPreferences(prev => prev ? { ...prev, ...updates } : null)

      console.log('✅ Preferências atualizadas')
      return true

    } catch (err) {
      console.error('❌ Erro ao atualizar preferências:', err)
      return false
    }
  }, [preferences?.id])

  // Contar notificações não lidas
  const unreadCount = notifications.filter(notif => notif.status === 'unread').length
  
  // Debug temporário para contagem
  // console.log('🔔 UnreadCount atualizado:', unreadCount, 'Total notificações:', notifications.length)

  // Filtrar notificações por tipo
  const filterByType = useCallback((type: string) => {
    return notifications.filter(notif => notif.type === type)
  }, [notifications])

  // Filtrar notificações por categoria
  const filterByCategory = useCallback((category: string) => {
    return notifications.filter(notif => notif.category === category)
  }, [notifications])

  // Filtrar notificações por prioridade
  const filterByPriority = useCallback((priority: Notification['priority']) => {
    return notifications.filter(notif => notif.priority === priority)
  }, [notifications])

  // Real-time updates para notificações
  useEffect(() => {
    if (!user?.id) return

    // Configurar subscription para notificações com canal único por usuário
    const channelName = `notifications_${user.id}`
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('🔔 Real-time payload recebido:', payload.eventType, payload.new?.title)
          
          if (payload.eventType === 'INSERT') {
            // Nova notificação
            const newNotification = payload.new as Notification
            
            console.log('🔔 Nova notificação detectada:', newNotification.title, 'Para usuário:', newNotification.user_id, 'Usuário logado:', user.id)
            
            // Só adicionar se for para o usuário logado
            if (newNotification.user_id === user.id) {
              setNotifications(prev => {
                console.log('🔔 Real-time: Adicionando notificação ao estado. Total antes:', prev.length, 'Nova:', newNotification.title)
                return [newNotification, ...prev]
              })
              // Forçar re-renderização
              setLastUpdate(Date.now())
              console.log('🔔 Estado atualizado - forçando re-renderização')
            } else {
              console.log('🔔 Notificação ignorada - não é para o usuário logado')
            }
          } else if (payload.eventType === 'UPDATE') {
            // Notificação atualizada (ex: marcada como lida)
            const updatedNotification = payload.new as Notification
            setNotifications(prev => 
              prev.map(notif => 
                notif.id === updatedNotification.id ? updatedNotification : notif
              )
            )
          } else if (payload.eventType === 'DELETE') {
            // Notificação removida
            const deletedNotification = payload.old as Notification
            setNotifications(prev => 
              prev.filter(notif => notif.id !== deletedNotification.id)
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('🔔 Status da subscription:', status, 'Canal:', channelName)
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time ativo para notificações')
        }
      })

    return () => {
      console.log('🔔 Desconectando canal:', channelName)
      supabase.removeChannel(channel)
    }
  }, [user?.id])

  return {
    // Estado
    notifications,
    preferences,
    loading,
    error,
    unreadCount,
    lastUpdate,
    
    // Ações
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    fetchPreferences,
    updatePreferences,
    
    // Filtros
    filterByType,
    filterByCategory,
    filterByPriority
  }
}

