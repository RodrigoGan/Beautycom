import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface MainPostButtonProps {
  postId: string
  userId: string
  currentUserId?: string
  onToggle?: (isMain: boolean) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'outline' | 'default'
  className?: string
  forceRefresh?: number
  markAsMain?: (postId: string) => Promise<boolean>
  unmarkAsMain?: (postId: string) => Promise<boolean>
  priorityOrder?: number
}

export const MainPostButton = ({
  postId,
  userId,
  currentUserId,
  onToggle,
  size = 'sm',
  variant = 'ghost',
  className = '',
  forceRefresh = 0,
  markAsMain,
  unmarkAsMain,
  priorityOrder
}: MainPostButtonProps) => {
  const [isMainPost, setIsMainPost] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const { toast } = useToast()

  // Verificar se o post é principal ao carregar
  useEffect(() => {
    checkMainPost()
  }, [postId])

  // Recarregar estado quando forceRefresh mudar
  useEffect(() => {
    if (forceRefresh > 0) {
      console.log(`🔄 ForceRefresh executado para post ${postId}, valor: ${forceRefresh}`)
      // Adicionar um pequeno delay para evitar chamadas simultâneas
      setTimeout(() => {
        checkMainPost()
      }, 100)
    }
  }, [forceRefresh])

  // Função para verificar se o post é principal
  const checkMainPost = async () => {
    console.log(`🔍 Verificando estado do post ${postId}`)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('is_main_post')
        .eq('id', postId)
        .single()

      if (error) {
        console.error('Erro ao verificar se post é principal:', error)
        return
      }

      const newStatus = data?.is_main_post || false
      console.log(`📊 Post ${postId}: is_main_post = ${newStatus}`)
      setIsMainPost(newStatus)
    } catch (error) {
      console.error('Erro ao verificar se post é principal:', error)
    } finally {
      setChecking(false)
    }
  }

  // Só mostrar o botão se o usuário atual é o dono do post
  const isOwner = currentUserId === userId
  if (!isOwner || checking) {
    return null
  }

  const handleToggle = async (e: React.MouseEvent) => {
    // Prevenir que o clique se propague para o card pai
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    if (!currentUserId || loading) return

    console.log(`🔄 Iniciando toggle para post ${postId}, estado atual: ${isMainPost}`)
    setLoading(true)

    try {
      let success = false

      if (isMainPost) {
        // Desmarcar como principal
        if (unmarkAsMain) {
          success = await unmarkAsMain(postId)
        }
      } else {
        // Marcar como principal
        if (markAsMain) {
          success = await markAsMain(postId)
        }
      }

      if (success) {
        // Atualizar estado local
        setIsMainPost(!isMainPost)
        
        // Callback para notificar componente pai
        onToggle?.(!isMainPost)
      }
    } catch (error) {
      console.error('Erro ao alterar status do post principal:', error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do post principal.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-200 ${
        isMainPost 
          ? 'text-yellow-400 hover:text-yellow-300 bg-black/30 hover:bg-black/40 border-0' 
          : 'text-gray-300 hover:text-gray-100 bg-black/20 hover:bg-black/30 border-0'
      }`}
      title={isMainPost ? "Remover dos posts principais" : "Marcar como post principal"}
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <Star className={`h-4 w-4 ${isMainPost ? 'fill-current' : ''}`} />
      )}
    </Button>
  )
}

