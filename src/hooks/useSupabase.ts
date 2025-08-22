import { useState, useEffect } from 'react'
import { supabase, User } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    // Verificar usuário atual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Buscar dados adicionais do usuário na tabela users
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setUser(userData)
      }
      setLoading(false)
    }

    getUser()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
          
          setUser(userData)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

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

      // Criar registro na tabela users
      if (data.user) {
        const { error: profileError } = await supabase
          .from('users')
          .insert({
            id: data.user.id,
            email,
            name,
            user_type: userType
          })

        if (profileError) throw profileError
      }

      toast({
        title: "Conta criada com sucesso!",
        description: "Verifique seu email para confirmar a conta.",
      })

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Erro ao criar conta",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      return { data: null, error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔄 Tentando fazer login com:', email)
      console.log('🔄 Iniciando chamada para Supabase...')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      console.log('🔄 Resposta do Supabase recebida')
      
      if (error) {
        console.error('❌ Erro no login:', error.message)
        throw error
      }

      console.log('✅ Login bem-sucedido!')

      // Definir usuário básico se não conseguir buscar dados adicionais
      if (data.user) {
        const basicUser = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.email.split('@')[0], // Nome básico do email
          nickname: data.user.email.split('@')[0],
          user_type: 'usuario',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as any
        setUser(basicUser)
        console.log('✅ Usuário básico definido:', basicUser.name)
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
        if (error.message.includes("Timeout")) {
          errorMessage = "Login demorou muito. Tente novamente."
        } else if (error.message.includes("Email not confirmed")) {
          errorMessage = "Email não confirmado. Verifique sua caixa de entrada ou desabilite a confirmação no Supabase."
        } else if (error.message.includes("Invalid login credentials")) {
          errorMessage = "Email ou senha incorretos"
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

  return {
    user,
    loading,
    signUp,
    signIn,
    signOut
  }
}

export function useAppointments() {
  const { toast } = useToast()

  const createAppointment = async (appointmentData: {
    client_id: string
    professional_id: string
    service_id: string
    date: string
    time: string
    notes?: string
  }) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          status: 'scheduled'
        })
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Agendamento criado!",
        description: "Seu agendamento foi registrado com sucesso.",
      })

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Erro ao criar agendamento",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      return { data: null, error }
    }
  }

  const getAppointments = async (userId: string, userType: string) => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          client:users!appointments_client_id_fkey(name, email),
          professional:users!appointments_professional_id_fkey(name, email),
          service:services(name, duration, price)
        `)

      if (userType === 'usuario') {
        query = query.eq('client_id', userId)
      } else if (userType === 'profissional') {
        query = query.eq('professional_id', userId)
      }

      const { data, error } = await query.order('date', { ascending: true })

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Erro ao buscar agendamentos",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      return { data: null, error }
    }
  }

  const updateAppointmentStatus = async (appointmentId: string, status: 'confirmed' | 'completed' | 'cancelled') => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status })
        .eq('id', appointmentId)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Status atualizado!",
        description: `Agendamento ${status === 'confirmed' ? 'confirmado' : status === 'completed' ? 'finalizado' : 'cancelado'}.`,
      })

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Erro ao atualizar status",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      return { data: null, error }
    }
  }

  return {
    createAppointment,
    getAppointments,
    updateAppointmentStatus
  }
}

export function useServices() {
  const { toast } = useToast()

  const getServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name')

      if (error) throw error

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Erro ao buscar serviços",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      return { data: null, error }
    }
  }

  const createService = async (serviceData: {
    name: string
    description: string
    duration: number
    price: number
    category: string
  }) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single()

      if (error) throw error

      toast({
        title: "Serviço criado!",
        description: "Novo serviço adicionado com sucesso.",
      })

      return { data, error: null }
    } catch (error) {
      toast({
        title: "Erro ao criar serviço",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      return { data: null, error }
    }
  }

  return {
    getServices,
    createService
  }
} 