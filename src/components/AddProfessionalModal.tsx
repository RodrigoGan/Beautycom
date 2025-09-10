import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Badge } from './ui/badge'

import { 
  Search, 
  UserPlus, 
  X, 
  Loader2,
  CheckCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface User {
  id: string
  name: string
  nickname: string
  profile_photo?: string
  email: string
  cidade?: string
  uf?: string
}

interface AddProfessionalModalProps {
  isOpen: boolean
  onClose: () => void
  salonId: string
  onProfessionalAdded: () => void
}

export const AddProfessionalModal: React.FC<AddProfessionalModalProps> = ({
  isOpen,
  onClose,
  salonId,
  onProfessionalAdded
}) => {
  const { toast } = useToast()
  
  const [currentStep, setCurrentStep] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isAdding, setIsAdding] = useState(false)

  // Buscar usuários
  const searchUsers = useCallback(async (term: string) => {
    if (!term || term.length < 3) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      console.log('🔍 Buscando usuários:', term)

      const { data, error } = await supabase
        .from('users')
        .select('id, name, nickname, profile_photo, email, cidade, uf')
        .or(`name.ilike.%${term}%,nickname.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(10)

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error)
        throw error
      }

      console.log('✅ Usuários encontrados:', data?.length || 0)
      setSearchResults(data || [])

    } catch (err) {
      console.error('❌ Erro ao buscar usuários:', err)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounce para busca
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm) {
        searchUsers(searchTerm)
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [searchTerm, searchUsers])

  // Adicionar profissional
  const handleAddProfessional = async () => {
    if (!selectedUser) {
      toast({
        title: 'Dados incompletos',
        description: 'Selecione um profissional para adicionar.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsAdding(true)
      console.log('➕ Adicionando profissional:', { selectedUser })

      // Verificar se o usuário já é profissional deste salão
      const { data: existingProfessional, error: checkError } = await supabase
        .from('salon_professionals')
        .select('id')
        .eq('salon_id', salonId)
        .eq('professional_id', selectedUser.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('❌ Erro ao verificar profissional existente:', checkError)
        throw checkError
      }

      if (existingProfessional) {
        toast({
          title: 'Profissional já existe',
          description: 'Este usuário já é profissional deste salão.',
          variant: 'destructive'
        })
        return
      }

             // Adicionar profissional
       const { data, error } = await supabase
         .from('salon_professionals')
         .insert({
           salon_id: salonId,
           professional_id: selectedUser.id,
           status: 'pending' // Começa como pendente até aceitar
         })
         .select()
         .single()

      if (error) {
        console.error('❌ Erro ao adicionar profissional:', error)
        throw error
      }

      console.log('✅ Profissional adicionado com sucesso:', data)
      
             toast({
         title: 'Profissional adicionado!',
         description: `${selectedUser.name} foi convidado para trabalhar no salão.`,
         variant: 'default'
       })

             // Resetar estado e fechar modal
       setCurrentStep(1)
       setSearchTerm('')
       setSearchResults([])
       setSelectedUser(null)
       onProfessionalAdded()
       onClose()

    } catch (err) {
      console.error('❌ Erro ao adicionar profissional:', err)
      toast({
        title: 'Erro ao adicionar profissional',
        description: err instanceof Error ? err.message : 'Erro desconhecido',
        variant: 'destructive'
      })
    } finally {
      setIsAdding(false)
    }
  }

     // Navegação entre passos
   const nextStep = () => {
     if (currentStep === 1 && selectedUser) {
       setCurrentStep(2)
     }
   }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

     const canGoNext = () => {
     if (currentStep === 1) return selectedUser !== null
     return false
   }

     const getStepTitle = () => {
     switch (currentStep) {
       case 1: return 'Selecionar Profissional'
       case 2: return 'Confirmar Adição'
       default: return 'Adicionar Profissional'
     }
   }

   const getStepDescription = () => {
     switch (currentStep) {
       case 1: return 'Busque e selecione o profissional que deseja adicionar'
       case 2: return 'Revise as informações e confirme a adição'
       default: return ''
     }
   }

     // Fechar modal e resetar estado
   const handleClose = () => {
     setCurrentStep(1)
     setSearchTerm('')
     setSearchResults([])
     setSelectedUser(null)
     onClose()
   }

  // Prevenir scroll do background
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-hidden">
      <Card className="w-full max-w-2xl max-h-[90vh] flex flex-col">
        <CardHeader className="pb-4 px-4 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
                <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                  <UserPlus className="h-5 w-5 text-white" />
                </div>
                {getStepTitle()}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {getStepDescription()}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              ✕
            </Button>
          </div>

                     {/* Indicador de progresso */}
           <div className="flex items-center justify-center gap-2 mt-4">
             <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-primary' : 'bg-muted'}`} />
             <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-primary' : 'bg-muted'}`} />
           </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto pb-20">
          {/* Passo 1: Selecionar Profissional */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="search">Buscar Profissional</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Digite o nome, nickname ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Buscando...</span>
                </div>
              )}

              {!isSearching && searchResults.length > 0 && (
                <div className="space-y-2">
                  <Label>Resultados da busca:</Label>
                  {searchResults.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUser?.id === user.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.profile_photo} />
                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                          {user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">@{user.nickname}</p>
                        {user.cidade && user.uf && (
                          <p className="text-xs text-muted-foreground">
                            {user.cidade}, {user.uf}
                          </p>
                        )}
                      </div>

                      {selectedUser?.id === user.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isSearching && searchTerm && searchResults.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum usuário encontrado.</p>
                </div>
              )}
            </div>
          )}

                     {/* Passo 2: Confirmar */}
           {currentStep === 2 && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border bg-muted/50">
                <Label className="text-sm font-medium mb-3 block">Resumo da Adição:</Label>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={selectedUser?.profile_photo} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-500 text-white">
                        {selectedUser?.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{selectedUser?.name}</p>
                      <p className="text-xs text-muted-foreground">@{selectedUser?.nickname}</p>
                    </div>
                  </div>

                                     <div className="flex items-center gap-2">
                     <Badge variant="outline" className="text-xs">
                       Profissional da Beleza
                     </Badge>
                   </div>

                  <div className="text-xs text-muted-foreground bg-yellow-50 p-2 rounded">
                    <p>⚠️ O profissional receberá um convite e precisará aceitar para se tornar ativo no salão.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer com botões - alinhado ao modal de Funcionários */}
        <div className="border-t bg-background p-4 flex gap-2 justify-end">
          {currentStep === 1 ? (
            <Button variant="outline" onClick={handleClose} className="flex-1 sm:flex-none">
              Cancelar
            </Button>
          ) : (
            <Button variant="outline" onClick={prevStep} className="flex-1 sm:flex-none">
              Voltar
            </Button>
          )}
          <Button
            onClick={currentStep === 2 ? handleAddProfessional : nextStep}
            disabled={currentStep === 2 ? isAdding : !canGoNext()}
            className="bg-gradient-primary hover:bg-gradient-primary/90 text-white flex-1 sm:flex-none"
          >
            {currentStep === 2 ? (
              isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Adicionando...</span>
                  <span className="sm:hidden">Adicionando</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Adicionar Profissional</span>
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
