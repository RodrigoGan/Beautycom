import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BackButton } from "@/components/ui/back-button"
import { Heart, MessageCircle, Bookmark, Share2, Search, Plus, Users, Lock, Sparkles, User, Send } from "lucide-react"
import { LikeButton } from "@/components/LikeButton"
import { CommentSection } from "@/components/CommentSection"
import { ShareButton } from "@/components/ShareButton"
import { FavoriteButton } from "@/components/FavoriteButton"
import { PostMenu } from "@/components/PostMenu"
import { CommentInput } from "@/components/CommentInput"
import { CommentCount } from "@/components/CommentCount"
import { InstagramCommentModal } from "@/components/InstagramCommentModal"
import { Link, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { useState, useEffect, useRef, useCallback } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import NewPostModal from "@/components/NewPostModal"
import { usePosts } from "@/hooks/usePosts"
import { useToast } from "@/hooks/use-toast"
import FeedVideo from "@/components/FeedVideo"
import VideoModal from "@/components/VideoModal"
import { Header } from "@/components/Header"
import { OptimizedImage } from '@/components/OptimizedImage'
import { useLoopDetection } from '@/utils/loopDetector'

const BeautyWall = () => {
  const { user } = useAuthContext()
  const navigate = useNavigate()
  const loopDetection = useLoopDetection('BeautyWall')
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  
  // Estados para modal de comentários
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [selectedPostForComments, setSelectedPostForComments] = useState<any>(null)
  
  // Estados para o modal de novo post
  const [showNewPostModal, setShowNewPostModal] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [postData, setPostData] = useState({
    title: '',
    description: '',
    category: '',
    postType: 'normal', // 'normal' ou 'before-after'
    images: [] as File[],
    videos: [] as File[]
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  // Hook para buscar posts do banco de dados
  const {
    posts: postsReais,
    loading: postsLoading,
    error: postsError,
    hasMore,
    isInitialized,
    filters,
    fetchPosts,
    loadMore,
    updateFilters,
    clearFilters
  } = usePosts()

  // Resetar scroll para o topo quando a página for carregada
  useEffect(() => {
    // Garantir que o scroll da página esteja habilitado
    document.body.style.overflow = ''
    document.body.style.touchAction = ''
    
    // Resetar scroll para o topo
    window.scrollTo(0, 0)
    
    // Também resetar o scroll do body e html para garantir
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
    
    // Forçar um pequeno delay para garantir que o reset funcione
    setTimeout(() => {
      window.scrollTo(0, 0)
      document.body.scrollTop = 0
      document.documentElement.scrollTop = 0
    }, 100)
    
    // Resetar o estado de scroll desabilitado
    setIsPageScrollDisabled(false)
  }, [])

  console.log('🔍 BeautyWall - Estado do usePosts:', {
    postsCount: postsReais.length,
    loading: postsLoading,
    error: postsError,
    isInitialized,
    hasMore,
    user: !!user
  })

  // Forçar busca inicial se não foi inicializado - CORRIGIDO
  useEffect(() => {
    console.log('🔄 BeautyWall useEffect - Verificando inicialização...')
    console.log('🔄 Estado atual:', { isInitialized, postsLoading, postsCount: postsReais.length })
    if (!isInitialized && !postsLoading) {
      console.log('🚀 BeautyWall - Forçando busca inicial...')
      fetchPosts(true)
    }
  }, [isInitialized, postsLoading]) // Removido fetchPosts das dependências

  // Timeout de segurança para evitar travamento infinito
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (postsLoading && postsReais.length === 0) {
        console.warn('⚠️ BeautyWall - Timeout de segurança ativado (10s)')
        console.warn('⚠️ Forçando parada do loading para evitar travamento')
        setLoadingTimeout(true)
      }
    }, 10000) // 10 segundos (mais agressivo)

    return () => clearTimeout(timeoutId)
  }, [postsLoading, postsReais.length])

  // Timeout ainda mais agressivo se não inicializou
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (!isInitialized && postsReais.length === 0) {
        console.warn('⚠️ BeautyWall - Timeout de inicialização ativado (8s)')
        console.warn('⚠️ Forçando parada do loading para evitar travamento')
        setLoadingTimeout(true)
      }
    }, 8000) // 8 segundos

    return () => clearTimeout(timeoutId)
  }, [isInitialized, postsReais.length])

  // Sincronizar estados locais dos selects com os filtros
  useEffect(() => {
    if (filters.category) {
      setSelectedCategory(filters.category)
    } else {
      setSelectedCategory('')
    }
    
    if (filters.postType) {
      setSelectedPostType(filters.postType)
    } else {
      setSelectedPostType('')
    }
  }, [filters.category, filters.postType])

  // Hook para toasts
  const { toast } = useToast()

  // Estado para busca
  const [searchTerm, setSearchTerm] = useState('')
  
  // Estados locais para controlar os valores visuais dos selects
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedPostType, setSelectedPostType] = useState<string>('')

  // Estado para modal de imagem ampliada
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState<{
    url: string
    label: string
    type: 'before' | 'after'
  } | null>(null)
  const [beforeAfterImages, setBeforeAfterImages] = useState<{
    before: { url: string; label: string }
    after: { url: string; label: string }
  } | null>(null)
  
  // Estado para modal de vídeo
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  
  // Estado local para controlar loading de segurança
  const [loadingTimeout, setLoadingTimeout] = useState(false)
  
  // Estados para modal de imagem (antes/depois)
  const [carouselPosition, setCarouselPosition] = useState(0)
  const [isSwiping, setIsSwiping] = useState(false)
  const [dragOffset, setDragOffset] = useState(0) // Para acompanhar o dedo em tempo real
  
  // Estados específicos para carrossel de posts
  const [postCarouselIndex, setPostCarouselIndex] = useState(0)
  const [postCarouselIsSwiping, setPostCarouselIsSwiping] = useState(false)
  const [postCarouselDragOffset, setPostCarouselDragOffset] = useState(0)
  const [isPageScrollDisabled, setIsPageScrollDisabled] = useState(false)
  
  // Refs para touch
  const touchStartX = useRef<number>(0)
  const touchEndX = useRef<number>(0)
  const touchStartY = useRef<number>(0)
  const touchEndY = useRef<number>(0)
  const isHorizontalGesture = useRef<boolean>(false)
  
  // Refs específicos para cada post
  const postTouchRefs = useRef<{[key: string]: {
    startX: number
    endX: number
  }}>({})

  // Ref para infinite scroll
  const observerRef = useRef<IntersectionObserver>()
  const lastPostRef = useRef<HTMLDivElement>(null)

  // Controlar scroll da página durante interação com carrossel
  useEffect(() => {
    if (isPageScrollDisabled) {
      // Desabilitar scroll da página
      document.body.style.overflow = 'hidden'
      document.body.style.touchAction = 'none'
    } else {
      // Reabilitar scroll da página
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }

    // Cleanup quando o componente for desmontado
    return () => {
      document.body.style.overflow = ''
      document.body.style.touchAction = ''
    }
  }, [isPageScrollDisabled])

  // Funções para controlar o modal
  const handleOpenNewPostModal = () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }
    setShowNewPostModal(true)
    setCurrentStep(1)
    setPostData({
      title: '',
      description: '',
      category: '',
      postType: 'normal',
      images: [],
      videos: []
    })
    setErrors({})
  }

  const handleCloseNewPostModal = () => {
    setShowNewPostModal(false)
    setCurrentStep(1)
    setPostData({
      title: '',
      description: '',
      category: '',
      postType: 'normal',
      images: [],
      videos: []
    })
    setErrors({})
  }

  const handleStepChange = (step: number) => {
    setCurrentStep(step)
  }

  const handlePostDataChange = (data: any) => {
    setPostData(data)
    // Limpar erros quando o usuário digita
    if (errors.title && data.title) setErrors(prev => ({ ...prev, title: '' }))
    if (errors.description && data.description) setErrors(prev => ({ ...prev, description: '' }))
    if (errors.category && data.category) setErrors(prev => ({ ...prev, category: '' }))
  }

  const handleErrorsChange = (newErrors: {[key: string]: string}) => {
    setErrors(newErrors)
  }

  // Função para lidar com busca
  const handleSearch = (value: string) => {
    setSearchTerm(value)
    updateFilters({ ...filters, search: value })
  }

  // Função para limpar busca
  const handleClearSearch = () => {
    console.log('🔄 Limpando filtros...')
    setSearchTerm('')
    setSelectedCategory('')
    setSelectedPostType('')
    clearFilters()
    
    toast({
      title: "Filtros limpos",
      description: "Mostrando todos os posts disponíveis",
    })
  }

  // Função para infinite scroll (apenas para usuários logados)
  const lastPostElementRef = useCallback((node: HTMLDivElement) => {
    if (postsLoading || !user) return // Não carregar mais se não estiver logado
    
    if (observerRef.current) observerRef.current.disconnect()
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore()
      }
    })
    
    if (node) observerRef.current.observe(node)
  }, [postsLoading, hasMore, loadMore, user])

  // Dados mock removidos - agora usando apenas dados do banco

  // Função para calcular tempo relativo
  const calcularTempoRelativo = (dataString: string) => {
    const agora = new Date()
    const dataPost = new Date(dataString)
    const diffMs = agora.getTime() - dataPost.getTime()
    const diffMinutos = Math.floor(diffMs / (1000 * 60))
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMinutos < 1) return 'Agora'
    if (diffMinutos < 60) return `${diffMinutos}m`
    if (diffHoras < 24) return `${diffHoras}h`
    if (diffDias < 7) return `${diffDias}d`
    
    // Para posts mais antigos, mostrar data completa
    return dataPost.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  // Converter posts reais para o formato da UI
  const converterPostParaUI = (post: any) => {
    // Extrair URL da imagem do media_urls
    let imagemUrl = "/placeholder-post.jpg"
    let isVideo = false
    let isBeforeAfter = false
    let beforeUrl = ""
    let afterUrl = ""
    let isCarousel = false
    let carouselImages: string[] = []
    
    console.log('Convertendo post:', post.id, 'post_type:', post.post_type, 'filtro_atual:', filters.postType, 'media_urls:', JSON.stringify(post.media_urls, null, 2))
    console.log('🔍 DEBUG AUTHOR:', {
      author: post.author,
      tipo: typeof post.author,
      nickname: post.author?.nickname,
      user_id: post.user_id,
      post_id: post.id
    })
    console.log('🔍 DEBUG AUTHOR EXPANDIDO:', JSON.stringify(post.author, null, 2))
    
    // Abordagem baseada no post_type
    switch (post.post_type) {
      case 'normal':
        // Post simples - 1 imagem ou 1 vídeo
        if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
          const firstMedia = post.media_urls.media[0]
          imagemUrl = firstMedia.url
          isVideo = firstMedia.type === 'video' || (imagemUrl && (imagemUrl.includes('.mp4') || imagemUrl.includes('.mov') || imagemUrl.includes('.avi')))
          
          // NÃO detectar carrossel automaticamente - usar apenas post_type do banco
          console.log('DEBUG: Post normal -', post.media_urls.media.length, 'mídias')
        } else if (post.media_urls && post.media_urls.url) {
          // Formato antigo
          imagemUrl = post.media_urls.url
          isVideo = imagemUrl && (imagemUrl.includes('.mp4') || imagemUrl.includes('.mov') || imagemUrl.includes('.avi'))
        } else if (post.media_urls && post.media_urls.before && post.media_urls.after) {
          // Post normal mas com estrutura before-after - usar a foto "depois"
          beforeUrl = post.media_urls.before
          afterUrl = post.media_urls.after
          imagemUrl = afterUrl
          console.log('DEBUG: Post normal com estrutura before-after - usando foto depois')
        }
        break
        
      case 'carousel':
        // Post de carrossel - múltiplas imagens
        isCarousel = true
        if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
          carouselImages = post.media_urls.media.map((media: any) => {
            let url = media.url
            if (url && url.includes('supabase.co')) {
              const baseUrl = url.split('?')[0]
              url = baseUrl + '?v=' + Date.now()
            }
            return url
          })
          imagemUrl = carouselImages[0] // Primeira imagem como principal
          console.log('DEBUG: Post carrossel detectado -', carouselImages.length, 'imagens')
        }
        break
        
      case 'before-after':
        // Post de transformação antes/depois
        isBeforeAfter = true
        // Verificar estrutura com media array
        if (post.media_urls && post.media_urls.media && post.media_urls.media.length >= 2) {
          beforeUrl = post.media_urls.media[0].url
          afterUrl = post.media_urls.media[1].url
          imagemUrl = afterUrl
          console.log('DEBUG: Post before-after (media array) detectado')
        } else if (post.media_urls && post.media_urls.beforeAfter) {
          beforeUrl = post.media_urls.beforeAfter.before
          afterUrl = post.media_urls.beforeAfter.after
          imagemUrl = afterUrl // Usar a foto "depois" como principal
          console.log('DEBUG: Post before-after detectado')
        } else if (post.media_urls && post.media_urls.before && post.media_urls.after) {
          // Formato antigo
          beforeUrl = post.media_urls.before
          afterUrl = post.media_urls.after
          imagemUrl = afterUrl
          console.log('DEBUG: Post before-after (formato antigo) detectado')
        }
        break
        
      case 'video':
        // Post de vídeo
        isVideo = true
        if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
          const videoMedia = post.media_urls.media.find((media: any) => media.type === 'video')
          if (videoMedia) {
            imagemUrl = videoMedia.url
            console.log('DEBUG: Post vídeo detectado')
          }
        } else if (post.media_urls && post.media_urls.url) {
          imagemUrl = post.media_urls.url
          console.log('DEBUG: Post vídeo (formato antigo) detectado')
        }
        break
        
      default:
        // Fallback para posts antigos
        console.log('DEBUG: Post com tipo desconhecido:', post.post_type, '- usando fallback')
        if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
          const firstMedia = post.media_urls.media[0]
          imagemUrl = firstMedia.url
          isVideo = firstMedia.type === 'video' || (imagemUrl && (imagemUrl.includes('.mp4') || imagemUrl.includes('.mov') || imagemUrl.includes('.avi')))
          
          // NÃO detectar carrossel automaticamente no fallback
          console.log('DEBUG: Post fallback -', post.media_urls.media.length, 'mídias')
        }
        break
    }
    
    // Processar URLs do Supabase com timestamp
    if (imagemUrl && imagemUrl.includes('supabase.co')) {
      const baseUrl = imagemUrl.split('?')[0]
      imagemUrl = baseUrl + '?v=' + Date.now()
    }
    
    if (beforeUrl && beforeUrl.includes('supabase.co')) {
      const baseUrl = beforeUrl.split('?')[0]
      beforeUrl = baseUrl + '?v=' + Date.now()
    }
    
    if (afterUrl && afterUrl.includes('supabase.co')) {
      const baseUrl = afterUrl.split('?')[0]
      afterUrl = baseUrl + '?v=' + Date.now()
    }
    
    // Verificar se a URL não é de exemplo ou se falhou
    if (imagemUrl && (imagemUrl.includes('example.com') || imagemUrl.includes('placeholder'))) {
      imagemUrl = "/placeholder-post.jpg"
      console.log('URL inválida detectada, usando placeholder')
    }
    
    console.log('DEBUG: Final imagemUrl:', imagemUrl, 'Post ID:', post.id)
    console.log('DEBUG: isBeforeAfter:', isBeforeAfter, 'beforeUrl:', beforeUrl, 'afterUrl:', afterUrl)
    console.log('DEBUG: isCarousel:', isCarousel, 'carouselImages:', carouselImages)
    
    const result = {
      id: post.id,
      titulo: post.title || post.titulo || '',
      descricao: post.description || post.descricao || '',
      categoria: post.category_id || post.category?.id || 
                typeof post.category === 'string' ? post.category : 
                typeof post.category === 'object' && post.category?.name ? post.category.name :
                typeof post.categoria === 'string' ? post.categoria :
                typeof post.categoria === 'object' && post.categoria?.name ? post.categoria.name :
                'Categoria',
      autor: post.author?.name || post.author?.nickname || post.author || post.autor || 'Usuário',
      nickname: post.author?.nickname || post.author?.name || 'Usuário',
      avatar: post.author?.profile_photo || post.avatar || post.avatar_url || '',
      imagem: imagemUrl,
      isVideo: isVideo,
      isBeforeAfter: isBeforeAfter,
      beforeUrl: beforeUrl,
      afterUrl: afterUrl,
      isCarousel: isCarousel,
      carouselImages: carouselImages,
      curtidas: post.likes || post.curtidas || 0,
      comentarios: post.comments || post.comentarios || 0,
      data: post.created_at || post.data || new Date().toISOString(),
      tempo: calcularTempoRelativo(post.created_at || post.data || new Date().toISOString()),
      postType: post.post_type || 'normal',
      user_id: post.user_id || post.author?.id || ''
    }
    

    
    return result
  }

  // Usar apenas posts reais do banco
  console.log('🔍 Posts do hook usePosts:', postsReais.length)
  
  // Verificar se há problema de conectividade
  if (postsReais.length === 0 && postsError) {
    console.log('⚠️ Problema de conectividade detectado na BeautyWall:', postsError)
    if (postsError.includes('timeout') || postsError.includes('limite') || postsError.includes('usage')) {
      console.log('💡 Isso pode ser devido ao "Exceeding usage limits" no Supabase')
    }
  }
  
  // Log adicional para debug
  console.log('🔍 BeautyWall - Estado atual:', {
    postsCount: postsReais.length,
    loading: postsLoading,
    error: postsError,
    isInitialized,
    loadingTimeout,
    hasMore,
    user: !!user,
    filters: filters
  })
  
  // Log específico para problemas de conectividade
  if (postsError) {
    console.log('❌ Erro no banco de dados:', postsError)
  }
  
  // Fallback para posts se não há dados do banco
  let postsExibidos = postsReais.map(converterPostParaUI)
  let showNoResultsMessage = false
  let showFallback = false
  
  if (postsReais.length === 0 && !postsLoading && isInitialized) {
    // Verificar se é erro de conectividade ou filtro sem resultados
    if (postsError) {
      // Erro de conectividade - mostrar fallback
      console.log('⚠️ Erro de conectividade - usando fallback temporário')
      console.log('💡 Isso pode ser devido ao "Exceeding usage limits" no Supabase')
      showFallback = true
    } else if (filters.category || filters.postType || filters.search) {
      // Filtro sem resultados - mostrar mensagem específica
      console.log('🔍 Filtro aplicado sem resultados - mostrando mensagem específica')
      console.log('📋 Filtros ativos:', { category: filters.category, postType: filters.postType, search: filters.search })
      showNoResultsMessage = true
    } else {
      // Sem filtros e sem dados - pode ser erro de conectividade
      console.log('⚠️ Nenhum dado do banco sem filtros - usando fallback temporário')
      showFallback = true
    }
  }
  
  // Aplicar fallback se necessário
  if (showFallback) {
    console.log('✅ Fallback ativo - 3 posts de exemplo sendo exibidos')
    
    const fallbackPosts = [
      {
        id: 'fallback-1',
        titulo: 'Transformação Completa',
        descricao: 'Antes e depois de uma transformação incrível! 💇‍♀️✨',
        autor: 'Studio Beauty',
        nickname: 'studiobeauty',
        avatar: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=400&fit=crop&crop=face',
        imagem: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=600&h=600&fit=crop',
        categoria: 'Cabelos Femininos',
        tempo: '2h',
        likes: 45,
        comentarios: 12,
        user_id: 'fallback-1',
        isFromDb: false,
        isVideo: false,
        isBeforeAfter: false,
        beforeUrl: '',
        afterUrl: '',
        isCarousel: false,
        carouselImages: [],
        videoUrl: '',
        carouselIndex: 0,
        curtidas: 45,
        data: new Date().toISOString(),
        postType: 'normal'
      },
      {
        id: 'fallback-2',
        titulo: 'Maquiagem Profissional',
        descricao: 'Look para festa com técnicas avançadas de maquiagem! 💄👑',
        autor: 'Profissional Hair',
        nickname: 'profhair',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face',
        imagem: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=600&h=600&fit=crop',
        categoria: 'Maquiagem',
        tempo: '4h',
        likes: 32,
        comentarios: 8,
        user_id: 'fallback-2',
        isFromDb: false,
        isVideo: false,
        isBeforeAfter: false,
        beforeUrl: '',
        afterUrl: '',
        isCarousel: false,
        carouselImages: [],
        videoUrl: '',
        carouselIndex: 0,
        curtidas: 32,
        data: new Date().toISOString(),
        postType: 'normal'
      },
      {
        id: 'fallback-3',
        titulo: 'Corte Masculino Moderno',
        descricao: 'Corte degradê com acabamento perfeito! ✂️💪',
        autor: 'Bella Salon',
        nickname: 'bellasalon',
        avatar: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=400&h=400&fit=crop&crop=face',
        imagem: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=600&fit=crop',
        categoria: 'Cabelos Masculinos',
        tempo: '6h',
        likes: 28,
        comentarios: 5,
        user_id: 'fallback-3',
        isFromDb: false,
        isVideo: false,
        isBeforeAfter: false,
        beforeUrl: '',
        afterUrl: '',
        isCarousel: false,
        carouselImages: [],
        videoUrl: '',
        carouselIndex: 0,
        curtidas: 28,
        data: new Date().toISOString(),
        postType: 'normal'
      }
    ]
    
    postsExibidos = fallbackPosts
  }

  // Remover posts duplicados baseado no ID
  const postsUnicos = postsExibidos.filter((post, index, self) => 
    index === self.findIndex(p => p.id === post.id)
  )
  
  console.log('🔍 Posts originais:', postsExibidos.length, 'Posts únicos:', postsUnicos.length)
  if (postsExibidos.length !== postsUnicos.length) {
    console.log('⚠️ Posts duplicados removidos:', postsExibidos.length - postsUnicos.length)
  }

  // Aplicar limitação para usuários não logados (apenas 3 posts)
  const postsParaExibir = user ? postsUnicos : postsUnicos.slice(0, 3)
  
  // Log para debug da renderização
  console.log('🎨 Renderização:', {
    postsParaExibir: postsParaExibir.length,
    loadingTimeout,
    postsError: !!postsError,
    postsLoading,
    isInitialized,
    user: !!user
  })

  // Função para lidar com clique no post/autor
  const handlePostClick = (post: any, type: 'post' | 'author') => {
    if (!user) {
      setSelectedPost({ ...post, type })
      setShowLoginModal(true)
    } else {
      // Usuário logado - redirecionar para perfil ou post
      if (type === 'author') {
        // Navegar para o perfil do autor
        if (post.user_id) {
          navigate(`/perfil/${post.user_id}`)
        } else {
          console.log('ID do usuário não encontrado para navegação')
        }
      } else {
        // Clique no post - por enquanto apenas log, pode implementar modal de post depois
        console.log('Ver post de:', post.autor)
      }
    }
  }

  // Função para abrir modal de comentários
  const handleOpenCommentModal = (post: any) => {
    if (!user) {
      setSelectedPost({ ...post, type: 'comments' })
      setShowLoginModal(true)
      return
    }
    
    setSelectedPostForComments(post)
    setShowCommentModal(true)
  }

  // Função para abrir modal de imagem ampliada
  const handleImageClick = (url: string, label: string, type: 'before' | 'after', beforeUrl?: string, afterUrl?: string) => {
    setSelectedImage({ url, label, type })
    if (beforeUrl && afterUrl) {
      setBeforeAfterImages({
        before: { url: beforeUrl, label: 'ANTES' },
        after: { url: afterUrl, label: 'DEPOIS' }
      })
      // Definir posição inicial do carrossel
      setCarouselPosition(type === 'before' ? 0 : 1)
    }
    setShowImageModal(true)
  }

  // Função para fechar modal de imagem ampliada
  const handleCloseImageModal = () => {
    setShowImageModal(false)
    setSelectedImage(null)
    setBeforeAfterImages(null)
    setCarouselPosition(0)
  }
  
  // Funções para modal de vídeo
  const handleVideoClick = (videoUrl: string) => {
    setSelectedVideo(videoUrl)
    setShowVideoModal(true)
  }
  
  const handleCloseVideoModal = () => {
    setShowVideoModal(false)
    // Delay para permitir a animação de saída
    setTimeout(() => {
      setSelectedVideo('')
    }, 300)
  }

  // Função para navegar para a próxima imagem
  const handleNextImage = () => {
    console.log('Next clicked - current position:', carouselPosition)
    console.log('beforeAfterImages exists:', !!beforeAfterImages)
    if (beforeAfterImages) {
      setCarouselPosition(1)
      console.log('Setting position to 1')
    }
  }

  // Função para navegar para a imagem anterior
  const handlePrevImage = () => {
    console.log('Prev clicked - current position:', carouselPosition)
    console.log('beforeAfterImages exists:', !!beforeAfterImages)
    if (beforeAfterImages) {
      setCarouselPosition(0)
      console.log('Setting position to 0')
    }
  }

  // Gestos de swipe para mobile (modal de imagem)
  const handleTouchStart = (e: React.TouchEvent) => {
    const startX = e.targetTouches[0].clientX
    console.log('Modal - Touch start at:', startX)
    touchStartX.current = startX
    setIsSwiping(true)
    setDragOffset(0) // Resetar o drag
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return
    const currentX = e.targetTouches[0].clientX
    const startX = touchStartX.current
    const containerWidth = window.innerWidth
    const dragDistance = currentX - startX
    const dragPercentage = (dragDistance / containerWidth) * 100
    
    // Limitar o drag entre -100% e 100%
    const clampedDrag = Math.max(-100, Math.min(100, dragPercentage))
    setDragOffset(clampedDrag)
    
    console.log('Modal - Touch move - dragDistance:', dragDistance, 'dragPercentage:', dragPercentage, 'clampedDrag:', clampedDrag)
    touchEndX.current = currentX
  }

  const handleTouchEnd = () => {
    if (!isSwiping) return
    
    const minSwipeDistance = 50 // 50px mínimo para considerar swipe
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    console.log('Modal - Swipe - touchStartX:', touchStartX.current, 'touchEndX:', touchEndX.current, 'distance:', distance)
    console.log('Current image index:', carouselPosition)
    
    if (isLeftSwipe && carouselPosition === 0) {
      console.log('Swiping left to position 1')
      setCarouselPosition(1)
    } else if (isRightSwipe && carouselPosition === 1) {
      console.log('Swiping right to position 0')
      setCarouselPosition(0)
    } else {
      console.log('Not enough swipe distance or invalid direction')
    }
    
    // Resetar estados
    setIsSwiping(false)
    touchStartX.current = 0
    touchEndX.current = 0
    setDragOffset(0) // Resetar o drag visual
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="pt-20 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
        {/* Header com navegação */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <BackButton 
              variant="outline" 
              size="sm"
              className="hover:bg-gradient-card hover:border-primary/40"
            />
            <Link to="/membros">
              <Button variant="hero" className="group">
                <Users className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                Ver Membros
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              BeautyWall
            </h1>
            <p className="text-muted-foreground">
              Descubra os trabalhos mais incríveis da comunidade
            </p>
          </div>
        </div>

        {/* Filtros e Busca */}
        <Card className="mb-6 bg-gradient-card border-primary/10 shadow-beauty-card">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome, @nickname ou descrição..." 
                  className="pl-10 border-primary/20 focus:border-primary"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={handleClearSearch}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                )}
              </div>
              
              {/* Filtros em linha */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <Select 
                    value={selectedCategory}
                    onValueChange={(value) => {
                      console.log('🎯 Filtro de categoria selecionado:', value)
                      console.log('🔍 Categoria anterior:', filters.category)
                      setSelectedCategory(value)
                      const newFilters = { ...filters, category: value === 'todos' ? undefined : value }
                      console.log('🔄 Novos filtros:', newFilters)
                      updateFilters(newFilters)
                    }}
                  >
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">✨ Todas as categorias</SelectItem>
                      <SelectItem value="Cabelos Femininos">👩‍🦰 Cabelos Femininos</SelectItem>
                      <SelectItem value="Cabelos Masculinos">👨‍🦱 Cabelos Masculinos</SelectItem>
                      <SelectItem value="Cuidados com as Unhas">💅 Cuidados com as Unhas</SelectItem>
                      <SelectItem value="Cuidados com a Barba">🧔 Cuidados com a Barba</SelectItem>
                      <SelectItem value="Estética Corporal">💪 Estética Corporal</SelectItem>
                      <SelectItem value="Estética Facial">✨ Estética Facial</SelectItem>
                      <SelectItem value="Tatuagem">🎨 Tatuagem</SelectItem>
                      <SelectItem value="Piercing">💎 Piercing</SelectItem>
                      <SelectItem value="Maquiagem">💄 Maquiagem</SelectItem>
                      <SelectItem value="Sobrancelhas / Cílios">👁️ Sobrancelhas / Cílios</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1">
                  <Select 
                    value={selectedPostType}
                    onValueChange={(value) => {
                      console.log('🎯 Filtro de tipo selecionado:', value)
                      setSelectedPostType(value)
                      const newFilters = { ...filters, postType: value === 'recentes' ? undefined : value }
                      updateFilters(newFilters)
                    }}
                  >
                    <SelectTrigger className="border-primary/20 focus:border-primary">
                      <SelectValue placeholder="Filtrar por tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recentes">🕒 Todos os tipos</SelectItem>
                      <SelectItem value="normal">📷 Posts simples</SelectItem>
                      <SelectItem value="carousel">🖼️ Carrossel</SelectItem>
                      <SelectItem value="before-after">🔄 Antes e Depois</SelectItem>
                      <SelectItem value="video">🎥 Vídeos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button variant="hero" className="group" onClick={handleOpenNewPostModal}>
                  <Plus className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  Novo Post
                </Button>
              </div>
              
              {/* Botão Limpar Filtros e Tags rápidas */}
              <div className="flex flex-wrap gap-2 items-center justify-between">
                {/* Tags rápidas - OCULTADAS TEMPORARIAMENTE
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="text-xs border-primary/20 hover:border-primary/40">
                    🔥 Tendências
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs border-primary/20 hover:border-primary/40">
                    ⭐ Destaques
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs border-primary/20 hover:border-primary/40">
                    🆕 Novos
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs border-primary/20 hover:border-primary/40">
                    🏆 Premiados
                  </Button>
                </div>
                */}
                
                {(filters.search || filters.category || filters.postType) && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleClearSearch}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ✕ Limpar filtros
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed de Posts - Estilo Instagram */}
        <div className="space-y-0 max-w-lg mx-auto">
          {(postsLoading && !isInitialized && !loadingTimeout) ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
              <h3 className="text-lg font-semibold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                Carregando posts...
              </h3>
              <p className="text-muted-foreground">
                Buscando os trabalhos mais incríveis da comunidade
              </p>
            </div>
          ) : loadingTimeout && postsParaExibir.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-destructive">
                Problema de conectividade
              </h3>
              <p className="text-muted-foreground mb-4">
                Estamos enfrentando problemas de conectividade. Tente novamente em alguns instantes.
              </p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setLoadingTimeout(false)
                  fetchPosts(true)
                }}
                className="group"
              >
                <svg className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tentar novamente
              </Button>
            </div>
          ) : postsError ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="h-8 w-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-destructive">
                Erro ao carregar posts
              </h3>
              <p className="text-muted-foreground mb-4">
                Não foi possível carregar os posts. Verifique sua conexão e tente novamente.
              </p>
              <Button 
                variant="outline" 
                onClick={() => fetchPosts(true)}
                className="group"
              >
                <svg className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Tentar novamente
              </Button>
            </div>
          ) : postsParaExibir.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                {showNoResultsMessage 
                  ? "Nenhum post encontrado para este filtro"
                  : postsError && (postsError.includes('timeout') || postsError.includes('limite') || postsError.includes('usage')) 
                    ? "Problema de conectividade detectado"
                    : "Nenhum post encontrado"
                }
              </h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                {showNoResultsMessage
                  ? `Não encontramos posts para "${filters.category || filters.postType || filters.search}". Tente ajustar os filtros ou explore outras categorias!`
                  : postsError && (postsError.includes('timeout') || postsError.includes('limite') || postsError.includes('usage'))
                    ? "Estamos enfrentando problemas de conectividade. Isso pode ser devido ao limite de uso do Supabase. Tente novamente em alguns instantes."
                    : filters.search || filters.category || filters.postType 
                      ? "Tente ajustar os filtros ou termos de busca para encontrar posts incríveis!"
                      : postsLoading 
                        ? "Carregando posts..."
                        : "Ainda não há posts na comunidade. Seja o primeiro a compartilhar seu trabalho!"
                }
              </p>
              {(filters.search || filters.category || filters.postType) && (
                <Button 
                  variant="outline" 
                  onClick={handleClearSearch}
                  className="group"
                >
                  <Search className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  Limpar filtros e ver todos os posts
                </Button>
              )}
              {!filters.search && !filters.category && !filters.postType && postsParaExibir.length === 0 && !postsLoading && (
                <Button 
                  variant="outline" 
                  onClick={() => fetchPosts(true)}
                  className="group"
                >
                  <Search className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
                  Tentar carregar posts novamente
                </Button>
              )}
            </div>
          ) : (
                        postsParaExibir.map((post, index) => (
              <div 
                key={post.id} 
                className="bg-background border-b border-border -mx-4 sm:-mx-6 lg:-mx-8"
                ref={index === postsParaExibir.length - 1 ? lastPostElementRef : null}
              >
                {/* Header do Post */}
                <div className="flex items-center gap-3 p-4 px-4 sm:px-6 lg:px-8">
                  <Avatar 
                    className="cursor-pointer w-8 h-8"
                    onClick={() => handlePostClick(post, 'author')}
                  >
                    <AvatarImage src={post.avatar} />
                    <AvatarFallback className="text-xs">
                      {typeof post.autor === 'string' && post.autor.length > 0 ? post.autor.charAt(0) : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => handlePostClick(post, 'author')}
                  >
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm">@{post.nickname}</h3>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">{post.tempo}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {post.autor}
                    </p>
                  </div>
                  <PostMenu 
                    postId={post.id}
                    postUserId={post.user_id || ''}
                    postTitle={post.titulo}
                    postDescription={post.descricao}
                    postCategory={post.categoria}
                    onPostUpdated={() => {
                      // Recarregar posts após edição
                      fetchPosts()
                    }}
                    onPostDeleted={() => {
                      // Recarregar posts após exclusão
                      fetchPosts()
                    }}
                  />
                </div>

                {/* Mídia do Post */}
                <div 
                  className="aspect-square bg-gradient-card cursor-pointer overflow-hidden"
                  onClick={() => handlePostClick(post, 'post')}
                >
                  {post.imagem && post.imagem !== "/placeholder-post.jpg" ? (
                    post.isBeforeAfter ? (
                      // Renderizar Before/After igual à prévia
                      <div className="w-full h-full p-3">
                        <div className="text-center mb-3">
                          <Badge variant="outline" className="text-xs bg-gradient-hero text-white border-0 shadow-beauty-glow">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Transformação Antes e Depois
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 h-full">
                          <div className="relative group cursor-pointer" onClick={() => handleImageClick(post.beforeUrl, 'ANTES', 'before', post.beforeUrl, post.afterUrl)}>
                            <img 
                              src={post.beforeUrl} 
                              alt="Antes"
                              className="w-full h-full object-cover shadow-md border-2 border-red-200"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                console.error('Erro ao carregar imagem antes:', post.beforeUrl)
                              }}
                            />
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                              ANTES
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                          <div className="relative group cursor-pointer" onClick={() => handleImageClick(post.afterUrl, 'DEPOIS', 'after', post.beforeUrl, post.afterUrl)}>
                            <img 
                              src={post.afterUrl} 
                              alt="Depois"
                              className="w-full h-full object-cover shadow-md border-2 border-green-200"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                console.error('Erro ao carregar imagem depois:', post.afterUrl)
                              }}
                            />
                            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                              DEPOIS
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-t from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                          </div>
                        </div>
                      </div>
                    ) : post.isVideo ? (
                      // Post de vídeo com FeedVideo
                      <FeedVideo 
                        videoUrl={post.imagem}
                        mutedByDefault={true}
                        className="w-full h-full"
                        onVideoClick={() => handleVideoClick(post.imagem)}
                      />
                    ) : post.isCarousel && post.carouselImages && post.carouselImages.length > 1 ? (
                      // Carrossel para múltiplas imagens - Simplificado como PostPreview
                      <div 
                        className="relative group overflow-hidden"
                        onTouchStart={(e) => {
                          const startX = e.targetTouches[0].clientX
                          const startY = e.targetTouches[0].clientY
                          console.log('🎯 Carousel touch start at:', startX, startY, 'postId:', post.id)
                          touchStartX.current = startX
                          touchStartY.current = startY
                          setPostCarouselIsSwiping(true)
                          setPostCarouselDragOffset(0)
                          isHorizontalGesture.current = false
                          // Não desabilitar scroll ainda - vamos esperar para ver se é horizontal
                        }}
                        onTouchMove={(e) => {
                          if (!postCarouselIsSwiping) return
                          
                          const currentX = e.targetTouches[0].clientX
                          const currentY = e.targetTouches[0].clientY
                          const startX = touchStartX.current
                          const startY = touchStartY.current
                          
                          const deltaX = Math.abs(currentX - startX)
                          const deltaY = Math.abs(currentY - startY)
                          
                          // Detectar se é um gesto horizontal (após um mínimo de movimento)
                          if (!isHorizontalGesture.current && deltaX > 10 && deltaX > deltaY * 1.5) {
                            console.log('🎯 Detectado gesto horizontal - travando scroll')
                            isHorizontalGesture.current = true
                            setIsPageScrollDisabled(true)
                          }
                          
                          // Se não é horizontal, não processar o carrossel
                          if (!isHorizontalGesture.current) return
                          
                          const containerWidth = window.innerWidth
                          const dragDistance = currentX - startX
                          const dragPercentage = (dragDistance / containerWidth) * 100
                          const clampedDrag = Math.max(-100, Math.min(100, dragPercentage))
                          
                          console.log('🎯 Carousel touch move - dragDistance:', dragDistance, 'dragPercentage:', dragPercentage, 'clampedDrag:', clampedDrag)
                          setPostCarouselDragOffset(clampedDrag)
                          touchEndX.current = currentX
                          touchEndY.current = currentY
                        }}
                        onTouchEnd={() => {
                          if (!postCarouselIsSwiping) return
                          
                          // Se não foi um gesto horizontal, não processar
                          if (!isHorizontalGesture.current) {
                            setPostCarouselIsSwiping(false)
                            touchStartX.current = 0
                            touchStartY.current = 0
                            touchEndX.current = 0
                            touchEndY.current = 0
                            return
                          }
                          
                          const minSwipeDistance = 50
                          const distance = touchStartX.current - touchEndX.current
                          const isLeftSwipe = distance > minSwipeDistance
                          const isRightSwipe = distance < -minSwipeDistance
                          
                          console.log('🎯 Carousel swipe - distance:', distance, 'isLeftSwipe:', isLeftSwipe, 'isRightSwipe:', isRightSwipe)
                          
                          if (isLeftSwipe && postCarouselIndex < post.carouselImages.length - 1) {
                            console.log('✅ Swiping left to next image')
                            setPostCarouselIndex(postCarouselIndex + 1)
                          } else if (isRightSwipe && postCarouselIndex > 0) {
                            console.log('✅ Swiping right to previous image')
                            setPostCarouselIndex(postCarouselIndex - 1)
                          }
                          
                          setPostCarouselIsSwiping(false)
                          touchStartX.current = 0
                          touchStartY.current = 0
                          touchEndX.current = 0
                          touchEndY.current = 0
                          setPostCarouselDragOffset(0) // Resetar o drag visual
                          isHorizontalGesture.current = false
                          
                          // Reabilitar scroll da página após um pequeno delay
                          setTimeout(() => {
                            setIsPageScrollDisabled(false)
                          }, 100)
                        }}
                        onTouchCancel={() => {
                          // Reabilitar scroll da página se o touch for cancelado
                          setPostCarouselIsSwiping(false)
                          touchStartX.current = 0
                          touchStartY.current = 0
                          touchEndX.current = 0
                          touchEndY.current = 0
                          setPostCarouselDragOffset(0)
                          isHorizontalGesture.current = false
                          setIsPageScrollDisabled(false)
                        }}
                      >
                        <div 
                          className="flex w-full h-full transition-transform duration-300 ease-in-out"
                          style={{ 
                            transform: `translateX(calc(-${postCarouselIndex * 100}% + ${postCarouselDragOffset}%))`,
                            transition: postCarouselIsSwiping ? 'none' : 'transform 0.3s ease-in-out'
                          }}
                        >
                          {post.carouselImages.map((imageUrl, index) => (
                            <div key={index} className="w-full h-full flex-shrink-0">
                              <img 
                                src={imageUrl} 
                                alt={`Post ${index + 1}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                  console.error('Erro ao carregar imagem do carrossel:', imageUrl)
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        
                        {/* Indicadores do carrossel */}
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 pointer-events-none">
                          {post.carouselImages.map((_, index) => (
                            <div
                              key={index}
                              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                                index === postCarouselIndex 
                                  ? 'bg-white scale-110' 
                                  : 'bg-white/50'
                              }`}
                            />
                          ))}
                        </div>
                        
                        {/* Contador */}
                        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full pointer-events-none">
                          {postCarouselIndex + 1}/{post.carouselImages.length}
                        </div>
                        
                        {/* Setas de navegação para desktop */}
                        <div className="absolute inset-0 pointer-events-none hidden md:block">
                          <button
                            onClick={() => {
                              if (postCarouselIndex > 0) {
                                setPostCarouselIndex(postCarouselIndex - 1)
                              }
                            }}
                            className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-50 ${
                              postCarouselIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                            }`}
                            disabled={postCarouselIndex === 0}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => {
                              if (postCarouselIndex < post.carouselImages.length - 1) {
                                setPostCarouselIndex(postCarouselIndex + 1)
                              }
                            }}
                            className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors z-50 ${
                              postCarouselIndex === post.carouselImages.length - 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                            }`}
                            disabled={postCarouselIndex === post.carouselImages.length - 1}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <OptimizedImage 
                        src={post.imagem} 
                        alt={post.titulo}
                        className="w-full h-full object-cover"
                        onError={() => {
                          loopDetection.detectImageLoad(post.imagem)
                          console.error('Erro ao carregar imagem:', post.imagem)
                        }}
                      />
                    )
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-muted-foreground text-center">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">Sem mídia</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ações do Post */}
                <div className="p-4 px-4 sm:px-6 lg:px-8">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex gap-4">
                      <LikeButton postId={post.id} />
                      <CommentCount 
                        postId={post.id} 
                        postTitle={post.titulo} 
                        onToggleComments={() => handleOpenCommentModal(post)}
                      />
                      <ShareButton 
                        postId={post.id} 
                        postTitle={post.titulo}
                        postUrl={`${window.location.origin}/post/${post.id}`}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <FavoriteButton postId={post.id} />
                    </div>
                  </div>

                  {/* Título e Descrição */}
                  <div className="mb-2">
                    <p className="text-sm">
                      <span className="font-semibold">@{post.nickname}</span>{" "}
                      <span className="font-semibold">{post.titulo}</span>{" "}
                      {post.descricao}
                    </p>
                    {/* Badge de categoria abaixo da descrição */}
                    <Badge variant="secondary" className="text-xs mt-2">
                      {typeof post.categoria === 'string' ? post.categoria : 
                       typeof post.categoria === 'object' && post.categoria?.name ? post.categoria.name : 
                       'Categoria'}
                    </Badge>
                  </div>

                  {/* Campo de comentário original */}
                  <CommentInput postId={post.id} />
                </div>
              </div>
            ))
          )}
        </div>

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
                Desbloqueie Mais Posts!
              </h3>
              
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Você está vendo apenas uma prévia dos nossos posts. Cadastre-se gratuitamente para explorar todo o BeautyWall, interagir com posts, seguir profissionais e descobrir trabalhos incríveis!
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
                ✨ Mais de 5000+ posts • 🔒 100% gratuito • 🚀 Cadastro em 2 minutos
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading mais posts e mensagem de fim (apenas para usuários logados) */}
        {user && (
          <div className="text-center mt-8">
            {postsLoading && postsParaExibir.length > 0 ? (
              <div className="py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-muted-foreground text-sm">Carregando mais posts...</p>
              </div>
            ) : !hasMore && postsParaExibir.length > 0 ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  ✨ Você viu todos os posts encontrados!
                </p>
                <p className="text-xs mt-2 text-muted-foreground">
                  {filters.search || filters.category || filters.postType
                    ? "💡 Dica: Tente ajustar os filtros para descobrir mais posts incríveis"
                    : "🎉 Novos posts são adicionados regularmente à comunidade"
                  }
                </p>
                {(filters.search || filters.category || filters.postType) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearSearch}
                    className="mt-3 text-xs"
                  >
                    Limpar filtros e ver todos os posts
                  </Button>
                )}
              </div>
            ) : null}
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
              {selectedPost?.type === 'author' ? 'Ver Perfil Completo' : 
               selectedPost?.type === 'comments' ? 'Ver Comentários' : 
               'Ver Post Completo'}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              {selectedPost?.type === 'author' ? `Para ver o perfil completo de ${selectedPost?.autor} e interagir com a comunidade, você precisa estar logado.` :
               selectedPost?.type === 'comments' ? `Para ver e adicionar comentários no post de ${selectedPost?.autor}, você precisa estar logado.` :
               `Para ver o post completo de ${selectedPost?.autor} e interagir com a comunidade, você precisa estar logado.`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-card rounded-lg border border-primary/10">
              <h4 className="font-semibold mb-2">O que você vai descobrir:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>✨ Posts completos</div>
                <div>💬 Comentar</div>
                <div>❤️ Curtir</div>
                <div>👤 Perfis detalhados</div>
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

      {/* Modal de comentários Instagram */}
      {selectedPostForComments && (
        <InstagramCommentModal
          isOpen={showCommentModal}
          onClose={() => {
            setShowCommentModal(false)
            setSelectedPostForComments(null)
          }}
          postId={selectedPostForComments.id}
          postTitle={selectedPostForComments.titulo}
          postAuthor={{
            nickname: selectedPostForComments.nickname,
            name: selectedPostForComments.autor,
            profile_photo: selectedPostForComments.avatar
          }}
        />
      )}

      {/* Modal para imagem ampliada */}
      <Dialog open={showImageModal} onOpenChange={setShowImageModal}>
        <DialogContent className="sm:max-w-none w-full h-full max-h-none p-0 bg-black/95">
          <div className="relative w-full h-full flex flex-col">
            {/* Header do modal */}
            <div className="flex items-center justify-between p-4 bg-black/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Badge 
                  variant="outline" 
                  className={`text-sm font-semibold ${
                    carouselPosition === 0 
                      ? 'bg-red-500 text-white border-red-500' 
                      : 'bg-green-500 text-white border-green-500'
                  }`}
                >
                  {carouselPosition === 0 ? 'ANTES' : 'DEPOIS'}
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCloseImageModal}
                className="h-8 w-8 text-white hover:bg-white/10"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            {/* Carrossel de imagens */}
            <div 
              className="flex-1 relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {beforeAfterImages && (
                <div 
                  className="flex h-full transition-transform duration-300 ease-in-out"
                  style={{ 
                    transform: `translateX(calc(-${carouselPosition * 100}% + ${dragOffset}%))`,
                    transition: isSwiping ? 'none' : 'transform 0.3s ease-in-out'
                  }}
                >
                  {/* Imagem ANTES */}
                  <div className="w-full h-full flex-shrink-0 flex items-center justify-center p-4">
                    <img 
                      src={beforeAfterImages.before.url} 
                      alt="Antes"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        console.error('Erro ao carregar imagem antes:', beforeAfterImages.before.url)
                      }}
                    />
                  </div>
                  
                  {/* Imagem DEPOIS */}
                  <div className="w-full h-full flex-shrink-0 flex items-center justify-center p-4">
                    <img 
                      src={beforeAfterImages.after.url} 
                      alt="Depois"
                      className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        console.error('Erro ao carregar imagem depois:', beforeAfterImages.after.url)
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Setas de navegação (apenas em telas maiores) */}
              <div className="absolute inset-0 pointer-events-none hidden md:block">
                {/* Seta esquerda */}
                <button
                  onClick={handlePrevImage}
                  className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-50 ${
                    carouselPosition === 0 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                  }`}
                  disabled={carouselPosition === 0}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {/* Seta direita */}
                <button
                  onClick={handleNextImage}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-auto bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-colors z-50 ${
                    carouselPosition === 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100'
                  }`}
                  disabled={carouselPosition === 1}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Footer do modal */}
            <div className="p-4 bg-black/50 backdrop-blur-sm text-center">
              <p className="text-white/80 text-sm md:hidden">
                Deslize para comparar as imagens
              </p>
              <p className="text-white/80 text-sm hidden md:block">
                Use as setas para navegar
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para novo post */}
      <NewPostModal
        isOpen={showNewPostModal}
        onClose={handleCloseNewPostModal}
        currentStep={currentStep}
        postData={postData}
        onStepChange={handleStepChange}
        onPostDataChange={handlePostDataChange}
        onErrorsChange={handleErrorsChange}
        errors={errors}
      />

      {/* Modal para vídeo */}
      <VideoModal
        videoUrl={selectedVideo}
        isOpen={showVideoModal}
        onClose={handleCloseVideoModal}
      />
    </div>
  );
};

export default BeautyWall;