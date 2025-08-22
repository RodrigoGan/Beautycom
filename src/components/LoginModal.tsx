import { User, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useLoginModal } from '@/contexts/LoginModalContext'

export const LoginModal = () => {
  const { isLoginModalOpen, hideLoginModal } = useLoginModal()

  return (
    <Dialog open={isLoginModalOpen} onOpenChange={hideLoginModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Interagir com Posts
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Para ver perfis completos e interagir com os posts, você precisa estar logado na sua conta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-4 bg-gradient-card rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground mb-3">
              Faça login para:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>👤 Ver perfis completos</li>
              <li>✨ Curtir e favoritar posts</li>
              <li>💬 Comentar e interagir</li>
              <li>👁️ Ocultar posts que não te interessam</li>
              <li>🚩 Denunciar conteúdo inadequado</li>
              <li>📝 Criar seus próprios posts</li>
            </ul>
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
              onClick={hideLoginModal}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continuar explorando
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
