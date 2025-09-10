import React, { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, MoreHorizontal, Calendar, MessageSquare, Heart, UserPlus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNotifications } from '@/hooks/useNotifications'
import { useAuthContext } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { cn } from '@/lib/utils'

interface NotificationDropdownProps {
  salonId?: string
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ salonId }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthContext()
  
  const {
    notifications,
    loading,
    unreadCount,
    lastUpdate,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications(salonId)

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Buscar notificações imediatamente quando o usuário estiver carregado
  useEffect(() => {
    if (user?.id) {
      fetchNotifications()
    }
  }, [user?.id, fetchNotifications])

  // Log para debug do real-time
  useEffect(() => {
    console.log('🔔 NotificationDropdown - lastUpdate mudou:', lastUpdate, 'unreadCount:', unreadCount)
  }, [lastUpdate, unreadCount])

  // Buscar notificações quando abrir (para garantir dados atualizados)
  useEffect(() => {
    if (isOpen) {
      fetchNotifications()
    }
  }, [isOpen, fetchNotifications])

  // Notificações para exibir (limitadas se não mostrar todas)
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5)

  // Função para obter ícone baseado no tipo
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment':
        return <Calendar className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'like':
        return <Heart className="h-4 w-4" />
      case 'follow':
        return <UserPlus className="h-4 w-4" />
      case 'system':
        return <Settings className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  // Função para obter cor baseada no tipo
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'appointment':
        return 'bg-blue-100 text-blue-600'
      case 'message':
        return 'bg-green-100 text-green-600'
      case 'like':
        return 'bg-red-100 text-red-600'
      case 'follow':
        return 'bg-purple-100 text-purple-600'
      case 'system':
        return 'bg-gray-100 text-gray-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  // Função para obter avatar do remetente
  const getSenderAvatar = (notification: any) => {
    // Se tem dados do remetente, usar o avatar dele
    if (notification.data?.sender_photo) {
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={notification.data.sender_photo} />
          <AvatarFallback className="text-xs">
            {notification.data.sender_name?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
      )
    }

    // Avatar padrão baseado no tipo
    return (
      <div className={cn(
        "h-8 w-8 rounded-full flex items-center justify-center",
        getNotificationColor(notification.type)
      )}>
        {getNotificationIcon(notification.type)}
      </div>
    )
  }

  const handleNotificationClick = async (notification: any) => {
    // Marcar como lida se não estiver lida
    if (notification.status !== 'read') {
      await markAsRead(notification.id)
    }

    // Navegar baseado no tipo de notificação
    if (notification.data?.appointment_id) {
      // Navegar para agendamento
      window.location.href = `/agenda-completa?appointment=${notification.data.appointment_id}`
    } else if (notification.data?.post_id) {
      // Navegar para post
      window.location.href = `/beautywall?post=${notification.data.post_id}`
    } else if (notification.data?.profile_id) {
      // Navegar para perfil
      window.location.href = `/perfil/${notification.data.profile_id}`
    }

    setIsOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Sino */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-gray-100 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700"
                >
                  Marcar todas como lidas
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Lista de Notificações */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Carregando notificações...
              </div>
            ) : displayNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">Nenhuma notificação</p>
                <p className="text-xs text-gray-400 mt-1">
                  Você receberá notificações sobre agendamentos, mensagens e atividades
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {displayNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "p-4 hover:bg-gray-50 cursor-pointer transition-colors",
                      notification.status !== 'read' && "bg-blue-50/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar/Ícone */}
                      {getSenderAvatar(notification)}
                      
                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 line-clamp-2">
                              {notification.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          
                          {/* Indicador de não lida */}
                          {notification.status !== 'read' && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                        
                        {/* Timestamp */}
                        <p className="text-xs text-gray-400 mt-2">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 5 && (
            <div className="border-t border-gray-200 p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-blue-600 hover:text-blue-700"
              >
                {showAll ? 'Mostrar menos' : `Ver todas (${notifications.length})`}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
