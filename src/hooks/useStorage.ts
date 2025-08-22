import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export type BucketType = 'fotoperfil' | 'fotopost' | 'fotodecapa' | 'logotipo'

interface UploadOptions {
  bucket: BucketType
  file: File
  userId?: string
  postId?: string
  businessId?: string
  onProgress?: (progress: number) => void
}

export function useStorage() {
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  // Função para gerar nome único do arquivo
  const generateFileName = (file: File, prefix: string, id?: string) => {
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const idSuffix = id ? `-${id}` : ''
    
    return `${prefix}-${timestamp}-${randomId}${idSuffix}.${extension}`
  }

  // Função para validar arquivo
  const validateFile = (file: File, maxSizeMB: number = 5) => {
    const maxSize = maxSizeMB * 1024 * 1024 // Converter para bytes
    
    if (file.size > maxSize) {
      throw new Error(`Arquivo muito grande. Máximo: ${maxSizeMB}MB`)
    }

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Tipo de arquivo não suportado. Use: JPG, PNG ou WebP')
    }

    return true
  }

  // Função para comprimir imagem
  const compressImage = async (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      const img = new Image()

      img.onload = () => {
        // Calcular novas dimensões mantendo proporção
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height)
        const newWidth = img.width * ratio
        const newHeight = img.height * ratio

        canvas.width = newWidth
        canvas.height = newHeight

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        // Converter para blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              })
              resolve(compressedFile)
            } else {
              resolve(file) // Fallback para arquivo original
            }
          },
          file.type,
          quality
        )
      }

      img.src = URL.createObjectURL(file)
    })
  }

  // Função principal de upload
  const uploadImage = async ({
    bucket,
    file,
    userId,
    postId,
    businessId,
    onProgress
  }: UploadOptions): Promise<string | null> => {
    setUploading(true)

    try {
      // Validar arquivo
      validateFile(file)

      // Comprimir imagem baseado no tipo de bucket
      let compressedFile = file
      switch (bucket) {
        case 'fotoperfil':
          compressedFile = await compressImage(file, 400, 0.8) // Foto pequena
          break
        case 'fotopost':
          compressedFile = await compressImage(file, 1200, 0.7) // Foto média
          break
        case 'fotodecapa':
        case 'logotipo':
          compressedFile = await compressImage(file, 800, 0.9) // Alta qualidade
          break
      }

      // Gerar nome do arquivo
      let fileName: string
      switch (bucket) {
        case 'fotoperfil':
          fileName = generateFileName(compressedFile, 'profile', userId)
          break
        case 'fotopost':
          fileName = generateFileName(compressedFile, 'post', postId)
          break
        case 'fotodecapa':
          fileName = generateFileName(compressedFile, 'cover', businessId)
          break
        case 'logotipo':
          fileName = generateFileName(compressedFile, 'logo', businessId)
          break
        default:
          fileName = generateFileName(compressedFile, 'file')
      }

      // Upload para Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, compressedFile, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) throw error

      // Gerar URL pública
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      toast({
        title: "Sucesso",
        description: "Imagem enviada com sucesso!",
      })

      return urlData.publicUrl

    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao enviar imagem",
        variant: "destructive"
      })
      return null
    } finally {
      setUploading(false)
    }
  }

  // Funções específicas para cada tipo de upload
  const uploadProfilePhoto = async (file: File, userId: string) => {
    return uploadImage({
      bucket: 'fotoperfil',
      file,
      userId
    })
  }

  const uploadPostPhoto = async (file: File, postId?: string) => {
    return uploadImage({
      bucket: 'fotopost',
      file,
      postId
    })
  }

  const uploadCoverPhoto = async (file: File, businessId: string) => {
    return uploadImage({
      bucket: 'fotodecapa',
      file,
      businessId
    })
  }

  const uploadLogo = async (file: File, businessId: string) => {
    return uploadImage({
      bucket: 'logotipo',
      file,
      businessId
    })
  }

  // Função para deletar imagem
  const deleteImage = async (bucket: BucketType, fileName: string) => {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([fileName])

      if (error) throw error

      toast({
        title: "Sucesso",
        description: "Imagem removida com sucesso!",
      })

      return true
    } catch (error) {
      console.error('Erro ao deletar imagem:', error)
      toast({
        title: "Erro",
        description: "Erro ao remover imagem",
        variant: "destructive"
      })
      return false
    }
  }

  // Função para listar imagens de um bucket
  const listImages = async (bucket: BucketType, folder?: string) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder || '')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao listar imagens:', error)
      return []
    }
  }

  return {
    uploading,
    uploadImage,
    uploadProfilePhoto,
    uploadPostPhoto,
    uploadCoverPhoto,
    uploadLogo,
    deleteImage,
    listImages,
    validateFile,
    compressImage
  }
} 