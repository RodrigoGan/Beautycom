import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  Users, 
  Check, 
  X, 
  Loader2,
  Clock
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { useNavigate } from 'react-router-dom'

// Interface específica para convites de funcionário
interface EmployeeInvite {
  id: string
  salon_id: string
  user_id: string
  role: 'admin' | 'secretary' | 'manager' | 'receptionist' | 'cleaner'
  permissions: any
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected'
  created_at: string
  updated_at: string
  salon?: {
    id: string
    name: string
    profile_photo?: string
  }
  user?: {
    id: string
    name: string
    nickname: string
    profile_photo?: string
    email: string
  }
}

export const EmployeeInvites = () => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [pendingInvites, setPendingInvites] = useState<EmployeeInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar convites pendentes do usuário logado
  const fetchPendingInvites = async () => {
    if (!user?.id) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando convites pendentes para:', user.id)

      const { data, error } = await supabase
        .from('salon_employees')
        .select(`
          *,
          salon:salons_studios(id, name, profile_photo),
          user:users(id, name, nickname, profile_photo, email)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar convites:', error)
        throw error
      }

      console.log('✅ Convites encontrados:', data?.length || 0)
      setPendingInvites(data || [])

    } catch (err) {
      console.error('❌ Erro ao buscar convites:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Aceitar convite
  const handleAcceptInvite = async (employeeId: string, salonName: string) => {
    try {
      const { data, error } = await supabase
        .from('salon_employees')
        .update({ status: 'active' })
        .eq('id', employeeId)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao aceitar convite:', error)
        throw error
      }

      toast({
        title: 'Convite aceito!',
        description: `Você agora é funcionário do ${salonName}.`,
        variant: 'default'
      })
      
      // Remover o convite da lista
      setPendingInvites(prev => prev.filter(invite => invite.id !== employeeId))

    } catch (error) {
      toast({
        title: 'Erro ao aceitar convite',
        description: 'Erro inesperado ao aceitar convite.',
        variant: 'destructive'
      })
    }
  }

  // Rejeitar convite
  const handleRejectInvite = async (employeeId: string, salonName: string) => {
    try {
      const { data, error } = await supabase
        .from('salon_employees')
        .update({ status: 'rejected' })
        .eq('id', employeeId)
        .eq('user_id', user?.id)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao rejeitar convite:', error)
        throw error
      }

      toast({
        title: 'Convite rejeitado',
        description: `Você rejeitou o convite do ${salonName}.`,
        variant: 'default'
      })
      
      // Remover o convite da lista
      setPendingInvites(prev => prev.filter(invite => invite.id !== employeeId))

    } catch (error) {
      toast({
        title: 'Erro ao rejeitar convite',
        description: 'Erro inesperado ao rejeitar convite.',
        variant: 'destructive'
      })
    }
  }

  const getRoleLabel = (role: EmployeeInvite['role']) => {
    const labels = {
      admin: 'Administrador',
      secretary: 'Secretária',
      manager: 'Gerente',
      receptionist: 'Recepcionista',
      cleaner: 'Limpeza'
    }
    return labels[role]
  }

  const getRoleColor = (role: EmployeeInvite['role']) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      secretary: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      receptionist: 'bg-purple-100 text-purple-800',
      cleaner: 'bg-gray-100 text-gray-800'
    }
    return colors[role]
  }

  // Buscar convites quando componente montar
  useEffect(() => {
    fetchPendingInvites()
  }, [user?.id])

  // Se não há convites pendentes, não renderiza nada
  if (pendingInvites.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 bg-gradient-card border-primary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Convites Pendentes
          <Badge variant="secondary" className="ml-2">
            {pendingInvites.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando convites...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchPendingInvites}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <div 
                key={invite.id} 
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors cursor-pointer group"
                onClick={() => navigate(`/salon/${invite.salon_id}`)}
                title="Clique para ver o perfil do salão"
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={invite.salon?.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                    {invite.salon?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate text-sm">
                      {invite.salon?.name}
                    </p>
                    <Badge 
                      variant="default" 
                      className={`text-xs ${getRoleColor(invite.role)}`}
                    >
                      {getRoleLabel(invite.role)}
                    </Badge>
                    <Badge 
                      variant="default" 
                      className="text-xs bg-yellow-100 text-yellow-800"
                    >
                      <Clock className="h-3 w-3 mr-1" />
                      Pendente
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    Convite enviado em {new Date(invite.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => handleAcceptInvite(invite.id, invite.salon?.name || 'Salão')}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleRejectInvite(invite.id, invite.salon?.name || 'Salão')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
