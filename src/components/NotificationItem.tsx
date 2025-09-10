import React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Calendar, 
  Users, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Info, 
  Star,
  Check,
  X
} from 'lucide-react'
import { Notification } from '@/hooks/useNotifications'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => Promise<boolean>
  onMarkAsUnread?: (id: string) => Promise<boolean>
  showActions?: boolean
  compact?: boolean
}

// Mapeamento de tipos para ícones
const getTypeIcon = (type: string) => {
  switch (type) {
    case 'appointment':
      return <Calendar className="h-4 w-4" />
    case 'professional':
      return <Users className="h-4 w-4" />
    case 'reminder':
      return <Clock className="h-4 w-4" />
    case 'alert':
      return <AlertCircle className="h-4 w-4" />
    case 'success':
      return <CheckCircle className="h-4 w-4" />
    case 'info':
      return <Info className="h-4 w-4" />
    default:
      return <Info className="h-4 w-4" />
  }
}

// Mapeamento de tipos para cores
const getTypeColor = (type: string) => {
  switch (type) {
    case 'appointment':
      return 'text-blue-600 bg-blue-50 border-blue-200'
    case 'professional':
      return 'text-green-600 bg-green-50 border-green-200'
    case 'reminder':
      return 'text-purple-600 bg-purple-50 border-purple-200'
    case 'alert':
      return 'text-red-600 bg-red-50 border-red-200'
    case 'success':
      return 'text-emerald-600 bg-emerald-50 border-emerald-200'
    case 'info':
      return 'text-slate-600 bg-slate-50 border-slate-200'
    default:
      return 'text-slate-600 bg-slate-50 border-slate-200'
  }
}

// Mapeamento de prioridades para cores
const getPriorityColor = (priority: Notification['priority']) => {
  switch (priority) {
    case 'urgent':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'normal':
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case 'low':
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-blue-100 text-blue-800 border-blue-200'
  }
}

// Mapeamento de prioridades para ícones
const getPriorityIcon = (priority: Notification['priority']) => {
  switch (priority) {
    case 'urgent':
      return <AlertCircle className="h-3 w-3" />
    case 'high':
      return <Star className="h-3 w-3" />
    case 'normal':
      return <Info className="h-3 w-3" />
    case 'low':
      return <Check className="h-3 w-3" />
    default:
      return <Info className="h-3 w-3" />
  }
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onMarkAsUnread,
  showActions = true,
  compact = false
}) => {
  const isRead = notification.status === 'read'
  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: ptBR
  })

  const handleMarkAsRead = async () => {
    if (!isRead) {
      await onMarkAsRead(notification.id)
    }
  }

  const handleMarkAsUnread = async () => {
    if (isRead && onMarkAsUnread) {
      await onMarkAsUnread(notification.id)
    }
  }

  if (compact) {
    return (
      <div 
        className={`flex items-center gap-3 p-3 rounded-lg border transition-all duration-200 hover:shadow-sm cursor-pointer ${
          isRead 
            ? 'bg-gray-50 border-gray-200 opacity-75' 
            : 'bg-white border-gray-200 shadow-sm'
        }`}
        onClick={handleMarkAsRead}
      >
        {/* Indicador de status */}
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
          isRead ? 'bg-gray-400' : 'bg-blue-500'
        }`} />
        
        {/* Ícone do tipo */}
        <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
          {getTypeIcon(notification.type)}
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-medium text-sm ${
              isRead ? 'text-gray-600' : 'text-gray-900'
            }`}>
              {notification.title}
            </span>
            <Badge 
              variant="secondary" 
              className={`text-xs ${getPriorityColor(notification.priority)}`}
            >
              {getPriorityIcon(notification.priority)}
              {notification.priority}
            </Badge>
          </div>
          <p className={`text-sm ${
            isRead ? 'text-gray-500' : 'text-gray-700'
          }`}>
            {notification.message}
          </p>
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-gray-400 flex-shrink-0">
          {timeAgo}
        </div>
      </div>
    )
  }

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      isRead ? 'opacity-75' : 'shadow-sm'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Indicador de status */}
          <div className={`w-2 h-2 rounded-full mt-3 flex-shrink-0 ${
            isRead ? 'bg-gray-400' : 'bg-blue-500'
          }`} />
          
          {/* Ícone do tipo */}
          <div className={`p-2 rounded-full ${getTypeColor(notification.type)}`}>
            {getTypeIcon(notification.type)}
          </div>
          
          {/* Conteúdo principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-medium ${
                isRead ? 'text-gray-600' : 'text-gray-900'
              }`}>
                {notification.title}
              </h4>
              
              {/* Badge de prioridade */}
              <Badge 
                variant="secondary" 
                className={`text-xs ${getPriorityColor(notification.priority)}`}
              >
                {getPriorityIcon(notification.priority)}
                {notification.priority}
              </Badge>
              
              {/* Badge de categoria */}
              <Badge variant="outline" className="text-xs">
                {notification.category}
              </Badge>
            </div>
            
            {/* Mensagem */}
            <p className={`text-sm mb-3 ${
              isRead ? 'text-gray-500' : 'text-gray-700'
            }`}>
              {notification.message}
            </p>
            
            {/* Metadados e timestamp */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                {timeAgo}
                
                {notification.scheduled_for && (
                  <>
                    <span>•</span>
                    <span>Agendada para: {new Date(notification.scheduled_for).toLocaleString('pt-BR')}</span>
                  </>
                )}
              </div>
              
              {/* Ações */}
              {showActions && (
                <div className="flex items-center gap-2">
                  {!isRead ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkAsRead}
                      className="h-8 px-3 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Marcar como lida
                    </Button>
                  ) : (
                    onMarkAsUnread && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleMarkAsUnread}
                        className="h-8 px-3 text-xs"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Marcar como não lida
                      </Button>
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

