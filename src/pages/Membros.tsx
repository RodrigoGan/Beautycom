import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackButton } from "@/components/ui/back-button"
import { Search, MapPin, UserPlus, Filter, Image, Lock, Sparkles, User, X, Star, ArrowLeftRight, Play, UserMinus } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { useState, useEffect, useCallback, useRef, useMemo } from "react"
import { Header } from "@/components/Header"
import { useUsers } from "@/hooks/useUsers"
import { useCategories } from "@/hooks/useCategories"
import { useFollows } from "@/hooks/useFollows"
import { useMainPosts } from "@/hooks/useMainPosts"
import { useSalonMainPosts } from "@/hooks/useSalonMainPosts"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PostModal } from "@/components/PostModal"
import VideoModal from "@/components/VideoModal"

// Função para converter usuários do banco para formato de membros (fora do componente para evitar loops)
const converterUsuarioParaMembro = (dbUser: any, getCategoryNames: (ids: string[]) => string[]) => {
  // Mapear UUIDs das categorias para nomes
  const nomesCategorias = getCategoryNames(dbUser.categories || [])
  
  // Debug removido para limpar console
  
  return {
    id: dbUser.id,
    nome: dbUser.name || 'Usuário',
    nickname: dbUser.nickname || 'usuario',
    tipo: dbUser.user_type === 'profissional' ? 'Profissional' : 'Usuário',
    cidade: dbUser.cidade && dbUser.uf ? `${dbUser.cidade}, ${dbUser.uf}` : 'Localização não informada',
    bairro: dbUser.bairro || '',
    habilidades: nomesCategorias, // Agora são nomes, não UUIDs
    avatar: dbUser.profile_photo || "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400&h=400&fit=crop&crop=face",
    isFromDb: true,
    dbUser: dbUser,
    isSalon: false
  }
}

// Função para converter salões para formato de membros
const converterSalonParaMembro = (salon: any) => {
  // Debug removido para limpar console
  
  return {
    id: salon.id,
    nome: salon.name || 'Salão',
    nickname: salon.name?.toLowerCase().replace(/\s+/g, '') || 'salao',
    tipo: 'Salão/Estúdio',
    cidade: salon.cidade && salon.uf ? `${salon.cidade}, ${salon.uf}` : 'Localização não informada',
    bairro: salon.bairro || '',
    habilidades: ['Salão/Estúdio'], // Salões têm habilidades específicas
    avatar: salon.profile_photo || "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop&crop=face",
    coverPhoto: salon.cover_photo, // Adicionar foto de capa
    isFromDb: true,
    dbUser: salon,
    isSalon: true,
    owner: salon.owner
  }
}

