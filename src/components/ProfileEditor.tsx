import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface ProfileEditorProps {
  isOpen: boolean
  onClose: () => void
  user: any
  onProfileUpdated: () => void
}

const ProfileEditor = ({ isOpen, onClose, user, onProfileUpdated }: ProfileEditorProps) => {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cepLoading, setCepLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    telefone: "",
    user_type: ""
  })

  // Estados brasileiros
  const estados = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", 
    "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", 
    "RS", "RO", "RR", "SC", "SP", "SE", "TO"
  ]

  // Carregar dados do usuário quando o modal abrir
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        nickname: user.nickname || "",
        cep: user.cep || "",
        logradouro: user.logradouro || "",
        numero: user.numero || "",
        complemento: user.complemento || "",
        bairro: user.bairro || "",
        cidade: user.cidade || "",
        uf: user.uf || "",
        telefone: user.phone || user.telefone || "",
        user_type: user.user_type || "usuario"
      })
    }
  }, [user, isOpen])

  // Função para formatar CEP (baseado no cadastro)
  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "")
    const limitedNumbers = numbers.slice(0, 8)
    
    if (limitedNumbers.length <= 5) {
      return limitedNumbers
    } else {
      return `${limitedNumbers.slice(0, 5)}-${limitedNumbers.slice(5)}`
    }
  }

  // Função para buscar CEP (baseado no cadastro)
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
          
          console.log('✅ Endereço preenchido automaticamente')
          toast({
            title: "Endereço encontrado!",
            description: "Os campos foram preenchidos automaticamente.",
          })
        } else {
          console.log('❌ CEP não encontrado')
          toast({
            title: "CEP não encontrado",
            description: "Verifique o CEP informado ou preencha manualmente.",
            variant: "destructive"
          })
        }
      } catch (error) {
        console.error('❌ Erro ao buscar CEP:', error)
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

  // Função para lidar com mudança no CEP (baseado no cadastro)
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setFormData(prev => ({
      ...prev,
      cep: formatted
    }))
    
    // Buscar CEP quando tiver 8 dígitos
    if (formatted.replace(/\D/g, "").length === 8) {
      console.log('🚀 Iniciando busca do CEP:', formatted)
      fetchCep(formatted)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('🚀 Iniciando atualização do perfil...')
    console.log('👤 Usuário ID:', user?.id)
    console.log('📝 Dados do formulário:', formData)
    
    if (!user?.id) {
      console.error('❌ Usuário não identificado')
      toast({
        title: "Erro",
        description: "Usuário não identificado",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      const updateData = {
        name: formData.name.trim(),
        cep: formData.cep.trim(),
        logradouro: formData.logradouro.trim(),
        numero: formData.numero.trim(),
        complemento: formData.complemento.trim(),
        bairro: formData.bairro.trim(),
        cidade: formData.cidade.trim(),
        uf: formData.uf,
        phone: formData.telefone.trim(),
        user_type: formData.user_type,
        updated_at: new Date().toISOString()
      }

      console.log('📡 Enviando dados para atualização:', updateData)

      const { data, error } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()

      if (error) {
        console.error('❌ Erro ao atualizar perfil:', error)
        throw error
      }

      console.log('✅ Perfil atualizado com sucesso!')
      console.log('📋 Dados retornados:', data)

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
      })

      console.log('🔄 Chamando onProfileUpdated...')
      onProfileUpdated()
      console.log('🚪 Fechando modal...')
      onClose()
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil:', error)
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível salvar as alterações. Tente novamente.",
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
              Editar Perfil
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-600 mt-2">
              Atualize suas informações pessoais. O nickname (@) e email não podem ser alterados.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 space-y-5">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome completo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Seu nome completo"
              required
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Nickname (somente leitura) */}
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-sm font-medium text-gray-700">Nickname</Label>
            <Input
              id="nickname"
              value={`@${formData.nickname}`}
              disabled
              className="bg-gray-50 border-gray-200 text-gray-500 h-11"
            />
            <p className="text-xs text-gray-500">
              O nickname não pode ser alterado
            </p>
          </div>



          {/* CEP */}
          <div className="space-y-2">
            <Label htmlFor="cep" className="text-sm font-medium text-gray-700">CEP</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="cep"
                  value={formData.cep}
                  onChange={handleCepChange}
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

          {/* Logradouro */}
          <div className="space-y-2">
            <Label htmlFor="logradouro" className="text-sm font-medium text-gray-700">Logradouro</Label>
            <Input
              id="logradouro"
              value={formData.logradouro}
              onChange={(e) => handleInputChange('logradouro', e.target.value)}
              placeholder="Rua, Avenida, etc."
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Número e Complemento */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero" className="text-sm font-medium text-gray-700">Número</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => handleInputChange('numero', e.target.value)}
                placeholder="123"
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complemento" className="text-sm font-medium text-gray-700">Complemento</Label>
              <Input
                id="complemento"
                value={formData.complemento}
                onChange={(e) => handleInputChange('complemento', e.target.value)}
                placeholder="Apto, Casa, etc."
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
              onChange={(e) => handleInputChange('bairro', e.target.value)}
              placeholder="Seu bairro"
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Cidade e Estado */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cidade" className="text-sm font-medium text-gray-700">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => handleInputChange('cidade', e.target.value)}
                placeholder="Sua cidade"
                className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uf" className="text-sm font-medium text-gray-700">Estado</Label>
              <Select value={formData.uf} onValueChange={(value) => handleInputChange('uf', value)}>
                <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200">
                  <SelectValue placeholder="Selecione o estado" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Telefone */}
          <div className="space-y-2">
            <Label htmlFor="telefone" className="text-sm font-medium text-gray-700">Telefone</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => handleInputChange('telefone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200"
            />
          </div>

          {/* Tipo de usuário */}
          <div className="space-y-2">
            <Label htmlFor="user_type" className="text-sm font-medium text-gray-700">Tipo de usuário</Label>
            <Select value={formData.user_type} onValueChange={(value) => handleInputChange('user_type', value)}>
              <SelectTrigger className="border-gray-200 focus:border-purple-500 focus:ring-purple-500/20 h-11 transition-all duration-200">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usuario">Usuário</SelectItem>
                <SelectItem value="profissional">Profissional</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Botões */}
          <div className="flex gap-4 pt-6 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 h-12"
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="hero"
              disabled={loading || !formData.name.trim()}
              className="flex-1 h-12"
            >
              {loading ? (
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
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default ProfileEditor
