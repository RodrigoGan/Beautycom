import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, UserPlus, LogIn } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface LoginRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  professionalName: string
}

export const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({
  isOpen,
  onClose,
  professionalName
}) => {
  const navigate = useNavigate()

  const handleLogin = () => {
    onClose()
    navigate('/login')
  }

  const handleRegister = () => {
    onClose()
    navigate('/cadastro')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Login Necessário
          </DialogTitle>
          <DialogDescription>
            Para agendar com {professionalName}, você precisa estar logado na plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mx-auto">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-2">
                  Agende com {professionalName}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Faça login ou crie uma conta para agendar seu horário
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            variant="outline" 
            onClick={handleLogin}
            className="flex-1"
          >
            <LogIn className="h-4 w-4 mr-2" />
            Fazer Login
          </Button>
          
          <Button 
            onClick={handleRegister}
            className="flex-1"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Criar Conta
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            É rápido e gratuito! 🎉
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
