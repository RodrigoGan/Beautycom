import React, { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Label } from './ui/label'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Separator } from './ui/separator'
import { Edit3, Loader2, X, ChevronLeft } from 'lucide-react'
import { useSalonEmployees } from '@/hooks/useSalonEmployees'
import { SalonEmployee } from '@/hooks/useSalonPermissions'
import { useToast } from '@/hooks/use-toast'
import { PermissionCategory } from './PermissionCategory'
import { PERMISSION_CATEGORIES, getAllPermissions, validatePermissionDependencies } from '@/config/permissionCategories'

interface EditEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
  employee: SalonEmployee | null
  onEmployeeUpdated: () => void
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  salonId,
  employee,
  onEmployeeUpdated
}) => {
  const { updateEmployee } = useSalonEmployees(salonId)
  const { toast } = useToast()

  const [selectedRole, setSelectedRole] = useState<SalonEmployee['role'] | null>(null)
  const [customRoleDescription, setCustomRoleDescription] = useState<string>('')
  const [customPermissions, setCustomPermissions] = useState<Record<string, boolean>>({})
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  // Carregar dados do funcionário quando modal abrir
  useEffect(() => {
    if (employee && isOpen) {
      setSelectedRole(employee.role)
      setCustomRoleDescription(employee.role_description || '')
      
      // Converter permissões do formato antigo para o novo
      const newPermissions: Record<string, boolean> = {}
      
      if (employee.permissions) {
        
        // Verificar se já está no novo formato (permissões simples)
        const hasOldFormat = employee.permissions && 
          typeof employee.permissions === 'object' && 
          'manage_employees' in employee.permissions
        
        if (!hasOldFormat) {
          // Já está no novo formato ou é null/undefined
          setCustomPermissions(employee.permissions as unknown as Record<string, boolean> || {})
        } else {
          // Está no formato antigo - converter
          Object.entries(employee.permissions).forEach(([category, perms]) => {
            if (typeof perms === 'object') {
              Object.entries(perms).forEach(([perm, value]) => {
                newPermissions[`${category}.${perm}`] = value as boolean
              })
            }
          })
          setCustomPermissions(newPermissions)
        }
        
      } else {
        // Se não há permissões, usar permissões padrão do cargo
        const defaultPermissions = getAllPermissions()
        const rolePermissions: Record<string, boolean> = {}
        
        // Mapear permissões padrão para o formato esperado
        Object.keys(defaultPermissions).forEach(key => {
          rolePermissions[key] = false
        })
        
        setCustomPermissions(rolePermissions)
      }
      
      // NÃO expandir categoria por padrão - deixar todas fechadas
      setExpandedCategory(null)
    }
  }, [employee, isOpen])

  // Limpar estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setSelectedRole(null)
      setCustomRoleDescription('')
      setCustomPermissions({})
      setExpandedCategory(null)
      setIsUpdating(false)
    }
  }, [isOpen])

  // Prevenir scroll da página de fundo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleUpdateEmployee = async () => {
    if (!employee || !selectedRole) return

    // Se selecionou "Outro", a descrição é obrigatória
    if (selectedRole === 'other' && !customRoleDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Por favor, descreva o cargo personalizado.',
        variant: 'destructive'
      })
      return
    }

    setIsUpdating(true)
    try {
      // Validar dependências antes de salvar
      const validatedPermissions = validatePermissionDependencies(customPermissions)
      
      // Usar a descrição personalizada se for "Outro", senão usar o role padrão
      const finalRole = selectedRole === 'other' ? 'other' : selectedRole
      const roleDescription = selectedRole === 'other' ? customRoleDescription.trim() : undefined
      
        employeeId: employee.id,
        role: finalRole,
        roleDescription,
        permissions: validatedPermissions
      })
      
      const result = await updateEmployee(employee.id, finalRole, validatedPermissions, roleDescription)
      
      
      if (result.success) {
        toast({
          title: 'Funcionário atualizado!',
          description: `${employee.user?.name} foi atualizado como ${selectedRole === 'other' ? customRoleDescription : getRoleLabel(selectedRole)}.`,
          variant: 'default'
        })
        onEmployeeUpdated()
        onClose()
      } else {
        console.error('❌ Erro detalhado:', result.error)
        toast({
          title: 'Erro ao atualizar funcionário',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      toast({
        title: 'Erro ao atualizar funcionário',
        description: 'Erro inesperado ao atualizar funcionário.',
        variant: 'destructive'
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const getRoleLabel = (role: SalonEmployee['role']) => {
    const labels = {
      admin: 'Administrador',
      secretary: 'Secretária',
      manager: 'Gerente',
      receptionist: 'Recepcionista',
      cleaner: 'Limpeza',
      other: 'Cargo personalizado'
    }
    return labels[role] || role
  }

  const getRoleDescription = (role: SalonEmployee['role']) => {
    const descriptions = {
      admin: 'Acesso total ao sistema do salão',
      secretary: 'Gerencia agendamentos e atendimento',
      manager: 'Gerencia profissionais e relatórios',
      receptionist: 'Atendimento e agendamentos',
      cleaner: 'Acesso limitado às informações',
      other: 'Cargo personalizado com permissões específicas'
    }
    return descriptions[role] || 'Cargo personalizado'
  }

  const handlePermissionChange = (key: string, checked: boolean) => {
    setCustomPermissions(prev => ({
      ...prev,
      [key]: checked
    }))
  }

  const handleSelectAllInCategory = (categoryId: string) => {
    const category = PERMISSION_CATEGORIES.find(cat => cat.id === categoryId)
    if (!category) return

    const newPermissions = { ...customPermissions }
    category.permissions.forEach(permission => {
      newPermissions[permission.key] = true
    })
    setCustomPermissions(newPermissions)
  }

  const handleClearAllInCategory = (categoryId: string) => {
    const category = PERMISSION_CATEGORIES.find(cat => cat.id === categoryId)
    if (!category) return

    const newPermissions = { ...customPermissions }
    category.permissions.forEach(permission => {
      newPermissions[permission.key] = false
    })
    setCustomPermissions(newPermissions)
  }

  const handleCategoryToggle = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId)
  }

  if (!isOpen || !employee) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                  <Edit3 className="h-5 w-5 text-white" />
                </div>
                Editar Funcionário
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Modifique o cargo e as permissões do funcionário
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-4 sm:px-6 pb-6 space-y-6 flex-1 overflow-y-auto">
          {/* Resumo do funcionário */}
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <Label className="text-xs text-muted-foreground">Funcionário</Label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 flex-shrink-0">
                  <AvatarImage src={employee.user?.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                    {employee.user?.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{employee.user?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{employee.user?.nickname}</p>
                  <p className="text-xs text-muted-foreground truncate">{employee.user?.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="text-xs whitespace-nowrap">
                  {employee.role === 'other' ? (employee.role_description || 'Cargo personalizado') : getRoleLabel(employee.role)}
                </Badge>
                <Badge 
                  variant="default" 
                  className={`text-xs whitespace-nowrap ${employee.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                >
                  {employee.status === 'active' ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Seleção de cargo */}
          <div className="space-y-3">
            <Label htmlFor="role">Cargo</Label>
            <Select 
              value={selectedRole || ''} 
              onValueChange={(value: SalonEmployee['role']) => {
                setSelectedRole(value)
                if (value !== 'other') {
                  setCustomRoleDescription('')
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cargo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">
                  <div className="flex flex-col">
                    <span className="font-medium">Administrador</span>
                    <span className="text-xs text-muted-foreground">Acesso total ao sistema</span>
                  </div>
                </SelectItem>
                <SelectItem value="secretary">
                  <div className="flex flex-col">
                    <span className="font-medium">Secretária</span>
                    <span className="text-xs text-muted-foreground">Gerencia agendamentos</span>
                  </div>
                </SelectItem>
                <SelectItem value="manager">
                  <div className="flex flex-col">
                    <span className="font-medium">Gerente</span>
                    <span className="text-xs text-muted-foreground">Gerencia profissionais</span>
                  </div>
                </SelectItem>
                <SelectItem value="receptionist">
                  <div className="flex flex-col">
                    <span className="font-medium">Recepcionista</span>
                    <span className="text-xs text-muted-foreground">Atendimento</span>
                  </div>
                </SelectItem>
                <SelectItem value="cleaner">
                  <div className="flex flex-col">
                    <span className="font-medium">Limpeza</span>
                    <span className="text-xs text-muted-foreground">Acesso limitado</span>
                  </div>
                </SelectItem>
                <SelectItem value="other">
                  <div className="flex flex-col">
                    <span className="font-medium">Outro</span>
                    <span className="text-xs text-muted-foreground">Cargo personalizado</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Campo para descrição do cargo personalizado */}
            {selectedRole === 'other' && (
              <div className="space-y-2">
                <Label htmlFor="customRoleDescription">Descrição do cargo</Label>
                <Input
                  id="customRoleDescription"
                  placeholder="Ex: Estagiário de Marketing, Coordenador de Eventos..."
                  value={customRoleDescription}
                  onChange={(e) => setCustomRoleDescription(e.target.value)}
                />
              </div>
            )}

            {/* Descrição do cargo */}
            {selectedRole && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">
                  {selectedRole === 'other' ? customRoleDescription : getRoleLabel(selectedRole)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {getRoleDescription(selectedRole)}
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Configuração de permissões */}
          <div className="space-y-3">
            <Label>Permissões</Label>
            <p className="text-xs text-muted-foreground">
              Clique nas categorias para expandir e configurar as permissões:
            </p>
            
            {/* Categorias de permissões */}
            <div className="space-y-3">
              {PERMISSION_CATEGORIES.map((category) => (
                <PermissionCategory
                  key={category.id}
                  title={category.title}
                  icon={category.icon}
                  permissions={category.permissions}
                  selectedPermissions={customPermissions}
                  onPermissionChange={handlePermissionChange}
                  onSelectAll={() => handleSelectAllInCategory(category.id)}
                  onClearAll={() => handleClearAllInCategory(category.id)}
                  isExpanded={expandedCategory === category.id}
                  onToggle={() => handleCategoryToggle(category.id)}
                />
              ))}
            </div>
          </div>
        </CardContent>
        
        {/* Botões fixos na parte inferior */}
        <div className="border-t bg-background p-4 flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleUpdateEmployee}
            disabled={!selectedRole || (selectedRole === 'other' && !customRoleDescription.trim()) || isUpdating}
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white flex-1 sm:flex-none"
          >
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="hidden sm:inline">Atualizando...</span>
                <span className="sm:hidden">Atualizando</span>
              </>
            ) : (
              <>
                <Edit3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Atualizar Funcionário</span>
                <span className="sm:hidden">Atualizar</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}


