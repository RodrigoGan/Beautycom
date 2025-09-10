import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Download, Copy, Share2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface QRCodeModalProps {
  isOpen: boolean
  onClose: () => void
  user: any
}

export const QRCodeModal = ({ isOpen, onClose, user }: QRCodeModalProps) => {
  const { toast } = useToast()
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // URL do perfil
  const profileUrl = `${window.location.origin}/perfil/${user?.id}`

  // Gerar QR Code usando uma biblioteca simples
  useEffect(() => {
    if (isOpen && user) {
      // Usando uma API online para gerar QR Code (em produção, use uma biblioteca local)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(profileUrl)}`
      setQrCodeDataUrl(qrUrl)
    }
  }, [isOpen, user, profileUrl])

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(qrCodeDataUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qr-code-${user?.nickname || 'perfil'}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast({
        title: "QR Code baixado!",
        description: "O QR Code foi salvo no seu dispositivo.",
      })
    } catch (error) {
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o QR Code.",
        variant: "destructive"
      })
    }
  }

  const handleCopyLink = () => {
    console.log('Tentando copiar link:', profileUrl)
    
    // Método mais simples e compatível
    const textArea = document.createElement('textarea')
    textArea.value = profileUrl
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    try {
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      if (successful) {
        console.log('Link copiado com sucesso')
        toast({
          title: "Link copiado!",
          description: "O link do perfil foi copiado para a área de transferência.",
        })
      } else {
        throw new Error('Falha ao copiar')
      }
    } catch (error) {
      document.body.removeChild(textArea)
      console.error('Erro ao copiar link:', error)
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link. Tente selecionar e copiar manualmente.",
        variant: "destructive"
      })
    }
  }

  const handleShare = async () => {
    console.log('Tentando compartilhar perfil')
    console.log('navigator.share disponível:', !!navigator.share)
    
    // Verifica se o navegador suporta Web Share API
    if (navigator.share) {
      try {
        const shareData = {
          title: `Perfil de ${user?.name || 'Usuário'} no Beautycom`,
          text: `Confira o perfil de ${user?.name || 'Usuário'} no Beautycom!`,
          url: profileUrl
        }
        
        console.log('Dados para compartilhamento:', shareData)
        await navigator.share(shareData)
        
        // Só mostra toast se o compartilhamento foi bem-sucedido
        console.log('Compartilhamento bem-sucedido')
        toast({
          title: "Compartilhado!",
          description: "Perfil compartilhado com sucesso.",
        })
        return // Sai da função se o compartilhamento funcionou
      } catch (error) {
        console.log('Erro no Web Share:', error)
        // Se o usuário cancelou o compartilhamento, não faz nada
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Usuário cancelou o compartilhamento')
          return
        }
        // Se houve outro erro, continua para o fallback
        console.log('Web Share falhou, usando fallback')
      }
    } else {
      console.log('Web Share API não disponível, usando fallback')
    }
    
    // Fallback: só copia o link se Web Share não estiver disponível ou falhou
    console.log('Executando fallback - copiando link')
    handleCopyLink()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm max-h-[85vh] overflow-y-auto">
        <DialogHeader className="pb-3">
          <DialogTitle className="text-lg">QR Code do Perfil</DialogTitle>
          <DialogDescription className="text-sm">
            Compartilhe seu perfil facilmente com este QR Code
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Informações do usuário */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user?.profile_photo || ''} />
              <AvatarFallback className="bg-gradient-hero text-white">
                {user?.name?.charAt(0) || user?.nickname?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{user?.name || 'Usuário'}</h3>
              <p className="text-xs text-muted-foreground">@{user?.nickname || 'usuario'}</p>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex justify-center">
            {qrCodeDataUrl ? (
              <div className="p-3 bg-white rounded-lg border">
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR Code do perfil" 
                  className="w-32 h-32"
                />
              </div>
            ) : (
              <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            )}
          </div>

          {/* Ações */}
          <div className="grid grid-cols-3 gap-2">
            <Button 
              variant="outline" 
              onClick={handleDownloadQR}
              size="sm"
              className="text-xs"
            >
              <Download className="mr-1 h-3 w-3" />
              Baixar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleCopyLink}
              size="sm"
              className="text-xs"
            >
              <Copy className="mr-1 h-3 w-3" />
              Copiar
            </Button>
            <Button 
              variant="outline" 
              onClick={handleShare}
              size="sm"
              className="text-xs"
            >
              <Share2 className="mr-1 h-3 w-3" />
              Compartilhar
            </Button>
          </div>

          {/* Link do perfil */}
          <div className="p-2 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Link do perfil:</p>
            <p className="text-xs font-mono break-all">{profileUrl}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
