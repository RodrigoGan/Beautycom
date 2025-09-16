import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

/**
 * Hook para verificação de palavra-chave de administrador
 * Sistema de segurança adicional para acesso às funcionalidades administrativas
 */
export const useAdminKeyVerification = () => {
  const [isKeyVerified, setIsKeyVerified] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthContext()
  
  /**
   * Verifica se a palavra-chave fornecida está correta
   * @param key - Palavra-chave fornecida pelo usuário
   * @returns Promise<boolean> - true se a chave estiver correta
   */
  const verifyAdminKey = useCallback(async (key: string): Promise<boolean> => {
    if (!user?.email) {
      setError('Usuário não autenticado')
      return false
    }
    
    setIsVerifying(true)
    setError(null)
    
    try {
      // Buscar a palavra-chave do usuário no banco
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('admin_key')
        .eq('email', user.email)
        .single()
      
      if (fetchError) {
        console.error('Erro ao verificar palavra-chave:', fetchError)
        setError('Erro interno do servidor')
        return false
      }
      
      if (!data?.admin_key) {
        setError('Palavra-chave não configurada')
        return false
      }
      
      // Verificar se a palavra-chave está correta
      const isCorrect = data.admin_key === key
      
      if (isCorrect) {
        setIsKeyVerified(true)
        // Armazenar verificação na sessão (não persistente)
        sessionStorage.setItem('admin_key_verified', 'true')
        return true
      } else {
        setError('Palavra-chave incorreta')
        return false
      }
      
    } catch (error) {
      console.error('Erro na verificação:', error)
      setError('Erro inesperado')
      return false
    } finally {
      setIsVerifying(false)
    }
  }, [user?.email])
  
  /**
   * Limpa a verificação (logout de admin)
   */
  const clearVerification = useCallback(() => {
    setIsKeyVerified(false)
    sessionStorage.removeItem('admin_key_verified')
    setError(null)
  }, [])
  
  /**
   * Verifica se já foi verificado nesta sessão
   */
  const checkSessionVerification = useCallback(() => {
    const sessionVerified = sessionStorage.getItem('admin_key_verified') === 'true'
    if (sessionVerified) {
      setIsKeyVerified(true)
    }
    return sessionVerified
  }, [])
  
  return {
    isKeyVerified,
    isVerifying,
    error,
    verifyAdminKey,
    clearVerification,
    checkSessionVerification
  }
}
