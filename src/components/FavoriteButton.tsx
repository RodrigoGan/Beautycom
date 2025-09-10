import { Bookmark } from 'lucide-react'
import { useFavorites } from '@/hooks/useFavorites'
import { useEffect } from 'react'

interface FavoriteButtonProps {
  postId: string
  className?: string
}

export const FavoriteButton = ({ postId, className = '' }: FavoriteButtonProps) => {
  const { isFavorited, isLoading, toggleFavorite, checkIfFavorited } = useFavorites(postId)

  useEffect(() => {
    checkIfFavorited()
  }, [checkIfFavorited])

  return (
    <button
      onClick={toggleFavorite}
      disabled={isLoading}
      className={`transition-all duration-200 hover:scale-105 disabled:opacity-50 ${className}`}
    >
      <Bookmark 
        className={`h-5 w-5 transition-all duration-200 ${
          isFavorited 
            ? 'fill-yellow-500 text-yellow-500' 
            : 'text-gray-400 hover:text-yellow-400'
        }`}
      />
    </button>
  )
}
