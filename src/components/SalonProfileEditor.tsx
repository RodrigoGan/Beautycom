import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { Loader2, Save, X, MapPin } from "lucide-react"

interface SalonProfileEditorProps {
  isOpen: boolean
  onClose: () => void
  salon: any
  onProfileUpdated: () => void
}

const SalonProfileEditor = ({ isOpen, onClose, salon, onProfileUpdated }: SalonProfileEditorProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: ""
  })

  // Estados brasileiros
  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ]

  // Carregar dados do salão quando o modal abrir
  useEffect(() => {
    if (salon && isOpen) {
      setFormData({
        name: salon.name || "",
        phone: salon.phone || "",
        email: salon.email || "",
        cep: salon.cep || "",
        logradouro: salon.logradouro || "",
        numero: salon.numero || "",
        complemento: salon.complemento || "",
        bairro: salon.bairro || "",
        cidade: salon.cidade || "",
        uf: salon.uf || ""
      })
    }
  }, [salon, isOpen])

  // Função para formatar CEP
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const limitedNumbers = numbers.slice(0, 8)
    
    if (limitedNumbers.length <= 5) {
      return limitedNumbers
    } else {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`
    }
  }

  // Função para buscar CEP
  const fetchCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, "")
    
    if (cleanCep.length === 8) {
      setCepLoading(true)
      try {
        console.log('🔍 Buscando CEP:', cleanCep)
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()
        
        console.log('📦 Resposta da API:', data)
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            uf: data.uf || ""
          }))
          
          toast({
            title: "Endereço encontrado!",
            description: "Preencha o número e complemento se necessário.",
          })
        } else {
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP digitado.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
        toast({
          title: "Erro ao buscar CEP",
          description: "Tente novamente ou preencha manualmente.",
          variant: "destructive"
        })
      } finally {
        setCepLoading(false)
      }
    }
  }

  // Função para validar formulário
  const validateForm = () => {
    const errors: string[] = []
    
    if (!formData.name.trim()) errors.push("Nome do salão")
    if (!formData.phone.trim()) errors.push("Telefone")
    if (!formData.email.trim()) errors.push("E-mail")
    if (!formData.cep.trim()) errors.push("CEP")
    if (!formData.logradouro.trim()) errors.push("Logradouro")
    if (!formData.numero.trim()) errors.push("Número")
    if (!formData.bairro.trim()) errors.push("Bairro")
    if (!formData.cidade.trim()) errors.push("Cidade")
    if (!formData.uf.trim()) errors.push("UF")
    
    return errors
  }

  // Função para salvar dados
  const handleSave = async () => {
    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: errors.join(", "),
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase
        .from('salons_studios')
        .update({
          name: formData.name.trim(),
          phone: formData.phone.trim(),
          email: formData.email.trim(),
          cep: formData.cep.trim(),
          logradouro: formData.logradouro.trim(),
          numero: formData.numero.trim(),
          complemento: formData.complemento.trim(),
          bairro: formData.bairro.trim(),
          cidade: formData.cidade.trim(),
          uf: formData.uf.trim().toUpperCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', salon.id)

      if (error) {
        throw error
      }

      toast({
        title: "Perfil atualizado!",
        description: "As informações do salão foram atualizadas com sucesso.",
      })

      onProfileUpdated()
      onClose()
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o perfil. Tente novamente.",
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
                <MapPin className="h-5 w-5 text-white" />
              </div>
              Editar Perfil do Salão
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Atualize as informações básicas do seu salão/estúdio.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="px-4 sm:px-6 space-y-5">
          {/* Nome do Salão */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome do Salão *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Nome do seu salão"
              required
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone *</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="(11) 99999-9999"
              required
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              placeholder="contato@salao.com"
              required
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          

          {/* CEP */}
          <div className="space-y-2">
            <Label htmlFor="cep" className="text-sm font-medium text-gray-700">CEP</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={(e) => {
                    const formatted = formatCep(e.target.value)
                    setFormData(prev => ({ ...prev, cep: formatted }))
                    if (formatted.length === 9) {
                      fetchCep(formatted)
                    }
                  }}
                  placeholder="00000-000"
                  maxLength={9}
                  className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200 pr-10"
                />
                {cepLoading && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                  </div>
                )}
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => formData.cep.replace(/\D/g, '').length === 8 && fetchCep(formData.cep)}
                disabled={cepLoading || formData.cep.replace(/\D/g, '').length !== 8}
                className="px-4 h-11 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
              >
                Buscar
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Digite o CEP e clique em "Buscar" ou aguarde o preenchimento automático
            </p>
          </div>

          {/* UF */}
          <div className="space-y-2">
            <Label htmlFor="uf" className="text-sm font-medium text-gray-700">UF</Label>
            <select
              id="uf"
              value={formData.uf}
              onChange={(e) => setFormData(prev => ({ ...prev, uf: e.target.value }))}
              className="w-full px-3 py-2 border-2 border-gray-200 bg-white rounded-md text-sm h-11 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
            >
              <option value="">Selecione...</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>

          {/* Logradouro */}
          <div className="space-y-2">
            <Label htmlFor="logradouro" className="text-sm font-medium text-gray-700">Logradouro</Label>
            <Input
              id="logradouro"
              value={formData.logradouro}
              onChange={(e) => setFormData(prev => ({ ...prev, logradouro: e.target.value }))}
              placeholder="Rua, Avenida, etc."
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero" className="text-sm font-medium text-gray-700">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData(prev => ({ ...prev, numero: e.target.value }))}
                placeholder="123"
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento" className="text-sm font-medium text-gray-700">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => setFormData(prev => ({ ...prev, complemento: e.target.value }))}
                placeholder="Apto, Sala, etc."
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
              />
            </div>
          </div>

          {/* Bairro */}
          <div className="space-y-2">
            <Label htmlFor="bairro" className="text-sm font-medium text-gray-700">Bairro</Label>
            <Input
              id="bairro"
              value={formData.bairro}
              onChange={(e) => setFormData(prev => ({ ...prev, bairro: e.target.value }))}
              placeholder="Nome do bairro"
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Cidade */}
          <div className="space-y-2">
            <Label htmlFor="cidade" className="text-sm font-medium text-gray-700">Cidade</Label>
            <Input
              id="cidade"
              value={formData.cidade}
              onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
              placeholder="Nome da cidade"
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-6">
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
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default SalonProfileEditor
