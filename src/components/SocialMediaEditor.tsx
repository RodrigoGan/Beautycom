import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Instagram, Facebook, Youtube, Linkedin, Save, X, Loader2, Share2 } from "lucide-react"
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface SocialMediaEditorProps {
  userId: string
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

export const SocialMediaEditor = ({ 
  userId, 
  currentSocialMedia, 
  onClose, 
  onUpdate 
}: SocialMediaEditorProps) => {
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
        .from('users')
        .update(socialMedia)
        .eq('id', userId)

      if (error) {
        throw error
      }

      toast({
        title: "Redes sociais atualizadas!",
        description: "Suas redes sociais foram salvas com sucesso.",
      })

      onUpdate()
      onClose()
    } catch (error) {
      console.error('Erro ao salvar redes sociais:', error)
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas redes sociais. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }



  return (
    <div className="w-full">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
        <div className="text-center">
          <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center justify-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            Editar Redes Sociais
          </h2>
          <p className="text-sm text-gray-600 mt-2">
            Configure suas redes sociais para que outros usuários possam encontrá-lo.
          </p>
        </div>
      </div>
      
      {/* Content */}
      <div className="px-4 sm:px-6 py-4 space-y-4 sm:space-y-5">
                 {/* Instagram */}
         <div className="space-y-2">
           <Label htmlFor="instagram" className="flex items-center gap-2">
             <Instagram className="h-4 w-4 text-pink-500" />
             Instagram
           </Label>
           <Input
             id="instagram"
             placeholder="@seuusuario"
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
             placeholder="seuusuario"
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
             placeholder="@seucanal"
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
             placeholder="seuusuario"
             value={socialMedia.social_linkedin || ''}
             onChange={(e) => handleInputChange('social_linkedin', e.target.value)}
             className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
           />
         </div>

                 {/* X (Twitter) */}
         <div className="space-y-2">
           <Label htmlFor="x" className="flex items-center gap-2">
             <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
               <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
             </svg>
             X (Twitter)
           </Label>
           <Input
             id="x"
             placeholder="@seuusuario"
             value={socialMedia.social_x || ''}
             onChange={(e) => handleInputChange('social_x', e.target.value)}
             className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
           />
         </div>

                 {/* TikTok */}
         <div className="space-y-2">
           <Label htmlFor="tiktok" className="flex items-center gap-2">
             <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
               <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
             </svg>
             TikTok
           </Label>
           <Input
             id="tiktok"
             placeholder="@seuusuario"
             value={socialMedia.social_tiktok || ''}
             onChange={(e) => handleInputChange('social_tiktok', e.target.value)}
             className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
           />
         </div>

        {/* Botões */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6 border-t border-gray-100">
          <Button 
            variant="outline"
            onClick={onClose}
            disabled={isSaving}
            className="flex-1 h-12"
          >
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            variant="hero"
            onClick={handleSave} 
            disabled={isSaving}
            className="flex-1 h-12"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
