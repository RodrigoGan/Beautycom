import { useState, useEffect } from "react"
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
import { Loader2, Save, X, User } from "lucide-react"

interface BioEditorProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onBioUpdated: () => void
}

const BioEditor = ({ isOpen, onClose, user, onBioUpdated }: BioEditorProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [bio, setBio] = useState("")

  // Determinar se é um profissional ou usuário comum
  const isProfessional = user?.user_type === 'profissional'

  // Carregar bio atual quando o modal abrir
  useEffect(() => {
    if (user && isOpen) {
      setBio(user.bio || "")
    }
  }, [user, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user?.id) {
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('users')
        .update({
          bio: bio.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao atualizar bio:', error)
        throw error
      }

             toast({
         title: isProfessional ? "Apresentação atualizada!" : "Descrição atualizada!",
         description: isProfessional 
           ? "Sua apresentação profissional foi salva com sucesso."
           : "Sua descrição pessoal foi salva com sucesso.",
       })

      onBioUpdated()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar bio:', error)
             toast({
         title: "Erro ao atualizar",
         description: isProfessional 
           ? "Não foi possível salvar a apresentação. Tente novamente."
           : "Não foi possível salvar a descrição. Tente novamente.",
         variant: "destructive"
       })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 rounded-xl sm:rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 pb-4">
          <div>
                         <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
               <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                 <User className="h-5 w-5 text-white" />
               </div>
               {isProfessional ? 'Editar Apresentação Profissional' : 'Editar Descrição Pessoal'}
             </DialogTitle>
             <DialogDescription className="text-sm text-gray-600 mt-2">
               {isProfessional 
                 ? 'Apresente-se profissionalmente para que clientes possam conhecê-lo melhor.'
                 : 'Conte um pouco sobre você para que outros usuários possam conhecê-lo melhor.'
               }
             </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 space-y-5">
          {/* Bio */}
                     <div className="space-y-2">
             <Label htmlFor="bio" className="text-sm font-medium text-gray-700">
               {isProfessional ? 'Apresentação Profissional' : 'Descrição Pessoal'}
             </Label>
                         <textarea
               id="bio"
               value={bio}
               onChange={(e) => setBio(e.target.value)}
               placeholder={isProfessional 
                 ? "Apresente-se como profissional, mencione suas especialidades, formação, experiência e o que torna seu trabalho único..."
                 : "Conte um pouco sobre você, seus interesses, hobbies, ou qualquer informação que gostaria de compartilhar..."
               }
               rows={6}
               maxLength={500}
               className="w-full px-3 py-3 border border-gray-200 rounded-lg focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 resize-none text-sm"
             />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {bio.length}/500 caracteres
              </p>
              <p className="text-xs text-gray-400">
                {bio.length > 0 ? `${Math.ceil(bio.length / 50)} min de leitura` : ''}
              </p>
            </div>
          </div>

                     {/* Dicas */}
           <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg p-4">
             <h4 className="text-sm font-medium text-purple-800 mb-2">
               {isProfessional ? '💼 Dicas para uma boa apresentação profissional:' : '💡 Dicas para uma boa descrição pessoal:'}
             </h4>
             <ul className="text-xs text-purple-700 space-y-1">
               {isProfessional ? (
                 <>
                   <li>• Apresente-se de forma profissional e confiável</li>
                   <li>• Mencione suas especialidades e áreas de atuação</li>
                   <li>• Inclua informações sobre sua formação e certificações</li>
                   <li>• Destaque sua experiência e anos de atuação</li>
                   <li>• Compartilhe sua filosofia de trabalho e valores</li>
                   <li>• Mencione diferenciais que tornam seu serviço único</li>
                 </>
               ) : (
                 <>
                   <li>• Apresente-se de forma amigável e autêntica</li>
                   <li>• Compartilhe seus interesses e hobbies</li>
                   <li>• Mencione o que te inspira na área da beleza</li>
                   <li>• Conte sobre suas experiências e aprendizados</li>
                   <li>• Mantenha um tom positivo e acolhedor</li>
                   <li>• Seja você mesmo, mostre sua personalidade</li>
                 </>
               )}
             </ul>
           </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-11 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BioEditor
