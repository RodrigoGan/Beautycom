import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { QrCode, Share2, Edit3, Heart, Users, UserPlus, MessageSquare, MapPin, Phone, Mail, Instagram, Facebook, Youtube, Linkedin, Sparkles, Star, Bookmark, ArrowLeftRight, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { BEAUTY_CATEGORIES } from "@/lib/constants"
import { ProfilePhotoUpload } from "@/components/ProfilePhotoUpload"
import { useAuthContext } from "@/contexts/AuthContext"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/Header"
import { useProfileStats } from "@/hooks/useProfileStats"
import { useFollows } from "@/hooks/useFollows"
import { SocialMediaEditor } from "@/components/SocialMediaEditor"
import { FollowModal } from "@/components/FollowModal"
import { UserActivityModal } from "@/components/UserActivityModal"
import { QRCodeModal } from "@/components/QRCodeModal"
import { ProfileShareButton } from "@/components/ProfileShareButton"
import { useToast } from "@/hooks/use-toast"
import ProfileEditor from "@/components/ProfileEditor"
import BioEditor from "@/components/BioEditor"
import SkillsEditor from "@/components/SkillsEditor"
import { PostModal } from "@/components/PostModal"
import { EmployeeInvites } from "@/components/EmployeeInvites"
import { ProfessionalInvites } from "@/components/ProfessionalInvites"
import { WorkplaceCard } from "@/components/WorkplaceCard"
import { ScheduleModal } from "@/components/ScheduleModal"
import { AgendaUnavailableModal } from "@/components/AgendaUnavailableModal"
import { useProfessionalAgendaStatus } from "@/hooks/useProfessionalAgendaStatus"

import { MainPostButton } from "@/components/MainPostButton"
import { useMainPosts } from "@/hooks/useMainPosts"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const Perfil = () => {
  const { user } = useAuthContext()
  const { userId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [profileUser, setProfileUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showSocialMediaEditor, setShowSocialMediaEditor] = useState(false)
  const [showFollowModal, setShowFollowModal] = useState(false)
  const [showActivityModal, setShowActivityModal] = useState(false)
  const [showQRCodeModal, setShowQRCodeModal] = useState(false)
  const [showProfileEditor, setShowProfileEditor] = useState(false)
  const [showBioEditor, setShowBioEditor] = useState(false)
  const [showSkillsEditor, setShowSkillsEditor] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [selectedPost, setSelectedPost] = useState<any>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [showAgendaUnavailableModal, setShowAgendaUnavailableModal] = useState(false)
  const [isModalTransitioning, setIsModalTransitioning] = useState(false)
  const [followModalType, setFollowModalType] = useState<'following' | 'followers'>('following')
  const [activityModalType, setActivityModalType] = useState<'favorites' | 'likes'>('favorites')
  const [modalTitle, setModalTitle] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [socialLinkLoading, setSocialLinkLoading] = useState<string | null>(null)
  
  // Determinar qual usuário mostrar
  const targetUserId = userId || user?.id
  
  // Verificar se é o próprio perfil
  const isOwnProfile = user?.id === targetUserId
  
  // Buscar categorias do usuário
  const [userCategories, setUserCategories] = useState<any[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  
  // Estados para posts do usuário
  const [userPosts, setUserPosts] = useState<any[]>([])
  const [postsLoading, setPostsLoading] = useState(false)
  const [postsError, setPostsError] = useState<string | null>(null)

  // Estados de paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [postsPerPage] = useState(12)
  const [totalPosts, setTotalPosts] = useState(0)

  // Estados para posts principais
  const [mainPosts, setMainPosts] = useState<any[]>([])
  const [mainPostsLoading, setMainPostsLoading] = useState(false)
  const [forceRefreshButtons, setForceRefreshButtons] = useState(0)

  // Usar dados do usuário correto - priorizar dados do banco
  const displayUser = profileUser || user
  


  // Função para buscar categorias do usuário
  const fetchUserCategories = async () => {
    if (!displayUser?.categories || displayUser.categories.length === 0) {
      setUserCategories([])
      return
    }
    
    setCategoriesLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, icon, color')
        .in('id', displayUser.categories)
        .order('name')

      if (error) {
        console.error('Erro ao buscar categorias:', error)
        setUserCategories([])
        return
      }

      setUserCategories(data || [])
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      setUserCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Função para buscar dados do usuário
  const fetchUserData = async () => {
    if (!targetUserId) {
      console.log('⚠️ targetUserId não disponível')
      return
    }
    
    try {
      console.log('🔍 Buscando dados do usuário:', targetUserId)
      setLoading(true)
      
      // Consulta simplificada - apenas dados básicos do usuário
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single()

      if (error) {
        console.error('❌ Erro na consulta:', error)
        throw error
      }
      
      console.log('✅ Dados do usuário encontrados:', data)
      
      if (data) {
        console.log('✅ Definindo dados do banco:', {
          name: data.name,
          nickname: data.nickname,
          user_type: data.user_type,
          cidade: data.cidade,
          uf: data.uf,
          profile_photo: data.profile_photo
        })
      setProfileUser(data)
      } else {
        console.log('⚠️ Usuário não encontrado no banco, usando dados básicos')
        setProfileUser(user)
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error)
      // Em caso de erro, usar dados básicos do Auth
      setProfileUser(user)
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados do usuário
  useEffect(() => {
    if (targetUserId) {
      console.log('🔄 useEffect executado, targetUserId:', targetUserId)
    fetchUserData()
    }
  }, [targetUserId, user?.id]) // Adicionar user?.id como dependência

  // Verificar status de follow quando o perfil carregar
  useEffect(() => {
    if (targetUserId && user?.id && !isOwnProfile) {
      checkFollowStatus()
    }
  }, [targetUserId, user?.id, isOwnProfile])

  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Função para recarregar dados após edição
  const handleSocialMediaUpdate = () => {
    fetchUserData()
  }

  // Determinar se é um profissional ou usuário comum
  const isProfessional = displayUser?.user_type === 'profissional'

  // Buscar categorias quando os dados do usuário mudarem
  useEffect(() => {
    if (displayUser) {
      fetchUserCategories()
    }
  }, [displayUser?.categories])

  // Função para buscar posts do usuário
  const fetchUserPosts = async (page: number = 1) => {
    if (!targetUserId) {
      setUserPosts([])
      return
    }
    
    setPostsLoading(true)
    setPostsError(null)
    
    try {
      // Calcular offset para paginação
      const offset = (page - 1) * postsPerPage
      
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_user_id_fkey(nickname, email, name, profile_photo),
          category:categories!posts_category_id_fkey(name)
        `)
        .eq('user_id', targetUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .range(offset, offset + postsPerPage - 1)

      if (error) {
        console.error('Erro ao buscar posts:', error)
        setPostsError('Erro ao carregar posts')
        setUserPosts([])
        return
      }

      // Buscar total de posts para paginação
      const { count: totalCount } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', targetUserId)
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
            // Verificar estrutura com media array
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length >= 2) {
              beforeUrl = post.media_urls.media[0].url
              afterUrl = post.media_urls.media[1].url
              imagemUrl = afterUrl
            } else if (post.media_urls && post.media_urls.beforeAfter) {
              beforeUrl = post.media_urls.beforeAfter.before
              afterUrl = post.media_urls.beforeAfter.after
              imagemUrl = afterUrl
            } else if (post.media_urls && post.media_urls.before && post.media_urls.after) {
              beforeUrl = post.media_urls.before
              afterUrl = post.media_urls.after
              imagemUrl = afterUrl
            }
            break
            
          case 'video':
            isVideo = true
            if (post.media_urls && post.media_urls.media && post.media_urls.media.length > 0) {
              const videoMedia = post.media_urls.media.find((media: any) => media.type === 'video')
              if (videoMedia) {
                // Para vídeos, usar o próprio vídeo como thumbnail
                imagemUrl = videoMedia.url
              }
            } else if (post.media_urls && post.media_urls.url) {
              // Para formato antigo, usar o próprio vídeo
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

      setUserPosts(processedPosts)
    } catch (error) {
      console.error('Erro ao buscar posts:', error)
      setPostsError('Erro ao carregar posts')
      setUserPosts([])
    } finally {
      setPostsLoading(false)
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



  // Buscar posts quando o usuário mudar
  useEffect(() => {
    if (targetUserId) {
      fetchUserPosts(currentPage)
    }
  }, [targetUserId, currentPage])

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

  // Log para debug
  console.log('🔍 Dados do displayUser:', {
    id: displayUser?.id,
    name: displayUser?.name,
    nickname: displayUser?.nickname,
    user_type: displayUser?.user_type,
    cidade: displayUser?.cidade,
    uf: displayUser?.uf,
    profile_photo: displayUser?.profile_photo
  })
  
  console.log('🔍 Foto de perfil:', {
    profile_photo: displayUser?.profile_photo,
    tem_foto: !!displayUser?.profile_photo,
    url_completa: displayUser?.profile_photo
  })

  // Buscar estatísticas do perfil
  const { stats: profileStats, loading: statsLoading, error: statsError } = useProfileStats(targetUserId || '')
  
  // Buscar dados de follow
  const { stats: followStats } = useFollows(targetUserId || '')
  
  // Hook para o usuário atual (para verificar follow status)
  const { checkIfFollowing, followUser, unfollowUser } = useFollows(user?.id || '')

  // Hook para posts principais
  const { 
    mainPosts: hookMainPosts, 
    loading: mainPostsHookLoading, 
    markAsMain, 
    unmarkAsMain 
  } = useMainPosts(targetUserId || '')

  // Hook para verificar status da agenda do profissional
  const { 
    hasServices, 
    hasActiveAgenda, 
    agendaType, 
    isTrialExpired, 
    checkAgendaStatus 
  } = useProfessionalAgendaStatus(displayUser?.id)

  // Função para abrir modal de follow
  const openFollowModal = (type: 'following' | 'followers') => {
    setFollowModalType(type)
    setModalTitle(type === 'following' ? 'Seguindo' : 'Seguidores')
    setShowFollowModal(true)
  }

  // Função para abrir modal de atividade
  const openActivityModal = (type: 'favorites' | 'likes') => {
    setActivityModalType(type)
    setModalTitle(type === 'favorites' ? 'Favoritos' : 'Curtidas')
    setShowActivityModal(true)
  }

  // Função para abrir editor de perfil
  const handleEditProfile = () => {
    // Por enquanto, abrir o editor de redes sociais
    // TODO: Implementar editor completo de perfil
    setShowSocialMediaEditor(true)
  }

  // Função para abrir editor de perfil principal (diferente do de redes sociais)
  const handleEditMainProfile = () => {
    setShowProfileEditor(true)
  }

  // Função para recarregar dados do perfil após edição
  const handleProfileUpdated = () => {
    fetchUserData()
  }

  // Função para abrir editor de bio
  const handleEditBio = () => {
    setShowBioEditor(true)
  }

  // Função para recarregar dados após edição da bio
  const handleBioUpdated = () => {
    fetchUserData()
  }

  // Função para abrir editor de habilidades/interesses
  const handleEditSkills = () => {
    setShowSkillsEditor(true)
  }

  // Função para recarregar dados após edição de habilidades/interesses
  const handleSkillsUpdated = () => {
    fetchUserData()
  }

  // Função para atualizar posts principais
  const handleMainPostToggle = () => {
    setForceRefreshButtons(prev => prev + 1)
    fetchUserPosts(currentPage) // Recarregar posts para atualizar a lista
  }

  // Função para verificar se o usuário atual está seguindo o perfil visualizado
  const checkFollowStatus = async () => {
    if (!user?.id || !targetUserId || user.id === targetUserId) return
    
    try {
      const isFollowingUser = await checkIfFollowing(targetUserId)
      setIsFollowing(isFollowingUser)
    } catch (error) {
      console.error('Erro ao verificar status de follow:', error)
    }
  }

  // Função para agendar horário com profissional
  const handleScheduleClick = async (professionalUser: any) => {
    if (!user) {
      // Se não estiver logado, redirecionar para login
      navigate('/login')
      return
    }

    // Prevenir múltiplas execuções simultâneas
    if (isModalTransitioning) {
      console.log('Modal já está sendo processado, ignorando clique')
      return
    }

    try {
      setIsModalTransitioning(true)
      
      // Fechar qualquer modal que esteja aberto PRIMEIRO
      setShowScheduleModal(false)
      setShowAgendaUnavailableModal(false)
      
      // Aguardar mais tempo para garantir que os modais foram fechados
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verificar status da agenda do profissional
      const agendaStatus = await checkAgendaStatus()
      
      // Aguardar mais um pouco para garantir que o estado foi atualizado
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Se a agenda não está ativa, mostrar modal de agenda indisponível
      if (!agendaStatus.hasServices || agendaStatus.isTrialExpired || !agendaStatus.hasActiveAgenda) {
        setShowAgendaUnavailableModal(true)
      } else {
        // Se a agenda está ativa, abrir modal de agendamento normal
        setShowScheduleModal(true)
      }
    } catch (error) {
      console.error('Erro ao verificar status da agenda:', error)
      // Em caso de erro, mostrar modal de agenda indisponível por segurança
      setShowScheduleModal(false)
      setShowAgendaUnavailableModal(true)
    } finally {
      // Sempre liberar o controle após um delay
      setTimeout(() => {
        setIsModalTransitioning(false)
      }, 500)
    }
  }

  // Função para seguir/deixar de seguir
  const handleFollowToggle = async () => {
    if (!user?.id || !targetUserId || user.id === targetUserId) return
    
    setFollowLoading(true)
    
    try {
      if (isFollowing) {
        // Deixar de seguir
        const result = await unfollowUser(targetUserId)
        
        if (result.success) {
          setIsFollowing(false)
          toast({
            title: "Deixou de seguir",
            description: `Você deixou de seguir ${displayUser?.name || 'este usuário'}.`,
          })
        } else {
          throw new Error('Erro ao deixar de seguir')
        }
      } else {
        // Seguir
        const result = await followUser(targetUserId)
        
        if (result.success) {
          setIsFollowing(true)
          toast({
            title: "Seguindo!",
            description: `Você agora está seguindo ${displayUser?.name || 'este usuário'}.`,
          })
        } else {
          throw new Error('Erro ao seguir')
        }
      }
    } catch (error) {
      console.error('Erro ao alterar status de follow:', error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status de follow. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setFollowLoading(false)
    }
  }

  // Função para abrir links das redes sociais de forma inteligente
  const openSocialLink = (platform: string, username: string) => {
    if (!username || socialLinkLoading === platform) return
    
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
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="pt-20 pb-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando perfil...</p>
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
          <Card className="mb-6 bg-gradient-card border-primary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                {isOwnProfile ? (
                  <ProfilePhotoUpload 
                    currentPhoto={displayUser?.profile_photo}
                    className="flex-shrink-0"
                  />
                ) : (
                  <Avatar className="w-24 h-24 ring-4 ring-primary/20 shadow-beauty">
                    <AvatarImage src={displayUser?.profile_photo || ''} />
                    <AvatarFallback className="text-2xl bg-gradient-hero text-white">
                      {displayUser?.name?.charAt(0) || displayUser?.nickname?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-2xl font-bold">{displayUser?.name || 'Usuário'}</h1>
                  <p className="text-muted-foreground">@{displayUser?.nickname || 'usuario'}</p>
                  <Badge variant="secondary" className="mt-2">
                    {displayUser?.user_type === 'profissional' ? 'Profissional' : 'Usuário'}
                  </Badge>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{displayUser?.cidade && displayUser?.uf ? `${displayUser.cidade}, ${displayUser.uf}` : 'Localização não informada'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => setShowQRCodeModal(true)}
                    title="Ver QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </Button>
                  <ProfileShareButton 
                    user={displayUser}
                    className="h-9 w-9"
                  />
                  {isOwnProfile ? (
                    <Button 
                      variant="outline" 
                      size="icon"
                      title="Editar perfil"
                      onClick={handleEditMainProfile}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant={isFollowing ? "outline" : "hero"}
                        size="sm"
                        onClick={handleFollowToggle}
                        disabled={followLoading}
                        className="px-4"
                      >
                        {followLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                        ) : isFollowing ? (
                          <UserPlus className="h-4 w-4 mr-2" />
                        ) : (
                          <UserPlus className="h-4 w-4 mr-2" />
                        )}
                        {isFollowing ? 'Seguindo' : 'Seguir'}
                      </Button>
                      
                      {/* Botão de Agendamento - Apenas para profissionais */}
                      {displayUser?.user_type === 'profissional' && (
                        <Button 
                          variant="beauty"
                          size="sm"
                          onClick={() => handleScheduleClick(displayUser)}
                          disabled={isModalTransitioning}
                          className="px-4 ml-2"
                        >
                          <Calendar className="h-4 w-4 mr-2" />
                          {isModalTransitioning ? 'Processando...' : 'Agendar'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Convites Pendentes - Apenas para o próprio perfil */}
          {isOwnProfile && <EmployeeInvites />}
          {isOwnProfile && <ProfessionalInvites />}

          {/* Redes Sociais */}
          <Card className="mb-6 bg-gradient-card border-secondary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Redes Sociais</CardTitle>
                {isOwnProfile && (
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
                {/* Seguindo - Clicável apenas para o dono do perfil */}
                <Button 
                  variant="ghost" 
                  className="flex-col h-auto p-3"
                  onClick={isOwnProfile ? () => openFollowModal('following') : undefined}
                  disabled={!isOwnProfile}
                >
                  <UserPlus className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">
                    {statsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      followStats.following.toLocaleString()
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Seguindo</span>
                </Button>
                
                {/* Seguidores - Clicável apenas para o dono do perfil */}
                <Button 
                  variant="ghost" 
                  className="flex-col h-auto p-3"
                  onClick={isOwnProfile ? () => openFollowModal('followers') : undefined}
                  disabled={!isOwnProfile}
                >
                  <Users className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">
                    {statsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      followStats.followers.toLocaleString()
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Seguidores</span>
                </Button>
                
                {/* Favoritos - Clicável apenas para o dono do perfil */}
                <Button 
                  variant="ghost" 
                  className="flex-col h-auto p-3"
                  onClick={isOwnProfile ? () => openActivityModal('favorites') : undefined}
                  disabled={!isOwnProfile}
                >
                  <Bookmark className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">
                    {statsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      profileStats.favorites.toLocaleString()
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Favoritos</span>
                </Button>
                
                {/* Curtidas - Clicável apenas para o dono do perfil */}
                <Button 
                  variant="ghost" 
                  className="flex-col h-auto p-3"
                  onClick={isOwnProfile ? () => openActivityModal('likes') : undefined}
                  disabled={!isOwnProfile}
                >
                  <Heart className="h-5 w-5 mb-1" />
                  <span className="text-sm font-semibold">
                    {statsLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
                    ) : (
                      profileStats.likes.toLocaleString()
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">Curtidas</span>
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
                    displayUser?.social_instagram 
                      ? 'hover:bg-pink-50 hover:border-pink-300 text-pink-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (displayUser?.social_instagram) {
                      openSocialLink('instagram', displayUser.social_instagram)
                    }
                  }}
                  disabled={!displayUser?.social_instagram || socialLinkLoading === 'instagram'}
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
                    displayUser?.social_facebook 
                      ? 'hover:bg-blue-50 hover:border-blue-300 text-blue-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (displayUser?.social_facebook) {
                      openSocialLink('facebook', displayUser.social_facebook)
                    }
                  }}
                  disabled={!displayUser?.social_facebook || socialLinkLoading === 'facebook'}
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
                    displayUser?.social_youtube 
                      ? 'hover:bg-red-50 hover:border-red-300 text-red-600' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (displayUser?.social_youtube) {
                      openSocialLink('youtube', displayUser.social_youtube)
                    }
                  }}
                  disabled={!displayUser?.social_youtube || socialLinkLoading === 'youtube'}
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
                    displayUser?.social_linkedin 
                      ? 'hover:bg-blue-50 hover:border-blue-300 text-blue-700' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (displayUser?.social_linkedin) {
                      openSocialLink('linkedin', displayUser.social_linkedin)
                    }
                  }}
                  disabled={!displayUser?.social_linkedin || socialLinkLoading === 'linkedin'}
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
                    displayUser?.social_x 
                      ? 'hover:bg-black/5 hover:border-gray-300 text-black' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (displayUser?.social_x) {
                      openSocialLink('x', displayUser.social_x)
                    }
                  }}
                  disabled={!displayUser?.social_x || socialLinkLoading === 'x'}
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
                    displayUser?.social_tiktok 
                      ? 'hover:bg-pink-50 hover:border-pink-300 text-pink-500' 
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  onClick={() => {
                    if (displayUser?.social_tiktok) {
                      openSocialLink('tiktok', displayUser.social_tiktok)
                    }
                  }}
                  disabled={!displayUser?.social_tiktok || socialLinkLoading === 'tiktok'}
                >
                  {socialLinkLoading === 'tiktok' ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  ) : (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quem eu sou */}
          <Card className="mb-6 bg-gradient-card border-accent/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Olá! Eu sou {displayUser?.name || 'Usuário'}
                {isOwnProfile && (
                  <Button variant="ghost" size="icon" onClick={handleEditBio}>
                    <Edit3 className="h-4 w-4" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {displayUser?.bio || 'Este usuário ainda não adicionou uma biografia.'}
              </p>
            </CardContent>
          </Card>

          {/* Meu Local de Trabalho */}
          <WorkplaceCard targetUserId={targetUserId} />

          {/* Habilidades/Interesses */}
          {(userCategories.length > 0 || isOwnProfile) && (
            <Card className="mb-6 bg-gradient-card border-primary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {isProfessional ? 'Habilidades' : 'Interesses'}
                  {isOwnProfile && (
                    <Button variant="ghost" size="icon" onClick={handleEditSkills}>
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userCategories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {userCategories.map((category) => (
                      <Badge 
                        key={category.id} 
                        variant="secondary" 
                        className="bg-gradient-primary text-white border-0 shadow-sm"
                      >
                        <span className="mr-1">{category.icon}</span>
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {isOwnProfile 
                      ? isProfessional 
                      ? "Adicione suas habilidades para que outros usuários possam encontrá-lo."
                        : "Adicione seus interesses para que outros usuários possam conhecê-lo melhor."
                      : isProfessional 
                        ? "Este usuário ainda não adicionou habilidades."
                        : "Este usuário ainda não adicionou interesses."
                    }
                  </p>
                )}
              </CardContent>
            </Card>
          )}



          {/* Posts */}
          <Card className="mb-6 bg-gradient-card border-secondary/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
            <CardHeader>
              <CardTitle>
                Posts 
                {isOwnProfile && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    (Principais: {hookMainPosts.length}/3)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Seção de Posts Principais */}
              {isOwnProfile && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
                    <svg className="h-5 w-5 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    Posts Principais
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {/* Sempre mostrar 3 espaços - preenchidos ou vazios */}
                    {[1, 2, 3].map((position) => {
                      const mainPost = hookMainPosts.find(post => post.priority_order === position)

                      if (mainPost) {
                        // Post principal existente
                        return (
                          <div
                            key={`main-${mainPost.id}`}
                            className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group relative"
                            onClick={() => {
                              setSelectedPost(mainPost)
                              setShowPostModal(true)
                            }}
                          >
                            {/* Conteúdo do post principal */}
                            {(() => {
                              if (!mainPost.imagem) {
                                return null
                              }

                              if (mainPost.isBeforeAfter) {
                                return (
                                  <div className="w-full h-full grid grid-cols-2 gap-1">
                                    <div className="relative">
                                      <img
                                        src={mainPost.beforeUrl}
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
                                        src={mainPost.afterUrl}
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

                              if (mainPost.isVideo) {
                                return (
                                  <video
                                    src={mainPost.imagem}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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

                              if (mainPost.isCarousel) {
                                return (
                                  <div className="relative w-full h-full">
                                    <img
                                      src={mainPost.imagem}
                                      alt={mainPost.titulo || 'Post'}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none'
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                      }}
                                    />
                                    {mainPost.carouselImages && mainPost.carouselImages.length > 1 && (
                                      <div className="absolute top-1 right-1 bg-black/50 text-white text-xs px-1 py-0.5 rounded text-center font-semibold shadow-sm">
                                        {mainPost.carouselImages.length}
                                      </div>
                                    )}
                                  </div>
                                )
                              }

                              return (
                                <img
                                  src={mainPost.imagem}
                                  alt={mainPost.titulo || 'Post'}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              )
                            })()}

                            {/* Indicadores de tipo de post */}
                            <div className="absolute top-2 right-2 flex gap-1">
                              {mainPost.isVideo && (
                                <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8 5v14l11-7z"/>
                                  </svg>
                                </div>
                              )}

                              {mainPost.isBeforeAfter && (
                                <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                                  <ArrowLeftRight className="h-3 w-3 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Botão de Post Principal */}
                            <div
                              className="absolute bottom-2 right-2 z-50"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                            >
                              <MainPostButton
                                postId={mainPost.id}
                                userId={targetUserId || ''}
                                currentUserId={user?.id}
                                onToggle={handleMainPostToggle}
                                size="sm"
                                variant="ghost"
                                className="text-yellow-400 hover:text-yellow-300 bg-black/30 hover:bg-black/40 border-0"
                                forceRefresh={forceRefreshButtons}
                                markAsMain={markAsMain}
                                unmarkAsMain={unmarkAsMain}
                                priorityOrder={mainPost.priority_order}
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
                                {position === 2 && "Destaque seu melhor trabalho"}
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
              {isOwnProfile && hookMainPosts.length > 0 && (
                <div className="border-t border-border/50 mb-6 pt-6">
                  <h3 className="text-lg font-semibold text-foreground mb-3">Todos os Posts</h3>
                </div>
              )}
              {postsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse"></div>
                  ))}
                </div>
              ) : postsError ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="h-6 w-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">Erro ao carregar posts</p>
                  <Button variant="outline" size="sm" onClick={() => fetchUserPosts(currentPage)}>
                    Tentar novamente
                  </Button>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-gradient-card rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h4 className="font-medium text-foreground mb-1">
                    {isOwnProfile ? 'Nenhum post ainda' : 'Nenhum post encontrado'}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    {isOwnProfile 
                      ? 'Compartilhe seu primeiro trabalho e inspire outros!'
                      : 'Este usuário ainda não compartilhou nenhum trabalho.'
                    }
                  </p>
                  {isOwnProfile && (
                    <Button variant="hero" size="sm" onClick={() => navigate('/beautywall')}>
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Criar primeiro post
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {userPosts.map((post) => (
                    <div 
                      key={post.id} 
                      className="aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer group relative"
                      onClick={() => {
                        setSelectedPost(post)
                        setShowPostModal(true)
                      }}
                    >
                      {(() => {
                        if (!post.imagem) {
                          return null
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
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              muted
                              preload="metadata"
                              onLoadedData={(e) => {
                                // Pausar o vídeo imediatamente após carregar
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
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
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
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              e.currentTarget.nextElementSibling?.classList.remove('hidden')
                            }}
                          />
                        )
                      })()}
                      <div className="hidden absolute inset-0 bg-gradient-card flex items-center justify-center">
                        <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
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

                        {post.isBeforeAfter && (
                          <div className="w-6 h-6 bg-black/50 rounded-full flex items-center justify-center">
                            <ArrowLeftRight className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>

                      {/* Botão de Post Principal */}
                      {isOwnProfile && (
                        <div 
                          className="absolute bottom-2 right-2 z-50"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                          }}
                        >
                          <MainPostButton
                            postId={post.id}
                            userId={targetUserId || ''}
                            currentUserId={user?.id}
                            onToggle={handleMainPostToggle}
                            size="sm"
                            variant="ghost"
                            className="bg-black/50 hover:bg-black/70 text-white border-0"
                            forceRefresh={forceRefreshButtons}
                            markAsMain={markAsMain}
                            unmarkAsMain={unmarkAsMain}
                          />
                        </div>
                      )}

                      

                    </div>
                  ))}
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

          {/* Card de Contato */}
          {displayUser?.phone && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Informações de Contato
                </CardTitle>
                <CardDescription>
                  Entre em contato diretamente com {displayUser.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Telefone */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Telefone</p>
                      <p className="text-sm text-muted-foreground">{displayUser.phone}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        window.open(`tel:${displayUser.phone}`, '_self')
                      }}
                    >
                      Ligar
                    </Button>
                  </div>

                  {/* WhatsApp */}
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">{displayUser.phone}</p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const phoneNumber = displayUser.phone?.replace(/\D/g, '')
                        window.open(`https://wa.me/55${phoneNumber}`, '_blank')
                      }}
                    >
                      Enviar
                    </Button>
                  </div>

                  {/* Email */}
                  {displayUser?.email && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                        <Mail className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">E-mail</p>
                        <p className="text-sm text-muted-foreground">{displayUser.email}</p>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          window.open(`mailto:${displayUser.email}`, '_self')
                        }}
                      >
                        Enviar
                      </Button>
                    </div>
                  )}

                  {/* Localização */}
                  {(displayUser?.cidade || displayUser?.uf || displayUser?.logradouro || displayUser?.bairro) && (
                    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                      <div className="w-10 h-10 bg-orange-500/10 rounded-full flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-orange-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">Localização</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          {/* Endereço completo */}
                          {displayUser?.logradouro && (
                            <p>{displayUser.logradouro}{displayUser?.numero && `, ${displayUser.numero}`}</p>
                          )}
                          {displayUser?.complemento && (
                            <p>{displayUser.complemento}</p>
                          )}
                          {displayUser?.bairro && (
                            <p>{displayUser.bairro}</p>
                          )}
                          {(displayUser?.cidade || displayUser?.uf) && (
                            <p>
                              {displayUser.cidade && displayUser.uf 
                                ? `${displayUser.cidade}, ${displayUser.uf}`
                                : displayUser.cidade || displayUser.uf
                              }
                              {displayUser?.cep && ` - CEP: ${displayUser.cep}`}
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
                            displayUser?.logradouro,
                            displayUser?.numero,
                            displayUser?.bairro,
                            displayUser?.cidade,
                            displayUser?.uf
                          ].filter(Boolean).join(', ')
                          
                          if (address) {
                            // Por enquanto, abre o Google Maps com o endereço
                            const encodedAddress = encodeURIComponent(address)
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank')
                          }
                        }}
                        disabled={!displayUser?.cidade && !displayUser?.logradouro}
                      >
                        Ver no Maps
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Modal de Posts */}
          <PostModal
            post={selectedPost}
            isOpen={showPostModal}
            onClose={() => setShowPostModal(false)}
            onPostDeleted={() => {
              setShowPostModal(false)
              fetchUserPosts(currentPage) // Recarregar posts para remover o post deletado
            }}
          />

          {/* Modal de Redes Sociais */}
          <Dialog open={showSocialMediaEditor} onOpenChange={setShowSocialMediaEditor}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Redes Sociais</DialogTitle>
                <DialogDescription>
                  Edite suas informações de redes sociais para que outros usuários possam encontrá-lo.
                </DialogDescription>
              </DialogHeader>
              <CardContent>
                <SocialMediaEditor 
                  userId={displayUser?.id || ''}
                  currentSocialMedia={{
                    social_instagram: displayUser?.social_instagram || '',
                    social_facebook: displayUser?.social_facebook || '',
                    social_youtube: displayUser?.social_youtube || '',
                    social_linkedin: displayUser?.social_linkedin || '',
                    social_x: displayUser?.social_x || '',
                    social_tiktok: displayUser?.social_tiktok || ''
                  }}
                  onClose={() => setShowSocialMediaEditor(false)}
                  onUpdate={handleSocialMediaUpdate} 
                />
              </CardContent>
            </DialogContent>
          </Dialog>

          {/* Modal de Seguidores/Seguindo */}
          <FollowModal 
            isOpen={showFollowModal} 
            onClose={() => setShowFollowModal(false)} 
            type={followModalType} 
            title={modalTitle} 
            userId={targetUserId} 
          />

          {/* Modal de Atividade (Favoritos/Curtidas) */}
          <UserActivityModal 
            isOpen={showActivityModal} 
            onClose={() => setShowActivityModal(false)} 
            type={activityModalType} 
            title={modalTitle} 
            userId={targetUserId} 
          />

          {/* Modal de QR Code */}
          <QRCodeModal 
            isOpen={showQRCodeModal} 
            onClose={() => setShowQRCodeModal(false)} 
            user={displayUser} 
          />

          {/* Modal de Perfil */}
          <ProfileEditor 
            isOpen={showProfileEditor} 
            onClose={() => setShowProfileEditor(false)} 
            user={displayUser} 
            onProfileUpdated={handleProfileUpdated} 
          />

          {/* Modal de Bio */}
          <BioEditor 
            isOpen={showBioEditor} 
            onClose={() => setShowBioEditor(false)} 
            user={displayUser} 
            onBioUpdated={handleBioUpdated} 
          />

          {/* Modal de Habilidades/Interesses */}
          <SkillsEditor 
            isOpen={showSkillsEditor} 
            onClose={() => setShowSkillsEditor(false)} 
            user={displayUser} 
            onSkillsUpdated={handleSkillsUpdated} 
          />

          {/* Modal de Agendamento - Só exibe se não há modal de agenda indisponível E não está em transição */}
          {!showAgendaUnavailableModal && !isModalTransitioning && (
            <ScheduleModal
              isOpen={showScheduleModal}
              onClose={() => {
                setShowScheduleModal(false)
                setIsModalTransitioning(false)
              }}
              professional={{
                id: displayUser?.id || '',
                name: displayUser?.name || 'Profissional',
                profile_photo: displayUser?.profile_photo,
                salon_id: undefined // Será determinado pelo modal
              }}
            />
          )}

          {/* Modal de Agenda Indisponível - Só exibe se não há modal de agendamento E não está em transição */}
          {!showScheduleModal && !isModalTransitioning && (
            <AgendaUnavailableModal
              isOpen={showAgendaUnavailableModal}
              onClose={() => {
                setShowAgendaUnavailableModal(false)
                setIsModalTransitioning(false)
              }}
              professional={{
                id: displayUser?.id || '',
                name: displayUser?.name || 'Profissional',
                profile_photo: displayUser?.profile_photo,
                phone: displayUser?.phone,
                whatsapp: displayUser?.phone // Usar phone como whatsapp se não houver campo específico
              }}
              scenario={
                !hasServices ? 'no_services' :
                isTrialExpired && !hasActiveAgenda ? 'trial_expired' :
                'agenda_disabled'
              }
            />
          )}

        </div>
      </div>
    </div>
  )
}

export default Perfil