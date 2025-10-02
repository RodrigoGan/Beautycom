import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, Phone, Mail, Instagram, Facebook, Youtube, Linkedin, Calendar, Star, Bookmark, ChevronLeft, ChevronRight } from "lucide-react"
import { BEAUTY_CATEGORIES } from "@/lib/constants"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/Header"
import { useToast } from "@/hooks/use-toast"
import { useMainPosts } from "@/hooks/useMainPosts"
import { LoginRequiredModal } from "@/components/LoginRequiredModal"

const PerfilPublico = () => {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [profileUser, setProfileUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [isModalTransitioning, setIsModalTransitioning] = useState(false)
  
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

  // Usar dados do usuário do banco
  const displayUser = profileUser
  
  // Hook para posts principais (sem edição)
  const { mainPosts: mainPostsData, loading: mainPostsLoadingData } = useMainPosts(userId, null)

  // Buscar categorias do usuário
  const fetchUserCategories = async () => {
    if (!userId) return
    
    try {
      setCategoriesLoading(true)
      const { data, error } = await supabase
        .from('user_categories')
        .select('category')
        .eq('user_id', userId)

      if (error) throw error
      
      setUserCategories(data || [])
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Função para buscar dados do usuário
  const fetchUserData = async () => {
    if (!userId) {
      console.log('⚠️ userId não disponível')
      return
    }
    
    try {
      console.log('🔍 Buscando dados do usuário:', userId)
      setLoading(true)
      
      // Consulta simplificada - apenas dados básicos do usuário
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
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
      }
    } catch (error) {
      console.error('❌ Erro ao buscar dados do usuário:', error)
      toast({
        title: "Erro",
        description: "Usuário não encontrado",
        variant: "destructive"
      })
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  // Buscar dados do usuário
  useEffect(() => {
    if (userId) {
      console.log('🔄 useEffect executado, userId:', userId)
      fetchUserData()
      fetchUserCategories()
    }
  }, [userId])

  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Função para agendar horário com profissional
  const handleScheduleClick = async (professionalUser: any) => {
    // Prevenir múltiplas execuções simultâneas
    if (isModalTransitioning) {
      console.log('Modal já está sendo processado, ignorando clique')
      return
    }

    try {
      setIsModalTransitioning(true)
      
      // Mostrar modal de login necessário
      setShowLoginModal(true)
    } catch (error) {
      console.error('Erro ao processar agendamento:', error)
    } finally {
      // Sempre liberar o controle após um delay
      setTimeout(() => {
        setIsModalTransitioning(false)
      }, 500)
    }
  }

  // Função para formatar telefone
  const formatPhone = (phone: string) => {
    if (!phone) return ''
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  // Função para obter categoria por nome
  const getCategoryByName = (categoryName: string) => {
    return BEAUTY_CATEGORIES.find(cat => cat.name === categoryName)
  }

  // Função para obter ícone da categoria
  const getCategoryIcon = (categoryName: string) => {
    const category = getCategoryByName(categoryName)
    return category?.icon || Star
  }

  // Função para obter cor da categoria
  const getCategoryColor = (categoryName: string) => {
    const category = getCategoryByName(categoryName)
    return category?.color || 'bg-gray-100 text-gray-800'
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Se não encontrou o usuário
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-muted-foreground">Usuário não encontrado</p>
              <Button variant="outline" onClick={() => navigate('/')} className="mt-4">
                Voltar ao início
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header do Perfil */}
          <Card className="mb-6 bg-gradient-card border-secondary/20 shadow-beauty-card">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                    <AvatarImage src={displayUser?.profile_photo} alt={displayUser?.name} />
                    <AvatarFallback className="text-2xl sm:text-3xl bg-gradient-primary text-white">
                      {displayUser?.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Informações do usuário */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                        {displayUser?.name}
                      </h1>
                      {displayUser?.nickname && (
                        <p className="text-muted-foreground mb-2">@{displayUser.nickname}</p>
                      )}
                      
                      {/* Localização */}
                      {(displayUser?.cidade || displayUser?.uf) && (
                        <div className="flex items-center text-muted-foreground mb-2">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>
                            {displayUser?.cidade && displayUser?.uf 
                              ? `${displayUser.cidade}, ${displayUser.uf}`
                              : displayUser?.cidade || displayUser?.uf
                            }
                          </span>
                        </div>
                      )}

                      {/* Tipo de usuário */}
                      {displayUser?.user_type === 'profissional' && (
                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 mb-2">
                          Profissional
                        </Badge>
                      )}
                    </div>

                    {/* Botão de Agendamento - Apenas para profissionais */}
                    {displayUser?.user_type === 'profissional' && (
                      <Button 
                        variant="beauty"
                        size="sm"
                        onClick={() => handleScheduleClick(displayUser)}
                        disabled={isModalTransitioning}
                        className="px-4"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        {isModalTransitioning ? 'Processando...' : 'Agendar'}
                      </Button>
                    )}
                  </div>

                  {/* Bio */}
                  {displayUser?.bio && (
                    <p className="text-muted-foreground mt-4 text-sm sm:text-base">
                      {displayUser.bio}
                    </p>
                  )}

                  {/* Categorias */}
                  {userCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {userCategories.map((userCategory, index) => {
                        const category = getCategoryByName(userCategory.category)
                        const IconComponent = getCategoryIcon(userCategory.category)
                        const colorClass = getCategoryColor(userCategory.category)
                        
                        return (
                          <Badge key={index} variant="outline" className={`${colorClass} border-0`}>
                            <IconComponent className="h-3 w-3 mr-1" />
                            {userCategory.category}
                          </Badge>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Links de contato */}
              <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border">
                {displayUser?.phone && (
                  <div className="flex items-center text-muted-foreground">
                    <Phone className="h-4 w-4 mr-2" />
                    <span className="text-sm">{formatPhone(displayUser.phone)}</span>
                  </div>
                )}
                
                {displayUser?.email && (
                  <div className="flex items-center text-muted-foreground">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="text-sm">{displayUser.email}</span>
                  </div>
                )}

                {/* Links sociais */}
                {displayUser?.instagram && (
                  <a 
                    href={displayUser.instagram} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    <span className="text-sm">Instagram</span>
                  </a>
                )}

                {displayUser?.facebook && (
                  <a 
                    href={displayUser.facebook} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Facebook className="h-4 w-4 mr-2" />
                    <span className="text-sm">Facebook</span>
                  </a>
                )}

                {displayUser?.youtube && (
                  <a 
                    href={displayUser.youtube} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    <span className="text-sm">YouTube</span>
                  </a>
                )}

                {displayUser?.linkedin && (
                  <a 
                    href={displayUser.linkedin} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center text-muted-foreground hover:text-primary transition-colors"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    <span className="text-sm">LinkedIn</span>
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Posts Principais */}
          {mainPostsData && mainPostsData.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Star className="h-5 w-5 mr-2" />
                  Posts Principais
                </CardTitle>
                <CardDescription>
                  Destaques do trabalho deste profissional
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {mainPostsData.map((post, index) => (
                    <div key={post.id} className="aspect-square bg-gradient-card rounded-lg overflow-hidden">
                      {post.image_url ? (
                        <img 
                          src={post.image_url} 
                          alt={`Post ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Sem imagem</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Posts do Usuário */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Posts</CardTitle>
              <CardDescription>
                Últimos posts deste profissional
              </CardDescription>
            </CardHeader>
            <CardContent>
              {postsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando posts...</p>
                </div>
              ) : postsError ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Erro ao carregar posts</p>
                </div>
              ) : userPosts.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum post encontrado</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userPosts.map((post) => (
                    <div key={post.id} className="bg-gradient-card rounded-lg overflow-hidden">
                      {post.image_url && (
                        <img 
                          src={post.image_url} 
                          alt="Post"
                          className="w-full h-48 object-cover"
                        />
                      )}
                      <div className="p-4">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Login Necessário */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => {
          setShowLoginModal(false)
          setIsModalTransitioning(false)
        }}
        professionalName={displayUser?.name || 'Profissional'}
      />
    </div>
  )
}

export default PerfilPublico
