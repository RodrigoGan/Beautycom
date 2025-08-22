import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { QrCode, Share2, Edit3, Heart, Users, UserPlus, MessageSquare, MapPin, Phone, Mail, Instagram, Facebook, Youtube, Linkedin, Sparkles, Star, Bookmark, ArrowLeftRight, Building2, ArrowLeft, Camera, ImageIcon, UserCheck, ChevronLeft, ChevronRight } from "lucide-react"
import { useAuthContext } from "@/contexts/AuthContext"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/Header"
import { useToast } from "@/hooks/use-toast"
import { useSalons } from "@/hooks/useSalons"
import { useSalonStats } from "@/hooks/useSalonStats"
import { useSalonPermissions } from "@/hooks/useSalonPermissions"
import { useSalonMainPosts } from "@/hooks/useSalonMainPosts"
import { SalonMainPostButton } from "@/components/SalonMainPostButton"
import { SalonPostsFilter } from "@/components/SalonPostsFilter"
import { PostModal } from "@/components/PostModal"
import SalonProfileEditor from "@/components/SalonProfileEditor"
import { SalonSocialMediaEditor } from "@/components/SalonSocialMediaEditor"
import SalonBioEditor from "@/components/SalonBioEditor"
import SalonPhotoEditor from "@/components/SalonPhotoEditor"
import { SalonFollowModal } from '@/components/SalonFollowModal'

import { SalonClientsModal } from '@/components/SalonClientsModal'
import { SalonPostsModal } from '@/components/SalonPostsModal'
import { QRCodeModal } from '@/components/QRCodeModal'
import { SalonEmployeeManager } from '@/components/SalonEmployeeManager'
import { SalonProfessionalManager } from '@/components/SalonProfessionalManager'
import { SalonSkills } from '@/components/SalonSkills'

