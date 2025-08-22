import { useEffect, useState, useCallback } from 'react'
import { MessageCircle } from 'lucide-react'
import { useCommentCount } from '@/hooks/useCommentCount'
import { useComments } from '@/hooks/useComments'
import { useCommentContext } from '@/contexts/CommentContext'
import { InstagramCommentModal } from './InstagramCommentModal'

interface CommentCountProps {
  postId: string
  postTitle?: string
  postAuthor?: {
    nickname: string
    name: string
    profile_photo?: string
  }
  className?: string
  onToggleComments?: () => void
}

export const CommentCount = ({ postId, postTitle = '', postAuthor, className = '', onToggleComments }: CommentCountProps) => {
  const { commentCount, isLoading, fetchCommentCount } = useCommentCount(postId)
  const { subscribeToCommentUpdates, unsubscribeFromCommentUpdates } = useCommentContext()

  const refreshCount = useCallback(() => {
    fetchCommentCount()
  }, [fetchCommentCount])

  useEffect(() => {
    fetchCommentCount()
    subscribeToCommentUpdates(postId, refreshCount)
    
    return () => {
      unsubscribeFromCommentUpdates(postId, refreshCount)
    }
  }, [fetchCommentCount, subscribeToCommentUpdates, unsubscribeFromCommentUpdates, postId, refreshCount])

  const handleClick = () => {
    if (onToggleComments) {
      onToggleComments()
    }
  }

  return (
    <>
      <button 
        onClick={handleClick}
        className={`flex items-center gap-2 text-sm transition-all duration-200 hover:scale-105 ${className}`}
      >
        <MessageCircle 
          className={`h-4 w-4 transition-all duration-200 ${
            commentCount > 0 
              ? 'fill-blue-500 text-blue-500' 
              : 'text-muted-foreground hover:text-blue-400'
          }`}
        />
        {commentCount > 0 && (
          <span className="text-muted-foreground">
            {isLoading ? '...' : commentCount}
          </span>
        )}
      </button>


    </>
  )
}
