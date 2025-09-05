import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload, X, Loader2 } from 'lucide-react'
import { useStorage } from '@/hooks/useStorage'
import { useAuthContext } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'

interface ProfilePhotoUploadProps {
  currentPhoto?: string | null
  onPhotoUpdated?: (photoUrl: string) => void
  className?: string
}

export const ProfilePhotoUpload = ({ 
  currentPhoto, 
  onPhotoUpdated, 
  className = '' 
}: ProfilePhotoUploadProps) => {
  const { user } = useAuthContext()
  const { uploadProfilePhoto } = useStorage()
  const { toast } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(currentPhoto || null)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  // Atualizar previewPhoto quando currentPhoto mudar
  useEffect(() => {
    setPreviewPhoto(currentPhoto || null)
  }, [currentPhoto])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setIsUploading(true)
    
    try {
      // Criar preview imediato
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewPhoto(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Fazer upload para Supabase
      const photoUrl = await uploadProfilePhoto(file, user.id)
      
      if (photoUrl) {
        // Atualizar no banco de dados
        const { error } = await supabase
          .from('users')
          .update({ profile_photo: photoUrl })
          .eq('id', user.id)

        if (error) throw error

        setPreviewPhoto(photoUrl)
        onPhotoUpdated?.(photoUrl)
        
        toast({
          title: "Foto atualizada!",
          description: "Sua foto de perfil foi atualizada com sucesso.",
          variant: "default",
        })
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro ao atualizar foto",
        description: "Tente novamente. Se o problema persistir, entre em contato conosco.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleCameraClick = () => {
    setShowPhotoMenu(false)
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  const handleGalleryClick = () => {
    setShowPhotoMenu(false)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleRemovePhoto = async () => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ profile_photo: null })
        .eq('id', user.id)

      if (error) throw error

      setPreviewPhoto(null)
      onPhotoUpdated?.('')
      
      toast({
        title: "Foto removida!",
        description: "Sua foto de perfil foi removida.",
        variant: "default",
      })
    } catch (error) {
      console.error('Erro ao remover foto:', error)
      toast({
        title: "Erro ao remover foto",
        description: "Tente novamente.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {/* Avatar */}
      <div className="relative">
        <Avatar className="w-24 h-24 ring-4 ring-primary/20 shadow-beauty">
          <AvatarImage 
            src={previewPhoto || ''} 
            className="object-cover object-center"
          />
          <AvatarFallback className="text-2xl bg-gradient-hero text-white">
            {user?.name?.charAt(0) || user?.nickname?.charAt(0) || 'U'}
          </AvatarFallback>
        </Avatar>
        
        {/* Botão de upload */}
        <Button
          size="sm"
          variant="outline"
          className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
          onClick={() => setShowPhotoMenu(!showPhotoMenu)}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Camera className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Menu de opções */}
      {showPhotoMenu && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowPhotoMenu(false)}
          />
          <div className="absolute z-50 mt-2 bg-background border border-border rounded-lg shadow-lg p-2">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCameraClick}
                className="justify-start"
              >
                <Camera className="mr-2 h-4 w-4" />
                Tirar foto
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGalleryClick}
                className="justify-start"
              >
                <Upload className="mr-2 h-4 w-4" />
                Escolher da galeria
              </Button>
              {previewPhoto && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="justify-start text-destructive"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remover foto
                </Button>
              )}
            </div>
          </div>
        </>
      )}

      {/* Input file oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Texto de ajuda */}
      <p className="text-sm text-muted-foreground text-center">
        {previewPhoto 
          ? "Clique na câmera para alterar sua foto"
          : "Adicione uma foto de perfil para personalizar sua conta"
        }
      </p>
    </div>
  )
}
