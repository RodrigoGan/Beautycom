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
  signUp: (email: string, password: string, name: string, userType?: 'usuario' | 'profissional') => Promise<{ data: any; error: any }>
  signOut: () => Promise<void>
  updateUser: (updates: Partial<User>) => Promise<void>
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
      console.log('✅ Usando dados do cache para usuário:', userId)
      return cached.data
    }
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) throw error
      
      // Salvar no cache
      userCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })
      
      console.log('✅ Dados do usuário carregados do banco e salvos no cache')
      return data
    } catch (error) {
      console.error('❌ Erro ao buscar usuário:', error)
      throw error
    }
  }

  // Verificar sessão atual
  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('🔄 AuthContext - Verificando sessão...')
        
        // Timeout para verificação de sessão (reduzido para 5 segundos)
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout: Verificação de sessão demorou muito')), 5000)
        })
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (session?.user) {
          console.log('🔄 AuthContext - Sessão encontrada, buscando dados do usuário...')
          
          // Timeout para busca de dados do usuário (reduzido para 5 segundos)
          const userPromise = supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          const userTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Timeout: Busca de dados do usuário demorou muito')), 5000)
          })
          
          try {
            const { data: userData, error } = await Promise.race([userPromise, userTimeoutPromise]) as any

            if (error) {
              console.error('Erro ao buscar dados do usuário:', error)
              // Fallback para dados básicos
              const basicUser = {
                id: session.user.id,
                email: session.user.email,
                name: session.user.email?.split('@')[0] || 'Usuário',
                nickname: session.user.email?.split('@')[0] || 'usuario',
                user_type: 'usuario',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } as any
              setUser(basicUser)
            } else {
              setUser(userData)
            }
          } catch (userError) {
            console.error('❌ Timeout ao buscar dados do usuário:', userError)
            // Fallback para dados básicos
            const basicUser = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.email?.split('@')[0] || 'Usuário',
              nickname: session.user.email?.split('@')[0] || 'usuario',
              user_type: 'usuario',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any
            setUser(basicUser)
          }
        } else {
          console.log('🔄 AuthContext - Nenhuma sessão encontrada')
          setUser(null)
        }
      } catch (error) {
        console.error('❌ Timeout ao verificar sessão:', error)
        // Se não conseguir verificar sessão, assumir que não está logado
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Buscar dados completos do usuário no banco
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (error) {
            console.error('Erro ao buscar dados do usuário:', error)
            // Fallback para dados básicos
            const basicUser = {
              id: session.user.id,
              email: session.user.email,
              name: session.user.email?.split('@')[0] || 'Usuário',
              nickname: session.user.email?.split('@')[0] || 'usuario',
              user_type: 'usuario',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any
            setUser(basicUser)
          } else {
            setUser(userData)
          }
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Tentando fazer login com:', email)
      console.log('🔄 Iniciando chamada para Supabase Auth...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('🔄 Resposta do Supabase Auth recebida')
      console.log('🔄 Data:', data ? 'Recebida' : 'Nula')
      console.log('🔄 Error:', error ? error.message : 'Nenhum')
      
      if (error) {
        console.error('❌ Erro no login:', error.message)
        throw error
      }

      console.log('✅ Login bem-sucedido!')
        console.log('✅ User ID:', data.user?.id)

        // Buscar dados completos do usuário no banco
        if (data.user) {
          try {
            const userData = await fetchUserWithCache(data.user.id)
            setUser(userData)
            console.log('✅ Usuário completo carregado:', userData.name)
          } catch (error) {
            console.error('Erro ao buscar dados do usuário:', error)
            // Fallback para dados básicos
            const basicUser = {
              id: data.user.id,
              email: data.user.email,
              name: data.user.email?.split('@')[0] || 'Usuário',
              nickname: data.user.email?.split('@')[0] || 'usuario',
              user_type: 'usuario',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            } as any
            setUser(basicUser)
            console.log('✅ Usuário básico definido:', basicUser.name)
          }
        }

        console.log('🔄 Exibindo toast de sucesso...')
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo de volta!",
        })

        console.log('✅ Processo de login finalizado com sucesso')
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

      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      })
    } catch (error) {
      toast({
        title: "Erro no logout",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
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
      console.log('✅ Usuário atualizado com sucesso:', updates)
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
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
} 