import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  Users, 
  Check, 
  X, 
  Clock,
  MapPin
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

// Interface para convite de profissional
interface ProfessionalInvite {
  id: string
  salon_id: string
  professional_id: string
  service_type?: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  salon?: {
    id: string
    name: string
    profile_photo?: string
    description?: string
    cidade?: string
    uf?: string
  }
}

export const ProfessionalInvites: React.FC = () => {
  const { toast } = useToast()
  const navigate = useNavigate()
  const [invites, setInvites] = useState<ProfessionalInvite[]>([])
  const [loading, setLoading] = useState(true)

  // Buscar convites pendentes
  const fetchInvites = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      console.log('🔍 Buscando convites de profissionais para:', user.id)

      const { data, error } = await supabase
        .from('salon_professionals')
        .select(`
          *,
          salon:salons_studios(id, name, profile_photo, description, cidade, uf)
        `)
        .eq('professional_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar convites:', error)
        throw error
      }

      console.log('✅ Convites encontrados:', data?.length || 0)
      setInvites(data || [])

    } catch (err) {
      console.error('❌ Erro ao buscar convites:', err)
    } finally {
      setLoading(false)
    }
  }

  // Aceitar convite
  const handleAcceptInvite = async (inviteId: string) => {
    try {
      console.log('✅ Aceitando convite:', inviteId)

      const { data, error } = await supabase
        .from('salon_professionals')
        .update({ status: 'accepted' })
        .eq('id', inviteId)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao aceitar convite:', error)
        throw error
      }

      console.log('✅ Convite aceito com sucesso:', data)
      
      toast({
        title: 'Convite aceito!',
        description: 'Você agora é profissional deste salão.',
        variant: 'default'
      })

      // Atualizar lista
      setInvites(prev => prev.filter(invite => invite.id !== inviteId))

    } catch (err) {
      console.error('❌ Erro ao aceitar convite:', err)
      toast({
        title: 'Erro ao aceitar convite',
        description: 'Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  // Rejeitar convite
  const handleRejectInvite = async (inviteId: string) => {
    try {
      console.log('❌ Rejeitando convite:', inviteId)

      const { data, error } = await supabase
        .from('salon_professionals')
        .update({ status: 'rejected' })
        .eq('id', inviteId)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao rejeitar convite:', error)
        throw error
      }

      console.log('✅ Convite rejeitado com sucesso:', data)
      
      toast({
        title: 'Convite rejeitado',
        description: 'O convite foi rejeitado.',
        variant: 'default'
      })

      // Atualizar lista
      setInvites(prev => prev.filter(invite => invite.id !== inviteId))

    } catch (err) {
      console.error('❌ Erro ao rejeitar convite:', err)
      toast({
        title: 'Erro ao rejeitar convite',
        description: 'Tente novamente.',
        variant: 'destructive'
      })
    }
  }

  // Buscar convites quando componente montar
  useEffect(() => {
    fetchInvites()
  }, [])

  // Se não há convites, não renderiza nada
  if (invites.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 bg-gradient-card border-primary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Convites de Profissionais Pendentes
          <Badge variant="secondary" className="ml-2">
            {invites.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {invites.map((invite) => (
            <div 
              key={invite.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={invite.salon?.profile_photo} />
                <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                  {invite.salon?.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              <div 
                className="flex-1 min-w-0 cursor-pointer hover:bg-primary/5 p-2 rounded transition-colors"
                onClick={() => navigate(`/salon/${invite.salon_id}`)}
                title="Clique para ver o perfil do salão"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium truncate text-sm">
                    {invite.salon?.name}
                  </p>
                  <Badge 
                    variant="default" 
                    className="text-xs bg-purple-100 text-purple-800"
                  >
                    {invite.service_type || 'Profissional'}
                  </Badge>
                  <Badge 
                    variant="default" 
                    className="text-xs bg-yellow-100 text-yellow-800"
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Pendente
                  </Badge>
                </div>
                {invite.salon?.cidade && invite.salon?.uf && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{invite.salon.cidade}, {invite.salon.uf}</span>
                  </div>
                )}
              </div>

              {/* Ações */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAcceptInvite(invite.id)
                  }}
                  title="Aceitar convite"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRejectInvite(invite.id)
                  }}
                  title="Rejeitar convite"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}



