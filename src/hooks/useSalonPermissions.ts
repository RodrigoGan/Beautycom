import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

// Interface para permissões granulares
export interface EmployeePermissions {
  manage_employees: {
    view: boolean
    add: boolean
    edit: boolean
    remove: boolean
    manage_permissions: boolean
  }
  manage_service_professionals: {
    view: boolean
    add: boolean
    edit: boolean
    remove: boolean
    view_schedule: boolean
    manage_schedule: boolean
  }
  appointments: {
    view: boolean
    create: boolean
    edit: boolean
    cancel: boolean
    reschedule: boolean
    view_all_professionals: boolean
  }
  salon_info: {
    view: boolean
    edit_basic_info: boolean
    edit_social_media: boolean
    edit_photos: boolean
    edit_description: boolean
  }
  reports: {
    view: boolean
    export: boolean
    financial_reports: boolean
    performance_reports: boolean
  }
  system_settings: {
    view: boolean
    edit: boolean
    manage_integrations: boolean
  }
  content_management: {
    view_posts: boolean
    manage_main_posts: boolean
    moderate_posts: boolean
  }
}

// Interface para funcionário
export interface SalonEmployee {
  id: string
  salon_id: string
  user_id: string
  role: 'admin' | 'secretary' | 'manager' | 'receptionist' | 'cleaner' | 'other' | 'owner'
  permissions: EmployeePermissions
  status: 'pending' | 'active' | 'inactive' | 'suspended' | 'rejected'
  created_at: string
  updated_at: string
  role_description?: string
  user?: {
    id: string
    name: string
    nickname: string
    profile_photo?: string
    email: string
  }
}

// Interface para cargo do usuário
export type UserRole = 'owner' | 'admin' | 'secretary' | 'manager' | 'receptionist' | 'cleaner' | 'none'

// Permissões padrão por cargo
export const DEFAULT_PERMISSIONS: Record<string, EmployeePermissions> = {
  admin: {
    manage_employees: { view: true, add: true, edit: true, remove: true, manage_permissions: true },
    manage_service_professionals: { view: true, add: true, edit: true, remove: true, view_schedule: true, manage_schedule: true },
    appointments: { view: true, create: true, edit: true, cancel: true, reschedule: true, view_all_professionals: true },
    salon_info: { view: true, edit_basic_info: true, edit_social_media: true, edit_photos: true, edit_description: true },
    reports: { view: true, export: true, financial_reports: true, performance_reports: true },
    system_settings: { view: true, edit: true, manage_integrations: true },
    content_management: { view_posts: true, manage_main_posts: true, moderate_posts: true }
  },
  secretary: {
    manage_employees: { view: false, add: false, edit: false, remove: false, manage_permissions: false },
    manage_service_professionals: { view: true, add: false, edit: false, remove: false, view_schedule: true, manage_schedule: false },
    appointments: { view: true, create: true, edit: true, cancel: true, reschedule: true, view_all_professionals: true },
    salon_info: { view: true, edit_basic_info: false, edit_social_media: false, edit_photos: false, edit_description: false },
    reports: { view: true, export: false, financial_reports: false, performance_reports: false },
    system_settings: { view: false, edit: false, manage_integrations: false },
    content_management: { view_posts: true, manage_main_posts: false, moderate_posts: false }
  },
  manager: {
    manage_employees: { view: true, add: false, edit: false, remove: false, manage_permissions: false },
    manage_service_professionals: { view: true, add: true, edit: true, remove: false, view_schedule: true, manage_schedule: true },
    appointments: { view: true, create: true, edit: true, cancel: true, reschedule: true, view_all_professionals: true },
    salon_info: { view: true, edit_basic_info: true, edit_social_media: true, edit_photos: false, edit_description: true },
    reports: { view: true, export: true, financial_reports: true, performance_reports: true },
    system_settings: { view: true, edit: false, manage_integrations: false },
    content_management: { view_posts: true, manage_main_posts: true, moderate_posts: true }
  },
  receptionist: {
    manage_employees: { view: false, add: false, edit: false, remove: false, manage_permissions: false },
    manage_service_professionals: { view: true, add: false, edit: false, remove: false, view_schedule: true, manage_schedule: false },
    appointments: { view: true, create: true, edit: true, cancel: true, reschedule: true, view_all_professionals: true },
    salon_info: { view: true, edit_basic_info: false, edit_social_media: false, edit_photos: false, edit_description: false },
    reports: { view: false, export: false, financial_reports: false, performance_reports: false },
    system_settings: { view: false, edit: false, manage_integrations: false },
    content_management: { view_posts: true, manage_main_posts: false, moderate_posts: false }
  },
  cleaner: {
    manage_employees: { view: false, add: false, edit: false, remove: false, manage_permissions: false },
    manage_service_professionals: { view: false, add: false, edit: false, remove: false, view_schedule: false, manage_schedule: false },
    appointments: { view: false, create: false, edit: false, cancel: false, reschedule: false, view_all_professionals: false },
    salon_info: { view: true, edit_basic_info: false, edit_social_media: false, edit_photos: false, edit_description: false },
    reports: { view: false, export: false, financial_reports: false, performance_reports: false },
    system_settings: { view: false, edit: false, manage_integrations: false },
    content_management: { view_posts: false, manage_main_posts: false, moderate_posts: false }
  }
}

