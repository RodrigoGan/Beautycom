import { useState, useEffect } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { useComments, Comment } from '@/hooks/useComments'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface CommentSectionProps {
  postId: string
  className?: string
  showComments?: boolean
  onToggleComments?: () => void
}

export const CommentSection = ({ postId, className = '', showComments = false, onToggleComments }: CommentSectionProps) => {
  const { user } = useAuthContext()
  const { comments, isLoading, isPosting, fetchComments, addComment } = useComments(postId)
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return

    try {
      await addComment(commentText)
      setCommentText('')
    } catch (error) {
      console.error('Erro ao postar comentário:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitComment()
    }
  }

    return (
    <div className={`p-4 ${className}`}>
      {/* Input para novo comentário - sempre visível */}
      <div className="flex gap-3 items-center">
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={user?.profile_photo} />
          <AvatarFallback className="text-xs bg-gradient-primary text-white">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Adicione um comentário..."
            className="flex-1 text-sm"
            disabled={isPosting}
          />
          <Button
            onClick={handleSubmitComment}
            disabled={!commentText.trim() || isPosting}
            size="sm"
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Lista de comentários - só visível quando showComments é true */}
      {showComments && (
        <div className="mt-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">Nenhum comentário ainda</p>
              <p className="text-xs text-muted-foreground mt-1">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-60 overflow-y-auto">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.user.profile_photo || ''} />
                    <AvatarFallback className="text-xs bg-gradient-primary text-white">
                      {comment.user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">
                        {comment.user.name || 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      {comment.comment}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
