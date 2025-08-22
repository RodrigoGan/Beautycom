import { Heart } from 'lucide-react'
import { useLikes } from '@/hooks/useLikes'
import { useEffect } from 'react'

interface LikeButtonProps {
  postId: string
  className?: string
}

export const LikeButton = ({ postId, className = '' }: LikeButtonProps) => {
  const { isLiked, likeCount, isLoading, toggleLike, checkIfLiked, getLikeCount } = useLikes(postId)

  useEffect(() => {
    checkIfLiked()
    getLikeCount()
  }, [checkIfLiked, getLikeCount])

  return (
    <button
      onClick={toggleLike}
      disabled={isLoading}
      className={`flex items-center gap-2 transition-all duration-200 hover:scale-105 disabled:opacity-50 ${className}`}
    >
      <Heart 
        className={`h-5 w-5 transition-all duration-200 ${
          isLiked 
            ? 'fill-red-500 text-red-500' 
            : 'text-gray-400 hover:text-red-400'
        }`}
      />
      {likeCount > 0 && (
        <span className="text-sm text-muted-foreground">
          {likeCount}
        </span>
      )}
    </button>
  )
}
