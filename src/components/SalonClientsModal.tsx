import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { UserPlus, MapPin, Heart, MessageCircle, Eye, Calendar } from 'lucide-react'

interface SalonClientsModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
  salonName: string
}

interface Client {
  id: string
  name: string
  nickname: string
  profile_photo?: string
  user_type: 'user' | 'profissional'
  cidade?: string
  uf?: string
  interactions_count: number
  last_interaction: string
  interaction_types: string[]
}

export const SalonClientsModal = ({ isOpen, onClose, salonId, salonName }: SalonClientsModalProps) => {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = async () => {
    if (!salonId) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Buscando clientes do salão:', salonId)

      // Buscar interações do salão
      const { data: interactionsData, error: interactionsError } = await supabase
        .from('salon_interactions')
        .select('user_id, interaction_type, created_at')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })

      if (interactionsError) {
        console.error('❌ Erro ao buscar interações:', interactionsError)
        throw interactionsError
      }

      if (!interactionsData || interactionsData.length === 0) {
        setClients([])
        setLoading(false)
        return
      }

      // Agrupar interações por usuário
      const userInteractions = interactionsData.reduce((acc, interaction) => {
        if (!acc[interaction.user_id]) {
          acc[interaction.user_id] = {
            interactions: [],
            types: new Set(),
            last_interaction: interaction.created_at
          }
        }
        acc[interaction.user_id].interactions.push(interaction)
        acc[interaction.user_id].types.add(interaction.interaction_type)
        if (interaction.created_at > acc[interaction.user_id].last_interaction) {
          acc[interaction.user_id].last_interaction = interaction.created_at
        }
        return acc
      }, {} as Record<string, { interactions: any[], types: Set<string>, last_interaction: string }>)

      // Buscar dados dos usuários
      const userIds = Object.keys(userInteractions)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, nickname, profile_photo, user_type, cidade, uf')
        .in('id', userIds)

      if (usersError) {
        console.error('❌ Erro ao buscar dados dos usuários:', usersError)
        throw usersError
      }

      // Combinar dados
      const clientsWithData = Object.entries(userInteractions).map(([userId, userData]) => {
        const userInfo = usersData?.find(user => user.id === userId)
        
        return {
          id: userId,
          name: userInfo?.name || 'Usuário',
          nickname: userInfo?.nickname || 'usuario',
          profile_photo: userInfo?.profile_photo,
          user_type: userInfo?.user_type || 'user',
          cidade: userInfo?.cidade,
          uf: userInfo?.uf,
          interactions_count: userData.interactions.length,
          last_interaction: userData.last_interaction,
          interaction_types: Array.from(userData.types)
        }
      })

      // Ordenar por última interação
      clientsWithData.sort((a, b) => new Date(b.last_interaction).getTime() - new Date(a.last_interaction).getTime())

      console.log('📊 Clientes encontrados:', clientsWithData.length)
      setClients(clientsWithData)

    } catch (err) {
      console.error('❌ Erro ao buscar clientes:', err)
      setError('Erro ao carregar clientes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && salonId) {
      fetchClients()
    }
  }, [isOpen, salonId])

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'agora'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 2592000)}m`
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-3 w-3" />
      case 'comment':
        return <MessageCircle className="h-3 w-3" />
      case 'view':
        return <Eye className="h-3 w-3" />
      case 'contact':
        return <Calendar className="h-3 w-3" />
      default:
        return <UserPlus className="h-3 w-3" />
    }
  }

  const getInteractionLabel = (type: string) => {
    switch (type) {
      case 'like':
        return 'Curtiu'
      case 'comment':
        return 'Comentou'
      case 'view':
        return 'Visualizou'
      case 'contact':
        return 'Contatou'
      default:
        return type
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-hidden">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              Clientes do Salão
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[60vh] px-4 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-destructive mb-4">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchClients}
              >
                Tentar novamente
              </Button>
            </div>
          ) : clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum cliente ainda</p>
              <p className="text-sm mt-1">
                Quando clientes interagirem com o salão, eles aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {clients.map((client) => (
                <div key={client.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={client.profile_photo} />
                      <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-r from-green-600 to-teal-500 text-white">
                        {client.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate text-sm sm:text-base">
                          {client.name}
                        </p>
                        <Badge variant={client.user_type === 'profissional' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                          {client.user_type === 'profissional' ? 'Profissional' : 'Usuário'}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        @{client.nickname}
                      </p>
                      {client.cidade && client.uf && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{client.cidade}, {client.uf}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <span>{client.interactions_count} interações</span>
                        <span>•</span>
                        <span>Última: {formatTimeAgo(client.last_interaction)}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        {client.interaction_types.map((type, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {getInteractionIcon(type)}
                            <span className="ml-1">{getInteractionLabel(type)}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
