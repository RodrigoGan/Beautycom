import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2, Upload, X, Camera, Image as ImageIcon } from "lucide-react"

interface SalonPhotoEditorProps {
  isOpen: boolean
  onClose: () => void
  salon: any
  onPhotoUpdated: () => void
}

const SalonPhotoEditor = ({ isOpen, onClose, salon, onPhotoUpdated }: SalonPhotoEditorProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadingProfile, setUploadingProfile] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  
  const profileFileRef = useRef<HTMLInputElement>(null)
  const coverFileRef = useRef<HTMLInputElement>(null)

  // Log para debug quando o modal abrir
  console.log('SalonPhotoEditor - Modal aberto:', isOpen)
  console.log('SalonPhotoEditor - Dados do salão:', salon)
  console.log('SalonPhotoEditor - Profile photo:', salon?.profile_photo)
  console.log('SalonPhotoEditor - Cover photo:', salon?.cover_photo)

  const handleFileSelect = (type: 'profile' | 'cover') => {
    const fileInput = type === 'profile' ? profileFileRef.current : coverFileRef.current
    if (fileInput) {
      fileInput.click()
    }
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = event.target.files?.[0]
    if (!file || !salon?.id) return

    // Validar tipo de arquivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione uma imagem (JPG, PNG ou WebP).",
        variant: "destructive"
      })
      return
    }

    // Validar tamanho (máximo 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "Por favor, selecione uma imagem menor que 5MB.",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    if (type === 'profile') {
      setUploadingProfile(true)
    } else {
      setUploadingCover(true)
    }

    try {
      // Determinar bucket e caminho
      const bucket = type === 'profile' ? 'fotoperfil' : 'cover-photos'
      const fileExtension = file.name.split('.').pop()
      const fileName = `${salon.id}/${type}_${Date.now()}.${fileExtension}`
      
      // Upload do arquivo
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        throw uploadError
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      if (!urlData.publicUrl) {
        throw new Error('Erro ao gerar URL pública')
      }

      // Atualizar salão no banco
      const updateField = type === 'profile' ? 'profile_photo' : 'cover_photo'
      const { error: updateError } = await supabase
        .from('salons_studios')
        .update({
          [updateField]: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', salon.id)

      if (updateError) {
        throw updateError
      }

      toast({
        title: `${type === 'profile' ? 'Foto de perfil' : 'Foto de capa'} atualizada!`,
        description: "A foto foi salva com sucesso.",
      })

      onPhotoUpdated()
    } catch (error) {
      console.error(`Erro ao atualizar ${type === 'profile' ? 'foto de perfil' : 'foto de capa'}:`, error)
      toast({
        title: "Erro ao salvar",
        description: `Não foi possível salvar a ${type === 'profile' ? 'foto de perfil' : 'foto de capa'}. Tente novamente.`,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      if (type === 'profile') {
        setUploadingProfile(false)
      } else {
        setUploadingCover(false)
      }
      // Limpar input
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  // Função para gerar URL com cache busting
  const getImageUrl = (url: string) => {
    if (!url) return ''
    console.log('Gerando URL para imagem:', url)
    return `${url}?v=${Date.now()}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 rounded-xl sm:rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 pb-4">
          <div>
            <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                <Camera className="h-5 w-5 text-white" />
              </div>
              Editar Fotos do Salão
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Atualize a foto de perfil e a foto de capa do seu salão/estúdio.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-4 sm:px-6 space-y-6">
          {/* Foto de Perfil */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Foto de Perfil
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('profile')}
                disabled={uploadingProfile}
                className="text-xs"
              >
                {uploadingProfile ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-3 w-3" />
                    Alterar
                  </div>
                )}
              </Button>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-200">
                {salon?.profile_photo ? (
                  <img
                    src={getImageUrl(salon.profile_photo)}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Erro ao carregar foto de perfil:', salon.profile_photo)
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                    onLoad={() => {
                      console.log('Foto de perfil carregada com sucesso')
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 ${salon?.profile_photo ? 'hidden' : ''}`}>
                  <Camera className="h-8 w-8 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600">
                  {salon?.profile_photo 
                    ? "Foto de perfil atual" 
                    : "Nenhuma foto de perfil definida"
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: 400x400px, máximo 5MB
                </p>
              </div>
            </div>
            
            <input
              ref={profileFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'profile')}
              className="hidden"
            />
          </div>

          {/* Foto de Capa */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Foto de Capa
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleFileSelect('cover')}
                disabled={uploadingCover}
                className="text-xs"
              >
                {uploadingCover ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Enviando...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Upload className="h-3 w-3" />
                    Alterar
                  </div>
                )}
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-100 border-2 border-gray-200">
                {salon?.cover_photo ? (
                  <img
                    src={getImageUrl(salon.cover_photo)}
                    alt="Foto de capa"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.log('Erro ao carregar foto de capa:', salon.cover_photo)
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.nextElementSibling?.classList.remove('hidden')
                    }}
                    onLoad={() => {
                      console.log('Foto de capa carregada com sucesso')
                    }}
                  />
                ) : null}
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 ${salon?.cover_photo ? 'hidden' : ''}`}>
                  <Camera className="h-12 w-12 text-white" />
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {salon?.cover_photo 
                    ? "Foto de capa atual" 
                    : "Nenhuma foto de capa definida"
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Recomendado: 1200x400px, máximo 5MB
                </p>
              </div>
            </div>
            
            <input
              ref={coverFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileChange(e, 'cover')}
              className="hidden"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={onClose} 
              disabled={loading}
              className="px-6 h-11 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              onClick={onClose} 
              disabled={loading}
              className="px-6 h-11 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white transition-all duration-200"
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default SalonPhotoEditor
