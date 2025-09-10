import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { 
  Users, 
  UserPlus, 
  Edit3, 
  Trash2, 
  MoreVertical, 
  UserCheck, 
  UserX,
  Loader2,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { useSalonEmployees } from '@/hooks/useSalonEmployees'
import { useSalonPermissions, SalonEmployee } from '@/hooks/useSalonPermissions'
import { AddEmployeeModal } from './AddEmployeeModal'
import { EditEmployeeModal } from './EditEmployeeModal'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface SalonEmployeeManagerProps {
  salonId: string
}

export const SalonEmployeeManager: React.FC<SalonEmployeeManagerProps> = ({ salonId }) => {
  const { employees, loading, error, fetchEmployees, removeEmployee } = useSalonEmployees(salonId)
  const { hasPermission } = useSalonPermissions(salonId)
  const { toast } = useToast()

  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<SalonEmployee | null>(null)
  const [removingEmployee, setRemovingEmployee] = useState<string | null>(null)
  const [salonOwner, setSalonOwner] = useState<any>(null)

  // Verificar permissões
  const canViewEmployees = hasPermission('manage_employees.view')
  const canAddEmployees = hasPermission('manage_employees.add')
  const canEditEmployees = hasPermission('manage_employees.edit')
  const canRemoveEmployees = hasPermission('manage_employees.remove')

  // Buscar dono do salão
  const fetchSalonOwner = async () => {
    try {
      const { data, error } = await supabase
        .from('salons_studios')
        .select(`
          owner_id,
          owner:users(id, name, nickname, profile_photo, email)
        `)
        .eq('id', salonId)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar dono do salão:', error)
        return
      }

      setSalonOwner(data)
    } catch (err) {
      console.error('❌ Erro ao buscar dono do salão:', err)
    }
  }

  // Buscar funcionários quando componente montar
  useEffect(() => {
    if (canViewEmployees) {
      fetchEmployees()
      fetchSalonOwner()
    }
  }, [fetchEmployees, canViewEmployees])

  const handleDeleteClick = (employee: SalonEmployee) => {
    setSelectedEmployee(employee)
    setShowDeleteModal(true)
  }

  const handleConfirmDelete = async () => {
    if (!selectedEmployee || !canRemoveEmployees) return

    setRemovingEmployee(selectedEmployee.id)
    try {
      const result = await removeEmployee(selectedEmployee.id)
      
      if (result.success) {
        toast({
          title: 'Funcionário removido!',
          description: `${selectedEmployee.user?.name} foi removido do salão.`,
          variant: 'default'
        })
        setShowDeleteModal(false)
        setSelectedEmployee(null)
      } else {
        toast({
          title: 'Erro ao remover funcionário',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: 'Erro ao remover funcionário',
        description: 'Erro inesperado ao remover funcionário.',
        variant: 'destructive'
      })
    } finally {
      setRemovingEmployee(null)
    }
  }

  const handleCancelDelete = () => {
    setShowDeleteModal(false)
    setSelectedEmployee(null)
  }

  const handleEditEmployee = (employee: SalonEmployee) => {
    setSelectedEmployee(employee)
    setShowEditModal(true)
  }

  const getRoleLabel = (role: SalonEmployee['role'], roleDescription?: string) => {
    // Se tem role_description personalizada, usar ela
    if (roleDescription && roleDescription.trim()) {
      return roleDescription
    }
    
    // Senão, usar os labels padrão
    const labels = {
      admin: 'Administrador',
      secretary: 'Secretária',
      manager: 'Gerente',
      receptionist: 'Recepcionista',
      cleaner: 'Limpeza',
      other: 'Outro',
      owner: 'Proprietário'
    }
    return labels[role] || role
  }

  const getRoleColor = (role: SalonEmployee['role']) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      secretary: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      receptionist: 'bg-purple-100 text-purple-800',
      cleaner: 'bg-gray-100 text-gray-800',
      other: 'bg-orange-100 text-orange-800',
      owner: 'bg-yellow-100 text-yellow-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status: SalonEmployee['status']) => {
    switch (status) {
      case 'active':
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

  const getStatusColor = (status: SalonEmployee['status']) => {
    switch (status) {
      case 'active':
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

  const getStatusLabel = (status: SalonEmployee['status']) => {
    switch (status) {
      case 'active':
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

  // Se não tem permissão para ver funcionários, não renderiza nada
  if (!canViewEmployees) {
    return null
  }

  return (
    <>
      <Card className="mb-6 bg-gradient-card border-primary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Meus Funcionários
              {employees.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {employees.length}
                </Badge>
              )}
            </div>
            {canAddEmployees && (
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-primary hover:bg-gradient-primary/90 text-white w-full sm:w-auto"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Adicionar Funcionário</span>
                <span className="sm:hidden">Adicionar</span>
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Seção do Dono do Salão */}
          {salonOwner && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                👑 Proprietário do Salão
              </h4>
              <div className="flex items-center gap-3 p-3 rounded-lg border-2 border-yellow-400/30 bg-yellow-50/50">
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={salonOwner.owner?.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-r from-yellow-600 to-orange-500 text-white">
                    {salonOwner.owner?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium truncate text-sm">
                      {salonOwner.owner?.name}
                    </p>
                    <Badge 
                      variant="default" 
                      className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300"
                    >
                      👑 Proprietário
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    @{salonOwner.owner?.nickname}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Separador */}
          {salonOwner && employees.length > 0 && (
            <div className="border-t border-border/50 mb-6 pt-6">
              <h4 className="text-sm font-medium text-muted-foreground mb-3">Funcionários</h4>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando funcionários...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchEmployees}
              >
                Tentar novamente
              </Button>
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Ainda não há funcionários no seu salão.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {employees.map((employee) => (
                <div 
                  key={employee.id} 
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <Avatar className="h-10 w-10 flex-shrink-0">
                    <AvatarImage src={employee.user?.profile_photo} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                      {employee.user?.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium truncate text-sm">
                        {employee.user?.name}
                      </p>
                      <Badge 
                        variant="default" 
                        className={`text-xs ${getRoleColor(employee.role)}`}
                      >
                        {getRoleLabel(employee.role, employee.role_description)}
                      </Badge>
                      <Badge 
                        variant="default" 
                        className={`text-xs ${getStatusColor(employee.status)}`}
                        title={employee.status === 'pending' ? 'Aguardando aceitação do convite' : undefined}
                      >
                        {getStatusIcon(employee.status)}
                        <span className="ml-1">{getStatusLabel(employee.status)}</span>
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      @{employee.user?.nickname}
                    </p>
                    <p className="text-xs text-muted-foreground truncate hidden sm:block">
                      {employee.user?.email}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-1">
                    {canEditEmployees && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEditEmployee(employee)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    )}
                    {canRemoveEmployees && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteClick(employee)}
                        disabled={removingEmployee === employee.id}
                      >
                        {removingEmployee === employee.id ? (
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

      {/* Modal para adicionar funcionário */}
      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        salonId={salonId}
        onEmployeeAdded={fetchEmployees}
      />

      {/* Modal para editar funcionário */}
      {selectedEmployee && (
        <EditEmployeeModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedEmployee(null)
          }}
          salonId={salonId}
          employee={selectedEmployee}
          onEmployeeUpdated={fetchEmployees}
        />
      )}

      {/* Modal de confirmação para excluir funcionário */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Confirmar Exclusão
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover <strong>{selectedEmployee?.user?.name}</strong> do salão?
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
              disabled={removingEmployee === selectedEmployee?.id}
              className="flex-1"
            >
              {removingEmployee === selectedEmployee?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Removendo...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover Funcionário
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
