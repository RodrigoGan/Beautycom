import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2, CheckCircle } from "lucide-react"
import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { translateError } from "@/utils/errorTranslations"

const RecuperarSenha = () => {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const { resetPassword } = useAuthContext()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError("Por favor, digite seu email")
      return
    }
    
    setLoading(true)
    setError("")
    setSuccess(false)
    
    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setError(translateError(error.message))
        return
      }
      
      setSuccess(true)
    } catch (error) {
      console.error("❌ Erro na recuperação de senha:", error)
      
      let errorMessage = "Erro ao enviar email de recuperação. Tente novamente."
      
      if (error instanceof Error) {
        errorMessage = translateError(error.message)
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
              Email enviado!
            </CardTitle>
            <CardDescription>
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md text-sm">
              <p className="font-medium">Instruções enviadas!</p>
              <p className="text-sm mt-1">
                Enviamos um link para redefinir sua senha para <strong>{email}</strong>
              </p>
            </div>
            
            <div className="text-center space-y-2">
              <Link to="/login" className="text-primary hover:underline">
                Voltar para o login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
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
            Recuperar senha
          </CardTitle>
          <CardDescription>
            Digite seu email para receber instruções de recuperação
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
            
            <Button 
              type="submit" 
              className="w-full" 
              variant="hero"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar instruções"
              )}
            </Button>
          </form>
          
          <div className="text-center space-y-2">
            <Link 
              to="/login" 
              className="inline-flex items-center text-sm text-muted-foreground hover:underline"
            >
              <ArrowLeft className="mr-1 h-4 w-4" />
              Voltar para o login
            </Link>
            <p className="text-sm text-muted-foreground">
              Lembrou da senha?{" "}
              <Link to="/login" className="text-primary hover:underline">
                Fazer login
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RecuperarSenha;