const Membros = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedMembro, setSelectedMembro] = useState<any>(null)
  
  // Estados para modais de posts
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [showPostModal, setShowPostModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [tipoMembro, setTipoMembro] = useState<string>("profissionais")
  const [membrosExibidos, setMembrosExibidos] = useState<any[]>([])
  const [carregando, setCarregando] = useState(false)
  const [chegouAoFinal, setChegouAoFinal] = useState(false)
  const membrosPorPagina = 6
  
  // Estados para filtros e busca
  const [busca, setBusca] = useState("")
  const [buscaDebounced, setBuscaDebounced] = useState("")
  const [habilidadeFiltro, setHabilidadeFiltro] = useState("todas")
  const [localizacaoFiltro, setLocalizacaoFiltro] = useState("")
  
  // Estados para auto preenchimento
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [isExactSearch, setIsExactSearch] = useState(false)
  
  // Estados para controle de follow
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({})

  // Hook para buscar categorias
  const { categories, getCategoryNames } = useCategories()
  
  // Memoizar os filtros para evitar recriações desnecessárias
  const userFilters = useMemo(() => ({
    search: buscaDebounced,
    exactSearch: isExactSearch,
    userType: tipoMembro === "profissionais" ? "profissional" as const : 
              tipoMembro === "usuarios" ? "usuario" as const : 
              tipoMembro === "todos" ? "all" as const : "profissional" as const,
    location: localizacaoFiltro,
    category: (habilidadeFiltro !== "todas" && categories.length > 0) ? 
              categories.find(c => {
                const mapping: { [key: string]: string } = {
                  'cabelos-femininos': 'Cabelos Femininos',
                  'cabelos-masculinos': 'Cabelos Masculinos',
                  'unhas': 'Cuidados com as Unhas',
                  'barba': 'Cuidados com a Barba',
                  'estetica-corporal': 'Estética Corporal',
                  'estetica-facial': 'Estética Facial',
                  'tatuagem': 'Tatuagem',
                  'piercing': 'Piercing',
                  'maquiagem': 'Maquiagem',
                  'sobrancelhas': 'Sobrancelhas / Cílios'
                }
                return c.name === mapping[habilidadeFiltro]
              })?.id : undefined
  }), [buscaDebounced, isExactSearch, tipoMembro, localizacaoFiltro, habilidadeFiltro, categories])
  
  // Hook para buscar usuários e salões do banco de dados
  const { 
    users: dbUsers, 
    salons: dbSalons,
    loading: dbLoading, 
    error: dbError, 
    hasMore: dbHasMore, 
    totalCount: dbTotalCount,
    loadMore: loadMoreDbUsers,
    refetch: refetchUsers
  } = useUsers(userFilters)
  
  // Hook para gerenciar follows
  const { followUser, unfollowUser, checkIfFollowing } = useFollows(user?.id || '')
  const { toast } = useToast()

  // Scroll para o topo quando a página carrega
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])
  
  // Dados mock removidos - agora trabalhamos apenas com dados do banco



  // Função para filtrar membros (apenas dados do banco) - REMOVIDA pois agora usamos filtros no banco
  // const filtrarMembros = useCallback(() => {
  //   // Esta função foi removida pois agora aplicamos filtros diretamente no banco de dados
  // }, [dbUsers, busca, tipoMembro, habilidadeFiltro, localizacaoFiltro, converterUsuarioParaMembro])

  // Função para buscar sugestões no banco de dados
  const fetchSearchSuggestions = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setSearchSuggestions([])
      return
    }
    
    setSuggestionsLoading(true)
    
    try {
      // Buscar sugestões de usuários
      const { data: usersData } = await supabase
        .from('users')
        .select('name, nickname')
        .or(`name.ilike.%${searchTerm}%,nickname.ilike.%${searchTerm}%`)
        .limit(5)
      
      // Buscar sugestões de salões
      const { data: salonsData } = await supabase
        .from('salons_studios')
        .select('name')
        .ilike('name', `%${searchTerm}%`)
        .limit(5)
      
      // Combinar sugestões
      const suggestions = []
      
      // Adicionar nomes de usuários
      usersData?.forEach(user => {
        if (user.name) suggestions.push(user.name)
        if (user.nickname) suggestions.push(`@${user.nickname}`)
      })
      
      // Adicionar nomes de salões
      salonsData?.forEach(salon => {
        if (salon.name) suggestions.push(salon.name)
      })
      
      // Remover duplicatas e limitar
      setSearchSuggestions([...new Set(suggestions)].slice(0, 8))
      
    } catch (error) {
      console.error('Erro ao buscar sugestões:', error)
      setSearchSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }

  // Função para fazer busca exata quando uma sugestão é selecionada
  const handleSuggestionClick = (suggestion: string) => {
    setBusca(suggestion)
    setShowSuggestions(false)
    setIsExactSearch(true) // Marcar como busca exata
  }

  // Função para resetar busca exata quando o usuário digita
  const handleSearchChange = (value: string) => {
    setBusca(value)
    setShowSuggestions(value.length > 0)
    setIsExactSearch(false) // Resetar busca exata quando usuário digita
  }

  // Debounce para busca principal
  useEffect(() => {
    const timer = setTimeout(() => {
      setBuscaDebounced(busca)
    }, 500)

    return () => clearTimeout(timer)
  }, [busca])

  // Debounce para sugestões (mais rápido)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSearchSuggestions(busca)
    }, 300)

    return () => clearTimeout(timer)
  }, [busca])

  // Função para carregar mais membros
  const carregarMaisMembros = useCallback(async () => {
    // Só carregar mais se o usuário estiver logado
    if (!user || carregando || dbLoading) return
    
    // Se há dados do banco e ainda há mais para carregar
    if (dbHasMore) {
      setCarregando(true)
      await loadMoreDbUsers()
      setCarregando(false)
    } else {
      // Se não há mais dados para carregar, marcar como fim
      setChegouAoFinal(true)
    }
  }, [user, carregando, dbHasMore, loadMoreDbUsers, dbLoading])

  // Proteção de loop removida - estava causando problemas

  // Converter usuários do banco para formato de membros (otimizado)
  const membrosUsuarios = useMemo(() => {
    const converted = dbUsers.map(user => converterUsuarioParaMembro(user, getCategoryNames))
    
    // Usuário logado será tratado como membro comum - sem tratamento especial
    
    return converted
  }, [dbUsers, getCategoryNames])
  
  // Converter salões para formato de membros (otimizado)
  const membrosSalons = useMemo(() => {
    return tipoMembro === "profissionais" ? 
      dbSalons.map(salon => converterSalonParaMembro(salon)) : []
  }, [dbSalons, tipoMembro])
  
  // Combinar usuários e salões (removida lógica de proprietários duplicados)
  const membrosConvertidos = useMemo(() => {
    return [...membrosUsuarios, ...membrosSalons]
  }, [membrosUsuarios, membrosSalons])
  
  // Sistema de embaralhamento removido - agora é feito no banco de dados
  

  // Carregar membros iniciais e aplicar filtros
  useEffect(() => {
    console.log('🔄 useEffect - Carregando membros iniciais...')
    console.log('  - dbLoading:', dbLoading)
    console.log('  - dbError:', dbError)
    console.log('  - membrosConvertidos.length:', membrosConvertidos.length)
    console.log('  - user:', !!user)
    
    if (dbError) {
      console.error('❌ Erro no banco de dados:', dbError)
      
      // Se for erro de rate limit, mostrar mensagem específica
      if (dbError.includes('Rate limit') || dbError.includes('limite excedido')) {
        // Rate limit detectado
      }
    }
    
    if (dbLoading) {
      console.log('⏳ Carregando dados do banco...')
    }
    
    // Fallback temporário para desktop quando não há dados
    if (membrosConvertidos.length === 0 && !dbLoading) {
      console.log('⚠️ Nenhum dado do banco - usando fallback temporário')
      // Nenhum dado do banco - usando fallback temporário
      
        const fallbackMembros = [
          {
            id: '00000000-0000-0000-0000-000000000001',
            nome: 'Studio Beauty',
            nickname: 'studiobeauty',
            tipo: 'Profissional',
            cidade: 'São Paulo, SP',
            bairro: 'Vila Madalena',
            habilidades: ['Cabelos Femininos', 'Maquiagem'],
            avatar: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop&crop=face',
            isFromDb: false
          },
          {
            id: '00000000-0000-0000-0000-000000000002',
            nome: 'Profissional Hair',
            nickname: 'profhair',
            tipo: 'Profissional',
            cidade: 'Rio de Janeiro, RJ',
            bairro: 'Copacabana',
            habilidades: ['Cabelos Masculinos', 'Barba'],
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
            isFromDb: false
          },
          {
            id: '00000000-0000-0000-0000-000000000003',
            nome: 'Bella Salon',
            nickname: 'bellasalon',
            tipo: 'Profissional',
            cidade: 'Belo Horizonte, MG',
            bairro: 'Savassi',
            habilidades: ['Estética Facial', 'Sobrancelhas'],
            avatar: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=400&fit=crop&crop=face',
            isFromDb: false
          }
        ]
      
        setMembrosExibidos(fallbackMembros)
      return
    }
    
    if (user) {
      // Usuário logado: carrega todos os membros do banco
      // Usuário logado - carregando todos os membros
      setMembrosExibidos(membrosConvertidos)
      } else {
      // Usuário não logado: apenas 3 membros do banco
      // Usuário não logado - carregando apenas 3 membros
      setMembrosExibidos(membrosConvertidos.slice(0, 3))
    }
    
    // Resetar estado de fim da lista quando filtros mudam
    setChegouAoFinal(false)
  }, [user, membrosConvertidos, dbLoading, dbError, dbHasMore, busca, habilidadeFiltro, localizacaoFiltro, tipoMembro])

  // Verificar se chegou ao final quando não há mais dados para carregar
  useEffect(() => {
    const totalItems = membrosConvertidos.length
    if (user && !carregando && !dbLoading && !dbHasMore && totalItems > 0) {
      setChegouAoFinal(true)
    }
  }, [user, carregando, dbLoading, dbHasMore, membrosConvertidos.length])

  // Resetar estado de fim quando há novos dados para carregar
  useEffect(() => {
    console.log('🔄 useEffect - Resetando estado de fim...')
    console.log('  - user:', !!user)
    console.log('  - dbHasMore:', dbHasMore)
    
    if (user && dbHasMore) {
      console.log('✅ Resetando chegouAoFinal para false')
      setChegouAoFinal(false)
    }
  }, [user, dbHasMore])

  // Função de scroll otimizada com useCallback e debounce
  const handleScroll = useCallback(() => {
    if (!user) return

    // Debounce para evitar muitas chamadas
    if (carregando || dbLoading || chegouAoFinal) return

    const scrollTop = window.scrollY
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight
    
    // Carregar mais quando estiver a 200px do final
    if (scrollTop + windowHeight >= documentHeight - 200) {
      console.log('📜 Scroll detectado - carregando mais membros...')
      console.log('  - scrollTop:', scrollTop)
      console.log('  - windowHeight:', windowHeight)
      console.log('  - documentHeight:', documentHeight)
      console.log('  - chegouAoFinal:', chegouAoFinal)
      carregarMaisMembros()
    }
  }, [user, carregando, carregarMaisMembros, chegouAoFinal, dbLoading])

  // Detectar quando o usuário chega próximo ao final da página
  useEffect(() => {
    // Só adicionar o listener se o usuário estiver logado
    if (!user) return

    console.log('📜 Adicionando listener de scroll...')
    window.addEventListener('scroll', handleScroll)
    return () => {
      console.log('📜 Removendo listener de scroll...')
      window.removeEventListener('scroll', handleScroll)
    }
  }, [user, handleScroll])

  // Função para lidar com clique em membro
  const handleMembroClick = (membro: any) => {
    if (!user) {
      setSelectedMembro(membro)
      setShowLoginModal(true)
      return
    }
    
    // Navegar para o perfil do membro ou salão
    if (membro.id) {
      if (membro.isSalon) {
        // Navegar para o perfil do salão
        navigate(`/salon/${membro.id}`)
      } else {
        // Navegar para o perfil do usuário
        navigate(`/perfil/${membro.id}`)
      }
    } else {
      // ID do membro não encontrado para navegação
    }
  }

  // Função para lidar com mudança de tipo de membro
  const handleTipoMembroChange = (value: string) => {
    console.log('🔄 Mudando tipo de membro para:', value)
    setTipoMembro(value)
  }

  // Função para abrir modal de post
  const handlePostClick = (post: any) => {
    setSelectedPost(post)
    setShowPostModal(true)
  }

  // Função para abrir modal de vídeo
  const handleVideoClick = (videoUrl: string) => {
    setShowVideoModal(true)
  }

  // Função para fechar modais
  const handleClosePostModal = () => {
    setShowPostModal(false)
    setSelectedPost(null)
  }

  const handleCloseVideoModal = () => {
    setShowVideoModal(false)
  }

  // Configurar função global para abrir modal de post
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).openPostModal = handlePostClick
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).openPostModal
      }
    }
  }, [])

  // Função para limpar filtros
  const limparFiltros = () => {
    console.log('🧹 Limpando filtros...')
    // Limpando filtros
    setTipoMembro("profissionais")
    setBusca("")
    setHabilidadeFiltro("todas")
    setLocalizacaoFiltro("")
    setChegouAoFinal(false)
    
    toast({
      title: "Filtros limpos",
      description: "Mostrando todos os membros disponíveis",
    })
  }

  // Cache para estados de follow para evitar queries desnecessárias
  const followCache = useRef<Record<string, boolean>>({})
  const lastCheckedMembers = useRef<string[]>([])

  // Verificar estado de follow para cada membro (DESABILITADO TEMPORARIAMENTE)
  // useEffect(() => {
  //   const checkFollowStates = async () => {
  //     if (!user || !membrosExibidos.length) return

  //     // Verificar se os membros mudaram significativamente
  //     const currentMemberIds = membrosExibidos.map(m => m.id).sort()
  //     const lastMemberIds = lastCheckedMembers.current.sort()
      
  //     // Se os membros são os mesmos, não fazer nada
  //     if (JSON.stringify(currentMemberIds) === JSON.stringify(lastMemberIds)) {
  //       return
  //     }

  //     lastCheckedMembers.current = currentMemberIds

  //     const states: Record<string, boolean> = { ...followCache.current }
  //     const loadingStates: Record<string, boolean> = {}

  //     // Verificar apenas membros que não estão no cache
  //     const membersToCheck = membrosExibidos.filter(membro => 
  //       !(membro.id in followCache.current)
  //     )

  //     if (membersToCheck.length === 0) {
  //       // Todos os membros já estão no cache
  //       setFollowingStates(states)
  //       return
  //     }

  //     // Verificar follows em batch (máximo 5 por vez para evitar sobrecarga)
  //     const batchSize = 5
  //     for (let i = 0; i < membersToCheck.length; i += batchSize) {
  //       const batch = membersToCheck.slice(i, i + batchSize)
        
  //       // Marcar como carregando
  //       batch.forEach(membro => {
  //         loadingStates[membro.id] = true
  //       })

  //       // Verificar follows em paralelo para este batch
  //       const batchPromises = batch.map(async (membro) => {
  //         try {
  //           const isFollowing = await checkIfFollowing(membro.id)
  //           followCache.current[membro.id] = isFollowing
  //           states[membro.id] = isFollowing
  //           return { id: membro.id, success: true }
  //         } catch (error) {
  //           console.error(`Erro ao verificar follow para ${membro.id}:`, error)
  //           followCache.current[membro.id] = false
  //           states[membro.id] = false
  //           return { id: membro.id, success: false }
  //         } finally {
  //           loadingStates[membro.id] = false
  //         }
  //       })

  //       await Promise.all(batchPromises)
        
  //       // Pequena pausa entre batches para evitar sobrecarga
  //       if (i + batchSize < membersToCheck.length) {
  //         await new Promise(resolve => setTimeout(resolve, 100))
  //       }
  //     }

  //     setFollowingStates(states)
  //     setFollowLoading(loadingStates)
  //   }

  //   checkFollowStates()
  // }, [user, membrosExibidos, checkIfFollowing])

  // Função para lidar com follow/unfollow
  const handleFollowToggle = async (membroId: string, membroNome: string) => {
    if (!user) return

    console.log('👥 Toggle follow para:', membroId, membroNome)
    setFollowLoading(prev => ({ ...prev, [membroId]: true }))

    try {
      const isCurrentlyFollowing = followingStates[membroId]
      
      if (isCurrentlyFollowing) {
        // Deixar de seguir
        console.log('👥 Deixando de seguir:', membroId)
        const result = await unfollowUser(membroId)
        if (result.success) {
          setFollowingStates(prev => ({ ...prev, [membroId]: false }))
          followCache.current[membroId] = false // Atualizar cache
          toast({
            title: "Deixou de seguir",
            description: `Você não está mais seguindo ${membroNome}`,
          })
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível deixar de seguir este usuário.",
            variant: "destructive"
          })
        }
      } else {
        // Seguir
        console.log('👥 Seguindo:', membroId)
        const result = await followUser(membroId)
        if (result.success) {
          setFollowingStates(prev => ({ ...prev, [membroId]: true }))
          followCache.current[membroId] = true // Atualizar cache
          toast({
            title: "Seguindo!",
            description: `Agora você está seguindo ${membroNome}`,
          })
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível seguir este usuário.",
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error('Erro ao alternar follow:', error)
      toast({
        title: "Erro",
        description: "Não foi possível processar esta ação.",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(prev => ({ ...prev, [membroId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header com navegação */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <BackButton 
              variant="outline" 
              size="sm"
              className="hover:bg-gradient-card hover:border-primary/40"
            />
            <Link to="/beautywall">
              <Button variant="hero" className="group">
                <Image className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Ver BeautyWall
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Membros
            </h1>
            <p className="text-muted-foreground">
              Encontre profissionais talentosos e conecte-se com a comunidade da beleza
            </p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-6 bg-gradient-card border-primary/10 shadow-beauty-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Busca com Auto Preenchimento */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome ou @nickname..." 
                  className="pl-10 border-primary/20 focus:border-primary"
                  value={busca}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(busca.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                />
                
                {/* Loading indicator */}
                {suggestionsLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  </div>
                )}
                
                {/* Dropdown de Sugestões */}
                {showSuggestions && (searchSuggestions.length > 0 || suggestionsLoading) && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-md shadow-lg z-50 mt-1">
                    {suggestionsLoading ? (
                      <div className="px-3 py-2 text-sm text-muted-foreground flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                        Buscando sugestões...
                      </div>
                    ) : (
                      searchSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm flex items-center gap-2"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <Search className="h-3 w-3 text-muted-foreground" />
                          {suggestion}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              
              {/* Filtros em linha */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Select value={habilidadeFiltro} onValueChange={setHabilidadeFiltro}>
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Filtrar por habilidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todas">✨ Todas as habilidades</SelectItem>
                      <SelectItem value="cabelos-femininos">👩‍🦰 Cabelos Femininos</SelectItem>
                      <SelectItem value="cabelos-masculinos">👨‍🦱 Cabelos Masculinos</SelectItem>
                      <SelectItem value="unhas">💅 Cuidados com as Unhas</SelectItem>
                      <SelectItem value="barba">🧔 Cuidados com a Barba</SelectItem>
                      <SelectItem value="estetica-corporal">💪 Estética Corporal</SelectItem>
                      <SelectItem value="estetica-facial">✨ Estética Facial</SelectItem>
                      <SelectItem value="tatuagem">🎨 Tatuagem</SelectItem>
                      <SelectItem value="piercing">💎 Piercing</SelectItem>
                      <SelectItem value="maquiagem">💄 Maquiagem</SelectItem>
                      <SelectItem value="sobrancelhas">👁️ Sobrancelhas / Cílios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select value={tipoMembro} onValueChange={handleTipoMembroChange}>
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Tipo de membro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">👥 Todos os membros</SelectItem>
                      <SelectItem value="usuarios">👤 Usuários</SelectItem>
                      <SelectItem value="profissionais">💇‍♀️ Profissionais / Salão/Estúdio</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Cidade, Estado ou Bairro" 
                    className="pl-10 border-primary/20 focus:border-primary"
                    value={localizacaoFiltro}
                    onChange={(e) => setLocalizacaoFiltro(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Botão Limpar Filtros */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                {(busca || habilidadeFiltro !== "todas" || localizacaoFiltro || tipoMembro !== "profissionais") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={limparFiltros}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕ Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>









        {/* Lista de Membros */}
        {membrosExibidos.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-3 bg-gradient-primary bg-clip-text text-transparent">
                Nenhum membro encontrado
              </h3>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {busca 
                    ? "🔍 Não encontramos membros com esses termos de busca"
                    : habilidadeFiltro !== "todas"
                      ? "💇‍♀️ Nenhum profissional encontrado com essa habilidade"
                      : localizacaoFiltro
                        ? "📍 Nenhum membro encontrado nessa localização"
                        : "👥 Nenhum membro encontrado com os filtros aplicados"
                  }
                </p>
                {(busca || habilidadeFiltro !== "todas" || localizacaoFiltro || tipoMembro !== "profissionais") && (
                  <div className="flex justify-center">
                    <Button variant="outline" onClick={limparFiltros} className="group">
                      <Search className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                      Limpar filtros e ver todos os membros
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {membrosExibidos.map((membro) => (
            <Card 
              key={membro.id} 
              className="hover:shadow-beauty transition-all duration-300 relative overflow-hidden"
            >
              {/* Foto de capa para salões */}
              {membro.isSalon && membro.coverPhoto && (
                <div className="w-full h-40 bg-gradient-to-r from-primary/20 to-secondary/20 relative overflow-hidden">
                  <img
                    src={membro.coverPhoto}
                    alt={`Capa de ${membro.nome}`}
                    className="w-full h-40 object-cover object-top"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/10"></div>
                </div>
              )}
              
              {/* Botão Seguir no canto superior direito */}
              {user && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`absolute top-2 right-2 h-8 w-8 rounded-full backdrop-blur-sm border transition-all z-10 ${
                    followingStates[membro.id] 
                      ? 'bg-green-500/80 border-green-400/50 hover:bg-green-600/80 text-white' 
                      : 'bg-background/80 border-border/50 hover:bg-primary/10 hover:border-primary/30'
                  }`}
                  onClick={async (e) => {
                    e.stopPropagation()
                    await handleFollowToggle(membro.id, membro.nome)
                  }}
                  disabled={followLoading[membro.id]}
                >
                  {followLoading[membro.id] ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : followingStates[membro.id] ? (
                    <UserMinus className="h-4 w-4" />
                  ) : (
                  <UserPlus className="h-4 w-4" />
                  )}
                </Button>
              )}

              <CardContent className={`p-6 ${membro.isSalon && membro.coverPhoto ? 'pt-20' : ''}`}>
                <div className="text-center">
                  {/* Área clicável para ir ao perfil */}
                  <div 
                    className="cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => handleMembroClick(membro)}
                  >
                    <Avatar className={`w-20 h-20 mx-auto mb-4 ${membro.isSalon && membro.coverPhoto ? 'relative -mt-20 ring-4 ring-background shadow-lg' : ''}`}>
                    <AvatarImage src={membro.avatar} alt={membro.nome} />
                    <AvatarFallback className="bg-gradient-primary text-white font-semibold text-xl">
                      {membro.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="font-semibold text-lg mb-1">{membro.nome}</h3>
                  <p className="text-sm text-muted-foreground mb-1">@{membro.nickname}</p>
                  <Badge variant="secondary" className="mb-2">{membro.tipo}</Badge>
                  
                  {/* Informações específicas para salões */}
                  {membro.isSalon && membro.owner && (
                    <div className="text-xs text-muted-foreground mb-2">
                      Proprietário: {membro.owner.name}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-4">
                    <MapPin className="h-4 w-4" />
                    <span>{membro.cidade}</span>
                  </div>

                  {membro.tipo !== "Usuário" && (
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {membro.habilidades.map((habilidade) => (
                        <Badge key={habilidade} variant="outline" className="text-xs">
                          {habilidade}
                        </Badge>
                      ))}
                    </div>
                  )}
                  </div>

                  {/* Posts principais - área separada */}
                  {(membro.tipo === "Profissional" || membro.isSalon) && (
                    <div onClick={(e) => e.stopPropagation()}>
                      {membro.isSalon ? (
                        <SalonMainPostsPreview salonId={membro.id} />
                      ) : (
                        <MainPostsPreview userId={membro.id} />
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        )}

        {/* Seção de incentivo ao cadastro para usuários não logados */}
        {!user && (
          <Card className="mt-8 bg-gradient-card border-primary/20 shadow-beauty-card">
            <CardContent className="p-8 text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Lock className="h-8 w-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
                Desbloqueie Mais Membros!
              </h3>
              
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Você está vendo apenas uma prévia dos nossos membros. Cadastre-se gratuitamente para explorar toda a comunidade da beleza, conectar-se com profissionais e descobrir talentos incríveis!
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/cadastro">
                  <Button variant="hero" size="lg" className="group">
                    <Sparkles className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                    Cadastrar Gratuitamente
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="outline" size="lg">
                    Já tenho conta
                  </Button>
                </Link>
        </div>

              <div className="mt-6 text-sm text-muted-foreground">
                ✨ Mais de 1000+ profissionais • 🔒 100% gratuito • 🚀 Cadastro em 2 minutos
              </div>
            </CardContent>
          </Card>
        )}

        {/* Indicador de carregamento */}
        {user && carregando && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2 text-muted-foreground">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span>Carregando mais membros...</span>
            </div>
          </div>
        )}

        {/* Indicador de fim da lista */}
        {(() => {
          const totalItems = dbUsers.length + (tipoMembro === "profissionais" ? dbSalons.length : 0)
          const shouldShow = user && !carregando && !dbLoading && totalItems > 0 && (!dbHasMore || chegouAoFinal)
          if (shouldShow) {
            // Mostrando mensagem de fim da lista
          }
          return shouldShow
        })() && (
        <div className="flex justify-center mt-8">
            <div className="text-center text-muted-foreground">
              <div className="w-12 h-12 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-medium">✨ Você viu todos os membros encontrados!</p>
              <p className="text-xs mt-2 text-muted-foreground">
                {busca || habilidadeFiltro !== "todas" || localizacaoFiltro
                  ? "💡 Dica: Tente ajustar os filtros para descobrir mais profissionais"
                  : tipoMembro === "todos"
                    ? "🎉 Novos membros são adicionados regularmente à comunidade"
                    : tipoMembro === "profissionais"
                      ? "✨ Você viu todos os profissionais disponíveis!"
                      : "✨ Você viu todos os usuários disponíveis!"
                }
              </p>
            </div>
        </div>
        )}


        </div>
      </div>

      {/* Modal para usuários não logados */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
                <User className="h-8 w-8 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Ver Perfil Completo
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Para ver o perfil completo de <strong>{selectedMembro?.nome}</strong> e conectar-se com este profissional, você precisa estar logado.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-card rounded-lg border border-primary/10">
              <h4 className="font-semibold mb-2">O que você vai descobrir:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>✨ Portfólio completo</div>
                <div>📞 Contato direto</div>
                <div>⭐ Avaliações</div>
                <div>📅 Agendamentos</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/cadastro" className="flex-1">
                <Button variant="hero" className="w-full group">
                  <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  Cadastrar Gratuitamente
                </Button>
              </Link>
              <Link to="/login" className="flex-1">
                <Button variant="outline" className="w-full">
                  Já tenho conta
                </Button>
              </Link>
            </div>
            
            <div className="text-center">
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Continuar explorando
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modais de Posts */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={showPostModal}
          onClose={handleClosePostModal}
        />
      )}

      <VideoModal
        videoUrl={selectedPost?.imagem || ''}
        isOpen={showVideoModal}
        onClose={handleCloseVideoModal}
      />
    </div>
  );
};

// Componente para exibir posts principais de um usuário
const MainPostsPreview = ({ userId }: { userId: string }) => {
  const { mainPosts, loading } = useMainPosts(userId)
  const { user } = useAuthContext()
  
  // Verificar se o usuário atual está vendo seu próprio perfil
  const isOwnProfile = user?.id === userId

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (mainPosts.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gradient-card rounded-lg border-2 border-dashed border-yellow-400/30 flex items-center justify-center group hover:border-yellow-400/50 transition-all duration-300">
            <div className="text-center p-2">
              <Star className="h-4 w-4 text-yellow-400/60 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground leading-tight">
                {isOwnProfile ? (
                  // Mensagens para o dono do perfil
                  <>
                    {i === 0 && "Escolha um post principal"}
                    {i === 1 && "Destaque seu trabalho"}
                    {i === 2 && "Selecione um post"}
                  </>
                ) : (
                  // Mensagens para visitantes
                  <>
                    {i === 0 && "Este membro ainda"}
                    {i === 1 && "não escolheu seus"}
                    {i === 2 && "posts principais"}
                  </>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((position) => {
        const post = mainPosts.find(p => p.priority_order === position)

        if (!post) {
          // Calcular quantos posts já foram escolhidos
          const postsEscolhidos = mainPosts.length
          
          // Espaço vazio com mensagem inteligente
          return (
            <div key={`empty-${position}`} className="aspect-square bg-gradient-card rounded-lg border-2 border-dashed border-yellow-400/30 flex items-center justify-center group hover:border-yellow-400/50 transition-all duration-300">
              <div className="text-center p-2">
                <Star className="h-4 w-4 text-yellow-400/60 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground leading-tight">
                  {isOwnProfile ? (
                    // Mensagens para o dono do perfil baseadas na quantidade
                    <>
                      {postsEscolhidos === 0 && position === 1 && "Escolha um post principal"}
                      {postsEscolhidos === 0 && position === 2 && "Destaque seu trabalho"}
                      {postsEscolhidos === 0 && position === 3 && "Selecione um post"}
                      
                      {postsEscolhidos === 1 && position === 2 && "Escolha mais um post"}
                      {postsEscolhidos === 1 && position === 3 && "para destacar"}
                      
                      {postsEscolhidos === 2 && position === 3 && "Escolha o último post"}
                    </>
                  ) : (
                    // Mensagens para visitantes baseadas na quantidade
                    <>
                      {postsEscolhidos === 1 && position === 2 && "Ainda não escolheu"}
                      {postsEscolhidos === 1 && position === 3 && "mais posts principais"}
                      
                      {postsEscolhidos === 2 && position === 3 && "Ainda não escolheu o último"}
                    </>
                  )}
                </p>
              </div>
            </div>
          )
        }

        // Post existente
        return (
          <div
            key={post.id}
            className="aspect-square bg-gradient-card rounded-lg overflow-hidden relative cursor-pointer group hover:scale-105 transition-transform duration-300"
            onClick={() => {
              // Aqui vamos usar uma função global para abrir o modal
              if (typeof window !== 'undefined' && (window as any).openPostModal) {
                (window as any).openPostModal(post)
              }
            }}
          >
            {/* Conteúdo do post baseado no tipo */}
            {(() => {
              if (!post.imagem) {
                return (
                  <div className="w-full h-full bg-gradient-card flex items-center justify-center">
                    <Image className="h-6 w-6 text-muted-foreground" />
                  </div>
                )
              }

              if (post.isBeforeAfter) {
                return (
                  <div className="w-full h-full grid grid-cols-2 gap-1">
                    <div className="relative">
                      <img
                        src={post.beforeUrl}
                        alt="Antes"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                    <div className="relative">
                      <img
                        src={post.afterUrl}
                        alt="Depois"
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )
              }

              if (post.isVideo) {
                return (
                  <video
              src={post.imagem} 
              className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                    onLoadedData={(e) => {
                      e.currentTarget.pause()
                      e.currentTarget.currentTime = 0
                    }}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'
                      e.currentTarget.nextElementSibling?.classList.remove('hidden')
                    }}
                  />
                )
              }

              if (post.isCarousel) {
                return (
                  <div className="relative w-full h-full">
                    <img
                      src={post.imagem}
                      alt={post.titulo || 'Post'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                    {post.carouselImages && post.carouselImages.length > 1 && (
                      <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded text-center font-semibold shadow-sm">
                        {post.carouselImages.length}
            </div>
          )}
                  </div>
                )
              }

              return (
                <img
                  src={post.imagem}
                  alt={post.titulo || 'Post'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              )
            })()}

            {/* Indicadores de tipo de post */}
            <div className="absolute top-1 right-1 flex gap-1">
              {post.isVideo && (
                <div className="w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                  <Play className="h-2.5 w-2.5 text-white fill-current" />
            </div>
              )}

              {post.isBeforeAfter && (
                <div className="w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                  <ArrowLeftRight className="h-2.5 w-2.5 text-white" />
          </div>
              )}

              {post.isCarousel && post.carouselImages && post.carouselImages.length > 1 && (
                <div className="w-5 h-5 bg-black/50 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">{post.carouselImages.length}</span>
        </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Componente para exibir posts principais de um salão
const SalonMainPostsPreview = ({ salonId }: { salonId: string }) => {
  const { mainPosts, loading } = useSalonMainPosts(salonId)
  const { user } = useAuthContext()
  
  // Verificar se o usuário atual é o proprietário do salão
  const isOwnSalon = false // TODO: Implementar verificação correta do proprietário do salão

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse"></div>
        ))}
      </div>
    )
  }

  if (mainPosts.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square bg-gradient-card rounded-lg border-2 border-dashed border-yellow-400/30 flex items-center justify-center group hover:border-yellow-400/50 transition-all duration-300">
            <div className="text-center p-2">
              <Star className="h-4 w-4 text-yellow-400/60 mx-auto mb-1" />
              <p className="text-xs text-muted-foreground leading-tight">
                {isOwnSalon ? (
                  // Mensagens para o proprietário do salão
                  <>
                    {i === 0 && "Escolha um post principal"}
                    {i === 1 && "Destaque o trabalho"}
                    {i === 2 && "Selecione um post"}
                  </>
                ) : (
                  // Mensagens para visitantes
                  <>
                    {i === 0 && "Este salão ainda"}
                    {i === 1 && "não escolheu seus"}
                    {i === 2 && "posts principais"}
                  </>
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map((position) => {
        const post = mainPosts.find(p => p.salon_main_post_priority === position)

        if (!post) {
          // Calcular quantos posts já foram escolhidos
          const postsEscolhidos = mainPosts.length
          
          // Espaço vazio com mensagem inteligente
          return (
            <div key={`empty-${position}`} className="aspect-square bg-gradient-card rounded-lg border-2 border-dashed border-yellow-400/30 flex items-center justify-center group hover:border-yellow-400/50 transition-all duration-300">
              <div className="text-center p-2">
                <Star className="h-4 w-4 text-yellow-400/60 mx-auto mb-1" />
                <p className="text-xs text-muted-foreground leading-tight">
                  {isOwnSalon ? (
                    // Mensagens para o proprietário do salão baseadas na quantidade
                    <>
                      {postsEscolhidos === 0 && position === 1 && "Escolha um post principal"}
                      {postsEscolhidos === 0 && position === 2 && "Destaque o trabalho"}
                      {postsEscolhidos === 0 && position === 3 && "Selecione um post"}
                      
                      {postsEscolhidos === 1 && position === 2 && "Escolha mais um post"}
                      {postsEscolhidos === 1 && position === 3 && "para destacar"}
                      
                      {postsEscolhidos === 2 && position === 3 && "Escolha o último post"}
                    </>
                  ) : (
                    // Mensagens para visitantes baseadas na quantidade
                    <>
                      {postsEscolhidos === 1 && position === 2 && "Ainda não escolheu"}
                      {postsEscolhidos === 1 && position === 3 && "mais posts principais"}
                      
                      {postsEscolhidos === 2 && position === 3 && "Ainda não escolheu o último"}
                    </>
                  )}
                </p>
              </div>
            </div>
          )
        }

        // Post existente
        return (
          <div
            key={post.id}
            className="aspect-square bg-gradient-card rounded-lg overflow-hidden relative cursor-pointer group hover:scale-105 transition-transform duration-300"
            onClick={() => {
              // Transformar o post de salão para o formato esperado pelo modal
              const transformedPost = {
                id: post.id,
                titulo: post.title,
                descricao: post.description,
                imagem: (() => {
                  // Converter media_urls para formato esperado
                  if (typeof post.media_urls === 'object' && post.media_urls?.media?.[0]?.url) {
                    return post.media_urls.media[0].url
                  }
                  if (typeof post.media_urls === 'string') {
                    try {
                      const parsed = JSON.parse(post.media_urls)
                      return parsed.media?.[0]?.url || ''
                    } catch {
                      return ''
                    }
                  }
                  return ''
                })(),
                autor: post.author?.name || 'Autor',
                autorNickname: post.author?.nickname || 'autor',
                autorFoto: post.author?.profile_photo || '',
                data: post.created_at,
                priority_order: post.salon_main_post_priority,
                // Adicionar propriedades específicas para tipos de post
                isBeforeAfter: (() => {
                  if (typeof post.media_urls === 'object' && post.media_urls?.type === 'before-after') {
                    return true
                  }
                  if (typeof post.media_urls === 'string') {
                    try {
                      const parsed = JSON.parse(post.media_urls)
                      return parsed.type === 'before-after'
                    } catch {
                      return false
                    }
                  }
                  return false
                })(),
                beforeUrl: (() => {
                  if (typeof post.media_urls === 'object' && post.media_urls?.type === 'before-after' && post.media_urls?.media?.[0]?.url) {
                    return post.media_urls.media[0].url
                  }
                  if (typeof post.media_urls === 'string') {
                    try {
                      const parsed = JSON.parse(post.media_urls)
                      if (parsed.type === 'before-after' && parsed.media?.[0]?.url) {
                        return parsed.media[0].url
                      }
                    } catch {
                      return ''
                    }
                  }
                  return ''
                })(),
                afterUrl: (() => {
                  if (typeof post.media_urls === 'object' && post.media_urls?.type === 'before-after' && post.media_urls?.media?.[1]?.url) {
                    return post.media_urls.media[1].url
                  }
                  if (typeof post.media_urls === 'string') {
                    try {
                      const parsed = JSON.parse(post.media_urls)
                      if (parsed.type === 'before-after' && parsed.media?.[1]?.url) {
                        return parsed.media[1].url
                      }
                    } catch {
                      return ''
                    }
                  }
                  return ''
                })(),
                isVideo: (() => {
                  if (typeof post.media_urls === 'object' && post.media_urls?.media?.[0]?.type === 'video') {
                    return true
                  }
                  if (typeof post.media_urls === 'string') {
                    try {
                      const parsed = JSON.parse(post.media_urls)
                      return parsed.media?.[0]?.type === 'video'
                    } catch {
                      return false
                    }
                  }
                  return false
                })(),
                isCarousel: (() => {
                  if (typeof post.media_urls === 'object' && post.media_urls?.media && post.media_urls.media.length > 1) {
                    return true
                  }
                  if (typeof post.media_urls === 'string') {
                    try {
                      const parsed = JSON.parse(post.media_urls)
                      return parsed.media && parsed.media.length > 1
                    } catch {
                      return false
                    }
                  }
                  return false
                })(),
                carouselImages: (() => {
                  if (typeof post.media_urls === 'object' && post.media_urls?.media) {
                    return post.media_urls.media.map((m: any) => m.url).filter(Boolean)
                  }
                  if (typeof post.media_urls === 'string') {
                    try {
                      const parsed = JSON.parse(post.media_urls)
                      return parsed.media?.map((m: any) => m.url).filter(Boolean) || []
                    } catch {
                      return []
                    }
                  }
                  return []
                })()
              }
              
              // Usar a função global para abrir o modal
              if (typeof window !== 'undefined' && (window as any).openPostModal) {
                (window as any).openPostModal(transformedPost)
              }
            }}
          >
            {/* Renderizar mídia do post */}
            {(() => {
              // Verificar se há media_urls
              if (!post.media_urls) {
                return (
                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">Sem imagem</span>
                  </div>
                )
              }

              // Se media_urls é um objeto parseado
              if (typeof post.media_urls === 'object' && post.media_urls !== null) {
                const mediaObj = post.media_urls as any

                // Se tem array de media com URLs
                if (mediaObj.media && Array.isArray(mediaObj.media) && mediaObj.media.length > 0) {
                  const firstMedia = mediaObj.media[0]
                  
                  // Se é before-after
                  if (mediaObj.type === 'before-after') {
                    // Para before-after, precisamos de pelo menos 2 imagens
                    if (mediaObj.media.length >= 2) {
                      const beforeMedia = mediaObj.media[0]
                      const afterMedia = mediaObj.media[1]
                      
                      return (
                        <div className="w-full h-full grid grid-cols-2 gap-1">
                          <div className="relative">
                            <img
                              src={beforeMedia.url}
                              alt="Antes"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="relative">
                            <img
                              src={afterMedia.url}
                              alt="Depois"
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                        </div>
                      )
                    } else {
                      // Fallback se não tiver 2 imagens
                      return (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-sm">Imagens incompletas</span>
                        </div>
                      )
                    }
                  }
                  
                  // Se é normal ou carousel
                  if (firstMedia.url) {
                    return (
                      <div className="relative w-full h-full">
                        <img
                          src={firstMedia.url}
                          alt={post.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {mediaObj.media.length > 1 && (
                          <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded text-center font-semibold shadow-sm">
                            {mediaObj.media.length}
                          </div>
                        )}
                      </div>
                    )
                  }
                }
              }

              // Se media_urls é uma string (formato antigo)
              if (typeof post.media_urls === 'string') {
                try {
                  const parsedMedia = JSON.parse(post.media_urls)
                  if (parsedMedia && parsedMedia.media && parsedMedia.media.length > 0) {
                    const firstMedia = parsedMedia.media[0]
                    if (firstMedia.url) {
                      return (
                        <div className="relative w-full h-full">
                          <img
                            src={firstMedia.url}
                            alt={post.title}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          {parsedMedia.media.length > 1 && (
                            <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded text-center font-semibold shadow-sm">
                              {parsedMedia.media.length}
                            </div>
                          )}
                        </div>
                      )
                    }
                  }
                } catch (error) {
                  console.error('Erro ao fazer parse do media_urls:', error)
                }
              }

              // Fallback
              return (
                <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Sem imagem</span>
                </div>
              )
            })()}


          </div>
        )
      })}
    </div>
  )
}

export default Membros;