export const useSalonPermissions = (salonId?: string) => {
  const { user } = useAuthContext()
  const [userRole, setUserRole] = useState<UserRole>('none')
  const [userPermissions, setUserPermissions] = useState<EmployeePermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Verificar se o usuário tem uma permissão específica
  const hasPermission = useCallback((permissionPath: string): boolean => {
    if (!userPermissions || !salonId || !user) return false

    // Se for dono, tem todas as permissões
    if (userRole === 'owner') return true

    // Navegar pela estrutura de permissões
    const pathParts = permissionPath.split('.')
    let currentLevel: any = userPermissions

    for (let i = 0; i < pathParts.length; i++) {
      if (!currentLevel || typeof currentLevel !== 'object' || !(pathParts[i] in currentLevel)) {
        return false
      }

      if (i === pathParts.length - 1) {
        // Último nível - verificar se é true
        return currentLevel[pathParts[i]] === true
      } else {
        // Nível intermediário - continuar navegando
        currentLevel = currentLevel[pathParts[i]]
      }
    }

    return false
  }, [userPermissions, userRole, salonId, user])

  // Verificar se o usuário tem acesso ao salão
  const hasAccess = useCallback((): boolean => {
    if (!salonId || !user) return false
    return userRole !== 'none'
  }, [salonId, user, userRole])

  // Verificar se é dono do salão
  const isOwner = useCallback((): boolean => {
    return userRole === 'owner'
  }, [userRole])

  // Verificar se é funcionário
  const isEmployee = useCallback((): boolean => {
    return userRole !== 'owner' && userRole !== 'none'
  }, [userRole])

  // Buscar permissões do usuário
  const fetchUserPermissions = useCallback(async () => {
    if (!salonId || !user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando permissões do usuário:', { salonId, userId: user.id })

      // Verificar se é dono do salão
      const { data: salonData, error: salonError } = await supabase
        .from('salons_studios')
        .select('owner_id')
        .eq('id', salonId)
        .single()

      if (salonError) {
        console.error('❌ Erro ao verificar dono do salão:', salonError)
        throw salonError
      }

      if (salonData?.owner_id === user.id) {
        console.log('✅ Usuário é dono do salão')
        setUserRole('owner')
        setUserPermissions(DEFAULT_PERMISSIONS.admin)
        setLoading(false)
        return
      }

      // Buscar dados do funcionário
      const { data: employeeData, error: employeeError } = await supabase
        .from('salon_employees')
        .select(`
          *,
          user:users(id, name, nickname, profile_photo, email)
        `)
        .eq('salon_id', salonId)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single()

      if (employeeError) {
        if (employeeError.code === 'PGRST116') {
          // Não encontrou funcionário
          console.log('ℹ️ Usuário não é funcionário do salão')
          setUserRole('none')
          setUserPermissions(null)
        } else {
          console.error('❌ Erro ao buscar funcionário:', employeeError)
          throw employeeError
        }
      } else if (employeeData) {
        console.log('✅ Funcionário encontrado:', employeeData)
        setUserRole(employeeData.role)
        setUserPermissions(employeeData.permissions)
      }

    } catch (err) {
      console.error('❌ Erro ao buscar permissões:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [salonId, user])

  // Atualizar permissões quando salonId ou user mudar
  useEffect(() => {
    fetchUserPermissions()
  }, [fetchUserPermissions])

  return {
    // Estados
    userRole,
    userPermissions,
    loading,
    error,

    // Funções
    hasPermission,
    hasAccess,
    isOwner,
    isEmployee,
    fetchUserPermissions,

    // Constantes
    DEFAULT_PERMISSIONS
  }
}
