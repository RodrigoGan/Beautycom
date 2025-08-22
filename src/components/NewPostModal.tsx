import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { X, ArrowLeft, ArrowRight, Image, Video, Sparkles, CheckCircle } from "lucide-react"
import { useState } from "react"
import ImageUploadEditor from "./ImageUploadEditor"
import PostPreview from "./PostPreview"
import { usePostUpload } from "@/hooks/usePostUpload"
import { useAuthContext } from "@/contexts/AuthContext"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NewPostModalProps {
  isOpen: boolean
  onClose: () => void
  currentStep: number
  onStepChange: (step: number) => void
  postData: {
    title: string
    description: string
    category: string
    postType: string
    images?: File[]
    videos?: File[]
  }
  onPostDataChange: (data: any) => void
  onErrorsChange: (errors: {[key: string]: string}) => void
  errors: {[key: string]: string}
}

const NewPostModal = ({ 
  isOpen, 
  onClose, 
  currentStep, 
  onStepChange, 
  postData, 
  onPostDataChange, 
  onErrorsChange,
  errors 
}: NewPostModalProps) => {
  
  const [beforeAfterComplete, setBeforeAfterComplete] = useState(false)
  const { createPost, isUploading } = usePostUpload()
  const { user } = useAuthContext()
  
  const categories = [
    { value: "Cabelos Femininos", label: "👩‍🦰 Cabelos Femininos" },
    { value: "Cabelos Masculinos", label: "👨‍🦱 Cabelos Masculinos" },
    { value: "Cuidados com as Unhas", label: "💅 Cuidados com as Unhas" },
    { value: "Cuidados com a Barba", label: "🧔 Cuidados com a Barba" },
    { value: "Estética Corporal", label: "💪 Estética Corporal" },
    { value: "Estética Facial", label: "✨ Estética Facial" },
    { value: "Tatuagem", label: "🎨 Tatuagem" },
    { value: "Piercing", label: "💎 Piercing" },
    { value: "Maquiagem", label: "💄 Maquiagem" },
    { value: "Sobrancelhas/Cílios", label: "👁️ Sobrancelhas/Cílios" }
  ]

  const handleInputChange = (field: string, value: string) => {
    // Aplicar limite de caracteres para o título
    if (field === 'title' && value.length > 50) {
      return // Não atualizar se ultrapassar o limite
    }
    
    onPostDataChange({
      ...postData,
      [field]: value
    })
    
    // Se for a primeira etapa e o campo for postType, avançar automaticamente
    if (currentStep === 1 && field === 'postType') {
      // Pequeno delay para dar feedback visual da seleção
      setTimeout(() => {
        onStepChange(2)
      }, 300)
    }
  }

  const handleImagesChange = (images: File[]) => {
    onPostDataChange({
      ...postData,
      images
    })
  }

  const handleVideosChange = (videos: File[]) => {
    onPostDataChange({
      ...postData,
      videos
    })
  }

  const handleBeforeAfterComplete = (isComplete: boolean) => {
    setBeforeAfterComplete(isComplete)
  }

  const validateStep1 = () => {
    const newErrors: {[key: string]: string} = {}
    
    if (!postData.title.trim()) {
      newErrors.title = "Título é obrigatório"
    } else if (postData.title.trim().length < 3) {
      newErrors.title = "Título deve ter pelo menos 3 caracteres"
    } else if (postData.title.trim().length > 50) {
      newErrors.title = "Título deve ter no máximo 50 caracteres"
    }
    
    if (!postData.description.trim()) {
      newErrors.description = "Descrição é obrigatória"
    } else if (postData.description.trim().length < 10) {
      newErrors.description = "Descrição deve ter pelo menos 10 caracteres"
    } else if (postData.description.trim().length > 2000) {
      newErrors.description = "Descrição deve ter no máximo 2000 caracteres"
    }
    
    if (!postData.category) {
      newErrors.category = "Categoria é obrigatória"
    }
    
    return newErrors
  }

  const handleNextStep = async () => {
    if (currentStep === 1) {
      // Step 1: Validar se tipo de post foi selecionado
      if (!postData.postType) {
        alert('Selecione um tipo de post')
        return
      }
      onStepChange(2)
    } else if (currentStep === 2) {
      // Step 2: Validar se há mídia
      const hasImages = postData.images && postData.images.length > 0
      const hasVideos = postData.videos && postData.videos.length > 0
      
      if (!hasImages && !hasVideos) {
        alert('Adicione pelo menos uma foto ou vídeo para continuar')
        return
      }
      
      if (postData.postType === 'before-after' && !beforeAfterComplete) {
        alert('Carregue as duas fotos (Antes e Depois) para continuar')
        return
      }
      
      onStepChange(3)
    } else if (currentStep === 3) {
      // Step 3: Validar informações e publicar
      console.log('Tentando publicar post:', postData)
      const stepErrors = validateStep1()
      console.log('Erros de validação:', stepErrors)
      
      if (Object.keys(stepErrors).length === 0) {
        onErrorsChange({}) // Limpar erros
        
        // Verificar se o usuário está logado
        if (!user) {
          console.log('Erro: Usuário não está logado')
          alert('Você precisa estar logado para publicar um post')
          return
        }
        
        // Verificar se há mídia
        const hasMedia = (postData.images && postData.images.length > 0) || 
                        (postData.videos && postData.videos.length > 0)
        
        if (!hasMedia) {
          console.log('Erro: Nenhuma mídia encontrada')
          alert('Adicione pelo menos uma foto ou vídeo para publicar')
          return
        }
        
        // Publicar o post
        console.log('Iniciando criação do post...')
        console.log('Usuário logado:', user)
        const result = await createPost(postData, user)
        console.log('Resultado da criação:', result)
        
        if (result.success) {
          console.log('Post criado com sucesso!')
          onClose() // Fechar modal
          // Aqui você pode adicionar lógica para atualizar a página BeautyWall
        } else {
          console.log('Erro na criação do post:', result.error)
        }
      } else {
        onErrorsChange(stepErrors) // Passar erros para o componente pai
      }
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      onStepChange(currentStep - 1)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Tipo de Post</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Escolha como você quer compartilhar seu trabalho
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {/* Post Normal */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            postData.postType === 'normal' 
              ? 'ring-2 ring-primary bg-gradient-card shadow-beauty-glow' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => handleInputChange('postType', 'normal')}
        >
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="mb-3 sm:mb-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center ${
                postData.postType === 'normal' 
                  ? 'bg-gradient-hero shadow-beauty-glow' 
                  : 'bg-gradient-primary'
              }`}>
                <Image className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Foto/Vídeo Normal</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Compartilhe fotos ou vídeos do seu trabalho
            </p>
          </CardContent>
        </Card>

        {/* Antes e Depois */}
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            postData.postType === 'before-after' 
              ? 'ring-2 ring-primary bg-gradient-card shadow-beauty-glow' 
              : 'hover:bg-muted/50'
          }`}
          onClick={() => handleInputChange('postType', 'before-after')}
        >
          <CardContent className="p-4 sm:p-6 text-center">
            <div className="mb-3 sm:mb-4">
              <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full flex items-center justify-center ${
                postData.postType === 'before-after' 
                  ? 'bg-gradient-hero shadow-beauty-glow' 
                  : 'bg-gradient-primary'
              }`}>
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
            </div>
            <h3 className="font-semibold mb-2 text-sm sm:text-base">Antes e Depois</h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Mostre a transformação completa
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">
          {postData.postType === 'normal' ? 'Upload de Mídia' : 'Upload Antes e Depois'}
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {postData.postType === 'normal' 
            ? 'Adicione fotos ou vídeos do seu trabalho' 
            : 'Adicione as fotos de antes e depois'
          }
        </p>
      </div>

      <ImageUploadEditor
        postType={postData.postType as 'normal' | 'before-after'}
        onImagesChange={handleImagesChange}
        onVideosChange={handleVideosChange}
        onBeforeAfterComplete={handleBeforeAfterComplete}
      />
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2">Informações do Post</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          Conte-nos sobre seu trabalho e veja como ficará!
        </p>
      </div>

      {/* Layout responsivo: Mobile = coluna única, Desktop = duas colunas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulário */}
        <div className="space-y-4">
          {/* Título */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Título do Post <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Ex: Transformação incrível!"
              value={postData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={errors.title ? "border-red-500" : ""}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Máximo 50 caracteres</span>
              <span>{postData.title.length}/50</span>
            </div>
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Descrição */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Conte mais sobre seu trabalho, técnicas utilizadas, resultado alcançado..."
              value={postData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={errors.description ? "border-red-500" : ""}
              rows={3}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mínimo 10 caracteres</span>
              <span>{postData.description.length}/2000</span>
            </div>
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Categoria */}
          <div className="space-y-1 sm:space-y-2">
            <Label htmlFor="category" className="text-sm font-medium">
              Categoria <span className="text-red-500">*</span>
            </Label>
            <Select
              value={postData.category}
              onValueChange={(value) => handleInputChange('category', value)}
            >
              <SelectTrigger className={errors.category ? "border-red-500" : ""}>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="text-sm text-red-500">{errors.category}</p>
            )}
          </div>
        </div>

        {/* Prévia */}
        <div className="space-y-4">
          <div className="text-center lg:text-left">
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">
              Prévia do Post
            </h3>
          </div>
          
          {/* Prévia Desktop */}
          <PostPreview postData={postData} />
          
          {/* Prévia Mobile */}
          <PostPreview postData={postData} isMobile={true} />
        </div>
      </div>
    </div>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      default:
        return renderStep1()
    }
  }

     return (
     <Dialog open={isOpen} onOpenChange={onClose}>
       <DialogContent className="max-w-[90vw] sm:max-w-2xl h-[85vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto mx-2 sm:mx-4 rounded-lg sm:rounded-xl">
                 <DialogHeader className="px-3 sm:px-6 pb-2">
          <div>
            <DialogTitle className="text-lg sm:text-xl bg-gradient-primary bg-clip-text text-transparent">
              Novo Post
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Compartilhe seu trabalho incrível com a comunidade
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Progress Bar */}
                 <div className="mb-4 sm:mb-6 px-3 sm:px-6">
                     <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-medium">Passo {currentStep} de 3</span>
             <span className="text-sm text-muted-foreground">
               {currentStep === 1 && "Tipo de Post"}
               {currentStep === 2 && "Upload de Mídia"}
               {currentStep === 3 && "Informações"}
             </span>
           </div>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div 
              className="bg-gradient-hero h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
          
          
        </div>

        {/* Step Content */}
                          <div className="px-2 sm:px-6">
           {renderCurrentStep()}
         </div>

                 {/* Navigation */}
         <div className="flex justify-between pt-6 border-t px-2 sm:px-6 pb-4 sm:pb-6">
           
           {/* Na primeira etapa, mostrar apenas o botão Cancelar centralizado */}
           {currentStep === 1 ? (
             <div className="flex justify-center w-full">
               <Button variant="outline" onClick={onClose} className="text-xs px-3 py-1 h-8">
                 Cancelar
               </Button>
             </div>
           ) : (
             <>
               <Button
                 variant="outline"
                 onClick={handlePreviousStep}
                 className="flex items-center gap-1 text-xs px-3 py-1 h-8"
               >
                 <ArrowLeft className="h-3 w-3" />
                 Anterior
               </Button>

               <div className="flex gap-2">
                 <Button variant="outline" onClick={onClose} className="text-xs px-3 py-1 h-8">
                   Cancelar
                 </Button>
                 <Button
                   onClick={handleNextStep}
                   disabled={
                     (currentStep === 2 && (
                       !postData.images?.length && !postData.videos?.length ||
                       (postData.postType === 'before-after' && !beforeAfterComplete)
                     )) ||
                     (currentStep === 3 && Object.keys(errors).length > 0) ||
                     isUploading
                   }
                   title={`Step: ${currentStep}, Errors: ${Object.keys(errors).length}, Uploading: ${isUploading}`}
                   className="flex items-center gap-1 text-xs px-3 py-1 h-8"
                   variant="hero"
                 >
                   {currentStep === 3 ? (isUploading ? 'Publicando...' : 'Publicar') : 'Próximo'}
                   <ArrowRight className="h-3 w-3" />
                 </Button>
               </div>
             </>
           )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NewPostModal 