const SalonProfile = () => {
  const { user } = useAuthContext()
  const { id } = useParams()
  const navigate = useNavigate()
  const { fetchSalonById } = useSalons()
  const { toast } = useToast()
  
  const [salon, setSalon] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showPostModal, setShowPostModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [socialLinkLoading, setSocialLinkLoading] = useState<string | null>(null)
  const [showQRCodeModal, setShowQRCodeModal] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [showSocialMediaEditor, setShowSocialMediaEditor] = useState(false)
  const [showBioEditor, setShowBioEditor] = useState(false)
  const [showPhotoEditor, setShowPhotoEditor] = useState(false)
  
  // Estados para posts do salão
  const [salonPosts, setSalonPosts] = useState<any[]>([])
  const [filteredPosts, setFilteredPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)
  
  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(12)
  const [totalPosts, setTotalPosts] = useState(0)
  
  // Estados dos filtros
  const [activeFilters, setActiveFilters] = useState({
    professionals: [] as string[],
    searchText: '',
    categories: [] as string[]
  })



  // Estados para modais de métricas
  const [showFollowModal, setShowFollowModal] = useState(false)

  const [showClientsModal, setShowClientsModal] = useState(false)
  const [showPostsModal, setShowPostsModal] = useState(false)

  // Verificar se é o próprio salão
  const isOwnSalon = user?.id === salon?.owner_id

  // Buscar estatísticas do salão
  const { stats: salonStats, loading: statsLoading, error: statsError } = useSalonStats(salon?.id || '')

  // Buscar permissões do usuário no salão
  const { hasPermission, isOwner, isEmployee } = useSalonPermissions(salon?.id || '')

  // Buscar posts principais do salão
  console.log('🏢 SalonProfile - salon?.id:', salon?.id, 'user?.id:', user?.id)
  console.log('🏢 SalonProfile - salon completo:', salon)
  
  const { 
    mainPosts: salonMainPosts, 
    loading: mainPostsLoading, 
    markAsMain, 
    unmarkAsMain,
    refetch: refetchMainPosts
  } = useSalonMainPosts(salon?.id || '')

  // Estado para forçar refresh dos botões


  // Função para abrir link de rede social
  const openSocialLink = (platform: string, username: string) => {
    if (!username) return
    
    setSocialLinkLoading(platform)
    const cleanUsername = username.replace('@', '')
    let webUrl = ''
    let appUrl = ''

    switch (platform) {
      case 'instagram':
        webUrl = `https://www.instagram.com/${cleanUsername}`
        appUrl = `instagram://user?username=${cleanUsername}`
        break
      case 'facebook':
        webUrl = `https://www.facebook.com/${cleanUsername}`
        appUrl = `fb://profile/${cleanUsername}`
        break
      case 'youtube':
        webUrl = `https://www.youtube.com/@${cleanUsername}`
        appUrl = `youtube://www.youtube.com/@${cleanUsername}`
        break
      case 'linkedin':
        webUrl = `https://www.linkedin.com/in/${cleanUsername}`
        appUrl = `linkedin://in/${cleanUsername}`
        break
      case 'x':
        webUrl = `https://x.com/${cleanUsername}`
        appUrl = `twitter://user?screen_name=${cleanUsername}`
        break
      case 'tiktok':
        webUrl = `https://www.tiktok.com/@${cleanUsername}`
        appUrl = `tiktok://user/${cleanUsername}`
        break
    }

    // Verificar se estamos no mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)

    if (isMobile) {
      // No mobile, tenta abrir o app primeiro
      const tryOpenApp = () => {
        const iframe = document.createElement('iframe')
        iframe.style.display = 'none'
        iframe.src = appUrl
        document.body.appendChild(iframe)
        
        // Remove o iframe após um tempo
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe)
          }
        }, 1000)
      }

      // Tenta abrir apenas o app nativo
      tryOpenApp()
    } else {
      // No desktop, abre diretamente no navegador
      window.open(webUrl, '_blank')
    }
    
    // Reset do loading após um tempo
    setTimeout(() => {
      setSocialLinkLoading(null)
    }, 500)
  }

  // Função para aplicar filtros
  const applyFilters = (posts: any[], filters: typeof activeFilters) => {
    console.log('🔍 Aplicando filtros:', filters)
    console.log('📝 Posts antes da filtragem:', posts.length)
    
    const filteredPosts = posts.filter(post => {
      // Filtro por profissionais
      if (filters.professionals.length > 0 && !filters.professionals.includes(post.user_id)) {
        console.log('❌ Post filtrado por profissional:', post.titulo, 'user_id:', post.user_id)
        return false
      }
      
      // Filtro por texto de busca
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase()
        const titleMatch = post.titulo?.toLowerCase().includes(searchLower)
        const descMatch = post.descricao?.toLowerCase().includes(searchLower)
        const authorMatch = post.user?.name?.toLowerCase().includes(searchLower)
        
        // Busca por @profissional
        if (filters.searchText.startsWith('@')) {
          const professionalName = filters.searchText.slice(1).toLowerCase()
          if (!authorMatch) {
            console.log('❌ Post filtrado por busca @profissional:', post.titulo)
            return false
          }
        } else {
          if (!titleMatch && !descMatch && !authorMatch) {
            console.log('❌ Post filtrado por busca de texto:', post.titulo)
            return false
          }
        }
      }
      
      // Filtro por categoria
      if (filters.categories.length > 0) {
        console.log('🔍 Verificando categoria do post:', post.titulo, 'category_id:', post.category_id, 'filtros:', filters.categories)
        if (!filters.categories.includes(post.category_id)) {
          console.log('❌ Post filtrado por categoria:', post.titulo, 'category_id:', post.category_id)
          return false
        }
      }
      
      return true
    })
    
    console.log('✅ Posts após filtragem:', filteredPosts.length)
    return filteredPosts
  }

  // Função para forçar refresh dos posts principais
  const handleForceRefresh = () => {
    console.log('🔄 Forçando refresh dos posts principais...')
    refetchMainPosts()
  }

  // Função para gerenciar posts principais
  const handleMainPostToggle = async (postId: string): Promise<boolean> => {
    console.log('🎯 Toggle post principal:', postId)
    
    const isMain = salonMainPosts.some(mp => mp.id === postId)
    console.log('🔍 Post é principal?', isMain)
    
    try {
      const result = isMain ? await unmarkAsMain(postId) : await markAsMain(postId)
      console.log(`✅ Operação ${isMain ? 'remoção' : 'adição'} concluída:`, result)
      
      // Forçar refresh dos posts principais após a operação
      if (result) {
        console.log('🔄 Forçando refresh dos posts principais...')
        setTimeout(() => {
          refetchMainPosts()
        }, 500) // Pequeno delay para garantir que o banco foi atualizado
      }
      
      return result
    } catch (error) {
      console.error('💥 Erro ao alterar post principal:', error)
      return false
    }
  }

  // Função para buscar posts do salão
  const fetchSalonPosts = async (page: number = 1) => {
    if (!salon?.id) {
      console.log('❌ Nenhum salão encontrado para buscar posts')
      setSalonPosts([])
      return
    }
    
    console.log('🔍 Buscando posts do salão:', salon.id, 'página:', page)
    setPostsLoading(true)
    setPostsError(null)
    
    try {
      // Primeiro, buscar profissionais vinculados ao salão
      console.log('👥 Buscando profissionais vinculados ao salão...')
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('salon_professionals')
        .select('professional_id')
        .eq('salon_id', salon.id)
        .eq('status', 'accepted')

      if (professionalsError) {
        console.error('❌ Erro ao buscar profissionais:', professionalsError)
        setPostsError('Erro ao carregar posts')
        setSalonPosts([])
        return
      }

      console.log('📊 Profissionais encontrados:', professionalsData?.length || 0, professionalsData)

      if (!professionalsData || professionalsData.length === 0) {
        console.log('⚠️ Nenhum profissional vinculado ao salão')
        setSalonPosts([])
        setTotalPosts(0)
        setPostsLoading(false)
        return
      }

      // Buscar posts dos profissionais vinculados
      const professionalIds = professionalsData.map(p => p.professional_id)
      console.log('🔍 Buscando posts dos profissionais:', professionalIds)
      
      // Calcular offset para paginação
      const offset = (page - 1) * postsPerPage
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_user_id_fkey(nickname, email, name, profile_photo),
          category:categories!posts_category_id_fkey(name)
        `)
        .in('user_id', professionalIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + postsPerPage - 1)

      if (error) {
        console.error('❌ Erro ao buscar posts:', error)
        setPostsError('Erro ao carregar posts')
        setSalonPosts([])
        return
      }

      console.log('📝 Posts encontrados:', data?.length || 0, data)

      // Buscar total de posts para paginação
      const { count: totalCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .in('user_id', professionalIds)
        .eq('is_active', true)

      setTotalPosts(totalCount || 0)
      console.log('📊 Total de posts:', totalCount)

      // Processar posts para exibição
      const processedPosts = (data || []).map(post => {
        let imagemUrl = ''
        let isVideo = false
        let isCarousel = false
        let isBeforeAfter = false
        let carouselImages: string[] = []
        let beforeUrl = ''
        let afterUrl = ''

        // Processar diferentes tipos de posts
        switch (post.post_type) {
          case 'normal':
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
              const firstMedia = post.media_urls.media[0]
              imagemUrl = firstMedia.url
              isVideo = firstMedia.type === 'video' || (imagemUrl && (imagemUrl.includes('.mp4') || imagemUrl.includes('.mov') || imagemUrl.includes('.avi')))
            } else if (post.media_urls && post.media_urls.url) {
              imagemUrl = post.media_urls.url
              isVideo = imagemUrl && (imagemUrl.includes('.mp4') || imagemUrl.includes('.mov') || imagemUrl.includes('.avi'))
            }
            break
            
          case 'carousel':
            isCarousel = true
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
              carouselImages = post.media_urls.media.map((media: any) => media.url)
              imagemUrl = carouselImages[0]
            }
            break
            
          case 'before-after':
            isBeforeAfter = true
            console.log('🔍 Processando post antes/depois:', post.title, 'media_urls:', post.media_urls)
            
            // Verificar estrutura com media array
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length >= 2) {
              beforeUrl = post.media_urls.media[0].url
              afterUrl = post.media_urls.media[1].url
              imagemUrl = afterUrl
              console.log('✅ URLs antes/depois encontradas (media array):', { beforeUrl, afterUrl })
            } else if (post.media_urls && post.media_urls.beforeAfter) {
              beforeUrl = post.media_urls.beforeAfter.before
              afterUrl = post.media_urls.beforeAfter.after
              imagemUrl = afterUrl
              console.log('✅ URLs antes/depois encontradas (beforeAfter):', { beforeUrl, afterUrl })
            } else if (post.media_urls && post.media_urls.before && post.media_urls.after) {
              beforeUrl = post.media_urls.before
              afterUrl = post.media_urls.after
              imagemUrl = afterUrl
              console.log('✅ URLs antes/depois encontradas (before/after):', { beforeUrl, afterUrl })
            } else {
              console.log('❌ URLs antes/depois não encontradas para:', post.title, 'Estrutura:', post.media_urls)
            }
            break
            
          case 'video':
            isVideo = true
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
              const videoMedia = post.media_urls.media.find((media: any) => media.type === 'video')
              if (videoMedia) {
                imagemUrl = videoMedia.url
              }
            } else if (post.media_urls && post.media_urls.url) {
              imagemUrl = post.media_urls.url
            }
            break
        }

        // Adicionar timestamp para cache busting
        if (imagemUrl && imagemUrl.includes('supabase.co')) {
          const baseUrl = imagemUrl.split('?')[0]
          imagemUrl = baseUrl + '?v=' + Date.now()
        }

        return {
          id: post.id,
          titulo: post.title,
          descricao: post.description,
          categoria: post.category?.name || 'Sem categoria',
          category_id: post.category_id, // Preservar o ID da categoria para filtragem
          post_type: post.post_type,
          imagem: imagemUrl,
          isVideo,
          isCarousel,
          isBeforeAfter,
          carouselImages,
          beforeUrl,
          afterUrl,
          created_at: post.created_at,
          tempo: formatTimeAgo(post.created_at),
          user_id: post.user_id,
          user: post.user || post.author
        }
      })

      setSalonPosts(processedPosts)
    } catch (error) {
      console.error('Erro ao buscar posts:', error)
      setPostsError('Erro ao carregar posts')
      setSalonPosts([])
    } finally {
      setPostsLoading(false)
    }
  }



  // Função para transformar post principal para o formato do modal
  const transformMainPostForModal = (mainPost: any) => {
    let imagemUrl = ''
    let isVideo = false
    let isCarousel = false
    let isBeforeAfter = false
    let carouselImages: string[] = []
    let beforeUrl = ''
    let afterUrl = ''

    // Processar media_urls baseado no tipo
    if (mainPost.media_urls && typeof mainPost.media_urls === 'object') {
      const mediaObj = mainPost.media_urls

      if (mediaObj.type === 'before-after' && mediaObj.media && mediaObj.media.length >= 2) {
        isBeforeAfter = true
        beforeUrl = mediaObj.media[0].url
        afterUrl = mediaObj.media[1].url
        imagemUrl = afterUrl // Usar a imagem "depois" como principal
      } else if (mediaObj.media && mediaObj.media.length > 0) {
        if (mediaObj.media.length > 1) {
          isCarousel = true
          carouselImages = mediaObj.media.map((m: any) => m.url)
          imagemUrl = carouselImages[0]
        } else {
          imagemUrl = mediaObj.media[0].url
          isVideo = mediaObj.media[0].type === 'video'
        }
      }
    }

    return {
      id: mainPost.id,
      titulo: mainPost.title,
      descricao: mainPost.description,
      categoria: 'Sem categoria', // Fallback
      post_type: mainPost.post_type,
      imagem: imagemUrl,
      isVideo,
      isCarousel,
      isBeforeAfter,
      carouselImages,
      beforeUrl,
      afterUrl,
      created_at: mainPost.created_at,
      tempo: formatTimeAgo(mainPost.created_at),
      user_id: mainPost.user_id,
      user: mainPost.author || { name: 'Usuário', nickname: 'Usuário', profile_photo: null }
    }
  }

  // Função para formatar tempo relativo
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'agora'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d`
    return `${Math.floor(diffInSeconds / 2592000)}m`
  }

  // Funções de navegação da paginação
  const goToPage = (page: number) => {
    if (page >= 1 && page <= Math.ceil(totalPosts / postsPerPage)) {
      setCurrentPage(page)
    }
  }

  const goToNextPage = () => {
    const nextPage = currentPage + 1
    if (nextPage <= Math.ceil(totalPosts / postsPerPage)) {
      setCurrentPage(nextPage)
    }
  }

  const goToPreviousPage = () => {
    const prevPage = currentPage - 1
    if (prevPage >= 1) {
      setCurrentPage(prevPage)
    }
  }

  const totalPages = Math.ceil(totalPosts / postsPerPage)

  // Carregar dados do salão
  useEffect(() => {
    const loadSalon = async () => {
      if (!id) return

      try {
        setLoading(true)
        const result = await fetchSalonById(id)
        
        if (result.success) {
          console.log('✅ Salon carregado com sucesso:', result.data?.id)
          setSalon(result.data)
        } else {
          toast({
            title: "Erro",
            description: "Salão não encontrado",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Erro ao carregar salão:', error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar o salão",
          variant: "destructive"
        })
      } finally {
        setLoading(false)
      }
    }

    loadSalon()
  }, [id, fetchSalonById, toast])

  // Buscar posts quando o salão mudar
  useEffect(() => {
    if (salon?.id) {
      fetchSalonPosts(currentPage)
    }
  }, [salon?.id, currentPage])

  // Aplicar filtros quando posts ou filtros mudarem
  useEffect(() => {
    setFilteredPosts(applyFilters(salonPosts, activeFilters))
  }, [salonPosts, activeFilters])



  // Função para recarregar dados do salão após edição
  const handleProfileUpdated = () => {
    // Recarregar dados do salão
    const loadSalon = async () => {
      if (!id) return
      try {
        const result = await fetchSalonById(id)
        if (result.success) {
          setSalon(result.data)
        }
      } catch (error) {
        console.error('Erro ao recarregar salão:', error)
      }
    }
    loadSalon()
  }

  // Função para recarregar dados após edição de redes sociais
  const handleSocialMediaUpdated = () => {
    handleProfileUpdated()
  }

  // Função para recarregar dados após edição de bio
  const handleBioUpdated = () => {
    handleProfileUpdated()
  }

  // Função para recarregar dados após edição de fotos
  const handlePhotoUpdated = () => {
    handleProfileUpdated()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="pt-20 pb-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando salão...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!salon) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="pt-20 pb-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>
            </div>
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Salão não encontrado</h2>
                <p className="text-muted-foreground mb-4">
                  O salão que você está procurando não existe ou foi removido.
                </p>
                <Button onClick={() => navigate('/')}>
                  Voltar ao início
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="pt-20 pb-8 relative overflow-hidden">
        {/* Elementos decorativos sutis */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-32 right-10 animate-pulse">
            <Sparkles className="h-6 w-6 text-primary/10" />
          </div>
          <div className="absolute top-64 left-8 animate-bounce delay-300">
            <Star className="h-4 w-4 text-secondary/10" />
          </div>
          <div className="absolute bottom-32 right-20 animate-pulse delay-500">
            <Sparkles className="h-5 w-5 text-accent/10" />
          </div>
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative z-10">
          {/* Card do Perfil */}
          <Card className="mb-6 bg-gradient-card border-primary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300 overflow-hidden">
            {/* Foto de Capa */}
            <div className="relative h-48 bg-gradient-to-br from-purple-500 to-pink-500">
              {salon?.cover_photo ? (
                <img
                  src={`${salon.cover_photo}?v=${Date.now()}`}
                  alt="Foto de capa"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="h-16 w-16 text-white/50" />
                </div>
              )}
              {/* Overlay gradiente sutil */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
            
            {/* Conteúdo do Perfil */}
            <CardContent className="p-6 relative">
              {/* Avatar posicionado sobre a foto de capa */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative -mt-16 sm:-mt-20">
                  <Avatar className="w-24 h-24 sm:w-28 sm:h-28 ring-4 ring-white shadow-beauty">
                    <AvatarImage src={salon?.profile_photo || ''} />
                    <AvatarFallback className="text-2xl bg-gradient-hero text-white">
                      <Building2 className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="flex-1 text-center sm:text-left mt-4 sm:mt-0">
                  <h1 className="text-2xl font-bold">{salon?.name || 'Salão'}</h1>
                  <p className="text-muted-foreground">Salão/Estúdio</p>
                  <Badge variant="secondary" className="mt-2">
                    Salão/Estúdio
                  </Badge>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{salon?.cidade && salon?.uf ? `${salon.cidade}, ${salon.uf}` : 'Localização não informada'}</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowQRCodeModal(true)}
                    title="Ver QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    title="Compartilhar"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  {hasPermission('salon_info.edit_photos') && (
                    <Button 
                      variant="outline" 
                      size="icon"
                      title="Editar fotos"
                      onClick={() => setShowPhotoEditor(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission('salon_info.edit_basic_info') ? (
                    <Button 
                      variant="outline" 
                      size="icon"
                      title="Editar salão"
                      onClick={() => setShowProfileEditor(true)}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button 
                      variant="hero"
                      size="sm"
                      className="px-4"
                    >
                      <Phone className="h-4 w-4 mr-2" />
                      Contatar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redes Sociais */}
          <Card className="mb-6 bg-gradient-card border-secondary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Redes Sociais</CardTitle>
                {hasPermission('salon_info.edit_social_media') && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowSocialMediaEditor(true)}
                    className="text-xs"
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {/* Seguidores - Clicável apenas para o dono do salão */}
                <Button 
                  variant="ghost" 
                  className="flex-col h-auto p-3"
                  onClick={isOwnSalon ? () => setShowFollowModal(true) : undefined}
                  disabled={!isOwnSalon}
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">
                    {statsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      salonStats.followers.toLocaleString()
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Seguidores</span>
                </Button>
                
                {/* Profissionais - Clicável apenas para o dono do salão */}
                <Button 
                  variant="ghost" 
                  className="flex-col h-auto p-3"
                  disabled={!isOwnSalon}
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">
                    {statsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      salonStats.professionals.toLocaleString()
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Profissionais</span>
                </Button>
                
                {/* Clientes - Clicável apenas para o dono do salão */}
                <Button 
                  variant="ghost" 
                  className="flex-col h-auto p-3"
                  onClick={isOwnSalon ? () => setShowClientsModal(true) : undefined}
                  disabled={!isOwnSalon}
                >
                  <UserPlus className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">
                    {statsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      salonStats.clients.toLocaleString()
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Clientes</span>
                </Button>
                
                {/* Posts dos Profissionais - Clicável apenas para o dono do salão */}
                <Button 
                  variant="ghost" 
                  className="flex-col h-auto p-3"
                  onClick={isOwnSalon ? () => setShowPostsModal(true) : undefined}
                  disabled={!isOwnSalon}
                >
                  <ImageIcon className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">
                    {statsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      salonStats.posts.toLocaleString()
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Posts</span>
                </Button>
              </div>
              
              {/* Mensagem de erro se houver problemas */}
              {statsError && (
                <div className="text-center mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">
                    Erro ao carregar estatísticas: {statsError}
                  </p>
                </div>
              )}
              
              <div className="flex justify-center gap-2">
                {/* Instagram */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`transition-colors ${
                    salon?.social_instagram 
                      ? 'hover:bg-pink-50 hover:border-pink-300 text-pink-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (salon?.social_instagram) {
                      openSocialLink('instagram', salon.social_instagram)
                    }
                  }}
                  disabled={!salon?.social_instagram || socialLinkLoading === 'instagram'}
                >
                  {socialLinkLoading === 'instagram' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Instagram className="h-4 w-4" />
                  )}
                </Button>

                {/* Facebook */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`transition-colors ${
                    salon?.social_facebook 
                      ? 'hover:bg-blue-50 hover:border-blue-300 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (salon?.social_facebook) {
                      openSocialLink('facebook', salon.social_facebook)
                    }
                  }}
                  disabled={!salon?.social_facebook || socialLinkLoading === 'facebook'}
                >
                  {socialLinkLoading === 'facebook' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Facebook className="h-4 w-4" />
                  )}
                </Button>

                {/* YouTube */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`transition-colors ${
                    salon?.social_youtube 
                      ? 'hover:bg-red-50 hover:border-red-300 text-red-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (salon?.social_youtube) {
                      openSocialLink('youtube', salon.social_youtube)
                    }
                  }}
                  disabled={!salon?.social_youtube || socialLinkLoading === 'youtube'}
                >
                  {socialLinkLoading === 'youtube' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Youtube className="h-4 w-4" />
                  )}
                </Button>

                {/* LinkedIn */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`transition-colors ${
                    salon?.social_linkedin 
                      ? 'hover:bg-blue-50 hover:border-blue-300 text-blue-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (salon?.social_linkedin) {
                      openSocialLink('linkedin', salon.social_linkedin)
                    }
                  }}
                  disabled={!salon?.social_linkedin || socialLinkLoading === 'linkedin'}
                >
                  {socialLinkLoading === 'linkedin' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <Linkedin className="h-4 w-4" />
                  )}
                </Button>

                {/* X (Twitter) */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`transition-colors ${
                    salon?.social_x 
                      ? 'hover:bg-black/5 hover:border-gray-300 text-black' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (salon?.social_x) {
                      openSocialLink('x', salon.social_x)
                    }
                  }}
                  disabled={!salon?.social_x || socialLinkLoading === 'x'}
                >
                  {socialLinkLoading === 'x' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                </Button>

                {/* TikTok */}
                <Button
                  variant="outline"
                  size="icon"
                  className={`transition-colors ${
                    salon?.social_tiktok 
                      ? 'hover:bg-pink-50 hover:border-pink-300 text-pink-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (salon?.social_tiktok) {
                      openSocialLink('tiktok', salon.social_tiktok)
                    }
                  }}
                  disabled={!salon?.social_tiktok || socialLinkLoading === 'tiktok'}
                >
                  {socialLinkLoading === 'tiktok' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Descrição */}
          <Card className="mb-6 bg-gradient-card border-accent/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
            <CardHeader>
                             <CardTitle className="flex items-center justify-between">
                 Sobre {salon?.name || 'o salão'}
                                  {hasPermission('salon_info.edit_description') && (
                    <Button variant="ghost" size="icon" onClick={() => setShowBioEditor(true)}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
               </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {salon?.description || 'Este salão ainda não adicionou uma descrição.'}
              </p>
            </CardContent>
          </Card>

          {/* Meus Funcionários - Apenas para quem tem permissão */}
          {hasPermission('manage_employees.view') && (
            <SalonEmployeeManager salonId={salon?.id || ''} />
          )}

          {/* Meus Profissionais - Conforme permissões */}
          {hasPermission('manage_service_professionals.view') && (
            <SalonProfessionalManager 
              salonId={salon.id}
              forcePermissions={{
                canView: hasPermission('manage_service_professionals.view'),
                canAdd: hasPermission('manage_service_professionals.add'),
                canRemove: hasPermission('manage_service_professionals.remove'),
                isOwner: isOwner()
              }}
            />
          )}
          


          {/* Habilidades dos Profissionais */}
          <SalonSkills salonId={salon.id} />

          {/* Posts */}
          <Card className="mb-6 bg-gradient-card border-secondary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
            <CardHeader>
              <CardTitle>
                Posts dos Profissionais
                {isOwnSalon && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Principais: {salonMainPosts.length}/3)
                  </span>
                )}
                {filteredPosts.length !== salonPosts.length && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    • {filteredPosts.length} de {salonPosts.length} posts
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                Posts dos profissionais vinculados ao salão
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Seção de Posts Principais */}
              {(
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Posts Principais do Salão
                  </h3>
                  <div className="grid grid-cols-3 gap-4">

                    
                    {/* Sempre mostrar 3 espaços - preenchidos ou vazios */}
                    {[1, 2, 3].map((position) => {
                      const mainPost = salonMainPosts.find(mp => mp.salon_main_post_priority === position)

                      if (mainPost) {
                        // Post principal existente
                        return (
                          <div
                            key={`main-${mainPost.id}`}
                            className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group relative"
                            onClick={() => {
                              // Transformar o post para o formato esperado pelo modal
                              const transformedPost = transformMainPostForModal(mainPost)
                              setSelectedPost(transformedPost)
                              setShowPostModal(true)
                            }}
                          >
                                                          {/* Conteúdo do post principal */}
                              {(() => {
                                // Verificar se há media_urls
                                if (!mainPost.media_urls) {
                                  return (
                                    <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                      <span className="text-gray-500 text-sm">Sem imagem</span>
                                    </div>
                                  )
                                }

                                // Se media_urls é um objeto parseado
                                if (typeof mainPost.media_urls === 'object' && mainPost.media_urls !== null) {
                                  const mediaObj = mainPost.media_urls as any

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
                                             alt={mainPost.title}
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

                                  // Fallback para estrutura antiga
                                  if (mediaObj.urls && Array.isArray(mediaObj.urls) && mediaObj.urls.length > 0) {
                                    return (
                                      <div className="relative w-full h-full">
                                        <img
                                          src={mediaObj.urls[0]}
                                          alt={mainPost.title}
                                          className="w-full h-full object-cover rounded-lg"
                                        />
                                        {mediaObj.urls.length > 1 && (
                                          <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded text-center font-semibold shadow-sm">
                                            {mediaObj.urls.length}
                                          </div>
                                        )}
                                      </div>
                                    )
                                  }
                                }

                                // Fallback
                                return (
                                  <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-500 text-sm">Sem imagem</span>
                                  </div>
                                )
                              })()}

                            {/* Indicadores de tipo de post */}
                            <div className="absolute top-2 right-2 flex gap-1">
                              {/* Indicadores serão adicionados quando soubermos os nomes corretos das colunas */}
                            </div>

                            {/* Botão de Post Principal */}
                            <div
                              className="absolute bottom-2 right-2 z-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <SalonMainPostButton
                                postId={mainPost.id}
                                isMain={true}
                                onToggle={handleMainPostToggle}
                                className="text-yellow-400 hover:text-yellow-300 bg-black/30 hover:bg-black/40 border-0"
                                hasPermission={hasPermission('content_management.manage_main_posts')}
                              />
                            </div>
                          </div>
                        )
                      } else {
                        // Espaço vazio
                        return (
                          <div
                            key={`empty-${position}`}
                            className="aspect-square bg-gradient-card rounded-lg overflow-hidden border-2 border-yellow-400/30 border-dashed flex flex-col items-center justify-center group relative cursor-pointer hover:border-yellow-400/50 transition-all duration-300"
                          >
                            {/* Estrela vazia no centro */}
                            <div className="flex flex-col items-center gap-2 text-center p-2">
                              <svg className="h-6 w-6 text-yellow-400/60 group-hover:text-yellow-400 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                              </svg>
                              <p className="text-xs text-muted-foreground font-medium leading-tight">
                                {position === 1 && "Escolha um post principal"}
                                {position === 2 && "Destaque o melhor trabalho"}
                                {position === 3 && "Selecione um post"}
                              </p>
                            </div>
                          </div>
                        )
                      }
                    })}
                  </div>
                </div>
              )}

              {/* Separador visual */}
              {salonMainPosts.length > 0 && (
                <div className="border-t border-border/50 mb-6 pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Todos os Posts</h3>
                </div>
              )}

              {/* Filtro de Posts */}
              <SalonPostsFilter
                salonId={salon?.id || ''}
                onFilterChange={setActiveFilters}
                className="mb-6"
              />
              {/* Lista de Posts */}
              {postsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando posts...</p>
                </div>
              ) : postsError ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">{postsError}</p>
                </div>
              ) : filteredPosts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredPosts.map((post) => (
                    <div
                      key={post.id}
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group relative"
                      onClick={() => {
                        setSelectedPost(post)
                        setShowPostModal(true)
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-full h-full">
                        {post.isVideo ? (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                            <div className="text-white text-center">
                              <svg className="h-8 w-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z"/>
                              </svg>
                              <span className="text-sm">Vídeo</span>
                            </div>
                          </div>
                        ) : post.isCarousel ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                            <div className="text-white text-center">
                              <svg className="h-8 w-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M4 6h2v12H4zm3 0h2v12H7zm3 0h2v12h-2zm3 0h2v12h-2zm3 0h2v12h-2z"/>
                              </svg>
                              <span className="text-sm">Carrossel</span>
                            </div>
                          </div>
                        ) : post.isBeforeAfter ? (
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
                        ) : post.imagem ? (
                          <img
                            src={post.imagem}
                            alt={post.titulo}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                            <div className="text-white text-center">
                              <svg className="h-8 w-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                              </svg>
                              <span className="text-sm">Imagem</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Indicadores de tipo de post */}
                      <div className="absolute top-2 right-2 flex gap-1">
                        {post.isVideo && (
                          <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                        )}

                        {post.isCarousel && (
                          <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                            <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M4 6h2v12H4zm3 0h2v12H7zm3 0h2v12h-2zm3 0h2v12h-2zm3 0h2v12h-2z"/>
                            </svg>
                          </div>
                        )}

                        {post.isBeforeAfter && (
                          <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                            <ArrowLeftRight className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Botão de Post Principal (para proprietário e funcionários com permissão) */}
                      {(() => {
                        const canManageMainPosts = isOwnSalon || isOwner() || isEmployee
                        console.log('🔍 Verificando permissões para posts principais:', {
                          postId: post.id,
                          isOwnSalon,
                          isOwner: isOwner(),
                          isEmployee,
                          canManageMainPosts,
                          currentUserId: user?.id,
                          salonOwnerId: salon?.owner_id
                        })
                        return canManageMainPosts
                      })() && (
                        <div className="absolute bottom-2 right-2 z-10">
                          {(() => {
                            const isMain = salonMainPosts.some(mp => mp.id === post.id)
                            
                            console.log('🔍 Renderizando botão para post:', {
                              postId: post.id,
                              isMain,
                              totalMainPosts: salonMainPosts.length,
                              mainPostIds: salonMainPosts.map(mp => mp.id),
                              salonMainPosts: salonMainPosts
                            })
                            
                            return (
                              <SalonMainPostButton
                                postId={post.id}
                                isMain={isMain}
                                onToggle={handleMainPostToggle}
                                className="text-white/70 hover:text-white bg-black/20 hover:bg-black/30 border-0"
                                hasPermission={hasPermission('content_management.manage_main_posts')}
                              />
                            )
                          })()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : salonPosts.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <p className="text-muted-foreground">
                    {isOwnSalon 
                      ? "Ainda não há posts dos profissionais vinculados ao seu salão."
                      : "Este salão ainda não tem posts dos profissionais."
                    }
                  </p>
                  {isOwnSalon && (
                    <Button className="mt-4" onClick={() => navigate(`/gerenciar-profissionais/${salon.id}`)}>
                      Gerenciar Profissionais
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <svg className="h-12 w-12 text-muted-foreground mx-auto mb-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                  </svg>
                  <p className="text-muted-foreground">
                    Nenhum post encontrado com os filtros aplicados.
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setActiveFilters({ professionals: [], searchText: '', categories: [] })}
                  >
                    Limpar Filtros
                  </Button>
                </div>
              )}
              
              {/* Paginação */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = currentPage - 2 + i
                      }
                      
                      return (
                        <Button
                          key={pageNumber}
                          variant={currentPage === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => goToPage(pageNumber)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNumber}
                        </Button>
                      )
                    })}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Informações da paginação */}
              {totalPosts > 0 && (
                <div className="text-center text-sm text-muted-foreground mt-4">
                  Mostrando {((currentPage - 1) * postsPerPage) + 1} a {Math.min(currentPage * postsPerPage, totalPosts)} de {totalPosts} posts
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="mb-6 bg-gradient-card border-accent/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Telefone */}
                {salon?.phone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Telefone</p>
                      <p className="text-sm text-muted-foreground">{salon.phone}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.open(`tel:${salon.phone}`, '_self')
                      }}
                    >
                      Ligar
                    </Button>
                  </div>
                )}

                {/* WhatsApp */}
                {salon?.phone && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">{salon.phone}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const phoneNumber = salon.phone?.replace(/\D/g, '')
                        window.open(`https://wa.me/55${phoneNumber}`, '_blank')
                      }}
                    >
                      Enviar
                    </Button>
                  </div>
                )}

                {/* Email */}
                {salon?.email && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">E-mail</p>
                      <p className="text-sm text-muted-foreground">{salon.email}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.open(`mailto:${salon.email}`, '_self')
                      }}
                    >
                      Enviar
                    </Button>
                  </div>
                )}

                {/* Localização */}
                {(salon?.cidade || salon?.uf || salon?.logradouro || salon?.bairro) && (
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-orange-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Localização</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        {/* Endereço completo */}
                        {salon?.logradouro && (
                          <p>{salon.logradouro}{salon?.numero && `, ${salon.numero}`}</p>
                        )}
                        {salon?.complemento && (
                          <p>{salon.complemento}</p>
                        )}
                        {salon?.bairro && (
                          <p>{salon.bairro}</p>
                        )}
                        {(salon?.cidade || salon?.uf) && (
                          <p>
                            {salon.cidade && salon.uf 
                              ? `${salon.cidade}, ${salon.uf}`
                              : salon.cidade || salon.uf
                            }
                            {salon?.cep && ` - CEP: ${salon.cep}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        // Preparar para futura integração com Google Maps
                        const address = [
                          salon?.logradouro,
                          salon?.numero,
                          salon?.bairro,
                          salon?.cidade,
                          salon?.uf
                        ].filter(Boolean).join(', ')
                        
                        if (address) {
                          // Por enquanto, abre o Google Maps com o endereço
                          const encodedAddress = encodeURIComponent(address)
                          window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
                        }
                      }}
                      disabled={!salon?.cidade && !salon?.logradouro}
                    >
                      Ver no Maps
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Modal de Posts */}
          <PostModal
            post={selectedPost}
            isOpen={showPostModal}
            onClose={() => setShowPostModal(false)}
          />

                     {/* Modal de Edição do Perfil */}
           <SalonProfileEditor
             isOpen={showProfileEditor}
             onClose={() => setShowProfileEditor(false)}
             salon={salon}
             onProfileUpdated={handleProfileUpdated}
           />

           {/* Modal de Edição de Redes Sociais */}
           <SalonSocialMediaEditor
             isOpen={showSocialMediaEditor}
             salonId={salon?.id || ''}
             currentSocialMedia={{
               social_instagram: salon?.social_instagram,
               social_facebook: salon?.social_facebook,
               social_youtube: salon?.social_youtube,
               social_linkedin: salon?.social_linkedin,
               social_x: salon?.social_x,
               social_tiktok: salon?.social_tiktok
             }}
             onClose={() => setShowSocialMediaEditor(false)}
             onUpdate={handleSocialMediaUpdated}
           />

                       {/* Modal de Edição de Bio */}
            <SalonBioEditor
              isOpen={showBioEditor}
              onClose={() => setShowBioEditor(false)}
              salon={salon}
              onBioUpdated={handleBioUpdated}
            />

            {/* Modal de Edição de Fotos */}
            <SalonPhotoEditor
              isOpen={showPhotoEditor}
              onClose={() => setShowPhotoEditor(false)}
              salon={salon}
              onPhotoUpdated={handlePhotoUpdated}
            />

            {/* Modais de Métricas */}
            <SalonFollowModal
              isOpen={showFollowModal}
              onClose={() => setShowFollowModal(false)}
              salonId={salon?.id || ''}
              salonName={salon?.name || ''}
            />



            <SalonClientsModal
              isOpen={showClientsModal}
              onClose={() => setShowClientsModal(false)}
              salonId={salon?.id || ''}
              salonName={salon?.name || ''}
            />

            <SalonPostsModal
              isOpen={showPostsModal}
              onClose={() => setShowPostsModal(false)}
              salonId={salon?.id || ''}
              salonName={salon?.name || ''}
            />

            {/* Modal de QR Code */}
            <QRCodeModal
              isOpen={showQRCodeModal}
              onClose={() => setShowQRCodeModal(false)}
              user={salon}
            />
         </div>
       </div>
     </div>
   )
 }

 export default SalonProfile
