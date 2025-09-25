import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { translateError } from '@/utils/errorTranslations'
import { User } from '@/lib/supabase'

// Cache local para reduzir chamadas ao Supabase
const userCache = new Map<string, any>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, name: string, userType?: 'usuario' | 'profissional') => Promise<{ data: any; error: string }>
  resetPassword: (email: string) => Promise<{ data: any; error: any }>
  updatePassword: (newPassword: string) => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
  syncUserType: () => Promise<void>
  refreshUser: () => Promise<void>
  userCache: Map<string, any>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuthContext = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  // Função para buscar usuário com cache
  const fetchUserWithCache = async (userId: string) => {
    const cacheKey = `user_${userId}`
    const cached = userCache.get(cacheKey)
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data
    }
    
    try {
      
      // Adicionar timeout reduzido para melhor UX
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 1000) // 1 segundo
      })
      
      const fetchPromise = supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      const { data, error } = await Promise.race([fetchPromise, timeoutPromise]) as any
      
      if (error) throw error
      
      // Salvar no cache
      userCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })
      
      return data
    } catch (error) {
      console.error('Erro ao buscar usuário:', error)
      throw error
    }
  }

  // Verificar sessão atual
  useEffect(() => {
    const checkUser = async () => {
      try {
        // Verificando sessão com timeout otimizado
        
        // Buscar sessão com timeout reduzido para melhor UX
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout na verificação de sessão')), 1000) // 1 segundo
        })
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (session?.user) {
          // Definir usuário básico imediatamente para melhor UX
          const basicUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.email?.split('@')[0] || 'Usuário',
            nickname: session.user.email?.split('@')[0] || 'usuario',
            user_type: session.user.user_metadata?.user_type || 'usuario',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any
          
          setUser(basicUser)
          setLoading(false) // Parar loading imediatamente após definir usuário básico
          
          // Buscar dados completos em background (sem bloquear a UI)
          setTimeout(async () => {
            try {
              const userData = await fetchUserWithCache(session.user.id)
              setUser(userData)
            } catch (error) {
              // Manter dados básicos se falhar - não mostrar erro para o usuário
              console.error('Erro ao buscar dados completos do usuário:', error)
            }
          }, 100) // Pequeno delay para não bloquear a UI
        } else {
          setUser(null)
          setLoading(false)
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error)
        setUser(null)
        setLoading(false)
      }
    }

    checkUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // console.log('🔄 AuthContext - Evento de autenticação:', event)
        // console.log('🔄 AuthContext - Sessão:', session ? 'Presente' : 'Ausente')
        
        if (session?.user) {
          // Definir usuário básico imediatamente
          const basicUser = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.email?.split('@')[0] || 'Usuário',
            nickname: session.user.email?.split('@')[0] || 'usuario',
            user_type: session.user.user_metadata?.user_type || 'usuario',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as any
          
          setUser(basicUser)
          setLoading(false) // Parar loading imediatamente
          
          // Buscar dados completos em background (sem bloquear a UI)
          setTimeout(async () => {
            try {
              const userData = await fetchUserWithCache(session.user.id)
              setUser(userData)
            } catch (error) {
              // Manter dados básicos se falhar
              console.error('Erro ao buscar dados completos do usuário:', error)
            }
          }, 100) // Pequeno delay para não bloquear a UI
        } else {
          setUser(null)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // Sincronizar user_type após o login (sempre sincronizar para manter atualizado)
  useEffect(() => {
    if (user?.id) {
      // Sempre sincronizar para manter user_type atualizado
      const timer = setTimeout(() => {
        syncUserType()
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [user?.id])

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }

      // Definir usuário básico imediatamente
      if (data.user) {
        const basicUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.email?.split('@')[0] || 'Usuário',
          nickname: data.user.email?.split('@')[0] || 'usuario',
          user_type: data.user.user_metadata?.user_type || 'usuario',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any
        
        setUser(basicUser)
        
        // Buscar dados completos em background
        try {
          const userData = await fetchUserWithCache(data.user.id)
          setUser(userData)
        } catch (error) {
          console.error('Erro ao buscar dados completos do usuário:', error)
        }
      }


      return { data, error: null }
        
    } catch (error) {
      console.error('❌ Erro no login:', error)
      
      let errorMessage = "Credenciais inválidas"
      
      if (error instanceof Error) {
        errorMessage = translateError(error.message)
      }

      toast({
        title: "Erro no login",
        description: errorMessage,
        variant: "destructive"
      })
      
      return { data: null, error }
    }
  }

  const signUp = async (email: string, password: string, name: string, userType: 'usuario' | 'profissional' = 'usuario') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            user_type: userType
          }
        }
      })

      if (error) throw error

      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      })

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Erro no cadastro",
        description: error instanceof Error ? translateError(error.message) : "Erro desconhecido",
        variant: "destructive"
      })
      
      return { data: null, error }
    }
  }

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://beautycom.com.br/redefinir-senha',
        data: {
          site_name: 'Beautycom',
          site_url: 'https://beautycom.com.br'
        }
      })

      if (error) throw error

      toast({
        title: "Email de recuperação enviado!",
        description: "Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.",
      })

      return { data, error: null }
    } catch (error) {
      console.error('❌ Erro na recuperação de senha:', error)
      
      let errorMessage = "Erro ao enviar email de recuperação"
      
      if (error instanceof Error) {
        errorMessage = translateError(error.message)
      }

      toast({
        title: "Erro na recuperação de senha",
        description: errorMessage,
        variant: "destructive"
      })
      
      return { data: null, error }
    }
  }

  const updatePassword = async (newPassword: string) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      toast({
        title: "Senha atualizada!",
        description: "Sua senha foi redefinida com sucesso.",
      })

      return { data, error: null }
    } catch (error) {
      console.error('❌ Erro ao atualizar senha:', error)
      
      let errorMessage = "Erro ao redefinir senha"
      
      if (error instanceof Error) {
        errorMessage = translateError(error.message)
      }

      toast({
        title: "Erro ao redefinir senha",
        description: errorMessage,
        variant: "destructive"
      })
      
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      
      // Limpar o estado do usuário imediatamente (mesmo se houver erro)
      setUser(null)
      userCache.clear()
      
      // Se houver erro, mas o usuário foi limpo, não mostrar toast
      if (error) {
        console.warn('Aviso no logout (ignorado):', error)
        // Não mostrar toast de erro para logout
        return
      }

    } catch (error) {
      console.error('Erro crítico no logout:', error)
      // Limpar estado mesmo em caso de erro crítico
      setUser(null)
      userCache.clear()
      
      // Só mostrar toast para erros críticos
      toast({
        title: "Erro no logout",
        description: "Ocorreu um erro inesperado durante o logout.",
        variant: "destructive"
      })
    }
  }

  // Função para sincronizar o user_type com o banco de dados
  const syncUserType = async () => {
    if (!user?.id) return
    
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('user_type')
        .eq('id', user.id)
        .single()
      
      if (!error && userData && userData.user_type !== user.user_type) {
        setUser(prev => prev ? { ...prev, user_type: userData.user_type } : null)
      }
    } catch (err) {
      // Silenciosamente ignora erros de sincronização
    }
  }

  // Função para atualizar dados do usuário do banco
  const refreshUser = async () => {
    if (!user?.id) return
    
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!error && userData) {
        setUser(userData)
      }
    } catch (err) {
      // Silenciosamente ignora erros de atualização
    }
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) {
      console.error('Erro: Usuário não autenticado ao tentar atualizar.')
      return
    }

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setUser(prev => ({ ...prev, ...updates }))
    } catch (error) {
      console.error('❌ Erro ao atualizar usuário:', error)
      toast({
        title: "Erro ao atualizar perfil",
        description: error instanceof Error ? translateError(error.message) : "Erro desconhecido",
        variant: "destructive"
      })
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      signUp, 
      signIn, 
      resetPassword,
      updatePassword,
      signOut, 
      updateUser, 
      syncUserType,
      refreshUser,
      userCache 
    }}>
      {children}
    </AuthContext.Provider>
  )
} 