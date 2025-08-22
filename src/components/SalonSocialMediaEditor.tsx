import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Instagram, Facebook, Youtube, Linkedin, Save, X, Loader2, Share2 } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface SalonSocialMediaEditorProps {
  isOpen: boolean
  salonId: string
  currentSocialMedia: {
    social_instagram?: string
    social_facebook?: string
    social_youtube?: string
    social_linkedin?: string
    social_x?: string
    social_tiktok?: string
  }
  onClose: () => void
  onUpdate: () => void
}

export const SalonSocialMediaEditor = ({ 
  isOpen,
  salonId, 
  currentSocialMedia, 
  onClose, 
  onUpdate 
}: SalonSocialMediaEditorProps) => {
  const [socialMedia, setSocialMedia] = useState(currentSocialMedia)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleInputChange = (field: string, value: string) => {
    setSocialMedia(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    try {
      const { error } = await supabase
        .from('salons_studios')
        .update(socialMedia)
        .eq('id', salonId)

      if (error) {
        throw error
      }

      toast({
        title: "Redes sociais atualizadas!",
        description: "As redes sociais do salão foram salvas com sucesso.",
      })

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar redes sociais:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as redes sociais. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 rounded-xl sm:rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 pb-4">
          <div>
            <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              Editar Redes Sociais
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Configure as redes sociais do salão para que os clientes possam encontrá-lo.
            </DialogDescription>
          </div>
        </DialogHeader>
      
        <div className="px-4 sm:px-6 space-y-4 sm:space-y-5">
        {/* Instagram */}
        <div className="space-y-2">
          <Label htmlFor="instagram" className="flex items-center gap-2">
            <Instagram className="h-4 w-4 text-pink-500" />
            Instagram
          </Label>
          <Input
            id="instagram"
            type="text"
            placeholder="@usuario"
            value={socialMedia.social_instagram || ''}
            onChange={(e) => handleInputChange('social_instagram', e.target.value)}
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
          />
        </div>

        {/* Facebook */}
        <div className="space-y-2">
          <Label htmlFor="facebook" className="flex items-center gap-2">
            <Facebook className="h-4 w-4 text-blue-600" />
            Facebook
          </Label>
          <Input
            id="facebook"
            type="text"
            placeholder="@usuario"
            value={socialMedia.social_facebook || ''}
            onChange={(e) => handleInputChange('social_facebook', e.target.value)}
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
          />
        </div>

        {/* YouTube */}
        <div className="space-y-2">
          <Label htmlFor="youtube" className="flex items-center gap-2">
            <Youtube className="h-4 w-4 text-red-600" />
            YouTube
          </Label>
          <Input
            id="youtube"
            type="text"
            placeholder="@canal"
            value={socialMedia.social_youtube || ''}
            onChange={(e) => handleInputChange('social_youtube', e.target.value)}
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-2">
          <Label htmlFor="linkedin" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4 text-blue-700" />
            LinkedIn
          </Label>
          <Input
            id="linkedin"
            type="text"
            placeholder="usuario"
            value={socialMedia.social_linkedin || ''}
            onChange={(e) => handleInputChange('social_linkedin', e.target.value)}
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
          />
        </div>

        {/* X (Twitter) */}
        <div className="space-y-2">
          <Label htmlFor="x" className="flex items-center gap-2">
            <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
            </svg>
            X (Twitter)
          </Label>
          <Input
            id="x"
            type="text"
            placeholder="@usuario"
            value={socialMedia.social_x || ''}
            onChange={(e) => handleInputChange('social_x', e.target.value)}
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
          />
        </div>

        {/* TikTok */}
        <div className="space-y-2">
          <Label htmlFor="tiktok" className="flex items-center gap-2">
            <svg className="h-4 w-4 text-black" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
            </svg>
            TikTok
          </Label>
          <Input
            id="tiktok"
            type="text"
            placeholder="@usuario"
            value={socialMedia.social_tiktok || ''}
            onChange={(e) => handleInputChange('social_tiktok', e.target.value)}
            className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
          />
        </div>
      </div>

        <div className="flex justify-end gap-3 pt-6">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="px-6 h-11 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 h-11 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white transition-all duration-200"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Salvando...
              </div>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
