import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, UserPlus, X, Search, ChevronLeft } from 'lucide-react'
import { useSalonEmployees } from '@/hooks/useSalonEmployees'
import { useToast } from '@/hooks/use-toast'
import { SalonEmployee } from '@/hooks/useSalonPermissions'
import { PermissionCategory } from './PermissionCategory'
import { PERMISSION_CATEGORIES, validatePermissionDependencies } from '@/config/permissionCategories'

interface User {
  id: string
  name: string
  nickname: string
  email: string
  profile_photo?: string
}

interface AddEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
  onEmployeeAdded: () => void
}

const getRoleLabel = (role: SalonEmployee['role']) => {
  const labels = {
    admin: 'Administrador',
    secretary: 'Secretária',
    manager: 'Gerente',
    receptionist: 'Recepcionista',
    cleaner: 'Limpeza',
    other: 'Outro'
  }
  return labels[role] || role
}

const getRoleDescription = (role: SalonEmployee['role']) => {
  const descriptions = {
    admin: 'Acesso total ao sistema',
    secretary: 'Gestão de agendamentos e atendimento',
    manager: 'Gerenciamento de equipe e operações',
    receptionist: 'Atendimento e agendamentos',
    cleaner: 'Acesso básico às informações',
    other: 'Cargo personalizado'
  }
  return descriptions[role] || 'Descrição não disponível'
}

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({
  isOpen,
  onClose,
  salonId,
  onEmployeeAdded
}) => {
  const { addEmployee, searchUsers } = useSalonEmployees(salonId)
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<SalonEmployee['role'] | null>(null)
  const [customRoleDescription, setCustomRoleDescription] = useState('')
  const [customPermissions, setCustomPermissions] = useState<Record<string, boolean>>({})
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)

  // Buscar usuários quando o termo de busca mudar
  useEffect(() => {
    const searchUsersDebounced = async () => {
      if (searchTerm.length >= 3) {
        setIsSearching(true)
        const results = await searchUsers(searchTerm)
        setSearchResults(results)
        setIsSearching(false)
      } else {
        setSearchResults([])
      }
    }

    const timeoutId = setTimeout(searchUsersDebounced, 300)
    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchUsers])

  // Limpar estado quando modal fechar
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm('')
      setSearchResults([])
      setSelectedUser(null)
      setSelectedRole(null)
      setCustomRoleDescription('')
      setCustomPermissions({})
      setCurrentStep(1)
      setExpandedCategory(null)
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

  const handleAddEmployee = async () => {
    if (!selectedUser || !selectedRole) return

    // Se selecionou "Outro", a descrição é obrigatória
    if (selectedRole === 'other' && !customRoleDescription.trim()) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Por favor, descreva o cargo personalizado.',
        variant: 'destructive'
      })
      return
    }

    setIsAdding(true)
    try {
      // Validar dependências antes de salvar
      const validatedPermissions = validatePermissionDependencies(customPermissions)
      
      // Usar a descrição personalizada se for "Outro", senão usar o role padrão
      const finalRole = selectedRole === 'other' ? 'other' : selectedRole
      const roleDescription = selectedRole === 'other' ? customRoleDescription.trim() : undefined
      
        userId: selectedUser.id,
        role: finalRole,
        roleDescription,
        permissions: validatedPermissions,
        salonId
      })
      
      const result = await addEmployee(selectedUser.id, finalRole, validatedPermissions, roleDescription)
      
      
      if (result.success) {
        toast({
          title: 'Funcionário adicionado!',
          description: `${selectedUser.name} foi adicionado como ${selectedRole === 'other' ? customRoleDescription : getRoleLabel(selectedRole)}.`,
          variant: 'default'
        })
        onEmployeeAdded()
        onClose()
      } else {
        console.error('❌ Erro detalhado:', result.error)
        toast({
          title: 'Erro ao adicionar funcionário',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('❌ Erro inesperado:', error)
      toast({
        title: 'Erro ao adicionar funcionário',
        description: 'Erro inesperado ao adicionar funcionário.',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

  const nextStep = () => {
    if (currentStep === 1 && selectedUser) {
      setCurrentStep(2)
    } else if (currentStep === 2 && selectedRole) {
      if (selectedRole === 'other' && !customRoleDescription.trim()) {
        toast({
          title: 'Descrição obrigatória',
          description: 'Por favor, descreva o cargo personalizado.',
          variant: 'destructive'
        })
        return
      }
      setCurrentStep(3)
    }
  }

  const prevStep = () => {
    if (currentStep === 3) {
      setCurrentStep(2)
    } else if (currentStep === 2) {
      setCurrentStep(1)
    }
  }

  const canGoNext = () => {
    if (currentStep === 1) return selectedUser !== null
    if (currentStep === 2) {
      if (selectedRole === 'other') {
        return customRoleDescription.trim().length > 0
      }
      return selectedRole !== null
    }
    return true
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
    
    setCustomPermissions(validatePermissionDependencies(newPermissions))
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UserPlus className="h-5 w-5 text-primary" />
              <div>
                <CardTitle className="text-lg">Adicionar Funcionário</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {currentStep === 1 && '1. Selecionar usuário'}
                  {currentStep === 2 && '2. Definir cargo'}
                  {currentStep === 3 && '3. Configurar permissões'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6">
          {/* Busca de usuários */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">1. Buscar usuário</Label>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Digite o nome, nickname ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Digite pelo menos 3 caracteres para buscar
                </p>
              </div>

              {/* Resultados da busca */}
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Buscando usuários...</span>
                </div>
              )}

              {searchResults.length > 0 && !isSearching && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <Card
                      key={user.id}
                      className={`cursor-pointer transition-colors hover:border-primary ${
                        selectedUser?.id === user.id ? 'border-primary bg-primary/5' : ''
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profile_photo} />
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{user.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              @{user.nickname}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {searchTerm.length >= 3 && searchResults.length === 0 && !isSearching && (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  Nenhum usuário encontrado
                </div>
              )}
            </div>
          )}

          {/* Usuário selecionado */}
          {currentStep === 1 && selectedUser && (
            <div className="space-y-3 mt-4">
              <Label>Usuário selecionado</Label>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedUser.profile_photo} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                          {selectedUser.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{selectedUser.name}</p>
                        <p className="text-xs text-muted-foreground">@{selectedUser.nickname}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedUser(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Seleção de cargo */}
          {currentStep === 2 && selectedUser && (
            <div className="space-y-4">
              {/* Resumo do usuário selecionado */}
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-xs text-muted-foreground mb-2">Usuário selecionado</Label>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.profile_photo} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white text-xs">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">@{selectedUser.nickname}</p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="role">2. Definir cargo</Label>
                <Select 
                  value={selectedRole || ''} 
                  onValueChange={(value: SalonEmployee['role']) => {
                    setSelectedRole(value)
                    if (value !== 'other') {
                      setCustomRoleDescription('')
                    }
                  }}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="secretary">Secretária</SelectItem>
                    <SelectItem value="receptionist">Recepcionista</SelectItem>
                    <SelectItem value="cleaner">Limpeza</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Campo para descrição personalizada */}
              {selectedRole === 'other' && (
                <div>
                  <Label htmlFor="customRole">Descrição do cargo</Label>
                  <Input
                    id="customRole"
                    placeholder="Ex: Auxiliar administrativo, Estagiário, etc."
                    value={customRoleDescription}
                    onChange={(e) => setCustomRoleDescription(e.target.value)}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Descreva o cargo personalizado
                  </p>
                </div>
              )}

              {selectedRole && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {selectedRole === 'other' ? customRoleDescription : getRoleLabel(selectedRole)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getRoleDescription(selectedRole)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Configuração de permissões */}
          {currentStep === 3 && selectedUser && selectedRole && (
            <div className="space-y-4">
              {/* Resumo do usuário e cargo */}
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <Label className="text-xs text-muted-foreground">Resumo</Label>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedUser.profile_photo} />
                    <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white text-xs">
                      {selectedUser.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedUser.name}</p>
                    <p className="text-xs text-muted-foreground">@{selectedUser.nickname}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {selectedRole === 'other' ? customRoleDescription : getRoleLabel(selectedRole)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {getRoleDescription(selectedRole)}
                  </span>
                </div>
              </div>

              <div>
                <Label>3. Configurar permissões</Label>
                <p className="text-xs text-muted-foreground mb-4">
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
            </div>
          )}
        </CardContent>
        
        {/* Botões fixos na parte inferior */}
        <div className="border-t bg-background p-4 flex gap-2 justify-end">
          {currentStep === 1 ? (
            <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
          ) : (
            <Button variant="outline" onClick={prevStep} className="flex-1 sm:flex-none">
              <ChevronLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
          )}
          <Button
            onClick={currentStep === 3 ? handleAddEmployee : nextStep}
            disabled={currentStep === 3 ? (!selectedUser || !selectedRole || isAdding) : !canGoNext()}
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white flex-1 sm:flex-none"
          >
            {currentStep === 3 ? (
              isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Adicionando...</span>
                  <span className="sm:hidden">Adicionando</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Adicionar Funcionário</span>
                  <span className="sm:hidden">Adicionar</span>
                </>
              )
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Próximo</span>
                <span className="sm:hidden">Próximo</span>
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
