import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthContext } from "@/contexts/AuthContext"
import { useSalons } from "@/hooks/useSalons"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Building2, Upload, ArrowLeft, Camera, Loader2, MapPin } from "lucide-react"

export default function CriarSalon() {
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { createSalon } = useSalons(user?.id)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: ''
  })

  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>('')
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [uploadingPhotos, setUploadingPhotos] = useState(false)
  const [searchingCep, setSearchingCep] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover') => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de arquivo inválido",
        description: "Por favor, selecione apenas imagens (JPG, PNG, etc.)",
        variant: "destructive"
      })
      return
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive"
      })
      return
    }

    if (type === 'profile') {
      setProfilePhoto(file)
      setProfilePhotoPreview(URL.createObjectURL(file))
    } else {
      setCoverPhoto(file)
      setCoverPhotoPreview(URL.createObjectURL(file))
    }
  }

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    setFormData(prev => ({ ...prev, cep }))

    if (cep.length === 8) {
      setSearchingCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()

        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro || '',
            bairro: data.bairro || '',
            cidade: data.localidade || '',
            uf: data.uf || ''
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
        setSearchingCep(false)
      }
    }
  }

  const uploadPhoto = async (file: File, type: 'profile' | 'cover', salonId: string): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}-${Date.now()}.${fileExt}`
      const filePath = `${salonId}/${fileName}`

      // Determinar o bucket baseado no tipo
      const bucketName = type === 'profile' ? 'profile-photos' : 'cover-photos'

      console.log(`📤 Fazendo upload de ${type}:`, filePath, 'para bucket:', bucketName)

      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error(`❌ Erro no upload de ${type}:`, error)
        throw error
      }

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath)

      console.log(`✅ Upload de ${type} concluído:`, urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error(`❌ Erro no upload de ${type}:`, error)
      return null
    }
  }

  const validateForm = () => {
    const errors: string[] = []

    // Campos obrigatórios
    if (!formData.name.trim()) {
      errors.push("Nome do salão/estúdio é obrigatório")
    }

    if (!formData.phone.trim()) {
      errors.push("Telefone é obrigatório")
    }

    if (!formData.email.trim()) {
      errors.push("E-mail é obrigatório")
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("E-mail inválido")
    }

    if (!formData.cep.trim()) {
      errors.push("CEP é obrigatório")
    } else if (formData.cep.length !== 8) {
      errors.push("CEP deve ter 8 dígitos")
    }

    if (!formData.logradouro.trim()) {
      errors.push("Logradouro é obrigatório")
    }

    if (!formData.numero.trim()) {
      errors.push("Número é obrigatório")
    }

    if (!formData.bairro.trim()) {
      errors.push("Bairro é obrigatório")
    }

    if (!formData.cidade.trim()) {
      errors.push("Cidade é obrigatória")
    }

    if (!formData.uf.trim()) {
      errors.push("Estado é obrigatório")
    }

    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar formulário
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
    setUploadingPhotos(false)

    try {
      // 1. Criar o salão primeiro
      const salonData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        cep: formData.cep.trim(),
        logradouro: formData.logradouro.trim(),
        numero: formData.numero.trim(),
        complemento: formData.complemento.trim(),
        bairro: formData.bairro.trim(),
        cidade: formData.cidade.trim(),
        uf: formData.uf.trim().toUpperCase()
      }

      const result = await createSalon(salonData)

      if (!result.success) {
        throw new Error('Erro ao criar salão')
      }

      const salonId = result.data.id
      console.log('🏗️ Salão criado com ID:', salonId)

      // 2. Fazer upload das fotos se existirem
      if (profilePhoto || coverPhoto) {
        setUploadingPhotos(true)
        
        const uploadPromises = []
        
        if (profilePhoto) {
          uploadPromises.push(
            uploadPhoto(profilePhoto, 'profile', salonId)
              .then(url => ({ type: 'profile', url }))
          )
        }
        
        if (coverPhoto) {
          uploadPromises.push(
            uploadPhoto(coverPhoto, 'cover', salonId)
              .then(url => ({ type: 'cover', url }))
          )
        }

        const uploadResults = await Promise.all(uploadPromises)
        
        // 3. Atualizar o salão com as URLs das fotos
        const photoUpdates: any = {}
        
        uploadResults.forEach(result => {
          if (result.url) {
            if (result.type === 'profile') {
              photoUpdates.profile_photo = result.url
            } else if (result.type === 'cover') {
              photoUpdates.cover_photo = result.url
            }
          }
        })

        if (Object.keys(photoUpdates).length > 0) {
          console.log('🔄 Atualizando salão com fotos:', photoUpdates)
          
          const { data: updateData, error: updateError } = await supabase
            .from('salons_studios')
            .update(photoUpdates)
            .eq('id', salonId)
            .select()
            .single()

          if (updateError) {
            console.error('❌ Erro ao atualizar fotos:', updateError)
          } else {
            console.log('✅ Fotos atualizadas:', updateData)
          }
        }
      }

      toast({
        title: "Salão criado!",
        description: "Seu salão/estúdio foi criado com sucesso",
      })
      
      navigate(`/salon/${salonId}`)
    } catch (error) {
      console.error('❌ Erro ao criar salão:', error)
      toast({
        title: "Erro",
        description: "Não foi possível criar o salão. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
      setUploadingPhotos(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle pt-20 pb-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-purple-700 bg-clip-text text-transparent">
                Criar meu Salão/Estúdio
              </h1>
              <p className="text-muted-foreground">
                Configure seu estabelecimento no Beautycom
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          {/* Fotos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Fotos do Estabelecimento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Foto de Perfil */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Foto de Perfil</label>
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={profilePhotoPreview} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-600 to-pink-500 text-white">
                      <Building2 className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(e, 'profile')}
                      className="hidden"
                      id="profile-photo"
                    />
                    <label htmlFor="profile-photo">
                      <Button type="button" variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Escolher foto
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recomendado: 400x400px, formato JPG ou PNG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>

              {/* Foto de Capa */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Foto de Capa</label>
                <div className="space-y-2">
                  {coverPhotoPreview && (
                    <div className="relative h-32 rounded-lg overflow-hidden">
                      <img
                        src={coverPhotoPreview}
                        alt="Capa"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange(e, 'cover')}
                      className="hidden"
                      id="cover-photo"
                    />
                    <label htmlFor="cover-photo">
                      <Button type="button" variant="outline" className="flex items-center gap-2">
                        <Upload className="h-4 w-4" />
                        Escolher foto de capa
                      </Button>
                    </label>
                    <p className="text-xs text-muted-foreground mt-1">
                      Recomendado: 1200x400px, formato JPG ou PNG (máx. 5MB)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Básicas */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nome do Salão/Estúdio *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Ex: Salão da Maria, Estúdio de Tatuagem XYZ"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Conte um pouco sobre seu estabelecimento..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">
                    Telefone/WhatsApp *
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">
                    E-mail *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="contato@salao.com"
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Endereço */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="cep" className="text-sm font-medium">
                    CEP *
                  </label>
                  <div className="relative">
                    <Input
                      id="cep"
                      name="cep"
                      value={formData.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      maxLength={8}
                      required
                    />
                    {searchingCep && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Digite o CEP para preenchimento automático
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="uf" className="text-sm font-medium">
                    Estado *
                  </label>
                  <Input
                    id="uf"
                    name="uf"
                    value={formData.uf}
                    onChange={handleInputChange}
                    placeholder="SP"
                    maxLength={2}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="logradouro" className="text-sm font-medium">
                  Logradouro *
                </label>
                <Input
                  id="logradouro"
                  name="logradouro"
                  value={formData.logradouro}
                  onChange={handleInputChange}
                  placeholder="Rua das Flores"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="numero" className="text-sm font-medium">
                    Número *
                  </label>
                  <Input
                    id="numero"
                    name="numero"
                    value={formData.numero}
                    onChange={handleInputChange}
                    placeholder="123"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="complemento" className="text-sm font-medium">
                    Complemento
                  </label>
                  <Input
                    id="complemento"
                    name="complemento"
                    value={formData.complemento}
                    onChange={handleInputChange}
                    placeholder="Sala 1"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="bairro" className="text-sm font-medium">
                    Bairro *
                  </label>
                  <Input
                    id="bairro"
                    name="bairro"
                    value={formData.bairro}
                    onChange={handleInputChange}
                    placeholder="Centro"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="cidade" className="text-sm font-medium">
                  Cidade *
                </label>
                <Input
                  id="cidade"
                  name="cidade"
                  value={formData.cidade}
                  onChange={handleInputChange}
                  placeholder="São Paulo"
                  required
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              className="flex-1"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {uploadingPhotos ? 'Fazendo upload...' : 'Criando...'}
                </div>
              ) : (
                'Criar Salão/Estúdio'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
