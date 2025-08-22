import { useState } from 'react'
import { MoreHorizontal, Edit, Trash2, EyeOff, Flag, Copy, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { supabase } from '@/lib/supabase'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCategories } from '@/hooks/useCategories'
import { useToast } from '@/hooks/use-toast'
import { useLoginModal } from '@/contexts/LoginModalContext'

interface PostMenuProps {
  postId: string
  postUserId: string
  postTitle: string
  postDescription: string
  postCategory: string
  className?: string
  onPostUpdated?: () => void
  onPostDeleted?: () => void
}

export const PostMenu = ({ 
  postId, 
  postUserId, 
  postTitle, 
  postDescription, 
  postCategory, 
  className = '', 
  onPostUpdated, 
  onPostDeleted 
}: PostMenuProps) => {
  const { user } = useAuthContext()
  const { showLoginModal } = useLoginModal()
  const { categories } = useCategories()
  const { toast } = useToast()
  const [showReportDialog, setShowReportDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [reportDescription, setReportDescription] = useState('')
  const [editTitle, setEditTitle] = useState(postTitle || '')
  const [editDescription, setEditDescription] = useState(postDescription || '')
  const [editCategory, setEditCategory] = useState(postCategory || '')
  const [isLoading, setIsLoading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const isOwner = user?.id === postUserId

  const handleRequireLogin = () => {
    showLoginModal()
  }

  const handleHidePost = async () => {
    if (!user) return

    try {
      await supabase
        .from('post_hidden')
        .insert({
          post_id: postId,
          user_id: user.id
        })
      
      toast({
        title: "Post ocultado!",
        description: "O post foi ocultado do seu feed.",
        variant: "default",
      })
    } catch (error) {
      console.error('Erro ao ocultar post:', error)
      toast({
        title: "Erro ao ocultar post",
        description: "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  const handleReportPost = async () => {
    if (!user || !reportReason) return

    setIsLoading(true)
    try {
      await supabase
        .from('post_reports')
        .insert({
          post_id: postId,
          user_id: user.id,
          reason: reportReason,
          description: reportDescription
        })
      
      setShowReportDialog(false)
      setReportReason('')
      setReportDescription('')
      toast({
        title: "Denúncia enviada!",
        description: "Obrigado por nos ajudar a manter a comunidade segura.",
        variant: "default",
      })
    } catch (error) {
      console.error('Erro ao denunciar post:', error)
      toast({
        title: "Erro ao enviar denúncia",
        description: "Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${postId}`
    try {
      await navigator.clipboard.writeText(postUrl)
      toast({
        title: "Link copiado!",
        description: "O link do post foi copiado para a área de transferência.",
        variant: "default",
      })
    } catch (error) {
      console.error('Erro ao copiar link:', error)
      toast({
        title: "Erro ao copiar link",
        description: "Tente novamente ou copie manualmente.",
        variant: "destructive",
      })
    }
  }

  const handleEditPost = () => {
    setEditTitle(postTitle)
    setEditDescription(postDescription)
    setEditCategory(postCategory)
    setShowEditDialog(true)
  }

  const handleSaveEdit = async () => {
    if (!editTitle.trim()) {
      toast({
        title: "Título obrigatório",
        description: "O título do post é obrigatório.",
        variant: "destructive",
      })
      return
    }

    setIsEditing(true)
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          title: editTitle.trim(),
          description: editDescription.trim()
        })
        .eq('id', postId)
        .eq('user_id', user?.id)

      if (error) throw error

      setShowEditDialog(false)
      
      // Atualizar o post localmente para refletir imediatamente
      const updatedPost = {
        id: postId,
        title: editTitle.trim(),
        description: editDescription.trim()
      }
      
      // Chamar callback para atualizar a UI
      onPostUpdated?.()
      
      // Mostrar feedback visual
      toast({
        title: "Post atualizado!",
        description: "Suas alterações foram salvas com sucesso.",
        variant: "default",
      })
      
    } catch (error) {
      console.error('Erro ao editar post:', error)
      toast({
        title: "Erro ao editar post",
        description: "Tente novamente. Se o problema persistir, entre em contato conosco.",
        variant: "destructive",
      })
    } finally {
      setIsEditing(false)
    }
  }

  const handleDeletePost = () => {
    setShowDeleteDialog(true)
  }

  const handleConfirmDelete = async () => {
    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_active: false })
        .eq('id', postId)
        .eq('user_id', user?.id)

      if (error) throw error

      setShowDeleteDialog(false)
      toast({
        title: "Post excluído!",
        description: "O post foi removido com sucesso.",
        variant: "default",
      })
      onPostDeleted?.()
    } catch (error) {
      console.error('Erro ao excluir post:', error)
      toast({
        title: "Erro ao excluir post",
        description: "Tente novamente. Se o problema persistir, entre em contato conosco.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DropdownMenu>
                 <DropdownMenuTrigger asChild>
           <Button
             variant="ghost"
             size="sm"
             className={`h-auto p-2 focus:outline-none focus:ring-0 focus:ring-offset-0 ${className}`}
           >
             <MoreHorizontal className="h-4 w-4" />
           </Button>
         </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {!user ? (
            // Usuário não logado - mostrar mensagem amigável
            <>
              <DropdownMenuItem onClick={handleRequireLogin} className="text-center">
                <User className="mr-2 h-4 w-4" />
                Faça login para interagir
              </DropdownMenuItem>
            </>
          ) : isOwner ? (
            // Usuário logado e é o dono do post
            <>
              <DropdownMenuItem onClick={handleEditPost}>
                <Edit className="mr-2 h-4 w-4" />
                Editar post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDeletePost} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir post
              </DropdownMenuItem>
            </>
          ) : (
            // Usuário logado mas não é o dono do post
            <>
              <DropdownMenuItem onClick={handleHidePost}>
                <EyeOff className="mr-2 h-4 w-4" />
                Ocultar post
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowReportDialog(true)}>
                <Flag className="mr-2 h-4 w-4" />
                Denunciar
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar link
          </DropdownMenuItem>
          
          {!user ? (
            <DropdownMenuItem onClick={handleRequireLogin}>
              <User className="mr-2 h-4 w-4" />
              Ver perfil
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem asChild>
              <Link to={`/perfil/${postUserId}`} className="flex items-center">
                <User className="mr-2 h-4 w-4" />
                Ver perfil
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

             {/* Dialog de edição */}
       <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
         <DialogContent className="max-w-[95vw] sm:max-w-lg mx-2 sm:mx-4">
           <DialogHeader className="text-center pb-4">
             <div className="flex items-center justify-center gap-2 mb-2">
               <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                 <Edit className="w-4 h-4 text-white" />
               </div>
               <DialogTitle className="text-xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent">
                 Editar Post
               </DialogTitle>
             </div>
             <DialogDescription className="text-center text-gray-600">
               💡 <strong>Dica:</strong> Você pode editar apenas o título e descrição do seu post. 
               Para alterar imagens, vídeos, categoria ou outros elementos, recomendamos excluir este post e criar um novo.
             </DialogDescription>
           </DialogHeader>
          
           <div className="space-y-6">
             <div>
               <label className="text-sm font-semibold text-gray-700 mb-2 block">Título *</label>
               <input
                 type="text"
                 value={editTitle}
                 onChange={(e) => setEditTitle(e.target.value)}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm"
                 placeholder="Digite o título do post..."
                 maxLength={100}
               />
               <p className="text-xs text-gray-500 mt-2">
                 {(editTitle || '').length}/100 caracteres
               </p>
             </div>
             
             <div>
               <label className="text-sm font-semibold text-gray-700 mb-2 block">Descrição</label>
               <Textarea
                 value={editDescription}
                 onChange={(e) => setEditDescription(e.target.value)}
                 placeholder="Descreva seu post..."
                 rows={4}
                 maxLength={500}
                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-white shadow-sm resize-none"
               />
               <p className="text-xs text-gray-500 mt-2">
                 {(editDescription || '').length}/500 caracteres
               </p>
             </div>
            
             <div className="flex gap-3 pt-4">
               <Button
                 onClick={handleSaveEdit}
                 disabled={!editTitle.trim() || isEditing}
                 className="flex-1 bg-gradient-primary hover:bg-gradient-primary/90 text-white font-semibold py-3 rounded-lg shadow-beauty-glow transition-all duration-200"
               >
                 {isEditing ? (
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Salvando...
                   </div>
                 ) : (
                   'Salvar alterações'
                 )}
               </Button>
               <Button
                 variant="outline"
                 onClick={() => setShowEditDialog(false)}
                 disabled={isEditing}
                 className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition-all duration-200"
               >
                 Cancelar
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

             {/* Dialog de confirmação de exclusão */}
       <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
         <DialogContent className="max-w-[95vw] sm:max-w-lg mx-2 sm:mx-4">
           <DialogHeader className="text-center pb-4">
             <div className="flex items-center justify-center gap-2 mb-2">
               <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                 <Trash2 className="w-4 h-4 text-white" />
               </div>
               <DialogTitle className="text-xl font-bold text-red-600">
                 Excluir Post
               </DialogTitle>
             </div>
             <DialogDescription className="text-center text-gray-600">
               ⚠️ <strong>Atenção:</strong> Esta ação não pode ser desfeita. 
               O post será removido permanentemente do feed.
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-6">
             <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
               <p className="text-sm text-red-700 font-medium">
                 Tem certeza que deseja excluir este post?
               </p>
             </div>
             
             <div className="flex gap-3 pt-4">
               <Button
                 onClick={handleConfirmDelete}
                 disabled={isLoading}
                 variant="destructive"
                 className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg shadow-sm transition-all duration-200"
               >
                 {isLoading ? (
                   <div className="flex items-center gap-2">
                     <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                     Excluindo...
                   </div>
                 ) : (
                   'Sim, excluir'
                 )}
               </Button>
               <Button
                 variant="outline"
                 onClick={() => setShowDeleteDialog(false)}
                 disabled={isLoading}
                 className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold py-3 rounded-lg transition-all duration-200"
               >
                 Cancelar
               </Button>
             </div>
           </div>
         </DialogContent>
       </Dialog>

       {/* Dialog de denúncia */}
       <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Denunciar post</DialogTitle>
             <DialogDescription>
               Ajude-nos a manter a comunidade segura denunciando conteúdo inadequado.
             </DialogDescription>
           </DialogHeader>
           
           <div className="space-y-4">
             <div>
               <label className="text-sm font-medium">Motivo da denúncia</label>
               <Select value={reportReason} onValueChange={setReportReason}>
                 <SelectTrigger>
                   <SelectValue placeholder="Selecione um motivo" />
                 </SelectTrigger>
                 <SelectContent>
                   <SelectItem value="spam">Spam</SelectItem>
                   <SelectItem value="inappropriate">Conteúdo inadequado</SelectItem>
                   <SelectItem value="fake">Informação falsa</SelectItem>
                   <SelectItem value="other">Outro</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             
             <div>
               <label className="text-sm font-medium">Descrição (opcional)</label>
               <Textarea
                 value={reportDescription}
                 onChange={(e) => setReportDescription(e.target.value)}
                 placeholder="Descreva o motivo da denúncia..."
                 rows={3}
               />
             </div>
             
             <div className="flex gap-2">
               <Button
                 onClick={handleReportPost}
                 disabled={!reportReason || isLoading}
                 className="flex-1"
               >
                 {isLoading ? 'Enviando...' : 'Enviar denúncia'}
               </Button>
               <Button
                 variant="outline"
                 onClick={() => setShowReportDialog(false)}
               >
                 Cancelar
               </Button>
             </div>
           </div>
         </DialogContent>
               </Dialog>
     </>
   )
 }
