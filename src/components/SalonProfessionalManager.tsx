import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  Users, 
  UserPlus, 
  Trash2, 
  UserCheck, 
  UserX,
  Loader2,
  Clock,
  AlertTriangle,
  MapPin
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useSalonPermissions } from '@/hooks/useSalonPermissions'
import { useToast } from '@/hooks/use-toast'
import { AddProfessionalModal } from './AddProfessionalModal'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

// Interface para profissional do salão
interface SalonProfessional {
  id: string
  salon_id: string
  professional_id: string
  service_type?: string
  status: 'pending' | 'accepted' | 'active' | 'inactive' | 'suspended' | 'rejected'
  created_at: string
  professional?: {
    id: string
    name: string
    nickname: string
    profile_photo?: string
    email: string
    cidade?: string
    uf?: string
  }
}

interface SalonProfessionalManagerProps {
  salonId: string
  forcePermissions?: {
    canView: boolean
    canAdd: boolean
    canRemove: boolean
    isOwner: boolean
  }
}

export const SalonProfessionalManager: React.FC<SalonProfessionalManagerProps> = ({ salonId, forcePermissions }) => {
  
  const { hasPermission, isOwner, isEmployee } = useSalonPermissions(salonId)
  const { toast } = useToast()
  

  
  const [professionals, setProfessionals] = useState<SalonProfessional[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  

  

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<SalonProfessional | null>(null)
  const [removingProfessional, setRemovingProfessional] = useState<string | null>(null)

  // Verificar permissões - usar forcePermissions se disponível
  const canViewProfessionals = forcePermissions?.canView ?? hasPermission('manage_service_professionals.view')
  const canAddProfessionals = forcePermissions?.canAdd ?? hasPermission('manage_service_professionals.add')
  const canRemoveProfessionals = forcePermissions?.canRemove ?? hasPermission('manage_service_professionals.remove')
  const isOwnerUser = forcePermissions?.isOwner ?? isOwner()
  


  // Buscar profissionais do salão
  const fetchProfessionals = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('salon_professionals')
        .select(`
          *,
          professional:users(id, name, nickname, profile_photo, email, cidade, uf)
        `)
        .eq('salon_id', salonId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setProfessionals(data || [])
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // Remover profissional
  const removeProfessional = async (professionalId: string) => {
    try {
      setError(null)

      const { error } = await supabase
        .from('salon_professionals')
        .delete()
        .eq('id', professionalId)
        .eq('salon_id', salonId)

      if (error) {
        throw error
      }

      setProfessionals(prev => prev.filter(prof => prof.id !== professionalId))
      return { success: true }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Buscar profissionais quando componente montar
  useEffect(() => {
    if (isOwnerUser || canViewProfessionals) {
      fetchProfessionals()
    }
  }, [salonId, isOwnerUser, canViewProfessionals])

  const handleDeleteClick = (professional: SalonProfessional) => {
    setSelectedProfessional(professional)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedProfessional || !(isOwnerUser || canRemoveProfessionals)) return

    setRemovingProfessional(selectedProfessional.id)
    try {
      const result = await removeProfessional(selectedProfessional.id)
      
      if (result.success) {
        toast({
          title: 'Profissional removido!',
          description: `${selectedProfessional.professional?.name} foi removido do salão.`,
          variant: 'default'
        })
        setShowDeleteModal(false)
        setSelectedProfessional(null)
      } else {
        toast({
          title: 'Erro ao remover profissional',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro ao remover profissional',
        description: 'Erro inesperado ao remover profissional.',
        variant: 'destructive'
      })
    } finally {
      setRemovingProfessional(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setSelectedProfessional(null)
  }

  const getStatusIcon = (status: SalonProfessional['status']) => {
    switch (status) {
      case 'active':
      case 'accepted':
        return <UserCheck className="h-3 w-3" />
      case 'pending':
        return <Clock className="h-3 w-3" />
      case 'rejected':
        return <UserX className="h-3 w-3" />
      case 'suspended':
        return <UserX className="h-3 w-3" />
      case 'inactive':
        return <UserX className="h-3 w-3" />
      default:
        return <UserX className="h-3 w-3" />
    }
  }

  const getStatusColor = (status: SalonProfessional['status']) => {
    switch (status) {
      case 'active':
      case 'accepted':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      case 'suspended':
        return 'bg-orange-100 text-orange-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusLabel = (status: SalonProfessional['status']) => {
    switch (status) {
      case 'active':
      case 'accepted':
        return 'Ativo'
      case 'pending':
        return 'Pendente'
      case 'rejected':
        return 'Rejeitado'
      case 'suspended':
        return 'Suspenso'
      case 'inactive':
        return 'Inativo'
      default:
        return 'Desconhecido'
    }
  }

  // LÓGICA CORRIGIDA: Proprietário sempre pode ver, funcionário precisa de permissão
  const canAccess = isOwnerUser || canViewProfessionals
  
  // Se não tem acesso, não renderiza nada
  if (!canAccess) {
    return null
  }

  return (
    <>


      <Card className="mb-6 bg-gradient-card border-primary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meus Profissionais
              {professionals.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {professionals.length}
                </Badge>
              )}
            </div>
                          {(isOwnerUser || canAddProfessionals) && (
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-primary hover:bg-gradient-primary/90 text-white w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Profissional</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando profissionais...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchProfessionals}
              >
                Tentar novamente
              </Button>
            </div>
          ) : professionals.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Ainda não há profissionais no seu salão.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {professionals.map((professional) => (
                <div 
                  key={professional.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={professional.professional?.profile_photo} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                      {professional.professional?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate text-sm">
                        {professional.professional?.name}
                      </p>
                      <Badge 
                        variant="default" 
                        className={`text-xs ${getStatusColor(professional.status)}`}
                        title={professional.status === 'pending' ? 'Aguardando aceitação do convite' : undefined}
                      >
                        {getStatusIcon(professional.status)}
                        <span className="ml-1">{getStatusLabel(professional.status)}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{professional.professional?.nickname}
                    </p>
                    {professional.professional?.cidade && professional.professional?.uf && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{professional.professional.cidade}, {professional.professional.uf}</span>
                      </div>
                    )}
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                                            {(isOwnerUser || canRemoveProfessionals) && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(professional)}
                        disabled={removingProfessional === professional.id}
                      >
                        {removingProfessional === professional.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

             {/* Modal para adicionar profissional */}
       <AddProfessionalModal
         isOpen={showAddModal}
         onClose={() => setShowAddModal(false)}
         salonId={salonId}
         onProfessionalAdded={fetchProfessionals}
       />

       {/* Modal de confirmação para excluir profissional */}
       <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle className="flex items-center gap-2">
               <AlertTriangle className="h-5 w-5 text-destructive" />
               Confirmar Exclusão
             </DialogTitle>
             <DialogDescription>
               Tem certeza que deseja remover <strong>{selectedProfessional?.professional?.name}</strong> do salão?
               <br />
               <span className="text-sm text-muted-foreground">
                 Esta ação não pode ser desfeita.
               </span>
             </DialogDescription>
           </DialogHeader>
           <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4">
             <Button
               variant="outline"
               onClick={handleCancelDelete}
               className="flex-1"
             >
               Cancelar
             </Button>
             <Button
               variant="destructive"
               onClick={handleConfirmDelete}
               disabled={removingProfessional === selectedProfessional?.id}
               className="flex-1"
             >
               {removingProfessional === selectedProfessional?.id ? (
                 <>
                   <Loader2 className="h-4 w-4 animate-spin mr-2" />
                   Removendo...
                 </>
               ) : (
                 <>
                   <Trash2 className="h-4 w-4 mr-2" />
                   Remover Profissional
                 </>
               )}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
     </>
   )
 }
