import { useState } from 'react'
import { Share2, Copy, MessageCircle, Mail, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface ProfileShareButtonProps {
  user: any
  className?: string
}

export const ProfileShareButton = ({ user, className = '' }: ProfileShareButtonProps) => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const profileUrl = `${window.location.origin}/perfil/${user?.id}`
  const shareText = `Confira o perfil de ${user?.name || 'Usuário'} no Beautycom!`

  const handleShare = async (type: 'whatsapp' | 'email' | 'copy' | 'native') => {
    setIsLoading(true)

    try {
      switch (type) {
        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${profileUrl}`)}`
          window.open(whatsappUrl, '_blank')
          break

                 case 'email':
           const emailUrl = `mailto:?subject=Perfil no Beautycom&body=${encodeURIComponent(`${shareText}\n\n${profileUrl}`)}`
           window.open(emailUrl, '_blank')
           break

        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n\n${profileUrl}`)
          toast({
            title: "Link copiado!",
            description: "O link do perfil foi copiado para a área de transferência.",
          })
          break

        case 'native':
                     if (navigator.share) {
             await navigator.share({
               title: `Perfil de ${user?.name || 'Usuário'} no Beautycom`,
               text: shareText,
               url: profileUrl
             })
          } else {
            // Fallback para navegadores que não suportam Web Share API
            await navigator.clipboard.writeText(`${shareText}\n\n${profileUrl}`)
            toast({
              title: "Link copiado!",
              description: "O link do perfil foi copiado para a área de transferência.",
            })
          }
          break
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
      toast({
        title: "Erro ao compartilhar",
        description: "Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          disabled={isLoading}
          className={className}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => handleShare('native')}>
          <Share2 className="mr-2 h-4 w-4" />
          Compartilhar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="mr-2 h-4 w-4" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')}>
          <Mail className="mr-2 h-4 w-4" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
