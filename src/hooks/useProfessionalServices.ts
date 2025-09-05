import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { compressImage } from '@/utils/compression'

export interface ProfessionalService {
  id?: string
  professional_id: string
  salon_id: string
  name: string
  description?: string
  duration_minutes: number
  price: number
  category: string
  photo_url?: string
  photo_filename?: string
  is_active: boolean
  requires_confirmation: boolean
  max_daily_bookings: number
  created_at?: string
  updated_at?: string
}

export interface ServiceFormData {
  name: string
  description?: string
  duration_minutes: number
  price: number
  category: string
  photo_file?: File
  is_active: boolean
  requires_confirmation: boolean
  max_daily_bookings: number
}

export const useProfessionalServices = (professionalId?: string, salonId?: string) => {
  const [services, setServices] = useState<ProfessionalService[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Carregar serviços
  const loadServices = useCallback(async () => {
    if (!professionalId || !salonId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('professional_services')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('salon_id', salonId)
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setServices(data || [])
    } catch (err) {
      console.error('Erro ao carregar serviços:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [professionalId, salonId])

  // Upload de foto com compressão
  const uploadPhoto = useCallback(async (file: File, serviceId: string): Promise<string> => {
    try {
      setUploading(true)
      
      console.log('🔄 Iniciando upload de foto...')
      console.log('📁 Arquivo original:', file.name, 'Tamanho:', (file.size / 1024 / 1024).toFixed(2), 'MB', 'Tipo:', file.type)
      console.log('🆔 Service ID:', serviceId)
      
      // Validar arquivo
      if (!file || file.size === 0) {
        throw new Error('Arquivo inválido ou vazio')
      }
      
      // Validar tipo de arquivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.')
      }
      
      // Validar tamanho (máximo 5MB)
      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        throw new Error('Arquivo muito grande. Máximo 5MB.')
      }
      
      // Comprimir imagem antes do upload (se não for WebP)
      let fileToUpload = file
      if (file.type !== 'image/webp') {
        try {
          console.log('🔧 Comprimindo imagem para upload...')
          fileToUpload = await compressImage(file, {
            maxWidth: 800,      // Largura máxima para serviços
            maxHeight: 800,     // Altura máxima para serviços
            quality: 0.8,       // Qualidade alta para serviços
            format: 'webp'      // Formato otimizado
          })
          console.log('✅ Imagem comprimida para upload')
          console.log('📏 Tamanho comprimido:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB')
          console.log('📊 Redução:', ((file.size - fileToUpload.size) / file.size * 100).toFixed(1), '%')
        } catch (compressError) {
          console.warn('⚠️ Erro na compressão, usando arquivo original:', compressError)
          fileToUpload = file
        }
      }
      
      // Usar extensão do arquivo comprimido
      const fileExt = fileToUpload.type === 'image/webp' ? 'webp' : file.name.split('.').pop()
      const fileName = `${serviceId}-${Date.now()}.${fileExt}`
      const filePath = `${serviceId}/${fileName}`

      console.log('📤 Fazendo upload de foto do serviço:', filePath)
      console.log('📁 Arquivo para upload:', fileToUpload.name, 'Tamanho:', (fileToUpload.size / 1024 / 1024).toFixed(2), 'MB')

      // TESTE: Verificar se o bucket existe antes do upload
      console.log('🔍 Verificando bucket service-photos...')
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
      if (bucketError) {
        console.error('❌ Erro ao listar buckets:', bucketError)
        // Se não conseguir listar buckets, pode ser problema de limites
        if (bucketError.message.includes('rate') || bucketError.message.includes('limit')) {
          throw new Error('Limite de uso do Supabase excedido. Tente novamente em alguns minutos.')
        }
      } else {
        const servicePhotosBucket = buckets?.find(b => b.name === 'service-photos')
        console.log('📦 Bucket service-photos encontrado:', !!servicePhotosBucket)
        if (servicePhotosBucket) {
          console.log('📦 Detalhes do bucket:', {
            name: servicePhotosBucket.name,
            public: servicePhotosBucket.public,
            file_size_limit: servicePhotosBucket.file_size_limit
          })
        } else {
          console.error('❌ Bucket service-photos não encontrado na lista')
          throw new Error('Bucket service-photos não encontrado. Verifique as configurações.')
        }
      }

      // Upload com timeout e retry
      let uploadAttempts = 0
      const maxAttempts = 3
      
      while (uploadAttempts < maxAttempts) {
        try {
          uploadAttempts++
          console.log(`🔄 Tentativa ${uploadAttempts} de upload...`)
          
          const { data, error: uploadError } = await supabase.storage
            .from('service-photos')
            .upload(filePath, fileToUpload, {
              cacheControl: '3600',
              upsert: false
            })

          if (uploadError) {
            console.error(`❌ Erro na tentativa ${uploadAttempts}:`, uploadError)
            console.error('❌ Mensagem do erro:', uploadError.message)
            
            // Verificar se é erro de limite
            if (uploadError.message.includes('rate') || uploadError.message.includes('limit') || uploadError.message.includes('quota')) {
              if (uploadAttempts < maxAttempts) {
                console.log(`⏳ Aguardando antes da tentativa ${uploadAttempts + 1}...`)
                await new Promise(resolve => setTimeout(resolve, 2000 * uploadAttempts)) // Backoff exponencial
                continue
              } else {
                throw new Error('Limite de uso do Supabase excedido. Tente novamente em alguns minutos.')
              }
            }
            
            throw uploadError
          }

          console.log('✅ Upload realizado com sucesso:', data)

          // Gerar URL pública
          const { data: urlData } = supabase.storage
            .from('service-photos')
            .getPublicUrl(filePath)

          if (!urlData.publicUrl) {
            throw new Error('Erro ao gerar URL pública')
          }

          console.log('✅ Upload de foto concluído:', urlData.publicUrl)
          return urlData.publicUrl
          
        } catch (attemptError) {
          if (uploadAttempts >= maxAttempts) {
            throw attemptError
          }
          // Continuar para próxima tentativa
        }
      }
      
      throw new Error('Todas as tentativas de upload falharam')
      
    } catch (err) {
      console.error('❌ Erro no upload da foto:', err)
      throw new Error(`Erro ao fazer upload da foto: ${err instanceof Error ? err.message : 'Erro desconhecido'}`)
    } finally {
      setUploading(false)
    }
  }, [])

  // Função de teste para upload direto
  const testUpload = useCallback(async (file: File): Promise<string> => {
    console.log('🧪 TESTE: Iniciando upload de teste...')
    console.log('📁 Arquivo de teste:', file.name, 'Tamanho:', file.size)
    
    try {
      const testFileName = `test-${Date.now()}.${file.name.split('.').pop()}`
      const testPath = `test/${testFileName}`
      
      console.log('🧪 TESTE: Fazendo upload para:', testPath)
      
      const { data, error } = await supabase.storage
        .from('service-photos')
        .upload(testPath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('🧪 TESTE: Erro no upload:', error)
        throw error
      }
      
      console.log('🧪 TESTE: Upload de teste bem-sucedido:', data)
      
      const { data: urlData } = supabase.storage
        .from('service-photos')
        .getPublicUrl(testPath)
      
      console.log('🧪 TESTE: URL gerada:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (err) {
      console.error('🧪 TESTE: Erro no teste de upload:', err)
      throw err
    }
  }, [])

  // Criar serviço
  const createService = useCallback(async (formData: ServiceFormData) => {
    console.log('🔄 createService iniciado')
    console.log('👤 Professional ID:', professionalId)
    console.log('🏢 Salon ID:', salonId)
    console.log('📋 FormData:', formData)
    
    if (!professionalId || !salonId) {
      console.error('❌ IDs não fornecidos')
      throw new Error('ID do profissional ou salão não fornecido')
    }

    try {
      console.log('🔄 Iniciando salvamento...')
      setSaving(true)
      setError(null)

      const serviceData: Omit<ProfessionalService, 'id' | 'created_at' | 'updated_at'> = {
        professional_id: professionalId,
        salon_id: salonId,
        name: formData.name,
        description: formData.description,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        category: formData.category,
        is_active: formData.is_active,
        requires_confirmation: formData.requires_confirmation,
        max_daily_bookings: formData.max_daily_bookings
      }
      
      console.log('📤 ServiceData preparado:', serviceData)

      // PASSO 1: Criar serviço SEM foto primeiro
      console.log('🔄 PASSO 1: Criando serviço sem foto...')
      const { data: newService, error: createError } = await supabase
        .from('professional_services')
        .insert(serviceData)
        .select()
        .single()

      if (createError) {
        console.error('❌ Erro no INSERT:', createError)
        console.error('❌ Código:', createError.code)
        console.error('❌ Mensagem:', createError.message)
        console.error('❌ Detalhes:', createError.details)
        throw createError
      }
      console.log('✅ PASSO 1 CONCLUÍDO: Serviço criado no banco:', newService)

      // PASSO 2: Se há foto, tentar upload separadamente
      if (formData.photo_file && newService) {
        console.log('🔄 PASSO 2: Iniciando upload da foto...')
        try {
          const photoUrl = await uploadPhoto(formData.photo_file, newService.id)
          
          console.log('🔄 Atualizando serviço com a URL da foto...')
          // Atualizar serviço com a URL da foto
          const { error: updateError } = await supabase
            .from('professional_services')
            .update({ 
              photo_url: photoUrl,
              photo_filename: formData.photo_file.name
            })
            .eq('id', newService.id)

          if (updateError) {
            console.error('❌ Erro ao atualizar serviço com foto:', updateError)
            console.log('⚠️ Serviço criado, mas foto não foi salva')
          } else {
            // Atualizar o serviço local com a foto
            newService.photo_url = photoUrl
            newService.photo_filename = formData.photo_file.name
            console.log('✅ PASSO 2 CONCLUÍDO: Foto salva com sucesso:', photoUrl)
          }
        } catch (photoError) {
          console.error('❌ Erro no PASSO 2 (upload da foto):', photoError)
          console.log('⚠️ Serviço foi criado com sucesso, mas foto falhou')
          console.log('⚠️ Detalhes do erro de upload:', photoError instanceof Error ? photoError.message : 'Erro desconhecido')
          
          // Verificar se é erro de limite do Supabase
          const errorMessage = photoError instanceof Error ? photoError.message : 'Erro desconhecido'
          if (errorMessage.includes('limit') || errorMessage.includes('rate') || errorMessage.includes('quota')) {
            console.log('⚠️ ERRO DE LIMITE DETECTADO: Supabase excedeu os limites de uso')
            console.log('⚠️ Serviço criado sem foto. Adicione a foto depois que os limites forem resolvidos.')
            
            // Não falhar o processo, mas informar o usuário
            // O serviço foi criado com sucesso, apenas sem foto
          }
          // Serviço foi criado, mas foto falhou - não falhar o processo todo
        }
      } else {
        console.log('✅ PASSO 2 PULADO: Nenhuma foto fornecida')
      }

      setServices(prev => [...prev, newService])
      console.log('✅ PROCESSO FINALIZADO: Serviço adicionado à lista local')
      return newService
    } catch (err) {
      console.error('❌ Erro geral no createService:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setSaving(false)
    }
  }, [professionalId, salonId, uploadPhoto])

  // Atualizar serviço
  const updateService = useCallback(async (serviceId: string, formData: ServiceFormData) => {
    try {
      setSaving(true)
      setError(null)

      const updateData: Partial<ProfessionalService> = {
        name: formData.name,
        description: formData.description,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        category: formData.category,
        is_active: formData.is_active,
        requires_confirmation: formData.requires_confirmation,
        max_daily_bookings: formData.max_daily_bookings
      }

      // Upload da nova foto se fornecida
      if (formData.photo_file) {
        try {
          const photoUrl = await uploadPhoto(formData.photo_file, serviceId)
          updateData.photo_url = photoUrl
          updateData.photo_filename = formData.photo_file.name
        } catch (photoError) {
          console.error('Erro ao fazer upload da foto:', photoError)
          // Não falhar se o upload da foto der erro
        }
      }

      const { data, error: updateError } = await supabase
        .from('professional_services')
        .update(updateData)
        .eq('id', serviceId)
        .select()
        .single()

      if (updateError) throw updateError

      setServices(prev => prev.map(service => 
        service.id === serviceId ? data : service
      ))

      return data
    } catch (err) {
      console.error('Erro ao atualizar serviço:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setSaving(false)
    }
  }, [uploadPhoto])

  // Deletar serviço
  const deleteService = useCallback(async (serviceId: string) => {
    try {
      setSaving(true)
      setError(null)

      // Buscar o serviço para pegar o nome do arquivo da foto
      const service = services.find(s => s.id === serviceId)
      
      const { error: deleteError } = await supabase
        .from('professional_services')
        .delete()
        .eq('id', serviceId)

      if (deleteError) throw deleteError

      // Deletar foto do storage se existir
      if (service?.photo_url) {
        try {
          // Extrair o caminho do arquivo da URL
          const urlParts = service.photo_url.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const serviceId = service.id
          const filePath = `${serviceId}/${fileName}`
          
          console.log('🗑️ Deletando foto do serviço:', filePath)
          
          const { error: removeError } = await supabase.storage
            .from('service-photos')
            .remove([filePath])
            
          if (removeError) {
            console.error('❌ Erro ao deletar foto:', removeError)
          } else {
            console.log('✅ Foto deletada com sucesso')
          }
        } catch (photoError) {
          console.error('❌ Erro ao deletar foto:', photoError)
          // Não falhar se a deleção da foto der erro
        }
      }

      setServices(prev => prev.filter(service => service.id !== serviceId))
    } catch (err) {
      console.error('Erro ao deletar serviço:', err)
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      throw new Error(errorMessage)
    } finally {
      setSaving(false)
    }
  }, [services])

  // Alternar status ativo/inativo
  const toggleServiceStatus = useCallback(async (serviceId: string) => {
    try {
      const service = services.find(s => s.id === serviceId)
      if (!service) return

      const { data, error } = await supabase
        .from('professional_services')
        .update({ is_active: !service.is_active })
        .eq('id', serviceId)
        .select()
        .single()

      if (error) throw error

      setServices(prev => prev.map(s => 
        s.id === serviceId ? data : s
      ))
    } catch (err) {
      console.error('Erro ao alternar status do serviço:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    }
  }, [services])

  // Validar dados do serviço
  const validateService = useCallback((formData: ServiceFormData) => {
    const errors: string[] = []

    if (!formData.name.trim()) {
      errors.push('Nome do serviço é obrigatório')
    }

    if (formData.duration_minutes <= 0) {
      errors.push('Duração deve ser maior que zero')
    }

    if (formData.price < 0) {
      errors.push('Preço não pode ser negativo')
    }

    if (formData.max_daily_bookings <= 0) {
      errors.push('Máximo de agendamentos diários deve ser maior que zero')
    }

    return errors
  }, [])

  // Carregar serviços quando os IDs mudarem
  useEffect(() => {
    loadServices()
  }, [loadServices])

  return {
    services,
    loading,
    error,
    saving,
    uploading,
    createService,
    updateService,
    deleteService,
    toggleServiceStatus,
    validateService,
    reload: loadServices,
    testUpload // Adicionado a função de teste
  }
}
