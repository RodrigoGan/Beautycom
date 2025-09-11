import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SelectionChips } from "@/components/ui/selection-chips"
import { Eye, EyeOff, ArrowLeft, ArrowRight, Sparkles, Users, Star, Heart, Calendar, CheckCircle, User, MoreVertical, Camera, Upload, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BEAUTY_CATEGORIES } from "@/lib/constants"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { useStorage } from "@/hooks/useStorage"
import { useCategories } from "@/hooks/useCategories"

const Cadastro = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [userType, setUserType] = useState<string>("")
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showPhotoMenu, setShowPhotoMenu] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [cep, setCep] = useState("")
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [addressData, setAddressData] = useState({
    logradouro: "",
    bairro: "",
    cidade: "",
    uf: "",
    complemento: "",
    numero: ""
  })
  
  // Estados para validação da etapa 1
  const [formData, setFormData] = useState({
    nome: "",
    nickname: "",
    email: "",
    senha: ""
  })
  const [errors, setErrors] = useState<{[key: string]: string}>({})
  const [touched, setTouched] = useState<{[key: string]: boolean}>({})
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isCheckingNickname, setIsCheckingNickname] = useState(false)
  
  // Estados para salvamento
  const [isSaving, setIsSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { toast } = useToast()
  const { uploadProfilePhoto } = useStorage()
  const { categories } = useCategories()

  // Scroll para o topo quando a página carregar
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Função para validar campos obrigatórios da etapa 1
  const validateStep1 = () => {
    const newErrors: {[key: string]: string} = {}
    
    // Marcar todos os campos como tocados para mostrar erros
    setTouched({
      foto: true,
      nome: true,
      nickname: true,
      userType: true,
      phoneNumber: true,
      email: true,
      senha: true
    })
    
    // Validar foto
    if (!profilePhoto) {
      newErrors.foto = "Foto é obrigatória"
    }
    
    // Validar nome completo
    if (!formData.nome.trim()) {
      newErrors.nome = "Nome completo é obrigatório"
    } else if (formData.nome.trim().length < 3) {
      newErrors.nome = "Nome deve ter pelo menos 3 caracteres"
    }
    
  // Validar nickname
  if (!formData.nickname.trim()) {
    newErrors.nickname = "Nickname é obrigatório"
  } else if (formData.nickname.trim().length < 3) {
    newErrors.nickname = "Nickname deve ter pelo menos 3 caracteres"
  } else if (!/^[a-zA-Z0-9._-]+$/.test(formData.nickname.trim())) {
    newErrors.nickname = "Nickname deve conter apenas letras, números, ponto, hífen e underscore"
  }
    
    // Validar tipo de usuário
    if (!userType) {
      newErrors.userType = "Tipo de usuário é obrigatório"
    }
    
    // Validar celular
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = "Celular é obrigatório"
    } else if (phoneNumber.replace(/\D/g, '').length < 10) {
      newErrors.phoneNumber = "Celular deve ter pelo menos 10 dígitos"
    }
    
    // Validar email
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "E-mail deve ter um formato válido"
    }
    
    // Validar senha
    if (!formData.senha) {
      newErrors.senha = "Senha é obrigatória"
    } else if (formData.senha.length < 6) {
      newErrors.senha = "Senha deve ter pelo menos 6 caracteres"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Função para marcar campo como tocado
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }
  
  // Função para atualizar dados do formulário
  const handleInputChange = (field: string, value: string) => {
    // Tratamento especial para nickname
    if (field === 'nickname') {
      // Remover @ do início se o usuário digitar
      if (value.startsWith('@')) {
        value = value.substring(1)
        // Mostrar mensagem amigável
        setErrors(prev => ({ ...prev, [field]: "O @ já está incluído automaticamente! 😊" }))
        // Limpar mensagem após 2 segundos
        setTimeout(() => {
          setErrors(prev => ({ ...prev, [field]: "" }))
        }, 2000)
      }
    }
    
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Limpar erro quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }))
    }
    
    // Validação em tempo real para nickname
    if (field === 'nickname' && value.trim()) {
      if (value.trim().length < 3) {
        setErrors(prev => ({ ...prev, [field]: "Nickname deve ter pelo menos 3 caracteres" }))
      } else if (!/^[a-zA-Z0-9._-]+$/.test(value.trim())) {
        setErrors(prev => ({ ...prev, [field]: "Nickname deve conter apenas letras, números, ponto, hífen e underscore" }))
      } else {
        // Limpar erro se estiver válido
        setErrors(prev => ({ ...prev, [field]: "" }))
      }
    }
  }
  
  // Função para salvar dados da etapa 1
  const saveStep1Data = async () => {
    setIsSaving(true)
    
    try {
      // 1. Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.senha,
        options: {
          data: {
            name: formData.nome,
            nickname: formData.nickname,
            user_type: userType
          }
        }
      })

      if (authError) {
        throw new Error(authError.message)
      }

      if (!authData.user) {
        throw new Error("Erro ao criar usuário")
      }

      const userId = authData.user.id

      // 2. Upload da foto de perfil se existir
      let profilePhotoUrl = null
      if (profilePhoto && fileInputRef.current?.files?.[0]) {
        const file = fileInputRef.current.files[0]
        profilePhotoUrl = await uploadProfilePhoto(file, userId)
      }

      // 3. Salvar dados completos na tabela users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: formData.email,
          name: formData.nome,
          nickname: formData.nickname,
          phone: phoneNumber,
          user_type: userType,
          profile_photo: profilePhotoUrl,
          agenda_enabled: false, // ✅ Agenda inicia desabilitada
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (profileError) {
        throw new Error(profileError.message)
      }

      // 4. Se for profissional, criar trial de 30 dias
      if (userType === 'profissional') {
        console.log('🎁 Criando trial de 30 dias para profissional:', userId)
        console.log('🎁 Dados do trial:', {
          professional_id: userId,
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active'
        })
        
        const trialEndDate = new Date()
        trialEndDate.setDate(trialEndDate.getDate() + 30) // 30 dias a partir de hoje
        
        const trialData = {
          professional_id: userId,
          start_date: new Date().toISOString(),
          end_date: trialEndDate.toISOString(),
          status: 'active',
          created_at: new Date().toISOString()
        }
        
        console.log('🎁 Tentando inserir trial com dados:', trialData)
        
        const { data: trialResult, error: trialError } = await supabase
          .from('professional_trials')
          .insert(trialData)
          .select()

        if (trialError) {
          console.error('❌ Erro ao criar trial:', trialError)
          console.error('❌ Detalhes do erro:', {
            message: trialError.message,
            details: trialError.details,
            hint: trialError.hint,
            code: trialError.code
          })
          // Não falhar o cadastro se o trial não for criado
        } else {
          console.log('✅ Trial de 30 dias criado com sucesso:', trialResult)
        }
      }

      // 5. Salvar ID do usuário para uso nas próximas etapas
      setUserId(userId)

      return true

    } catch (error) {
      console.error("Erro ao salvar dados:", error)
      
      // Tratar erros específicos com mensagens amigáveis
      let errorMessage = "Erro ao criar conta. Tente novamente."
      let errorTitle = "Erro no cadastro"
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase()
        
        // Erros de email já existente
        if (errorMsg.includes('email') && errorMsg.includes('already')) {
          errorTitle = "E-mail já cadastrado"
          errorMessage = "Este e-mail já está sendo usado por outra conta. Tente usar um e-mail diferente ou faça login se já possui uma conta."
        }
        // Erros de nickname já existente
        else if (errorMsg.includes('nickname') && errorMsg.includes('unique')) {
          errorTitle = "Nickname já existe"
          errorMessage = "Este nickname já está sendo usado. Escolha outro nickname único."
        }
        // Erros de constraint unique
        else if (errorMsg.includes('duplicate key') || errorMsg.includes('unique constraint')) {
          if (errorMsg.includes('email')) {
            errorTitle = "E-mail já cadastrado"
            errorMessage = "Este e-mail já está sendo usado por outra conta. Tente usar um e-mail diferente ou faça login se já possui uma conta."
          } else if (errorMsg.includes('nickname')) {
            errorTitle = "Nickname já existe"
            errorMessage = "Este nickname já está sendo usado. Escolha outro nickname único."
          } else {
            errorTitle = "Dados já existem"
            errorMessage = "Alguns dados informados já estão sendo usados por outra conta. Verifique e tente novamente."
          }
        }
        // Erros de senha fraca
        else if (errorMsg.includes('password') && errorMsg.includes('weak')) {
          errorTitle = "Senha muito fraca"
          errorMessage = "Sua senha deve ter pelo menos 6 caracteres. Escolha uma senha mais segura."
        }
        // Erros de formato de email
        else if (errorMsg.includes('email') && errorMsg.includes('invalid')) {
          errorTitle = "E-mail inválido"
          errorMessage = "O formato do e-mail está incorreto. Verifique e tente novamente."
        }
        // Erros de rede/conexão
        else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('timeout')) {
          errorTitle = "Erro de conexão"
          errorMessage = "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente."
        }
        // Erros do Supabase Auth
        else if (errorMsg.includes('user already registered')) {
          errorTitle = "Conta já existe"
          errorMessage = "Já existe uma conta com este e-mail. Tente fazer login ou use um e-mail diferente."
        }
        else if (errorMsg.includes('invalid email')) {
          errorTitle = "E-mail inválido"
          errorMessage = "O formato do e-mail está incorreto. Verifique e tente novamente."
        }
        else if (errorMsg.includes('password should be at least')) {
          errorTitle = "Senha muito curta"
          errorMessage = "A senha deve ter pelo menos 6 caracteres. Escolha uma senha mais segura."
        }
        // Outros erros conhecidos
        else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive"
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Função para salvar dados da etapa 2
  const saveStep2Data = async () => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Tente novamente.",
        variant: "destructive"
      })
      return false
    }

    setIsSaving(true)
    
    try {
      const { error } = await supabase
        .from('users')
        .update({
          cep: cep,
          logradouro: addressData.logradouro,
          numero: addressData.numero,
          complemento: addressData.complemento,
          bairro: addressData.bairro,
          cidade: addressData.cidade,
          uf: addressData.uf,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw new Error(error.message)
      }

      return true

    } catch (error) {
      console.error("Erro ao salvar endereço:", error)
      toast({
        title: "Erro ao salvar endereço",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  // Função para salvar dados da etapa 3
  const saveStep3Data = async () => {
    if (!userId) {
      toast({
        title: "Erro",
        description: "Usuário não encontrado. Tente novamente.",
        variant: "destructive"
      })
      return false
    }

    setIsSaving(true)
    
    try {
      // Mapear nomes das categorias para UUIDs
      const categoryIds = selectedPreferences.map(prefName => {
        const category = categories.find(cat => cat.name === prefName)
        if (!category) {
          console.warn(`Categoria não encontrada: ${prefName}`)
          return null
        }
        return category.id
      }).filter(id => id !== null) as string[]

      if (categoryIds.length === 0) {
        throw new Error("Nenhuma categoria válida selecionada")
      }

      const { error } = await supabase
        .from('users')
        .update({
          categories: categoryIds,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) {
        throw new Error(error.message)
      }

      toast({
        title: "Cadastro completo!",
        description: "Seu perfil foi criado com sucesso. Redirecionando...",
        variant: "default"
      })

      // Aguardar um pouco para mostrar a mensagem
      setTimeout(() => {
        navigate(`/perfil/${userId}`)
      }, 2000)

      return true

    } catch (error) {
      console.error("Erro ao salvar preferências:", error)
      toast({
        title: "Erro ao salvar preferências",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive"
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const nextStep = async () => {
    if (currentStep === 1) {
      // ✅ VALIDAR PRIMEIRO, DEPOIS SALVAR
      if (!validateStep1()) {
        return // Não prossegue se validação falhar
      }
      
      const success = await saveStep1Data()
      if (success) {
        setCurrentStep(prev => prev + 1)
      }
    } else if (currentStep === 2) {
      const success = await saveStep2Data()
      if (success) {
        setCurrentStep(prev => prev + 1)
      }
    } else if (currentStep === 3) {
      await saveStep3Data()
    } else {
      setCurrentStep(prev => prev + 1)
    }
  }
  const prevStep = () => setCurrentStep(prev => prev - 1)

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.photo-upload-area')) {
        setShowPhotoMenu(false)
      }
    }

    if (showPhotoMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showPhotoMenu])

  // Função para lidar com upload de arquivo
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setIsUploading(true)
      
      // Criar preview imediato
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePhoto(e.target?.result as string)
        // Marcar foto como tocada e limpar erro
        setTouched(prev => ({ ...prev, foto: true }))
        if (errors.foto) {
          setErrors(prev => ({ ...prev, foto: "" }))
        }
      }
      reader.readAsDataURL(file)
      
      // O upload real será feito durante o salvamento
      setIsUploading(false)
    }
  }

  // Função para abrir câmera
  const handleCameraClick = () => {
    setShowPhotoMenu(false)
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }

  // Função para abrir galeria
  const handleGalleryClick = () => {
    setShowPhotoMenu(false)
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }


  // Função para formatar número de telefone
  const formatPhoneNumber = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, "")
    
    // Limita a 11 dígitos (DDD + 9 dígitos)
    const limitedNumbers = numbers.slice(0, 11)
    
    // Aplica a máscara
    if (limitedNumbers.length <= 2) {
      return `(${limitedNumbers}`
    } else if (limitedNumbers.length <= 6) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2)}`
    } else if (limitedNumbers.length <= 10) {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 6)}-${limitedNumbers.slice(6)}`
    } else {
      return `(${limitedNumbers.slice(0, 2)}) ${limitedNumbers.slice(2, 7)}-${limitedNumbers.slice(7)}`
    }
  }

  // Função para lidar com mudança no telefone
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
    // Limpar erro quando usuário começa a digitar
    if (errors.phoneNumber) {
      setErrors(prev => ({ ...prev, phoneNumber: "" }))
    }
  }

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
      setIsLoadingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          setAddressData({
            logradouro: data.logradouro || "",
            bairro: data.bairro || "",
            cidade: data.localidade || "",
            uf: data.uf || "",
            complemento: "",
            numero: ""
          })
        } else {
          // CEP não encontrado
          setAddressData({
            logradouro: "",
            bairro: "",
            cidade: "",
            uf: "",
            complemento: "",
            numero: ""
          })
        }
      } catch (error) {
        console.error("Erro ao buscar CEP:", error)
      } finally {
        setIsLoadingCep(false)
      }
    }
  }

  // Função para lidar com mudança no CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value)
    setCep(formatted)
    
    // Buscar CEP quando tiver 8 dígitos
    if (formatted.replace(/\D/g, "").length === 8) {
      fetchCep(formatted)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4 relative overflow-hidden">
      {/* Elementos decorativos animados */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 animate-bounce delay-100">
          <Sparkles className="h-8 w-8 text-primary/20" />
        </div>
        <div className="absolute top-40 right-20 animate-bounce delay-300">
          <Heart className="h-6 w-6 text-secondary/20" />
        </div>
        <div className="absolute bottom-40 left-20 animate-bounce delay-500">
          <Star className="h-7 w-7 text-accent/20" />
        </div>
        <div className="absolute top-1/2 right-10 animate-pulse delay-700">
          <Users className="h-5 w-5 text-primary/15" />
        </div>
        <div className="absolute bottom-20 right-10 animate-bounce delay-1000">
          <Calendar className="h-6 w-6 text-secondary/15" />
        </div>
      </div>

      <Card className="w-full max-w-lg relative z-10 backdrop-blur-sm bg-background/95 animate-in slide-in-from-bottom-4 duration-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/image/logotipobeautycom.png" 
              alt="Beautycom" 
              className="h-16 w-16"
            />
          </div>
          <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
            Criar Conta
          </CardTitle>
          <CardDescription className="mb-6">
            Vamos começar sua jornada na beleza
          </CardDescription>
          
          {/* Indicador de progresso */}
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-hero h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          
          {/* Etapas visuais */}
          <div className="flex justify-center space-x-2 mb-6">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all duration-300 ${
                  step <= currentStep
                    ? "bg-gradient-hero text-white shadow-beauty-glow"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step < currentStep ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  step
                )}
              </div>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {currentStep === 1 && (
            <div className="space-y-4">
              {/* Upload de Foto */}
              <div className="space-y-3">
                <Label className="flex items-center gap-1">
                  Foto de Perfil
                  <span className="text-red-500">*</span>
                </Label>
                <div className="flex flex-col items-center space-y-3">
                  <div className="relative photo-upload-area">
                    {profilePhoto ? (
                      <img 
                        src={profilePhoto} 
                        alt="Foto de perfil" 
                        className="w-20 h-20 rounded-full object-cover border-4 border-primary/20 shadow-lg cursor-pointer hover:border-primary/40 transition-colors"
                        onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded-full bg-gradient-card border-2 border-dashed border-primary/30 flex items-center justify-center relative group hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer"
                        onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                      >
                        {isUploading ? (
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        ) : (
                          <div className="flex flex-col items-center space-y-1">
                            <User className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            <Camera className="h-3 w-3 text-muted-foreground/60 group-hover:text-primary/60 transition-colors" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Menu de opções - FORA da imagem */}
                    {showPhotoMenu && (
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-background border border-border rounded-lg shadow-lg z-50 min-w-[160px]">
                        <div className="p-1">
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                            onClick={handleCameraClick}
                            disabled={isUploading}
                          >
                            <Camera className="h-4 w-4" />
                            <span>Tirar Foto</span>
                          </button>
                          <button
                            type="button"
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted rounded-md transition-colors"
                            onClick={handleGalleryClick}
                            disabled={isUploading}
                          >
                            <Upload className="h-4 w-4" />
                            <span>Escolher da Galeria</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Texto explicativo */}
                  {!profilePhoto && (
                    <div className="text-center space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Clique para adicionar sua foto
                      </p>
                      <p className="text-xs text-muted-foreground/70">
                        Sua foto ajuda outros usuários a te reconhecer
                      </p>
                    </div>
                  )}
                  
                  {profilePhoto && (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Clique na foto para alterar
                      </p>
                    </div>
                  )}
                </div>
                
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
                {errors.foto && touched.foto && (
                  <p className="text-sm text-red-500 mt-1">{errors.foto}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-1">
                  Nome Completo
                  <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="nome" 
                  placeholder="Seu nome completo" 
                  value={formData.nome}
                  onChange={(e) => handleInputChange('nome', e.target.value)}
                  onBlur={() => handleBlur('nome')}
                  className={errors.nome && touched.nome ? "border-red-500" : ""}
                />
                {errors.nome && touched.nome && (
                  <p className="text-sm text-red-500 mt-1">{errors.nome}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nickname" className="flex items-center gap-1">
                  Nickname (apelido)
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">@</span>
                  <Input 
                    id="nickname" 
                    placeholder="meu.apelido" 
                    className={`pl-8 ${errors.nickname && touched.nickname ? "border-red-500" : ""}`}
                    value={formData.nickname}
                    onChange={(e) => handleInputChange('nickname', e.target.value)}
                    onBlur={() => handleBlur('nickname')}
                  />
                </div>
                {errors.nickname && touched.nickname && (
                  <p className={`text-sm mt-1 ${
                    errors.nickname.includes('😊') 
                      ? 'text-blue-500' 
                      : 'text-red-500'
                  }`}>
                    {errors.nickname}
                  </p>
                )}
              </div>
              <div className="space-y-3">
                <Label className="flex items-center gap-1">
                  Escolha seu Tipo de Usuário
                  <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      userType === "usuario"
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setUserType("usuario")
                      setTouched(prev => ({ ...prev, userType: true }))
                      if (errors.userType) {
                        setErrors(prev => ({ ...prev, userType: "" }))
                      }
                    }}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        userType === "usuario" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <Users className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Usuário</div>
                        <div className="text-xs text-muted-foreground">Encontrar profissionais</div>
                      </div>
                    </div>
                    {userType === "usuario" && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div
                    className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                      userType === "profissional"
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/30 hover:bg-muted/50"
                    }`}
                    onClick={() => {
                      setUserType("profissional")
                      setTouched(prev => ({ ...prev, userType: true }))
                      if (errors.userType) {
                        setErrors(prev => ({ ...prev, userType: "" }))
                      }
                    }}
                  >
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        userType === "profissional" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        <Star className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">Profissional</div>
                        <div className="text-xs text-muted-foreground">Oferecer serviços</div>
                      </div>
                    </div>
                    {userType === "profissional" && (
                      <div className="absolute top-2 right-2">
                        <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                          <CheckCircle className="h-3 w-3 text-primary-foreground" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {errors.userType && touched.userType && (
                  <p className="text-sm text-red-500 mt-1">{errors.userType}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="celular" className="flex items-center gap-1">
                  Celular
                  <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="celular" 
                  placeholder="(11) 99999-9999" 
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  onBlur={() => handleBlur('phoneNumber')}
                  maxLength={15}
                  className={errors.phoneNumber && touched.phoneNumber ? "border-red-500" : ""}
                />
                {errors.phoneNumber && touched.phoneNumber && (
                  <p className="text-sm text-red-500 mt-1">{errors.phoneNumber}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-1">
                  E-mail
                  <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="seu@email.com" 
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={() => handleBlur('email')}
                  className={errors.email && touched.email ? "border-red-500" : ""}
                />
                {errors.email && touched.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="senha" className="flex items-center gap-1">
                  Senha
                  <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input 
                    id="senha" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Mínimo 6 caracteres"
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    onBlur={() => handleBlur('senha')}
                    className={errors.senha && touched.senha ? "border-red-500" : ""}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button 
                onClick={nextStep} 
                className="w-full" 
                variant="hero"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                Próximo <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
              
              {/* Link para login - apenas na primeira etapa */}
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Já tem uma conta?{" "}
                  <Link to="/login" className="text-primary hover:text-primary/80 font-medium transition-colors">
                    Faça login
                  </Link>
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP</Label>
                <div className="relative">
                  <Input 
                    id="cep" 
                    placeholder="00000-000" 
                    value={cep}
                    onChange={handleCepChange}
                    maxLength={9}
                  />
                  {isLoadingCep && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="logradouro">Endereço</Label>
                <Input 
                  id="logradouro" 
                  placeholder="Rua, Avenida..." 
                  value={addressData.logradouro}
                  onChange={(e) => setAddressData(prev => ({ ...prev, logradouro: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="numero">Número</Label>
                  <Input 
                    id="numero" 
                    placeholder="123" 
                    value={addressData.numero}
                    onChange={(e) => setAddressData(prev => ({ ...prev, numero: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="complemento">Complemento</Label>
                  <Input 
                    id="complemento" 
                    placeholder="Apto 45" 
                    value={addressData.complemento}
                    onChange={(e) => setAddressData(prev => ({ ...prev, complemento: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro</Label>
                <Input 
                  id="bairro" 
                  placeholder="Nome do bairro" 
                  value={addressData.bairro}
                  onChange={(e) => setAddressData(prev => ({ ...prev, bairro: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input 
                    id="cidade" 
                    placeholder="Nome da cidade" 
                    value={addressData.cidade}
                    onChange={(e) => setAddressData(prev => ({ ...prev, cidade: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="uf">Estado</Label>
                  <Input 
                    id="uf" 
                    placeholder="UF" 
                    value={addressData.uf}
                    onChange={(e) => setAddressData(prev => ({ ...prev, uf: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="w-full" disabled={isSaving}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button 
                  onClick={nextStep} 
                  className="w-full" 
                  variant="hero"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                  Próximo <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Mensagem motivacional */}
              <div className="text-center p-4 bg-gradient-card rounded-xl border border-primary/10">
                <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                <h3 className="font-semibold text-foreground mb-1">
                  {userType === "profissional" 
                    ? "Você está quase lá!" 
                    : "Quase pronto!"
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  {userType === "profissional" 
                    ? "Selecione suas habilidades para conectar com clientes ideais"
                    : "Ajude-nos a encontrar os melhores profissionais para você"
                  }
                </p>
              </div>

              <SelectionChips
                items={[...BEAUTY_CATEGORIES]}
                selectedItems={selectedPreferences}
                onSelectionChange={setSelectedPreferences}
                title={userType === "profissional" ? "Habilidades" : "Preferências"}
                subtitle={`Selecione suas ${userType === "profissional" ? "habilidades" : "preferências"} (pode escolher mais de uma)`}
              />
              
              <div className="flex gap-2">
                <Button onClick={prevStep} variant="outline" className="w-full" disabled={isSaving}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button 
                  onClick={nextStep} 
                  className="w-full" 
                  variant="hero"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    <>
                      Finalizar <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                  </Button>
              </div>
            </div>
          )}

          <div className="mt-8 text-center space-y-4">
            <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Gratuito</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Seguro</span>
              </div>
              <div className="flex items-center space-x-1">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Rápido</span>
              </div>
            </div>
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Voltar para o início
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Cadastro;