import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { 
  compressImage, 
  compressVideo, 
  validateFileSize, 
  validateImageFile, 
  validateVideoFile,
  COMPRESSION_CONFIGS,
  formatFileSize
} from '@/utils/compression'

interface UploadResult {
  success: boolean
  urls: string[]
  error?: string
}

interface MediaFile {
  file: File
  type: 'image' | 'video'
  order?: number
  beforeAfter?: 'before' | 'after'
}

export const usePostUpload = () => {
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()

  const uploadMedia = async (
    files: MediaFile[],
    postId: string,
    postType: 'normal' | 'before-after' | 'video' | 'carousel'
  ): Promise<UploadResult> => {
    setIsUploading(true)
    
    try {
      const urls: string[] = []
      
      // Função para sanitizar nomes de arquivo
      const sanitizeFileName = (fileName: string) => {
        return fileName
          .replace(/[^a-zA-Z0-9.-]/g, '_') // Remove caracteres especiais
          .replace(/_+/g, '_') // Remove underscores múltiplos
          .replace(/^_|_$/g, '') // Remove underscores no início/fim
          .toLowerCase() // Converte para minúsculas
      }
      
      for (const mediaFile of files) {
        const { file, type, order, beforeAfter } = mediaFile
        
        // Validar arquivo antes da compressão
        if (type === 'image') {
          if (!validateImageFile(file)) {
            throw new Error('Tipo de imagem não suportado. Use: JPG, PNG ou WebP')
          }
          if (!validateFileSize(file, COMPRESSION_CONFIGS.post.maxSizeMB)) {
            throw new Error(`Imagem muito grande. Máximo: ${COMPRESSION_CONFIGS.post.maxSizeMB}MB`)
          }
        } else if (type === 'video') {
          if (!validateVideoFile(file)) {
            throw new Error('Tipo de vídeo não suportado. Use: MP4, WebM, OGG ou MOV')
          }
          if (!validateFileSize(file, COMPRESSION_CONFIGS.video.maxSizeMB)) {
            throw new Error(`Vídeo muito grande. Máximo: ${COMPRESSION_CONFIGS.video.maxSizeMB}MB`)
          }
        }
        
        // Comprimir arquivo
        let compressedFile = file
        console.log(`🔧 Comprimindo ${type}: ${formatFileSize(file.size)}`)
        
        try {
          if (type === 'image') {
            compressedFile = await compressImage(file, {
              maxWidth: COMPRESSION_CONFIGS.post.maxWidth,
              maxHeight: COMPRESSION_CONFIGS.post.maxHeight,
              quality: COMPRESSION_CONFIGS.post.quality
            })
          } else if (type === 'video') {
            compressedFile = await compressVideo(file, {
              maxWidth: COMPRESSION_CONFIGS.video.maxWidth,
              maxHeight: COMPRESSION_CONFIGS.video.maxHeight,
              bitrate: COMPRESSION_CONFIGS.video.bitrate,
              fps: COMPRESSION_CONFIGS.video.fps
            })
          }
          
          console.log(`✅ Compressão concluída: ${formatFileSize(file.size)} → ${formatFileSize(compressedFile.size)}`)
        } catch (compressionError) {
          console.warn('⚠️ Erro na compressão, usando arquivo original:', compressionError)
          // Continuar com arquivo original se a compressão falhar
        }
        
        // Sanitizar nome do arquivo
        const sanitizedName = sanitizeFileName(compressedFile.name)
        const fileExtension = compressedFile.name.split('.').pop() || 'jpg'
        const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExtension}`
        
        // Determinar bucket baseado no tipo de post
        let bucket = 'post-media'
        let filePath = `${postId}/${safeFileName}`
        
        if (postType === 'before-after') {
          bucket = 'post-before-after'
          const prefix = beforeAfter === 'before' ? 'before' : 'after'
          filePath = `${postId}/${prefix}_${safeFileName}`
        } else if (postType === 'normal' && files.length > 1) {
          bucket = 'post-gallery'
          filePath = `${postId}/${order}_${safeFileName}`
        }
        
        // Upload do arquivo comprimido
        console.log('📤 Fazendo upload:', { bucket, filePath, fileName: compressedFile.name, size: formatFileSize(compressedFile.size) })
        
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, compressedFile, {
            cacheControl: '3600',
            upsert: false
          })
        
        if (error) {
          console.error('❌ Erro no upload:', error)
          throw new Error(`Erro no upload: ${error.message}`)
        }
        
        console.log('✅ Upload bem-sucedido:', { bucket, filePath })
        
        // Gerar URL pública
        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath)
        
        urls.push(urlData.publicUrl)
      }
      
      return {
        success: true,
        urls
      }
      
    } catch (error) {
      console.error('❌ Erro no upload:', error)
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      
      return {
        success: false,
        urls: [],
        error: error instanceof Error ? error.message : "Erro desconhecido"
      }
    } finally {
      setIsUploading(false)
    }
  }

  const createPost = async (postData: {
    title: string
    description: string
    category: string
    postType: string
    images?: File[]
    videos?: File[]
  }, user: any) => {
    setIsUploading(true)
    
    try {
      console.log('🚀 Iniciando criação de post...')
      
      // Verificar se o usuário está logado
      if (!user || !user.id) {
        throw new Error('Usuário não está logado')
      }
      
      console.log('Usuário para criar post:', user)
      
      // Timeout para operações do Supabase (30 segundos no mobile)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const timeout = isMobile ? 30000 : 20000 // 30s mobile, 20s desktop
      console.log(`⏱️ Timeout configurado: ${timeout}ms (mobile: ${isMobile})`)
      
      // Função para criar promessa com timeout
      const withTimeout = <T>(promise: any, ms: number): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Operação expirou após ${ms/1000}s. Tente novamente.`)), ms)
          )
        ])
      }
      
      // Buscar categoria real do banco com timeout
      console.log('🔍 Buscando categoria:', postData.category)
      const { data: category, error: categoryError } = await withTimeout<any>(
        supabase
          .from('categories')
          .select('id')
          .eq('name', postData.category)
          .single(),
        timeout
      )
      
      if (categoryError || !category) {
        console.error('❌ Erro ao buscar categoria:', categoryError)
        throw new Error('Categoria não encontrada')
      }
      
      console.log('✅ Categoria encontrada:', category)
      
      // 1. Criar o post primeiro
      console.log('📝 Criando post com user_id:', user.id)
      console.log('🔧 Tipo do user.id:', typeof user.id)
      
      // Determinar o tipo de post automaticamente baseado no conteúdo
      let finalPostType = postData.postType
      
      // Se for 'normal' mas tem múltiplas imagens, deve ser 'carousel'
      if (postData.postType === 'normal' && postData.images && postData.images.length > 1) {
        finalPostType = 'carousel'
        console.log('🔄 Detectado múltiplas imagens - alterando tipo para carousel')
      }
      
      // Se for 'normal' mas tem vídeo, deve ser 'video'
      if (postData.postType === 'normal' && postData.videos && postData.videos.length > 0) {
        finalPostType = 'video'
        console.log('🔄 Detectado vídeo - alterando tipo para video')
      }
      
      const postDataToInsert = {
        title: postData.title,
        description: postData.description,
        category_id: category.id,
        post_type: finalPostType,
        user_id: user.id, // Adicionar user_id
        media_urls: {} // Será atualizado após upload
      }
      
      console.log('📊 Dados para inserir:', postDataToInsert)
      
      const { data: post, error: postError } = await withTimeout<any>(
        supabase
          .from('posts')
          .insert(postDataToInsert)
          .select()
          .single(),
        timeout
      )
      
      if (postError) {
        console.error('❌ Erro ao criar post:', postError)
        throw new Error(`Erro ao criar post: ${postError.message}`)
      }
      
      console.log('✅ Post criado com ID:', post.id)
      
      // 2. Preparar arquivos para upload
      const mediaFiles: MediaFile[] = []
      
      // Adicionar vídeos
      if (postData.videos && postData.videos.length > 0) {
        console.log('📹 Adicionando vídeo para upload')
        mediaFiles.push({
          file: postData.videos[0],
          type: 'video'
        })
      }
      
      // Adicionar imagens
      if (postData.images && postData.images.length > 0) {
        console.log(`📸 Adicionando ${postData.images.length} imagem(ns) para upload`)
        if (postData.postType === 'before-after') {
          // Para antes e depois, assumimos que há exatamente 2 imagens
          if (postData.images.length === 2) {
            mediaFiles.push({
              file: postData.images[0],
              type: 'image',
              beforeAfter: 'before'
            })
            mediaFiles.push({
              file: postData.images[1],
              type: 'image',
              beforeAfter: 'after'
            })
          }
        } else {
          // Para posts normais, adicionar todas as imagens
          postData.images.forEach((file, index) => {
            mediaFiles.push({
              file,
              type: 'image',
              order: index + 1
            })
          })
        }
      }
      
      console.log(`📦 Total de ${mediaFiles.length} arquivo(s) para upload`)
      
      // 3. Fazer upload das mídias
      const uploadResult = await uploadMedia(
        mediaFiles,
        post.id,
        finalPostType as 'normal' | 'before-after' | 'video' | 'carousel'
      )
      
      if (!uploadResult.success) {
        console.error('❌ Upload falhou, deletando post:', uploadResult.error)
        // Se o upload falhou, deletar o post criado
        await supabase
          .from('posts')
          .delete()
          .eq('id', post.id)
        
        throw new Error(uploadResult.error || 'Erro no upload')
      }
      
      console.log('✅ Upload concluído com sucesso')
      
      // 4. Atualizar o post com as URLs das mídias
      const mediaUrls: any = {
        type: finalPostType,
        media: uploadResult.urls.map((url, index) => ({
          url,
          type: mediaFiles[index].type,
          order: mediaFiles[index].order || 1
        }))
      }
      
      if (finalPostType === 'before-after') {
        mediaUrls.beforeAfter = {
          before: uploadResult.urls[0],
          after: uploadResult.urls[1]
        }
      }
      
      console.log('🔗 Atualizando post com URLs das mídias')
      
      const { error: updateError } = await withTimeout<any>(
        supabase
          .from('posts')
          .update({ media_urls: mediaUrls })
          .eq('id', post.id),
        timeout
      )
      
      if (updateError) {
        console.error('❌ Erro ao atualizar post:', updateError)
        throw new Error(`Erro ao atualizar post: ${updateError.message}`)
      }
      
      console.log('🎉 Post criado e atualizado com sucesso!')
      
      toast({
        title: "Post criado com sucesso!",
        description: "Seu post foi publicado no BeautyWall",
      })
      
      return {
        success: true,
        postId: post.id
      }
      
    } catch (error) {
      console.error('💥 Erro ao criar post:', error)
      
      let errorMessage = "Erro desconhecido"
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Mensagens mais amigáveis para erros comuns
        if (errorMessage.includes('expirou')) {
          errorMessage = "Operação demorou muito. Verifique sua conexão e tente novamente."
        } else if (errorMessage.includes('fetch')) {
          errorMessage = "Erro de conexão. Verifique sua internet."
        } else if (errorMessage.includes('storage')) {
          errorMessage = "Erro no upload de arquivo. Tente novamente."
        } else if (errorMessage.includes('categoria')) {
          errorMessage = "Categoria não encontrada. Selecione uma categoria válida."
        }
      }
      
      toast({
        title: "Erro ao criar post",
        description: errorMessage,
        variant: "destructive"
      })
      
      return {
        success: false,
        error: errorMessage
      }
    } finally {
      console.log('🏁 Finalizando criação de post')
      setIsUploading(false)
    }
  }

  return {
    isUploading,
    createPost,
    uploadMedia
  }
} 