import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Users, MapPin, Building2, User } from 'lucide-react'

interface SalonFollowModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
  salonName: string
}

interface Follower {
  id: string
  name: string
  nickname: string
  profile_photo?: string
  user_type: 'user' | 'profissional'
  cidade?: string
  uf?: string
  created_at: string
}

export const SalonFollowModal = ({ isOpen, onClose, salonId, salonName }: SalonFollowModalProps) => {
  const [followers, setFollowers] = useState<Follower[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchFollowers = async () => {
    if (!salonId) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Buscando seguidores do salão:', salonId)

      // Primeiro, buscar IDs dos seguidores
      const { data: followData, error: followError } = await supabase
        .from('salon_follows')
        .select('follower_id, created_at')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })

      if (followError) {
        console.error('❌ Erro ao buscar seguidores:', followError)
        throw followError
      }

      if (!followData || followData.length === 0) {
        setFollowers([])
        setLoading(false)
        return
      }

      // Buscar dados dos usuários
      const followerIds = followData.map(item => item.follower_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, nickname, profile_photo, user_type, cidade, uf')
        .in('id', followerIds)

      if (usersError) {
        console.error('❌ Erro ao buscar dados dos usuários:', usersError)
        throw usersError
      }

      // Combinar dados dos seguidores com dados dos usuários
      const followersWithData = followData.map(follow => {
        const userData = usersData?.find(user => user.id === follow.follower_id)
        return {
          id: follow.follower_id,
          name: userData?.name || 'Usuário',
          nickname: userData?.nickname || 'usuario',
          profile_photo: userData?.profile_photo,
          user_type: userData?.user_type || 'user',
          cidade: userData?.cidade,
          uf: userData?.uf,
          created_at: follow.created_at
        }
      })

      console.log('📊 Seguidores encontrados:', followersWithData.length)
      setFollowers(followersWithData)

    } catch (err) {
      console.error('❌ Erro ao buscar seguidores:', err)
      setError('Erro ao carregar seguidores')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && salonId) {
      fetchFollowers()
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-[90vw] sm:max-w-md max-h-[85vh] overflow-hidden">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                <Users className="h-5 w-5 text-white" />
              </div>
              Seguidores do Salão
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
                onClick={fetchFollowers}
              >
                Tentar novamente
              </Button>
            </div>
          ) : followers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum seguidor ainda</p>
              <p className="text-sm mt-1">
                Quando pessoas seguirem o salão, elas aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {followers.map((follower) => (
                <div key={follower.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={follower.profile_photo} />
                      <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                        {follower.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate text-sm sm:text-base">
                          {follower.name}
                        </p>
                        <Badge variant={follower.user_type === 'profissional' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                          {follower.user_type === 'profissional' ? (
                            <>
                              <Building2 className="h-3 w-3 mr-1" />
                              Profissional
                            </>
                          ) : (
                            <>
                              <User className="h-3 w-3 mr-1" />
                              Usuário
                            </>
                          )}
                        </Badge>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        @{follower.nickname}
                      </p>
                      {follower.cidade && follower.uf && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{follower.cidade}, {follower.uf}</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Seguindo desde {formatTimeAgo(follower.created_at)}
                      </p>
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
