import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Users, MapPin, Star, Calendar, UserCheck } from 'lucide-react'

interface SalonProfessionalsModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
  salonName: string
}

interface Professional {
  id: string
  name: string
  nickname: string
  profile_photo?: string
  email: string
  cidade?: string
  uf?: string
  categories?: string[]
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  posts_count: number
}

export const SalonProfessionalsModal = ({ isOpen, onClose, salonId, salonName }: SalonProfessionalsModalProps) => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfessionals = async () => {
    if (!salonId) return

    setLoading(true)
    setError(null)

    try {
      console.log('🔍 Buscando profissionais do salão:', salonId)

      // Buscar profissionais vinculados ao salão
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('salon_professionals')
        .select('professional_id, status, created_at')
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })

      if (professionalsError) {
        console.error('❌ Erro ao buscar profissionais:', professionalsError)
        throw professionalsError
      }

      if (!professionalsData || professionalsData.length === 0) {
        setProfessionals([])
        setLoading(false)
        return
      }

      // Buscar dados dos profissionais
      const professionalIds = professionalsData.map(item => item.professional_id)
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, nickname, profile_photo, email, user_type, cidade, uf, categories')
        .in('id', professionalIds)
        .eq('user_type', 'profissional')

      if (usersError) {
        console.error('❌ Erro ao buscar dados dos profissionais:', usersError)
        throw usersError
      }

      // Buscar contagem de posts para cada profissional
      const professionalsWithPosts = await Promise.all(
        professionalIds.map(async (professionalId) => {
          const { count: postsCount } = await supabase
            .from('posts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', professionalId)
            .eq('is_active', true)

          return { professionalId, postsCount: postsCount || 0 }
        })
      )

      // Combinar dados
      const professionalsWithData = professionalsData.map(professional => {
        const userData = usersData?.find(user => user.id === professional.professional_id)
        const postsData = professionalsWithPosts.find(p => p.professionalId === professional.professional_id)
        
        return {
          id: professional.professional_id,
          name: userData?.name || 'Profissional',
          nickname: userData?.nickname || 'profissional',
          profile_photo: userData?.profile_photo,
          email: userData?.email || '',
          cidade: userData?.cidade,
          uf: userData?.uf,
          categories: userData?.categories || [],
          status: professional.status,
          created_at: professional.created_at,
          posts_count: postsData?.postsCount || 0
        }
      })

      console.log('📊 Profissionais encontrados:', professionalsWithData.length)
      setProfessionals(professionalsWithData)

    } catch (err) {
      console.error('❌ Erro ao buscar profissionais:', err)
      setError('Erro ao carregar profissionais')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && salonId) {
      fetchProfessionals()
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge variant="default" className="text-xs"><UserCheck className="h-3 w-3 mr-1" />Aceito</Badge>
      case 'pending':
        return <Badge variant="secondary" className="text-xs"><Calendar className="h-3 w-3 mr-1" />Pendente</Badge>
      case 'rejected':
        return <Badge variant="destructive" className="text-xs">Rejeitado</Badge>
      default:
        return <Badge variant="outline" className="text-xs">{status}</Badge>
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
                <Users className="h-5 w-5 text-white" />
              </div>
              Profissionais do Salão
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
                onClick={fetchProfessionals}
              >
                Tentar novamente
              </Button>
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum profissional vinculado</p>
              <p className="text-sm mt-1">
                Quando profissionais se vincularem ao salão, eles aparecerão aqui
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {professionals.map((professional) => (
                <div key={professional.id} className="flex items-center justify-between p-3 sm:p-4 rounded-lg border">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0">
                      <AvatarImage src={professional.profile_photo} />
                      <AvatarFallback className="text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                        {professional.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium truncate text-sm sm:text-base">
                          {professional.name}
                        </p>
                        {getStatusBadge(professional.status)}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">
                        @{professional.nickname}
                      </p>
                      {professional.cidade && professional.uf && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          <span>{professional.cidade}, {professional.uf}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          <span>{professional.posts_count} posts</span>
                        </div>
                        <span>•</span>
                        <span>Vinculado há {formatTimeAgo(professional.created_at)}</span>
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
