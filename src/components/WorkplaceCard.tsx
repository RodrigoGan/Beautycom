import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  Building2, 
  MapPin, 
  ExternalLink,
  Users,
  Crown,
  UserCheck
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

// Interface para local de trabalho
interface Workplace {
  id: string
  salon_id: string
  user_id?: string
  professional_id?: string
  role?: 'admin' | 'secretary' | 'manager' | 'receptionist' | 'cleaner'
  service_type?: string
  type: 'employee' | 'professional' | 'owner' // Tipo de vínculo
  status: 'active' | 'pending' | 'inactive' | 'suspended' | 'rejected'
  created_at: string
  salon?: {
    id: string
    name: string
    profile_photo?: string
    description?: string
    cidade?: string
    uf?: string
    owner_id?: string // Adicionar owner_id para verificar se é proprietário
  }
}

export const WorkplaceCard = ({ targetUserId }: { targetUserId?: string }) => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [workplaces, setWorkplaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Usar targetUserId se fornecido, senão usar user?.id
  const userIdToCheck = targetUserId || user?.id

  // Buscar locais de trabalho do usuário
  const fetchWorkplaces = async () => {
    if (!userIdToCheck) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando locais de trabalho para:', userIdToCheck)

      // Buscar funcionários ativos
      const { data: employeesData, error: employeesError } = await supabase
        .from('salon_employees')
        .select(`
          *,
          salon:salons_studios(id, name, profile_photo, description, cidade, uf, owner_id)
        `)
        .eq('user_id', userIdToCheck)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (employeesError) {
        console.error('❌ Erro ao buscar funcionários:', employeesError)
        throw employeesError
      }

      // Buscar profissionais aceitos
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('salon_professionals')
        .select(`
          *,
          salon:salons_studios(id, name, profile_photo, description, cidade, uf, owner_id)
        `)
        .eq('professional_id', userIdToCheck)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (professionalsError) {
        console.error('❌ Erro ao buscar profissionais:', professionalsError)
        throw professionalsError
      }

      // Buscar salões próprios
      const { data: ownedSalonsData, error: ownedSalonsError } = await supabase
        .from('salons_studios')
        .select('*')
        .eq('owner_id', userIdToCheck)
        .order('created_at', { ascending: false })

      if (ownedSalonsError) {
        console.error('❌ Erro ao buscar salões próprios:', ownedSalonsError)
        throw ownedSalonsError
      }

      // Criar mapa de salões únicos com os vínculos do usuário atual
      const salonsMap = new Map()

      console.log('🔍 DEBUG - Salões próprios:', ownedSalonsData?.length || 0)
      console.log('🔍 DEBUG - Funcionários:', employeesData?.length || 0)
      console.log('🔍 DEBUG - Profissionais:', professionalsData?.length || 0)

      // Adicionar salões próprios (usuário é proprietário)
      ownedSalonsData?.forEach(salon => {
        console.log(`👑 Adicionando salão próprio: ${salon.name}`)
        salonsMap.set(salon.id, {
          salon,
          userRoles: ['owner'] // Vínculos do usuário atual
        })
      })

      // Adicionar vínculos de funcionários (usuário é funcionário)
      employeesData?.forEach(emp => {
        console.log(`👥 Adicionando vínculo de funcionário: ${emp.salon?.name} - ${emp.role}`)
        if (salonsMap.has(emp.salon_id)) {
          // Usuário já tem vínculo com este salão, adicionar função
          const existing = salonsMap.get(emp.salon_id)
          existing.userRoles.push(`employee:${emp.role}`)
          console.log(`📝 Adicionado função ${emp.role} ao salão existente: ${emp.salon?.name}`)
        } else {
          // Novo vínculo de funcionário
          salonsMap.set(emp.salon_id, {
            salon: emp.salon,
            userRoles: [`employee:${emp.role}`]
          })
          console.log(`🆕 Novo vínculo de funcionário: ${emp.salon?.name}`)
        }
      })

      // Adicionar vínculos de profissionais (usuário é profissional)
      professionalsData?.forEach(prof => {
        console.log(`💼 Adicionando vínculo de profissional: ${prof.salon?.name}`)
        if (salonsMap.has(prof.salon_id)) {
          // Usuário já tem vínculo com este salão, adicionar profissional
          const existing = salonsMap.get(prof.salon_id)
          existing.userRoles.push('professional')
          console.log(`📝 Adicionado profissional ao salão existente: ${prof.salon?.name}`)
        } else {
          // Novo vínculo de profissional
          salonsMap.set(prof.salon_id, {
            salon: prof.salon,
            userRoles: ['professional']
          })
          console.log(`🆕 Novo vínculo de profissional: ${prof.salon?.name}`)
        }
      })

      // Converter para array
      const uniqueWorkplaces = Array.from(salonsMap.values())
        .sort((a, b) => new Date(b.salon.created_at).getTime() - new Date(a.salon.created_at).getTime())

      console.log('✅ Locais de trabalho únicos encontrados:', uniqueWorkplaces.length)
      uniqueWorkplaces.forEach(wp => {
        console.log(`📋 ${wp.salon.name}: ${wp.userRoles.join(', ')}`)
      })
      
      setWorkplaces(uniqueWorkplaces)

    } catch (err) {
      console.error('❌ Erro ao buscar locais de trabalho:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Obter badges para um local de trabalho (baseado nos vínculos do usuário atual)
  const getRoleBadges = (workplace: any) => {
    const badges = []

    // Verificar se é proprietário
    const isOwner = workplace.userRoles.includes('owner')

    // Mostrar badges apenas para os vínculos do usuário atual
    workplace.userRoles.forEach((role: string) => {
      if (role === 'owner') {
        badges.push({
          label: 'Proprietário',
          color: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0',
          icon: <Crown className="h-3 w-3" />
        })
      } else if (role.startsWith('employee:') && !isOwner) {
        // Só mostrar badge de funcionário se NÃO for proprietário
        const employeeRole = role.split(':')[1]
        const labels = {
          admin: 'Administrador',
          secretary: 'Secretária',
          manager: 'Gerente',
          receptionist: 'Recepcionista',
          cleaner: 'Limpeza'
        }
        const colors = {
          admin: 'bg-red-100 text-red-800 border-red-200',
          secretary: 'bg-blue-100 text-blue-800 border-blue-200',
          manager: 'bg-green-100 text-green-800 border-green-200',
          receptionist: 'bg-purple-100 text-purple-800 border-purple-200',
          cleaner: 'bg-gray-100 text-gray-800 border-gray-200'
        }
        badges.push({
          label: labels[employeeRole] || 'Funcionário',
          color: colors[employeeRole] || 'bg-gray-100 text-gray-800 border-gray-200',
          icon: <Users className="h-3 w-3" />
        })
      } else if (role === 'professional') {
        badges.push({
          label: 'Profissional',
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: <UserCheck className="h-3 w-3" />
        })
      }
    })

    return badges
  }

  // Buscar locais de trabalho quando componente montar
  useEffect(() => {
    fetchWorkplaces()
  }, [userIdToCheck])

  // Se não há locais de trabalho, não renderiza nada
  if (workplaces.length === 0) {
    return null
  }

  return (
    <Card className="mb-6 bg-gradient-card border-primary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          {workplaces.length === 1 ? 'Meu Local de Trabalho' : 'Meus Locais de Trabalho'}
          <Badge variant="secondary" className="ml-2">
            {workplaces.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando locais de trabalho...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchWorkplaces}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {workplaces.map((workplace) => (
              <div 
                key={workplace.salon.id} 
                className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer group ${
                  workplace.userRoles.includes('owner')
                    ? 'border-yellow-400/50 hover:border-yellow-400 bg-yellow-50/50 hover:bg-yellow-50'
                    : workplace.userRoles.includes('professional')
                    ? 'border-purple-400/50 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => navigate(`/salon/${workplace.salon.id}`)}
                title="Clique para ver o perfil do salão"
              >
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={workplace.salon.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                    {workplace.salon.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate text-sm">
                      {workplace.salon.name}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {getRoleBadges(workplace).map((badge, index) => (
                        <Badge 
                          key={index}
                          variant="outline" 
                          className={`text-xs flex items-center gap-1 ${badge.color}`}
                        >
                          {badge.icon}
                          {badge.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {workplace.salon.cidade && workplace.salon.uf && (
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground truncate">
                        {workplace.salon.cidade}, {workplace.salon.uf}
                      </p>
                    </div>
                  )}
                  {workplace.salon.description && (
                    <p className="text-xs text-muted-foreground truncate mt-1">
                      {workplace.salon.description}
                    </p>
                  )}
                </div>

                {/* Ícone de navegação */}
                <div className="flex-shrink-0">
                  <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}