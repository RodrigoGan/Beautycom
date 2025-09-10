import { useState } from 'react'
import { Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useComments } from '@/hooks/useComments'
import { useCommentCount } from '@/hooks/useCommentCount'
import { useCommentContext } from '@/contexts/CommentContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { useLoginModal } from '@/contexts/LoginModalContext'

interface CommentInputProps {
  postId: string
}

export const CommentInput = ({ postId }: CommentInputProps) => {
  const { user } = useAuthContext()
  const { showLoginModal } = useLoginModal()
  const { addComment, isPosting } = useComments(postId)
  const { refreshCommentCount } = useCommentContext()
  const [commentText, setCommentText] = useState('')

  const handleSubmitComment = async () => {
    if (!user) {
      showLoginModal()
      return
    }

    if (!commentText.trim()) return

    console.log('🎯 Tentando enviar comentário:', commentText, 'para post:', postId)

    try {
      const result = await addComment(commentText)
      console.log('✅ Comentário enviado com sucesso:', result)
      setCommentText('')
      
      // Recarregar contador de comentários
      refreshCommentCount(postId)
    } catch (error) {
      console.error('❌ Erro ao postar comentário:', error)
      alert('Erro ao enviar comentário. Tente novamente.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

  return (
    <div className="flex gap-3 items-center pt-2 border-t border-border">
      <Avatar className="w-6 h-6">
        <AvatarImage src={user?.profile_photo || ''} />
        <AvatarFallback className="text-xs">
          {user?.email?.charAt(0) || 'U'}
        </AvatarFallback>
      </Avatar>
      <input 
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Adicione um comentário..." 
        className="flex-1 bg-transparent text-sm placeholder:text-muted-foreground border-none outline-none"
        onKeyPress={handleKeyPress}
        disabled={isPosting}
      />
      <Button 
        variant="ghost" 
        className="h-auto p-0 text-sm text-primary font-semibold"
        onClick={handleSubmitComment}
        disabled={!commentText.trim() || isPosting}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
