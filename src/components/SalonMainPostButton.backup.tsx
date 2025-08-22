import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface SalonMainPostButtonProps {
  postId: string
  salonId: string
  currentUserId?: string
  isMain: boolean
  onToggle: (postId: string) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  className?: string
  disabled?: boolean
  forceRefresh?: number
  hasPermission?: boolean  // Se o usuário tem permissão para gerenciar posts principais
}

export const SalonMainPostButton: React.FC<SalonMainPostButtonProps> = ({
  postId,
  salonId,
  currentUserId,
  isMain,
  onToggle,
  size = 'sm',
  variant = 'ghost',
  className,
  disabled = false,
  forceRefresh = 0,
  hasPermission = false
}) => {
  const [isMainPost, setIsMainPost] = useState(isMain)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  // Verificar se o post é principal ao carregar
  useEffect(() => {
    checkMainPost()
  }, [postId])

  // Verificar se o post é principal quando isMain mudar
  useEffect(() => {
    console.log(`🔄 isMain prop mudou para post ${postId}:`, isMain)
    setIsMainPost(isMain)
  }, [isMain, postId])

  // Recarregar estado quando forceRefresh mudar
  useEffect(() => {
    if (forceRefresh > 0) {
      console.log(`🔄 ForceRefresh executado para post ${postId}, valor: ${forceRefresh}`)
      
      // Executar imediatamente
      checkMainPost()
      
      // E também após um delay para garantir
      setTimeout(() => {
        console.log(`🔄 Executando checkMainPost via forceRefresh (delay) para post ${postId}`)
        checkMainPost()
      }, 500)
    }
  }, [forceRefresh, postId])

  // Função para verificar se o post é principal
  const checkMainPost = async () => {
    console.log(`🔍 Verificando estado do post ${postId}`)
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('is_salon_main_post, salon_main_post_priority')
        .eq('id', postId)
        .single()

      if (error) {
        console.error('Erro ao verificar se post é principal:', error)
        setChecking(false)
        return
      }

      const newStatus = data?.is_salon_main_post || false
      const priority = data?.salon_main_post_priority
      console.log(`📊 Post ${postId}: is_salon_main_post = ${newStatus}, priority = ${priority}`)
      
      // Forçar atualização do estado
      setIsMainPost(newStatus)
      console.log(`✅ Estado atualizado para post ${postId}: ${newStatus}`)
    } catch (error) {
      console.error('Erro ao verificar se post é principal:', error)
    } finally {
      setChecking(false)
    }
  }

  // Mostrar o botão apenas para usuários com permissão
  const isLoggedIn = !!currentUserId
  console.log('🔍 SalonMainPostButton renderizando:', { 
    postId, 
    currentUserId, 
    isLoggedIn, 
    checking, 
    hasPermission,
    isMainPost 
  })
  
  if (!isLoggedIn || checking || !hasPermission) {
    console.log('❌ SalonMainPostButton não renderizando:', { 
      isLoggedIn, 
      checking, 
      hasPermission,
      reason: !isLoggedIn ? 'não logado' : !hasPermission ? 'sem permissão' : 'carregando'
    })
    return null
  }

  const handleClick = async (e: React.MouseEvent) => {
    // Prevenir que o clique se propague para o card pai
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()
    
    if (!currentUserId || loading || disabled) return

    console.log(`🔄 Iniciando toggle para post ${postId}, estado atual: ${isMainPost}`)
    setLoading(true)

    try {
      // Usar apenas o callback onToggle, não as funções diretas
      // O componente pai (SalonProfile) vai gerenciar a lógica
      console.log(`🔄 Chamando onToggle para post ${postId}`)
      await onToggle(postId)
      
      // NÃO atualizar estado local - deixar o forceRefresh/checkMainPost fazer isso
      console.log(`✅ onToggle concluído para post ${postId}`)
    } catch (error) {
      console.error('Erro ao alterar status do post principal:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleClick}
      disabled={loading || disabled}
      className={`p-2 rounded-full transition-all duration-200 ${
        isMainPost 
          ? 'text-yellow-400 hover:text-yellow-300 bg-black/30 hover:bg-black/40 border-0' 
          : disabled
            ? 'text-gray-400 bg-black/10 border-0 cursor-not-allowed'
            : 'text-white/70 hover:text-white bg-black/20 hover:bg-black/30 border-0'
      }`}
      title={
        isMainPost 
          ? 'Remover dos principais' 
          : disabled 
            ? 'Limite de 3 posts principais atingido'
            : 'Marcar como principal'
      }
    >
      {loading ? (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      ) : (
        <Star className={`h-4 w-4 ${isMainPost ? 'fill-current' : ''}`} />
      )}
    </Button>
  )
}

