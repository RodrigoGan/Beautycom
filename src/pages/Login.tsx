import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { translateError } from "@/utils/errorTranslations"

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const { signIn } = useAuthContext()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !password) {
      setError("Por favor, preencha todos os campos")
      return
    }
    
    setLoading(true)
    setError("")
    console.log('🔄 Iniciando processo de login...')
    
    // Timeout de segurança para evitar travamento
    const timeoutId = setTimeout(() => {
      console.error('❌ Timeout no login - forçando reset')
      setLoading(false)
      setError("Tempo limite excedido. Tente novamente.")
    }, 15000) // 15 segundos
    
    try {
      console.log('🔄 Chamando signIn...')
      const { data, error } = await signIn(email, password)
      
      console.log('🔄 signIn retornou')
      console.log('🔄 Data recebida:', data ? 'Sim' : 'Não')
      console.log('🔄 Error recebido:', error ? 'Sim' : 'Não')
      
      if (error) {
        console.error('❌ Erro retornado pelo signIn:', error)
        setError("Email ou senha incorretos")
        return
      }
      
      if (data?.user) {
        console.log('✅ Login bem-sucedido, redirecionando...')
        console.log('✅ Usuário:', data.user.email)
        console.log('✅ Tipo de usuário:', data.user.user_metadata?.user_type || 'usuario')
        
        // Redirecionar baseado no tipo de usuário
        const userType = data.user.user_metadata?.user_type || 'usuario'
        const redirectPath = userType === 'profissional' ? '/agenda-profissional' : '/beautywall'
        
        console.log('✅ Redirecionando para:', redirectPath)
        navigate(redirectPath)
        console.log('✅ Redirecionamento executado')
      } else {
        console.warn('⚠️ Login sem dados de usuário')
        setError("Erro inesperado no login")
      }
    } catch (error) {
      console.error("❌ Erro no login:", error)
      
      // Mensagens de erro mais específicas
      let errorMessage = "Erro ao fazer login. Tente novamente."
      
      if (error instanceof Error) {
        errorMessage = translateError(error.message)
      }
      
      setError(errorMessage)
    } finally {
      clearTimeout(timeoutId)
      console.log('🏁 Finalizando processo de login')
      setLoading(false)
    }
  }



  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/image/logotipobeautycom.png" 
              alt="Beautycom" 
              className="h-16 w-16"
            />
          </div>
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Bem-vindo de volta!
          </CardTitle>
          <CardDescription>
            Entre na sua conta para continuar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">Senha</Label>
                <Link to="/recuperar-senha" className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              variant="hero"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
          

          
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link to="/cadastro" className="text-primary hover:underline">
                Cadastre-se
              </Link>
            </p>
            <Link to="/" className="text-sm text-muted-foreground hover:underline">
              Voltar para o início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;