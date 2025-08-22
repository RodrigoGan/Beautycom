import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { SalonEmployee, EmployeePermissions, DEFAULT_PERMISSIONS } from '@/hooks/useSalonPermissions'

export const useSalonEmployees = (salonId: string) => {
  const [employees, setEmployees] = useState<SalonEmployee[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar funcionários do salão
  const fetchEmployees = useCallback(async () => {
    if (!salonId) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando funcionários do salão:', salonId)

      // Primeiro, buscar o dono do salão para excluí-lo da lista de funcionários
      const { data: salonData, error: salonError } = await supabase
        .from('salons_studios')
        .select('owner_id')
        .eq('id', salonId)
        .single()

      if (salonError) {
        console.error('❌ Erro ao buscar dono do salão:', salonError)
        throw salonError
      }

      const ownerId = salonData?.owner_id
      console.log('👑 Dono do salão:', ownerId)

      // Buscar funcionários (excluindo o dono)
      const { data, error } = await supabase
        .from('salon_employees')
        .select(`
          *,
          user:users(id, name, nickname, profile_photo, email)
        `)
        .eq('salon_id', salonId)
        .neq('user_id', ownerId) // Excluir o dono da lista de funcionários
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar funcionários:', error)
        throw error
      }

      console.log('✅ Funcionários encontrados:', data?.length || 0)
      setEmployees(data || [])

    } catch (err) {
      console.error('❌ Erro ao buscar funcionários:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [salonId])

  // Adicionar funcionário
  const addEmployee = useCallback(async (
    userId: string,
    role: SalonEmployee['role'],
    customPermissions?: Partial<EmployeePermissions>,
    roleDescription?: string
  ) => {
    if (!salonId) return { success: false, error: 'ID do salão não fornecido' }

    try {
      setError(null)

      console.log('➕ Adicionando funcionário:', { salonId, userId, role, customPermissions, roleDescription })

      // Verificar se o usuário é o dono do salão
      const { data: salonData, error: salonError } = await supabase
        .from('salons_studios')
        .select('owner_id')
        .eq('id', salonId)
        .single()

      if (salonError) {
        console.error('❌ Erro ao verificar dono do salão:', salonError)
        return { success: false, error: 'Erro ao verificar permissões' }
      }

      if (salonData?.owner_id === userId) {
        return { success: false, error: 'O dono do salão não pode ser adicionado como funcionário' }
      }

      // Verificar se o usuário já é funcionário
      const existingEmployee = employees.find(emp => emp.user_id === userId)
      if (existingEmployee) {
        return { success: false, error: 'Usuário já é funcionário deste salão' }
      }

      // Usar permissões padrão do cargo ou permissões customizadas
      const permissions = customPermissions || DEFAULT_PERMISSIONS[role]
      console.log('🔐 Permissões que serão aplicadas:', permissions)

      const insertData = {
        salon_id: salonId,
        user_id: userId,
        role,
        permissions,
        role_description: roleDescription, // Adicionar descrição do cargo
        status: 'pending' // Novo funcionário sempre começa como 'pending'
      }
      console.log('📝 Dados para inserção:', insertData)

      const { data, error } = await supabase
        .from('salon_employees')
        .insert(insertData)
        .select(`
          *,
          user:users(id, name, nickname, profile_photo, email)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao adicionar funcionário:', error)
        console.error('❌ Detalhes do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ Funcionário adicionado com sucesso:', data)
      setEmployees(prev => [data, ...prev])

      return { success: true, data }

    } catch (err) {
      console.error('❌ Erro ao adicionar funcionário:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId, employees])

  // Aceitar convite de funcionário
  const acceptEmployeeInvite = useCallback(async (employeeId: string) => {
    try {
      setError(null)

      console.log('✅ Aceitando convite de funcionário:', employeeId)

      const { data, error } = await supabase
        .from('salon_employees')
        .update({ status: 'active' })
        .eq('id', employeeId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .select(`
          *,
          user:users(id, name, nickname, profile_photo, email)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao aceitar convite:', error)
        throw error
      }

      console.log('✅ Convite aceito com sucesso:', data)
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? data : emp))

      return { success: true, data }

    } catch (err) {
      console.error('❌ Erro ao aceitar convite:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  // Rejeitar convite de funcionário
  const rejectEmployeeInvite = useCallback(async (employeeId: string) => {
    try {
      setError(null)

      console.log('❌ Rejeitando convite de funcionário:', employeeId)

      const { data, error } = await supabase
        .from('salon_employees')
        .update({ status: 'rejected' })
        .eq('id', employeeId)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .select(`
          *,
          user:users(id, name, nickname, profile_photo, email)
        `)
        .single()

      if (error) {
        console.error('❌ Erro ao rejeitar convite:', error)
        throw error
      }

      console.log('✅ Convite rejeitado com sucesso:', data)
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? data : emp))

      return { success: true, data }

    } catch (err) {
      console.error('❌ Erro ao rejeitar convite:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [])

  // Atualizar funcionário
  const updateEmployee = useCallback(async (
    employeeId: string,
    role: SalonEmployee['role'],
    customPermissions?: Partial<EmployeePermissions>,
    roleDescription?: string
  ) => {
    try {
      setError(null)

      console.log('✏️ Atualizando funcionário:', { employeeId, role, customPermissions, roleDescription })

      // Usar permissões padrão do cargo ou permissões customizadas
      const permissions = customPermissions || DEFAULT_PERMISSIONS[role]

      const updates: any = {
        role,
        permissions
      }

      // Adicionar role_description se fornecido
      if (roleDescription) {
        updates.role_description = roleDescription
      }

      console.log('🔍 DEBUG - Dados para update:', updates)

      const { data, error } = await supabase
        .from('salon_employees')
        .update(updates)
        .eq('id', employeeId)
        .eq('salon_id', salonId)
        .select(`
          *,
          user:users(id, name, nickname, profile_photo, email)
        `)
        .single()

      console.log('🔍 DEBUG - Resposta do Supabase:', { data, error })

      if (error) {
        console.error('❌ Erro ao atualizar funcionário:', error)
        console.error('❌ Detalhes do erro:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ Funcionário atualizado com sucesso:', data)
      setEmployees(prev => prev.map(emp => emp.id === employeeId ? data : emp))

      return { success: true, data }

    } catch (err) {
      console.error('❌ Erro ao atualizar funcionário:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId])

  // Remover funcionário
  const removeEmployee = useCallback(async (employeeId: string) => {
    try {
      setError(null)

      console.log('🗑️ Removendo funcionário:', employeeId)

      const { error } = await supabase
        .from('salon_employees')
        .delete()
        .eq('id', employeeId)
        .eq('salon_id', salonId)

      if (error) {
        console.error('❌ Erro ao remover funcionário:', error)
        throw error
      }

      console.log('✅ Funcionário removido com sucesso')
      setEmployees(prev => prev.filter(emp => emp.id !== employeeId))

      return { success: true }

    } catch (err) {
      console.error('❌ Erro ao remover funcionário:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [salonId])

  // Buscar usuários para adicionar como funcionários
  const searchUsers = useCallback(async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) return []

    try {
      // Buscar usuários que correspondem ao termo de busca
      const { data, error } = await supabase
        .from('users')
        .select('id, name, nickname, profile_photo, email')
        .or(`name.ilike.%${searchTerm}%,nickname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(10)

      if (error) {
        console.error('❌ Erro ao buscar usuários:', error)
        throw error
      }

      // Filtrar usuários que já são funcionários
      const existingEmployeeIds = employees.map(emp => emp.user_id)
      const availableUsers = data?.filter(user => !existingEmployeeIds.includes(user.id)) || []

      return availableUsers

    } catch (err) {
      console.error('❌ Erro ao buscar usuários:', err)
      return []
    }
  }, [employees])

  return {
    // Estados
    employees,
    loading,
    error,

    // Funções
    fetchEmployees,
    addEmployee,
    updateEmployee,
    removeEmployee,
    searchUsers,
    acceptEmployeeInvite,
    rejectEmployeeInvite
  }
}
