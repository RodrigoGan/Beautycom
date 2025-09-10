import { useState } from 'react'
import { Share2, Copy, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLoginModal } from '@/contexts/LoginModalContext'

interface ShareButtonProps {
  postId: string
  postTitle: string
  postUrl?: string
  className?: string
}

export const ShareButton = ({ postId, postTitle, postUrl, className = '' }: ShareButtonProps) => {
  const { user } = useAuthContext()
  const { showLoginModal } = useLoginModal()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const shareUrl = postUrl || `${window.location.origin}/post/${postId}`
  const shareText = `Confira este post incrível no BeautyWall: ${postTitle}`

  const recordShare = async (shareType: string) => {
    if (!user) {
      showLoginModal()
      return
    }

    try {
      await supabase
        .from('post_shares')
        .insert({
          post_id: postId,
          user_id: user.id,
          share_type: shareType
        })
    } catch (error) {
      console.error('Erro ao registrar compartilhamento:', error)
    }
  }

  const handleShare = async (type: 'whatsapp' | 'copy') => {
    setIsLoading(true)

    try {
      switch (type) {
        case 'whatsapp':
          const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${shareUrl}`)}`
          window.open(whatsappUrl, '_blank')
          await recordShare('whatsapp')
          break

        case 'copy':
          await navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`)
          toast({
            title: "Link copiado!",
            description: "O link foi copiado para a área de transferência.",
            variant: "default",
          })
          await recordShare('copy_link')
          break
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          disabled={isLoading}
          className={`h-auto p-2 ${className}`}
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare('whatsapp')}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Compartilhar no WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')}>
          <Copy className="mr-2 h-4 w-4" />
          Copiar link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
