import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2, Save, X, Building2 } from "lucide-react"

interface SalonBioEditorProps {
  isOpen: boolean
  onClose: () => void
  salon: any
  onBioUpdated: () => void
}

const SalonBioEditor = ({ isOpen, onClose, salon, onBioUpdated }: SalonBioEditorProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [description, setDescription] = useState("")

  // Carregar descrição atual quando o modal abrir
  useEffect(() => {
    if (salon && isOpen) {
      setDescription(salon.description || "")
    }
  }, [salon, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!salon?.id) {
      toast({
        title: "Erro",
        description: "Salão não identificado",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase
        .from('salons_studios')
        .update({
          description: description.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', salon.id)

      if (error) {
        console.error('Erro ao atualizar descrição:', error)
        throw error
      }

      toast({
        title: "Descrição atualizada!",
        description: "A descrição do salão foi salva com sucesso.",
      })

      onBioUpdated()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar descrição:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar a descrição. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] sm:max-w-lg h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 rounded-xl sm:rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 pb-1">
          <div>
            <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              Editar Descrição do Salão
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-1">
              Conte um pouco sobre seu salão/estúdio para que os clientes possam conhecê-lo melhor.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 space-y-2">
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrição do Salão
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Conte um pouco sobre seu salão, os serviços oferecidos, especialidades, experiência, etc..."
              rows={5}
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 resize-none"
            />
            <p className="text-xs text-gray-500">
              {description.length}/500 caracteres
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-3">
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
              type="submit"
              disabled={loading}
              className="px-6 h-11 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white transition-all duration-200"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </div>
              ) : (
                'Salvar Descrição'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SalonBioEditor
