import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Menu, X, Bell, User, LogOut, Building2, MessageSquare, Shield } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
import { useSuperAdminAccess } from "@/hooks/useSuperAdminAccess"
// import { useSalonProfessionals } from "@/hooks/useSalonProfessionals" // REMOVIDO - não utilizado
import { supabase } from "@/lib/supabase"
import { NotificationDropdown } from "@/components/NotificationDropdown"


export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthContext()
  const { isSuperAdmin } = useSuperAdminAccess()
  const isLoggedIn = !!user
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Hook para gerenciar salões - restaurado para funcionar com profissionais
  const { userSalon, loading: salonLoading } = useSalons(user?.id)
  
  // Lógica de permissões restaurada
  const isOwner = () => user?.id === userSalon?.owner_id
  const hasPermission = (permission: string) => isOwner() // Apenas donos têm todas as permissões
  const isEmployee = () => false
  
  // const [userAsProfessional, setUserAsProfessional] = useState<any[]>([])
  // const [userAsProfessionalLoading, setUserAsProfessionalLoading] = useState(false)
  
  // Verificar se pode acessar agenda profissional (lógica completa restaurada)
  const canAccessProfessionalAgenda = () => {
    
    if (!user) return false
    
    // 1. Dono de salão pode acessar
    if (userSalon?.owner_id === user.id) return true
    
    // 2. QUALQUER usuário do tipo 'profissional' pode acessar
    if (user?.user_type === 'profissional') return true
    
    // 3. Funcionários com permissão podem acessar (com limitações baseadas em permissões)
    if (isEmployee() && hasPermission('appointments.view')) return true
    
    return false
  }
  
  // Debug removido para evitar loops

  const handleSignOut = async () => {
    console.log('🔍 Header - Iniciando logout...')
    console.log('🔍 Header - Usuário antes do logout:', user?.id)
    
    try {
      await signOut()
      console.log('🔍 Header - Logout executado com sucesso')
      setIsMenuOpen(false)
      // Redirecionar para a página inicial após o logout
      navigate('/')
      console.log('🔍 Header - Redirecionamento executado')
    } catch (error) {
      console.error('❌ Header - Erro no logout:', error)
    }
  }

  // Fechar menu quando clicar fora dele ou pressionar Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscapeKey)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isMenuOpen])

  // Fechar menu quando a rota mudar
  useEffect(() => {
    setIsMenuOpen(false)
  }, [location.pathname])

  // const fetchUserAsProfessional = useCallback(async () => {
  //   if (!user?.id) return
  //   
  //   try {
  //     setUserAsProfessionalLoading(true)
  //     console.log('🔍 Header - Buscando salões onde usuário é profissional:', user.id)
  //     
  //     const { data, error } = await supabase
  //       .from('salon_professionals')
  //       .select(`
  //         *,
  //         salon:salons_studios(id, name, owner_id)
  //       `)
  //       .eq('professional_id', user.id)
  //       .eq('status', 'accepted')
  //       .eq('agenda_enabled', true)
  //   
  //   if (error) {
  //       console.error('❌ Header - Erro ao buscar salões do usuário:', error)
  //       return
  //     }
  //     
  //     console.log('✅ Header - Salões onde usuário é profissional:', data)
  //     setUserAsProfessional(data || [])
  //     
  //   } catch (err) {
  //     console.error('❌ Header - Erro ao buscar salões do usuário:', err)
  //   } finally {
  //     setUserAsProfessionalLoading(false)
  //   }
  // }, [user?.id])

  // Debug removido para evitar loops

  // useEffect(() => {
  //   if (user?.id) {
  //     fetchUserAsProfessional()
  //   }
  // }, [user?.id, fetchUserAsProfessional])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-primary/10">
      <div ref={menuRef} className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <img 
              src="/image/logotipobeautycom.png" 
              alt="Beautycom" 
              className="h-8 w-8 mr-3"
            />
            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Beautycom
            </span>
          </Link>

          {/* Elementos Essenciais - Visíveis em todas as telas */}
          <div className="flex items-center space-x-2">
            {isLoggedIn ? (
              <>
                {/* Sistema de Notificações */}
                <NotificationDropdown salonId={userSalon?.id} />
                
                {/* Botão Admin - Apenas para Super Admins */}
                {isSuperAdmin && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex items-center gap-2"
                    title="Painel Admin"
                  >
                    <Link to="/admin">
                      <Shield className="h-4 w-4" />
                      <span className="hidden md:inline">Admin</span>
                    </Link>
                  </Button>
                )}
                
                {/* Nome do Usuário */}
                <span className="hidden sm:inline text-sm text-muted-foreground">
                  Olá, {user?.name || user?.nickname || 'Usuário'}
                </span>
                
                {/* Avatar do Usuário */}
                <Link to="/perfil">
                  <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all">
                    <AvatarImage 
                      src={user?.profile_photo} 
                      alt={user?.name || user?.nickname || 'Usuário'} 
                    />
                    <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || user?.nickname?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/cadastro">
                  <Button variant="hero" size="sm">
                    Cadastrar
                  </Button>
                </Link>
              </>
            )}
            
            {/* Menu Hambúrguer - Visível em todas as telas */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Menu Hambúrguer - Funciona em todas as telas */}
        {isMenuOpen && (
          <div className="py-4 space-y-3 border-t border-primary/10">
            {isLoggedIn ? (
              <>
                {/* Seção Principal */}
                <div className="px-4 py-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Navegação</h3>
                  <div className="space-y-1">
                    <Link to="/agenda-pessoal" className="block px-2 py-2 text-sm hover:bg-accent rounded">Agenda Pessoal</Link>
                    {canAccessProfessionalAgenda() && (
                      <Link to="/agenda-profissional" className="block px-2 py-2 text-sm hover:bg-accent rounded">Agenda Profissional</Link>
                    )}
                    <Link to="/membros" className="block px-2 py-2 text-sm hover:bg-accent rounded">Membros</Link>
                    <Link to="/beautywall" className="block px-2 py-2 text-sm hover:bg-accent rounded">BeautyWall</Link>
                    
                    {/* Admin - Apenas para Super Admins */}
                    {isSuperAdmin && (
                      <Link to="/admin" className="block px-2 py-2 text-sm hover:bg-accent rounded flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Admin
                      </Link>
                    )}
                  </div>
                </div>

                {/* Seção do Salão */}
                {!salonLoading && (
                  <div className="px-4 py-2">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-2">Meu Negócio</h3>
                    <div className="space-y-1">
                      {userSalon?.owner_id === user?.id ? (
                        <Link to={`/salon/${userSalon.id}`} className="block px-2 py-2 text-sm hover:bg-accent rounded">
                          Meu Salão
                        </Link>
                      ) : (
                        <button 
                          onClick={() => {
                            navigate('/criar-salao')
                            setIsMenuOpen(false)
                          }}
                          className="block w-full text-left px-2 py-2 text-sm hover:bg-accent rounded"
                        >
                          Criar Salão
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Seção de Conta */}
                <div className="px-4 py-2">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-2">Conta</h3>
                  <div className="space-y-1">
                    <Link to="/perfil" className="block px-2 py-2 text-sm hover:bg-accent rounded">Perfil</Link>
                    <Link to="/planos" className="block px-2 py-2 text-sm hover:bg-accent rounded">Planos</Link>
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left px-2 py-2 text-sm hover:bg-accent rounded text-destructive"
                    >
                      Sair
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-2">
                  <div className="space-y-1">
                    <Link to="/membros" className="block px-2 py-2 text-sm hover:bg-accent rounded">Explorar</Link>
                    <Link to="/planos" className="block px-2 py-2 text-sm hover:bg-accent rounded">Planos</Link>
                  </div>
                </div>
                <div className="px-4 py-2 border-t border-primary/10 pt-4">
                  <div className="space-y-2">
                    <Link to="/login" className="block">
                      <Button variant="outline" className="w-full">
                        Login
                      </Button>
                    </Link>
                    <Link to="/cadastro" className="block">
                      <Button variant="hero" className="w-full">
                        Cadastrar
                      </Button>
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}