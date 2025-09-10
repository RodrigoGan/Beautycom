import React, { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Filter, 
  Search, 
  CheckCircle, 
  Inbox, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Settings
} from 'lucide-react'
import { Notification, useNotifications } from '@/hooks/useNotifications'
import { NotificationItem } from './NotificationItem'

interface NotificationListProps {
  salonId?: string
  maxItems?: number
  showFilters?: boolean
  showPagination?: boolean
  compact?: boolean
  onNotificationClick?: (notification: Notification) => void
}

// Tipos de notificação disponíveis
const NOTIFICATION_TYPES = [
  { value: 'all', label: 'Todas' },
  { value: 'appointment', label: 'Agendamentos' },
  { value: 'professional', label: 'Profissionais' },
  { value: 'reminder', label: 'Lembretes' },
  { value: 'alert', label: 'Alertas' },
  { value: 'success', label: 'Sucessos' },
  { value: 'info', label: 'Informações' }
]

// Categorias disponíveis
const NOTIFICATION_CATEGORIES = [
  { value: 'all', label: 'Todas' },
  { value: 'test', label: 'Teste' },
  { value: 'system', label: 'Sistema' },
  { value: 'user', label: 'Usuário' },
  { value: 'salon', label: 'Salão' }
]

// Prioridades disponíveis
const NOTIFICATION_PRIORITIES = [
  { value: 'all', label: 'Todas' },
  { value: 'urgent', label: 'Urgente' },
  { value: 'high', label: 'Alta' },
  { value: 'normal', label: 'Normal' },
  { value: 'low', label: 'Baixa' }
]

export const NotificationList: React.FC<NotificationListProps> = ({
  salonId,
  maxItems = 10,
  showFilters = true,
  showPagination = true,
  compact = false,
  onNotificationClick
}) => {
  const {
    notifications,
    loading,
    error,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead
  } = useNotifications(salonId)

  // Estados de filtros
  const [typeFilter, setTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = maxItems

  // Filtrar notificações
  const filteredNotifications = useMemo(() => {
    let filtered = [...notifications]

    // Filtro por tipo
    if (typeFilter !== 'all') {
      filtered = filtered.filter(notif => notif.type === typeFilter)
    }

    // Filtro por categoria
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(notif => notif.category === categoryFilter)
    }

    // Filtro por prioridade
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(notif => notif.priority === priorityFilter)
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(notif => notif.status === statusFilter)
    }

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(notif => 
        notif.title.toLowerCase().includes(term) ||
        notif.message.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [notifications, typeFilter, categoryFilter, priorityFilter, statusFilter, searchTerm])

  // Calcular paginação
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentNotifications = filteredNotifications.slice(startIndex, endIndex)

  // Handlers
  const handleMarkAsRead = async (id: string) => {
    const success = await markAsRead(id)
    if (success && onNotificationClick) {
      const notification = notifications.find(n => n.id === id)
      if (notification) {
        onNotificationClick(notification)
      }
    }
    return success
  }

  const handleMarkAllAsRead = async () => {
    const count = await markAllAsRead()
    if (count > 0) {
      console.log(`✅ ${count} notificações marcadas como lidas`)
    }
  }

  const handleRefresh = () => {
    fetchNotifications()
    setCurrentPage(1)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const clearFilters = () => {
    setTypeFilter('all')
    setCategoryFilter('all')
    setPriorityFilter('all')
    setStatusFilter('all')
    setSearchTerm('')
    setCurrentPage(1)
  }

  // Estatísticas dos filtros
  const filterStats = {
    total: notifications.length,
    filtered: filteredNotifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-muted-foreground">Carregando notificações...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-2">Erro ao carregar notificações</p>
        <p className="text-sm text-muted-foreground mb-4">{error}</p>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Tentar novamente
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Notificações</h3>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {filterStats.total}
            </Badge>
            {filterStats.unread > 0 && (
              <Badge variant="destructive">
                {filterStats.unread} não lidas
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {filterStats.unread > 0 && (
            <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Marcar todas como lidas
            </Button>
          )}
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtros</span>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar notificações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtro por tipo */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por categoria */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_CATEGORIES.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por prioridade */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_PRIORITIES.map(priority => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtro por status */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="unread">Não lidas</SelectItem>
                <SelectItem value="read">Lidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estatísticas dos filtros */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="text-sm text-muted-foreground">
              Mostrando {filterStats.filtered} de {filterStats.total} notificações
            </div>
            <Button onClick={clearFilters} variant="ghost" size="sm">
              Limpar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Lista de notificações */}
      <div className="space-y-3">
        {currentNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {filterStats.total === 0 ? 'Nenhuma notificação' : 'Nenhuma notificação encontrada com os filtros aplicados'}
            </p>
            {filterStats.total === 0 ? (
              <p className="text-sm text-muted-foreground">Suas notificações aparecerão aqui</p>
            ) : (
              <Button onClick={clearFilters} variant="outline" size="sm" className="mt-2">
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          currentNotifications.map(notification => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onMarkAsRead={handleMarkAsRead}
              compact={compact}
              showActions={true}
            />
          ))
        )}
      </div>

      {/* Paginação */}
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                onClick={() => handlePageChange(page)}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
              >
                {page}
              </Button>
            ))}
            
            <Button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              variant="outline"
              size="sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

