import { useState, useEffect } from 'react'
import { X, Heart, Send } from 'lucide-react'
import { useComments } from '@/hooks/useComments'
import { useCommentCount } from '@/hooks/useCommentCount'
import { useCommentContext } from '@/contexts/CommentContext'
import { useAuthContext } from '@/contexts/AuthContext'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface InstagramCommentModalProps {
  postId: string
  postTitle: string
  postAuthor: {
    nickname: string
    name: string
    profile_photo?: string
  }
  isOpen: boolean
  onClose: () => void
}

export const InstagramCommentModal = ({ 
  postId, 
  postTitle, 
  postAuthor, 
  isOpen, 
  onClose 
}: InstagramCommentModalProps) => {
  const { user } = useAuthContext()
  const { comments, fetchComments, addComment, isPosting } = useComments(postId)
  const { commentCount } = useCommentCount(postId)
  const { refreshCommentCount } = useCommentContext()
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, fetchComments])

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return

    try {
      await addComment(commentText)
      setCommentText('')
      refreshCommentCount(postId)
    } catch (error) {
      console.error('Erro ao postar comentário:', error)
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
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50"
          onClick={onClose}
        />
      )}
      
      {/* Modal */}
      <div 
        className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 transition-transform duration-300 ease-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '80vh' }}
      >
                 {/* Header */}
         <div className="flex items-center justify-between p-4 border-b border-gray-200">
           <div className="flex items-center gap-3">
             <Avatar className="w-8 h-8">
               <AvatarImage src={postAuthor?.profile_photo || ''} />
               <AvatarFallback className="text-xs">
                 {postAuthor?.nickname?.charAt(0) || 'U'}
               </AvatarFallback>
             </Avatar>
            <div>
              <h3 className="font-semibold text-sm">{postTitle}</h3>
              <p className="text-xs text-muted-foreground">{commentCount} comentário{commentCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto max-h-60vh">
          {comments.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Nenhum comentário ainda</p>
              <p className="text-xs text-muted-foreground mt-2">Seja o primeiro a comentar!</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={comment.user.profile_photo || ''} />
                    <AvatarFallback className="text-xs">
                      {comment.user.nickname?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">
                        {comment.user.nickname || 'Usuário'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2">
                      {comment.comment}
                    </p>
                    <div className="flex items-center gap-4">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
                        <Heart className="h-3 w-3" />
                        <span>0</span>
                      </button>
                      <button className="text-xs text-muted-foreground hover:text-primary transition-colors">
                        Responder
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex gap-3 items-center">
            <Avatar className="w-8 h-8 flex-shrink-0">
              <AvatarImage src={user?.profile_photo || ''} />
              <AvatarFallback className="text-xs">
                {user?.email?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 flex gap-2">
              <Input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Adicione um comentário..."
                className="flex-1 text-sm border-0 bg-gray-100 rounded-full px-4 py-2 focus:ring-2 focus:ring-primary/20"
                disabled={isPosting}
              />
              <Button
                onClick={handleSubmitComment}
                disabled={!commentText.trim() || isPosting}
                size="sm"
                className="rounded-full h-8 w-8 p-0 bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
