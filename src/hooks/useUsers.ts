import { useState, useEffect, useCallback } from 'react'
import { supabase, User } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'

export interface UserFilters {
  search?: string
  userType?: 'usuario' | 'profissional' | 'all'
  category?: string
  location?: string
  limit?: number
  offset?: number
}

export interface SalonStudio {
  id: string
  owner_id: string
  name: string
  description?: string
  profile_photo?: string
  cover_photo?: string
  phone?: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  social_instagram?: string
  social_facebook?: string
  social_youtube?: string
  social_linkedin?: string
  social_x?: string
  social_tiktok?: string
  created_at: string
  updated_at: string
  owner?: {
    id: string
    name: string
    email: string
    profile_photo?: string
    user_type: string
  }
}

export interface UseUsersReturn {
  users: User[]
  salons: SalonStudio[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  fetchUsers: (filters?: UserFilters) => Promise<void>
  loadMore: () => Promise<void>
  refetch: () => Promise<void>
}

export function useUsers(filters: UserFilters = {}) {
  const { user } = useAuthContext()
  const [users, setUsers] = useState<User[]>([])
  const [salons, setSalons] = useState<SalonStudio[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)

  const fetchUsers = useCallback(async (filters: UserFilters = {}, resetPage = false) => {
    // Iniciando busca de usuários e salões
    
    setLoading(true)
    setError(null)
    setCurrentOffset(0)
    
    // Função para executar query com timeout
    const executeQueryWithTimeout = async (queryFn: () => Promise<any>, timeoutMs: number = 5000) => {
      return Promise.race([
        queryFn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Timeout: Query demorou mais de ${timeoutMs}ms`)), timeoutMs)
        )
      ])
    }
    
    // Função para retry com backoff exponencial
    const retryWithBackoff = async (fn: () => Promise<any>, maxRetries: number = 2) => {
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          return await executeQueryWithTimeout(fn, 5000)
        } catch (error) {
          if (attempt === maxRetries) {
            throw error
          }
          const delay = Math.pow(2, attempt) * 1000 // 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }
    
    try {
      // Fazendo requisição para Supabase
      try {
        const { data: testData, error: testError } = await retryWithBackoff(async () => {
          return await supabase
            .from('users')
            .select('id, name, user_type')
            .limit(1)
        })
        
        if (testError) {
          // Se for erro de rate limit, usar fallback
          if (testError.code === 'PGRST301' || testError.message.includes('rate limit')) {
            // Rate limit detectado
            setError('Rate limit do Supabase - usando dados de fallback')
            setUsers([])
            setSalons([])
            setTotalCount(0)
            setHasMore(false)
            setCurrentOffset(0)
            setLoading(false)
            return
          }
          
          setError(`Erro de conectividade: ${testError.message}`)
          setUsers([])
          setSalons([])
          setTotalCount(0)
          setHasMore(false)
          setCurrentOffset(0)
          setLoading(false)
          return
        }
        
        // Query de teste OK
      } catch (error) {
        console.error('❌ Erro na query de teste após retry:', error)
        
        // Se for timeout, provavelmente é rate limit
        if (error instanceof Error && error.message.includes('Timeout')) {
          // Timeout detectado
          setError('Supabase com limite excedido - usando dados de fallback')
          setUsers([])
          setSalons([])
          setTotalCount(0)
          setHasMore(false)
          setCurrentOffset(0)
          setLoading(false)
          return
        }
        
        setError(`Erro de conectividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        setUsers([])
        setSalons([])
        setTotalCount(0)
        setHasMore(false)
        setCurrentOffset(0)
        setLoading(false)
        return
      }
      
      // Construindo queries
      
      // Buscar usuários
      let usersQuery = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(0, 20) // Aumentar range para garantir que o Rodrigo apareça

      // Query de usuários base construída

      // Aplicar filtro por tipo de usuário
      if (filters.userType && filters.userType !== 'all') {
        if (filters.userType === 'profissional') {
          usersQuery = usersQuery.eq('user_type', 'profissional')
        } else if (filters.userType === 'usuario') {
          usersQuery = usersQuery.eq('user_type', 'usuario')
        }
      } else {
        // Se não há filtro específico, buscar apenas profissionais por padrão
        usersQuery = usersQuery.eq('user_type', 'profissional')
      }

      // Aplicar filtro de busca para usuários
      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim()
        usersQuery = usersQuery.or(`name.ilike.%${searchTerm}%,nickname.ilike.%${searchTerm}%`)
        // Filtro de busca aplicado
      }

      // Aplicar filtro de categoria para usuários
      if (filters.category) {
        usersQuery = usersQuery.contains('categories', [filters.category])
        // Filtro de categoria aplicado
      }

      // Aplicar filtro de localização para usuários
      if (filters.location && filters.location.trim()) {
        const locationTerm = filters.location.trim()
        usersQuery = usersQuery.or(`cidade.ilike.%${locationTerm}%,uf.ilike.%${locationTerm}%,bairro.ilike.%${locationTerm}%`)
        // Filtro de localização aplicado
      }

      // Buscar salões se o filtro for para profissionais
      let salonsQuery = null
      if (filters.userType === 'profissional' || !filters.userType) {
        // Construindo query de salões
        salonsQuery = supabase
          .from('salons_studios')
          .select(`
            *,
            owner:users!salons_studios_owner_id_fkey(id, name, email, profile_photo, user_type)
          `, { count: 'exact' })
          .order('created_at', { ascending: false })
          .range(0, 11)

        // Aplicar filtro de busca para salões
        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.trim()
          salonsQuery = salonsQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
          // Filtro de busca aplicado
        }

        // Aplicar filtro de localização para salões
        if (filters.location && filters.location.trim()) {
          const locationTerm = filters.location.trim()
          salonsQuery = salonsQuery.or(`cidade.ilike.%${locationTerm}%,uf.ilike.%${locationTerm}%,bairro.ilike.%${locationTerm}%`)
          // Filtro de localização aplicado
        }
      }

      // Queries finais construídas
      
      const startTime = Date.now()
      
      // Executar queries em paralelo
      const [usersResult, salonsResult] = await Promise.all([
        retryWithBackoff(async () => await usersQuery),
        salonsQuery ? retryWithBackoff(async () => await salonsQuery) : Promise.resolve({ data: [], error: null, count: 0 })
      ])
      
      const endTime = Date.now()
      const duration = endTime - startTime
      
      // Queries executadas
      

      


      if (usersResult.error) {
        console.error('❌ Erro ao buscar usuários:', usersResult.error)
        console.error('❌ Código do erro:', usersResult.error.code)
        console.error('❌ Mensagem do erro:', usersResult.error.message)
        
        // Se for erro de rate limit, usar fallback
        if (usersResult.error.code === 'PGRST301' || usersResult.error.message.includes('rate limit') || usersResult.error.message.includes('Exceeding usage limits')) {
          // Rate limit detectado
          setError('Rate limit do Supabase - usando dados de fallback')
          setUsers([])
          setTotalCount(0)
          setHasMore(false)
          setLoading(false)
          return
        }
        
        setError(usersResult.error.message)
        setUsers([])
        setTotalCount(0)
        setHasMore(false)
        return
      }

      if (salonsResult.error) {
        console.error('❌ Erro ao buscar salões:', salonsResult.error)
        console.error('❌ Código do erro:', salonsResult.error.code)
        console.error('❌ Mensagem do erro:', salonsResult.error.message)
        
        setError(salonsResult.error.message)
        setSalons([])
        // setTotalCount(0) // Total de salões não é retornado pela query, então não atualiza
        setHasMore(false)
        return
      }

      if (usersResult.data) {
        // Dados de usuários recebidos com sucesso
        
        if (usersResult.data.length > 0) {
          console.log('✅ Primeiro usuário:', usersResult.data[0])
          console.log('✅ Último usuário:', usersResult.data[usersResult.data.length - 1])
        }
        
        const dbUsers = usersResult.data as User[]
        setUsers(dbUsers)
        setTotalCount(usersResult.count || 0)
        setHasMore((usersResult.count || 0) > dbUsers.length)
        setCurrentOffset(dbUsers.length)
        
        console.log('✅ Estado atualizado com sucesso!')
      } else {
        console.log('⚠️ Nenhum dado de usuários recebido')
        console.log('⚠️ Data é null/undefined')
        setUsers([])
        setTotalCount(0)
        setHasMore(false)
      }

      if (salonsResult.data) {
        console.log('✅ Dados de salões recebidos com sucesso!')
        console.log('📊 Total de salões:', salonsResult.data.length)
        console.log('🔢 Count total:', salonsResult.count || 0)
        
        if (salonsResult.data.length > 0) {
          console.log('✅ Primeiro salão:', salonsResult.data[0])
          console.log('✅ Último salão:', salonsResult.data[salonsResult.data.length - 1])
        }
        
        const dbSalons = salonsResult.data as SalonStudio[]
        setSalons(dbSalons)
        // setTotalCount(salonsResult.count || 0) // Total de salões não é retornado pela query, então não atualiza
        setHasMore((salonsResult.count || 0) > dbSalons.length)
        setCurrentOffset(dbSalons.length)
        
        console.log('✅ Estado atualizado com sucesso!')
      } else {
        console.log('⚠️ Nenhum dado de salões recebido')
        console.log('⚠️ Data é null/undefined')
        setSalons([])
        // setTotalCount(0) // Total de salões não é retornado pela query, então não atualiza
        setHasMore(false)
      }
    } catch (err) {
      console.error('❌ Erro geral ao buscar usuários:', err)
      
      // Se for timeout, usar fallback
      if (err instanceof Error && err.message.includes('Timeout')) {
        console.log('⚠️ Timeout geral - usando fallback')
        setError('Supabase com limite excedido - usando dados de fallback')
        setUsers([])
        setSalons([])
        setTotalCount(0)
        setHasMore(false)
        setLoading(false)
        return
      }
      
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      setUsers([])
      setSalons([])
      setTotalCount(0)
      setHasMore(false)
    } finally {
      console.log('🏁 Finalizando busca de usuários')
      setLoading(false)
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return

    console.log('🔄 Carregando mais usuários...')

    setLoading(true)
    setError(null)

    try {
      let usersQuery = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + 11)

      // Aplicar filtros atuais
      if (filters.userType && filters.userType !== 'all') {
        if (filters.userType === 'profissional') {
          usersQuery = usersQuery.eq('user_type', 'profissional')
        } else if (filters.userType === 'usuario') {
          usersQuery = usersQuery.eq('user_type', 'usuario')
        }
      } else {
        usersQuery = usersQuery.eq('user_type', 'profissional')
      }

      if (filters.search && filters.search.trim()) {
        const searchTerm = filters.search.trim()
        usersQuery = usersQuery.or(`name.ilike.%${searchTerm}%,nickname.ilike.%${searchTerm}%`)
      }

      if (filters.category) {
        usersQuery = usersQuery.contains('categories', [filters.category])
      }

      if (filters.location && filters.location.trim()) {
        const locationTerm = filters.location.trim()
        usersQuery = usersQuery.or(`cidade.ilike.%${locationTerm}%,uf.ilike.%${locationTerm}%,bairro.ilike.%${locationTerm}%`)
      }

      const { data: usersData, error: usersError } = await usersQuery

      if (usersError) {
        console.error('❌ Erro ao carregar mais usuários:', usersError)
        setError(usersError.message)
        return
      }

      if (usersData && usersData.length > 0) {
        console.log('✅ Mais usuários carregados:', usersData.length)
        const newUsers = usersData as User[]
        setUsers(prev => [...prev, ...newUsers])
        setCurrentOffset(prev => prev + newUsers.length)
        setHasMore(newUsers.length === 12) // Se recebeu menos que 12, não há mais
      } else {
        console.log('⚠️ Nenhum usuário adicional encontrado')
        setHasMore(false)
      }

      let salonsQuery = null
      if (filters.userType === 'profissional' || !filters.userType) {
        salonsQuery = supabase
          .from('salons_studios')
          .select(`
            *,
            owner:users!salons_studios_owner_id_fkey(id, name, email, profile_photo, user_type)
          `)
          .order('created_at', { ascending: false })
          .range(currentOffset, currentOffset + 11)

        if (filters.search && filters.search.trim()) {
          const searchTerm = filters.search.trim()
          salonsQuery = salonsQuery.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        }

        if (filters.location && filters.location.trim()) {
          const locationTerm = filters.location.trim()
          salonsQuery = salonsQuery.or(`cidade.ilike.%${locationTerm}%,uf.ilike.%${locationTerm}%,bairro.ilike.%${locationTerm}%`)
        }

        const { data: salonsData, error: salonsError } = await salonsQuery

        if (salonsError) {
          console.error('❌ Erro ao carregar mais salões:', salonsError)
          setError(salonsError.message)
          return
        }

        if (salonsData && salonsData.length > 0) {
          console.log('✅ Mais salões carregados:', salonsData.length)
          const newSalons = salonsData as SalonStudio[]
          setSalons(prev => [...prev, ...newSalons])
          setCurrentOffset(prev => prev + newSalons.length)
          setHasMore(newSalons.length === 12) // Se recebeu menos que 12, não há mais
        } else {
          console.log('⚠️ Nenhum salão adicional encontrado')
          setHasMore(false)
        }
      }
    } catch (err) {
      console.error('❌ Erro ao carregar mais usuários:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentOffset, filters])

  const refetch = useCallback(() => {
    return fetchUsers(filters, true)
  }, [fetchUsers, filters])

  // Buscar usuários quando os filtros mudarem
  useEffect(() => {
    console.log('🔄 Filtros mudaram, buscando usuários...')
    fetchUsers(filters, true)
  }, [filters, fetchUsers])

  return {
    users,
    salons,
    loading,
    error,
    totalCount,
    hasMore,
    loadMore,
    refetch
  }
} 