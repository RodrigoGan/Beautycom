import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/lib/supabase'

// Cache local para reduzir chamadas ao Supabase
const userCache = new Map<string, any>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutos

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ data: any; error: any }>
  signUp: (email: string, password: string, name: string, userType?: 'usuario' | 'profissional') => Promise<{ data: any; error: string }>
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
      
      // Adicionar timeout para evitar travamento
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 3000) // 3 segundos
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
        // Verificando sessão
        
        // Buscar sessão sem timeout para evitar problemas
        const { data: { session } } = await supabase.auth.getSession()
        
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
          
          // Buscar dados completos em background
          try {
            const userData = await fetchUserWithCache(session.user.id)
            setUser(userData)
          } catch (error) {
            // Manter dados básicos se falhar
            console.error('Erro ao buscar dados completos do usuário:', error)
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        console.error('❌ Erro ao verificar sessão:', error)
        setUser(null)
      } finally {
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
          
          // Buscar dados completos em background
          try {
            const userData = await fetchUserWithCache(session.user.id)
            setUser(userData)
          } catch (error) {
            console.error('Erro ao buscar dados completos do usuário:', error)
          }
        } else {
          setUser(null)
        }
        setLoading(false)
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

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo de volta!",
      })

      return { data, error: null }
        
    } catch (error) {
      console.error('❌ Erro no login:', error)
      
      let errorMessage = "Credenciais inválidas"
      
      if (error instanceof Error) {
        if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email não confirmado. Verifique sua caixa de entrada."
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos"
        } else if (error.message.includes("fetch")) {
          errorMessage = "Erro de conexão. Verifique sua internet e tente novamente."
        } else {
          errorMessage = error.message
        }
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
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error

      // Limpar o estado do usuário imediatamente
      setUser(null)

      // Limpar o cache de usuários
      userCache.clear()

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    } catch (error) {
      console.error('Erro no logout:', error)
      toast({
        title: "Erro no logout",
        description: error instanceof Error ? error.message : "Erro desconhecido",
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
        description: error instanceof Error ? error.message : "Erro desconhecido",
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