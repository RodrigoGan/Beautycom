import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

interface SalonMainPostButtonProps {
  postId: string
  isMain: boolean
  hasPermission: boolean
  onToggle: (postId: string) => Promise<boolean>
  className?: string
}

export const SalonMainPostButton: React.FC<SalonMainPostButtonProps> = ({
  postId,
  isMain,
  hasPermission,
  onToggle,
  className = ""
}) => {
  const [loading, setLoading] = useState(false)

  // Não mostrar botão se não tem permissão
  if (!hasPermission) {
    return null
  }

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (loading) return

    console.log(`🔄 Toggle para post ${postId}, atual: ${isMain}`)
    setLoading(true)

    try {
      await onToggle(postId)
    } catch (error) {
      console.error('Erro ao alterar status do post principal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-200 ${
        isMain 
          ? 'text-yellow-400 hover:text-yellow-300 bg-black/30 hover:bg-black/40' 
          : 'text-white/70 hover:text-white bg-black/20 hover:bg-black/30'
      } ${className}`}
      title={
        isMain 
          ? 'Remover dos principais' 
          : 'Marcar como principal'
      }
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <Star className={`h-4 w-4 ${isMain ? 'fill-current text-yellow-400' : ''}`} />
      )}
    </Button>
  )
}