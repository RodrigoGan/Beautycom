import { useState, useEffect, useCallback } from 'react'
import { supabase, User } from '@/lib/supabase'

export interface UserFilters {
  search?: string
  userType?: 'usuario' | 'profissional' | 'all'
  category?: string
  location?: string
  limit?: number
  offset?: number
}

export interface UseUsersReturn {
  users: User[]
  loading: boolean
  error: string | null
  hasMore: boolean
  totalCount: number
  fetchUsers: (filters?: UserFilters) => Promise<void>
  loadMore: () => Promise<void>
}

export const useUsers = (): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [currentOffset, setCurrentOffset] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)
  const limit = 12

  const fetchUsers = useCallback(async (filters: UserFilters = {}) => {
    console.log('🔄 fetchUsers chamado com filtros:', filters)
    
    // Evitar múltiplas chamadas simultâneas
    if (loading) {
      console.log('⏳ fetchUsers ignorado - já está carregando')
      return
    }
    
    setLoading(true)
    setError(null)
    
    try {
      console.log('📡 Fazendo requisição para Supabase...')
      
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Filtro por busca (nome, nickname, cidade)
      if (filters.search?.trim()) {
        const searchTerm = filters.search.trim()
        query = query.or(`name.ilike.%${searchTerm}%,nickname.ilike.%${searchTerm}%,cidade.ilike.%${searchTerm}%`)
      }

      // Filtro por tipo de usuário (simplificado)
      if (filters.userType && filters.userType !== 'all') {
        console.log('🔍 Aplicando filtro userType:', filters.userType)
        if (filters.userType === 'profissional') {
          // Profissionais e Salões/Estúdios
          query = query.in('user_type', ['profissional', 'salão', 'estúdio'])
          console.log('🔍 Filtro IN aplicado para profissionais')
        } else if (filters.userType === 'usuario') {
          // Apenas usuários
          query = query.eq('user_type', 'usuario')
          console.log('🔍 Filtro EQ aplicado para usuários')
        }
      } else {
        console.log('🔍 Sem filtro de tipo - buscando todos')
      }

              // Temporariamente: testar sem filtros
        console.log('🔍 Testando sem filtros para debug...')
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('*')
          .limit(5)
        
        console.log('🔍 Teste sem filtros:', { 
          dataLength: testData?.length, 
          error: testError?.message,
          dataSample: testData?.slice(0, 2)
        })

        // Se o teste sem filtros funcionar, usar esses dados
        if (testData && testData.length > 0) {
          console.log('✅ Teste sem filtros funcionou, usando esses dados')
          setUsers(testData)
          setTotalCount(testData.length)
          setHasMore(false)
          setCurrentOffset(0)
          return
        } else {
          console.log('❌ Teste sem filtros falhou - nenhum dado retornado')
          console.log('🔍 Verificando se há dados na tabela...')
          
          // Teste simples para verificar se há dados
          const { data: testDataCount, error: testErrorCount } = await supabase
            .from('users')
            .select('count')
            .limit(1)
          
          if (testErrorCount) {
            console.error('❌ Erro ao verificar tabela:', testErrorCount.message)
          } else {
            console.log('✅ Tabela acessível, mas sem dados filtrados')
          }
        }

      // Log da query final
      console.log('🔍 Query final construída')

      // Filtro por categoria (se o usuário tem a categoria)
      if (filters.category) {
        query = query.contains('categories', [filters.category])
      }

      // Filtro por localização
      if (filters.location?.trim()) {
        const locationTerm = filters.location.trim()
        query = query.or(`cidade.ilike.%${locationTerm}%,uf.ilike.%${locationTerm}%`)
      }

      // Paginação
      query = query.range(0, limit - 1)

      console.log('🔍 Executando query com filtros:', {
        search: filters.search,
        userType: filters.userType,
        location: filters.location,
        limit
      })

      const { data, error: fetchError, count } = await query

      console.log('🔍 Resultado da query:', { 
        dataLength: data?.length, 
        error: fetchError?.message, 
        count,
        hasData: !!data,
        dataType: typeof data,
        dataSample: data?.slice(0, 2)
      })

      if (fetchError) {
        console.error('❌ Erro ao buscar usuários:', fetchError.message)
        setUsers([])
        setTotalCount(0)
        setHasMore(false)
        setCurrentOffset(0)
        return
      }

      console.log(`✅ Usuários carregados: ${data?.length || 0} de ${count || 0}`)
      console.log('🔍 Query executada com sucesso')
      
      if (data && data.length > 0) {
        console.log('📋 Primeiros usuários carregados:')
        data.slice(0, 3).forEach(user => {
          console.log(`  - ${user.name} (${user.user_type})`)
        })
      } else {
        console.log('⚠️ Nenhum usuário retornado da query')
        console.log('🔍 Verificando se há dados na tabela...')
        
        // Teste simples para verificar se há dados
        const { data: testData, error: testError } = await supabase
          .from('users')
          .select('count')
          .limit(1)
        
        if (testError) {
          console.error('❌ Erro ao verificar tabela:', testError.message)
        } else {
          console.log('✅ Tabela acessível, mas sem dados filtrados')
        }
      }
      
      setUsers(data || [])
      setTotalCount(count || 0)
      setHasMore((data?.length || 0) === limit)
      setCurrentOffset(limit)

    } catch (err) {
      console.error('❌ Erro geral ao buscar usuários:', err)
      setUsers([])
      setTotalCount(0)
      setHasMore(false)
      setCurrentOffset(0)
    } finally {
      setLoading(false)
    }
  }, [loading])

  const loadMore = useCallback(async () => {
    console.log('🔄 loadMore chamado')
    
    if (loading || !hasMore) {
      console.log('⏳ loadMore ignorado - loading:', loading, 'hasMore:', hasMore)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('📡 Carregando mais usuários...')
      
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      // Paginação para carregar mais
      query = query.range(currentOffset, currentOffset + limit - 1)

      const { data, error: fetchError } = await query

      if (fetchError) {
        console.error('❌ Erro ao carregar mais usuários:', fetchError.message)
        setHasMore(false)
        return
      }

      console.log(`✅ Mais usuários carregados: ${data?.length || 0}`)

      if (data && data.length > 0) {
        setUsers(prev => [...prev, ...data])
        setCurrentOffset(prev => prev + limit)
        setHasMore(data.length === limit)
      } else {
        setHasMore(false)
      }

    } catch (err) {
      console.error('❌ Erro geral ao carregar mais usuários:', err)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [loading, hasMore, currentOffset])

  // Inicializar apenas uma vez
  useEffect(() => {
    console.log('🔄 useUsers useEffect - isInitialized:', isInitialized)
    if (!isInitialized) {
      console.log('🚀 useUsers inicializado')
      setIsInitialized(true)
      // Carregar dados iniciais sem filtros
      fetchUsers({})
    }
  }, [isInitialized, fetchUsers])

  return {
    users,
    loading,
    error,
    hasMore,
    totalCount,
    fetchUsers,
    loadMore
  }
} 