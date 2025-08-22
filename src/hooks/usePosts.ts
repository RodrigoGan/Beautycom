import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { requestLimiter } from '@/utils/requestLimiter'

export interface Post {
  id: string
  title: string
  description: string
  post_type: 'normal' | 'before-after' | 'video' | 'carousel'
  media_urls: any
  category_id: string
  user_id: string
  created_at: string
  updated_at: string
  is_active: boolean
  // Dados relacionados
  author?: {
    nickname: string
    email: string
  }
  category?: {
    name: string
  }
}

export interface PostsFilters {
  search?: string
  category?: string
  postType?: string
  author?: string
}

export const usePosts = () => {
  console.log('🔄 usePosts hook inicializado')
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)

  // Paginação
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)

  // Filtros
  const [filters, setFilters] = useState<PostsFilters>({})

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
        console.log(`🔄 Tentativa ${attempt}/${maxRetries}...`)
        return await executeQueryWithTimeout(fn, 5000)
      } catch (error) {
        console.error(`❌ Tentativa ${attempt} falhou:`, error)
        if (attempt === maxRetries) {
          throw error
        }
        const delay = Math.pow(2, attempt) * 1000 // 2s, 4s
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  // Buscar posts com filtros e paginação
  const fetchPosts = useCallback(async (resetPage = false, customFilters?: PostsFilters) => {
    setLoading(true)
    setError(null)

    try {
      const currentPage = resetPage ? 0 : page
      const from = currentPage * pageSize
      const to = from + pageSize - 1
      const filtersToUse = customFilters || filters

      console.log('🔍 Buscando posts:', { currentPage, from, to, filters: filtersToUse, customFilters: !!customFilters })
      
      // Teste de conectividade básica com retry reduzido
      console.log('🔍 Testando conectividade básica...')
      try {
        const { data: testData, error: testError } = await retryWithBackoff(async () => {
          return await requestLimiter.execute(async () => 
            await supabase
              .from('posts')
              .select('id, title, post_type')
              .limit(1)
          )
        })

        if (testError) {
          console.error('❌ Erro na conectividade:', testError)
          
          // Detectar rate limits específicos
          if (testError.code === 'PGRST301' || 
              testError.message?.includes('rate limit') || 
              testError.message?.includes('usage limit') ||
              testError.message?.includes('timeout')) {
            console.warn('⚠️ Rate limit detectado no Supabase')
            setError('Erro de conectividade: Limite de uso excedido no Supabase')
          } else {
            setError(`Erro de conectividade: ${testError.message}`)
          }
          
          setPosts([])
          setHasMore(false)
          setIsInitialized(true)
          setLoading(false)
          return
        }
        
        console.log('✅ Conectividade com Supabase OK')
      } catch (error) {
        console.error('❌ Erro na conectividade após retry:', error)
        
        // Detectar rate limits em erros de timeout
        if (error instanceof Error && 
            (error.message.includes('timeout') || 
             error.message.includes('Timeout'))) {
          console.warn('⚠️ Rate limit detectado (timeout)')
          setError('Erro de conectividade: Timeout - possível limite de uso excedido')
        } else {
          setError(`Erro de conectividade: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
        }
        
        setPosts([])
        setHasMore(false)
        setIsInitialized(true)
        setLoading(false)
        return
      }

      // Construir query base
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_user_id_fkey(nickname, email, name, profile_photo),
          category:categories!posts_category_id_fkey(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(from, to)

      // Aplicar filtros (simplificado por enquanto)
      if (filtersToUse.search && filtersToUse.search.trim()) {
        const searchTerm = filtersToUse.search.trim()
        
        // Se começa com @, buscar por nickname do autor
        if (searchTerm.startsWith('@')) {
          const nickname = searchTerm.substring(1) // Remove o @
          console.log('🔍 Buscando por nickname:', nickname)
          
          // Se o nickname está vazio (apenas @), não aplicar filtro
          if (!nickname.trim()) {
            console.log('🔍 Nickname vazio, não aplicando filtro de usuário')
          } else {
            // Primeiro, buscar o usuário pelo nickname (busca parcial)
            const { data: userData, error: userError } = await retryWithBackoff(async () => {
              return await requestLimiter.execute(async () => 
                await supabase
                  .from('users')
                  .select('id')
                  .ilike('nickname', `%${nickname}%`)
                  .limit(10)
              )
            })
            
            if (userError) {
              console.log('❌ Erro ao buscar usuários:', userError)
            } else if (userData && userData.length > 0) {
              console.log('✅ Usuários encontrados:', userData.length)
              // Buscar posts de todos os usuários encontrados
              const userIds = userData.map(user => user.id)
              query = query.in('user_id', userIds)
            } else {
              console.log('❌ Nenhum usuário encontrado com nickname:', nickname)
              // Se não encontrar o usuário, retornar array vazio
              setPosts([])
              setHasMore(false)
              setIsInitialized(true)
              setLoading(false)
              return
            }
          }
        } else {
          // Buscar em título e descrição
          query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        }
      }

      // Aplicar filtros de categoria e tipo
      if (filtersToUse.category) {
        console.log('🔍 Aplicando filtro de categoria:', filtersToUse.category)
        
        // Log específico para debugar "Sobrancelhas / Cílios"
        if (filtersToUse.category === 'Sobrancelhas / Cílios') {
          console.log('🔍 DEBUG: Categoria "Sobrancelhas / Cílios" detectada')
        }
        
        // Buscar categoria por nome e usar o ID
        const { data: categoryData, error: categoryError } = await retryWithBackoff(async () => {
          return await requestLimiter.execute(async () => 
            await supabase
              .from('categories')
              .select('id')
              .eq('name', filtersToUse.category)
              .single()
          )
        })
        
        if (categoryError) {
          console.error('❌ Erro ao buscar categoria:', categoryError)
        }
        
        if (categoryData) {
          console.log('✅ Categoria encontrada, ID:', categoryData.id)
          console.log('🔍 Aplicando filtro category_id =', categoryData.id)
          
          // Log específico para "Sobrancelhas / Cílios"
          if (filtersToUse.category === 'Sobrancelhas / Cílios') {
            console.log('🔍 DEBUG: Aplicando filtro para Sobrancelhas/Cílios com ID:', categoryData.id)
          }
          
          query = query.eq('category_id', categoryData.id)
        } else {
          console.log('❌ Categoria não encontrada:', filtersToUse.category)
          console.log('🔍 Verificando categorias disponíveis...')
          
          // Buscar todas as categorias para debug
          const { data: allCategories } = await supabase
            .from('categories')
            .select('id, name')
            .order('name')
          
          console.log('📋 Categorias disponíveis:', allCategories?.map(c => `${c.name} (${c.id})`))
          
          // Log específico para "Sobrancelhas / Cílios"
          if (filtersToUse.category === 'Sobrancelhas / Cílios') {
            console.log('🔍 DEBUG: Categoria "Sobrancelhas / Cílios" não encontrada no banco')
            console.log('🔍 DEBUG: Verificando se existe variação do nome...')
            const sobrancelhasCategory = allCategories?.find(c => 
              c.name.includes('Sobrancelhas') || c.name.includes('Cílios')
            )
            if (sobrancelhasCategory) {
              console.log('🔍 DEBUG: Encontrada categoria similar:', sobrancelhasCategory)
            }
          }
        }
      }

      if (filtersToUse.postType && filtersToUse.postType !== 'recentes') {
        console.log('🔍 Aplicando filtro de tipo:', filtersToUse.postType)
        query = query.eq('post_type', filtersToUse.postType)
      }

      // Executar query principal com retry
      console.log('📡 Fazendo requisição para Supabase...')
      const startTime = Date.now()
      
      const { data, error: fetchError } = await retryWithBackoff(async () => {
        return await requestLimiter.execute(async () => await query)
      })
      
      if (fetchError) {
        console.error('❌ Erro na query principal:', fetchError)
        if (fetchError.code === 'PGRST301' || fetchError.message?.includes('rate limit') || fetchError.message?.includes('usage limit')) {
          console.log('⚠️ Rate limit detectado na query principal')
          setError(`Erro de conectividade: ${fetchError.message} - possível limite de uso excedido`)
        } else {
          setError(`Erro de conectividade: ${fetchError.message}`)
        }
        setLoading(false)
        return
      }
      
      console.log('⏱️ Query executada em', Date.now() - startTime, 'ms')
      console.log('📊 Posts encontrados:', data?.length || 0)
      
      // Log específico para "Sobrancelhas / Cílios"
      if (filtersToUse.category === 'Sobrancelhas / Cílios') {
        console.log('🔍 DEBUG: Posts retornados para Sobrancelhas/Cílios:', data?.length || 0)
        if (data && data.length > 0) {
          console.log('🔍 DEBUG: Primeiros posts retornados:', data.slice(0, 3).map(p => ({
            id: p.id,
            title: p.title,
            category_id: p.category_id,
            post_type: p.post_type
          })))
        }
      }
      
      if (data && data.length > 0) {
        console.log('📋 Primeiros posts:', data.slice(0, 3).map(p => p.title))
      }

      // Atualizar posts
      if (resetPage) {
        setPosts(data || [])
        setPage(0)
      } else {
        setPosts(prev => [...prev, ...(data || [])])
        setPage(currentPage + 1)
      }

      // Verificar se há mais posts
      setHasMore((data?.length || 0) === pageSize)

      setIsInitialized(true)

    } catch (err) {
      console.error('❌ Erro na query de teste após retry:', err)
      console.error('❌ Tipo do erro:', typeof err)
      console.error('❌ Stack do erro:', err instanceof Error ? err.stack : 'N/A')
      
      // Verificar se é um erro de timeout/conectividade
      if (err instanceof Error && err.message.includes('timeout')) {
        console.warn('⚠️ Timeout detectado - problema de conectividade com Supabase')
        setError('Erro de conectividade: Timeout - possível limite de uso excedido')
      } else {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      }
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, filters])

  // Carregar mais posts
  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(false)
    }
  }, [loading, hasMore, fetchPosts])

  // Atualizar filtros com debounce para reduzir requisições
  const updateFilters = useCallback((newFilters: PostsFilters) => {
    console.log('🔄 Atualizando filtros:', newFilters)
    setFilters(newFilters)
    setPage(0)
    setHasMore(true)
    
    // Debounce para evitar múltiplas requisições
    const timeoutId = setTimeout(() => {
      fetchPosts(true, newFilters)
    }, 300) // 300ms de delay
    
    return () => clearTimeout(timeoutId)
  }, [fetchPosts])

  // Limpar filtros
  const clearFilters = useCallback(() => {
    console.log('🧹 Limpando filtros no hook usePosts')
    setFilters({})
    setPage(0)
    setHasMore(true)
    // Buscar com filtros vazios imediatamente
    fetchPosts(true, {})
  }, [fetchPosts])

  // Busca inicial - CORRIGIDO para evitar loops infinitos
  useEffect(() => {
    console.log('🔄 useEffect do usePosts - isInitialized:', isInitialized, 'loading:', loading)
    if (!isInitialized && !loading) {
      console.log('🚀 Iniciando busca inicial de posts...')
      fetchPosts(true)
    }
  }, [isInitialized, loading]) // Removido fetchPosts das dependências

  return {
    posts,
    loading,
    error,
    hasMore,
    isInitialized,
    filters,
    fetchPosts,
    loadMore,
    updateFilters,
    clearFilters
  }
} 