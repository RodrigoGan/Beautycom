import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SelectionChips } from "@/components/ui/selection-chips"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Loader2, Save, X, Star, Heart } from "lucide-react"

interface SkillsEditorProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onSkillsUpdated: () => void
}

interface Category {
  id: string
  name: string
  description: string
  icon: string
  color: string
}

// Mapear categorias do banco para o formato do SelectionChips
const mapCategoriesToSelectionItems = (categories: Category[]) => {
  return categories.map(cat => cat.name)
}

const SkillsEditor = ({ isOpen, onClose, user, onSkillsUpdated }: SkillsEditorProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedCategoryNames, setSelectedCategoryNames] = useState<string[]>([])

  // Determinar se é um profissional ou usuário comum
  const isProfessional = user?.user_type === 'profissional'

  // Carregar categorias disponíveis
  useEffect(() => {
    if (isOpen) {
      fetchCategories()
    }
  }, [isOpen])

  // Carregar habilidades/interesses atuais do usuário
  useEffect(() => {
    if (user && isOpen) {
      setSelectedCategories(user.categories || [])
    }
  }, [user, isOpen])

  // Mapear IDs das categorias selecionadas para nomes quando as categorias carregarem
  useEffect(() => {
    if (categories.length > 0 && selectedCategories.length > 0) {
      const selectedNames = categories
        .filter(cat => selectedCategories.includes(cat.id))
        .map(cat => cat.name)
      setSelectedCategoryNames(selectedNames)
    } else {
      setSelectedCategoryNames([])
    }
  }, [categories, selectedCategories])

  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, description, icon, color')
        .order('name')

      if (error) {
        console.error('Erro ao buscar categorias:', error)
        throw error
      }

      setCategories(data || [])
    } catch (error) {
      console.error('Erro ao buscar categorias:', error)
      toast({
        title: "Erro ao carregar categorias",
        description: "Não foi possível carregar as opções disponíveis.",
        variant: "destructive"
      })
    } finally {
      setCategoriesLoading(false)
    }
  }

  const handleCategorySelectionChange = (selectedNames: string[]) => {
    setSelectedCategoryNames(selectedNames)
    
    // Converter nomes de volta para IDs
    const selectedIds = categories
      .filter(cat => selectedNames.includes(cat.name))
      .map(cat => cat.id)
    
    setSelectedCategories(selectedIds)
  }

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
          categories: selectedCategories,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Erro ao atualizar categorias:', error)
        throw error
      }

      toast({
        title: isProfessional ? "Habilidades atualizadas!" : "Interesses atualizados!",
        description: isProfessional 
          ? "Suas habilidades foram salvas com sucesso."
          : "Seus interesses foram salvos com sucesso.",
      })

      onSkillsUpdated()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar categorias:', error)
      toast({
        title: "Erro ao atualizar",
        description: isProfessional 
          ? "Não foi possível salvar as habilidades. Tente novamente."
          : "Não foi possível salvar os interesses. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl h-auto max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 rounded-xl sm:rounded-2xl border-0 shadow-2xl">
        <DialogHeader className="px-4 sm:px-6 pb-4">
          <div>
            <DialogTitle className="text-xl sm:text-2xl bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent flex items-center gap-3 font-bold">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
                {isProfessional ? <Star className="h-5 w-5 text-white" /> : <Heart className="h-5 w-5 text-white" />}
              </div>
              {isProfessional ? 'Editar Habilidades' : 'Editar Interesses'}
            </DialogTitle>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 space-y-8">
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
              <span className="ml-2 text-gray-600">Carregando opções...</span>
            </div>
          ) : (
            <SelectionChips
              items={mapCategoriesToSelectionItems(categories)}
              selectedItems={selectedCategoryNames}
              onSelectionChange={handleCategorySelectionChange}
              title={isProfessional ? "Habilidades" : "Interesses"}
              subtitle={`Selecione suas ${isProfessional ? "habilidades" : "interesses"} (pode escolher mais de uma)`}
            />
          )}

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

export default SkillsEditor
