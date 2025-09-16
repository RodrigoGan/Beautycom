import { useMemo } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Hook para verificar se o usuário atual tem acesso de super admin
 * Verifica tanto o campo is_super_admin quanto o email específico como fallback
 */
export const useSuperAdminAccess = () => {
  const { user } = useAuthContext()
  
  const isSuperAdmin = useMemo(() => {
    // Verificação de segurança: apenas usuários autenticados
    if (!user || !user.id) {
      return false
    }
    
    // Verificação principal: campo is_super_admin
    if (user.is_super_admin === true) {
      return true
    }
    
    // Fallback de segurança: email específico (apenas para desenvolvimento/emergência)
    if (user.email === 'rodrigo_gan@hotmail.com') {
      return true
    }
    
    return false
  }, [user])
  
  return { 
    isSuperAdmin,
    user 
  }
}
