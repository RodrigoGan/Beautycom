import { Button } from "@/components/ui/button"
import { Menu, X, Bell, User, LogOut, Building2 } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
import { useSalonPermissions } from "@/hooks/useSalonPermissions"


export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuthContext()
  const isLoggedIn = !!user
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Hook para gerenciar salões
  const { userSalon, loading: salonLoading } = useSalons(user?.id)
  
  // Hook para permissões do salão
  const { hasPermission, isOwner, isEmployee } = useSalonPermissions(userSalon?.id)
  
  // Verificar se pode acessar agenda profissional
  const canAccessProfessionalAgenda = () => {
    if (!user) return false
    
    // Profissionais sempre podem acessar
    if (user.user_type === 'profissional') return true
    
    // Funcionários com permissão podem acessar
    if (isEmployee() && hasPermission('appointments.view')) return true
    
    // Dono do salão pode acessar
    if (isOwner()) return true
    
    return false
  }
  
  // Debug logs
  console.log('🔍 Header Debug:', {
    userId: user?.id,
    userSalon,
    salonLoading,
    isLoggedIn
  })

  const handleSignOut = async () => {
    await signOut()
    setIsMenuOpen(false)
    // Redirecionar para a página inicial após o logout
    navigate('/')
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

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                
                {/* Links das Agendas */}
                <Link to="/agenda-pessoal">
                  <Button variant="ghost" size="sm">
                    Agenda Pessoal
                  </Button>
                </Link>
                
                {/* Agenda Profissional - Apenas para quem tem permissão */}
                {canAccessProfessionalAgenda() && (
                  <Link to="/agenda-profissional">
                    <Button variant="ghost" size="sm">
                      Agenda Profissional
                    </Button>
                  </Link>
                )}
                
                {/* Botão do Salão/Estúdio */}
                {!salonLoading && (
                  userSalon ? (
                    <Link to={`/salon/${userSalon.id}`}>
                      <Button variant="ghost" size="sm">
                        Meu Salão
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate('/criar-salao')}
                    >
                      Criar Salão
                    </Button>
                  )
                )}
                
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Olá, {user?.name || user?.nickname || 'Usuário'}
                  </span>
                  <Link to="/perfil">
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-5 w-5" />
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Link to="/membros">
                  <Button variant="ghost" size="sm">
                    Explorar
                  </Button>
                </Link>
                <Link to="/planos">
                  <Button variant="ghost" size="sm">
                    Planos
                  </Button>
                </Link>
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
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-3 border-t border-primary/10">
            {isLoggedIn ? (
              <>
                <Link to="/perfil" className="block px-4 py-2 text-sm hover:bg-accent">Perfil</Link>
                
                {/* Botão do Salão/Estúdio - Mobile */}
                {!salonLoading && (
                  userSalon ? (
                    <Link to={`/salon/${userSalon.id}`} className="block px-4 py-2 text-sm hover:bg-accent">
                      Meu Salão
                    </Link>
                  ) : (
                    <button 
                      onClick={() => {
                        navigate('/criar-salao')
                        setIsMenuOpen(false)
                      }}
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-accent"
                    >
                      Criar Salão
                    </button>
                  )
                )}
                
                <Link to="/agenda-pessoal" className="block px-4 py-2 text-sm hover:bg-accent">Agenda Pessoal</Link>
                <Link to="/membros" className="block px-4 py-2 text-sm hover:bg-accent">Membros</Link>
                <Link to="/beautywall" className="block px-4 py-2 text-sm hover:bg-accent">BeautyWall</Link>
                <Link to="/planos" className="block px-4 py-2 text-sm hover:bg-accent">Planos</Link>
                {/* Agenda Profissional - Apenas para quem tem permissão */}
                {canAccessProfessionalAgenda() && (
                  <Link to="/agenda-profissional" className="block px-4 py-2 text-sm hover:bg-accent">Agenda Profissional</Link>
                )}
                <button className="block w-full text-left px-4 py-2 text-sm hover:bg-accent">Configurações</button>
                <button 
                  onClick={handleSignOut}
                  className="block w-full text-left px-4 py-2 text-sm hover:bg-accent text-destructive"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link to="/membros" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    Explorar
                  </Button>
                </Link>
                <Link to="/planos" className="block">
                  <Button variant="ghost" className="w-full justify-start">
                    Planos
                  </Button>
                </Link>
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
              </>
            )}
          </div>
        )}
      </div>
    </header>
  )
}