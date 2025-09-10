import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface SalonStudio {
  id: string
  owner_id: string
  name: string
  description?: string
  profile_photo?: string
  cover_photo?: string
  phone?: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  social_instagram?: string
  social_facebook?: string
  social_youtube?: string
  social_linkedin?: string
  social_x?: string
  social_tiktok?: string
  created_at: string
  updated_at: string
  // Relacionamento com o proprietário
  owner?: {
    id: string
    name: string
    email: string
    profile_photo?: string
    user_type: string
  }
}

interface SalonProfessional {
  id: string
  salon_id: string
  professional_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
}

interface CreateSalonData {
  name: string
  description?: string
  profile_photo?: string
  cover_photo?: string
  phone?: string
  email?: string
  cep?: string
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  cidade?: string
  uf?: string
  social_instagram?: string
  social_facebook?: string
  social_youtube?: string
  social_linkedin?: string
  social_x?: string
  social_tiktok?: string
}

export const useSalons = (userId?: string) => {
  const [userSalon, setUserSalon] = useState<SalonStudio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar salão do usuário
  const fetchUserSalon = useCallback(async () => {
    if (!userId) {
      console.log('❌ Usuário não autenticado')
      setUserSalon(null)
      setLoading(false)
      return
    }

    try {
      console.log('🔍 Buscando salão do usuário:', userId)
      
      // Primeiro, tentar buscar salão onde o usuário é dono
      let { data, error } = await supabase
        .from('salons_studios')
        .select(`
          *,
          owner:users!salons_studios_owner_id_fkey(id, name, email, profile_photo, user_type)
        `)
        .eq('owner_id', userId)
        .single()

      // Se não for dono, buscar salão onde é profissional vinculado
      if (error && error.code === 'PGRST116') {
        console.log('🔍 Usuário não é dono, buscando como profissional vinculado...')
        
        const { data: professionalData, error: professionalError } = await supabase
          .from('salon_professionals')
          .select(`
            salon_id,
            status,
            salon:salons_studios!salon_professionals_salon_id_fkey(
              *,
              owner:users!salons_studios_owner_id_fkey(id, name, email, profile_photo, user_type)
            )
          `)
          .eq('professional_id', userId)
          .eq('status', 'accepted')
          .single()

        if (professionalError) {
          console.log('📭 Usuário não é profissional vinculado:', userId)
          setUserSalon(null)
          return
        }

        if (professionalData?.salon) {
          console.log('✅ Salão encontrado como profissional vinculado:', professionalData.salon)
          setUserSalon(professionalData.salon)
          return
        }
      }

      if (error) {
        console.error('❌ Erro detalhado do Supabase:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        
        if (error.code === 'PGRST116') {
          console.log('📭 Nenhum salão encontrado para o usuário:', userId)
          setUserSalon(null)
        } else {
          console.error('❌ Erro ao buscar salão:', error)
          throw error
        }
      } else {
        // console.log('✅ Salão encontrado como dono:', data)
        setUserSalon(data)
      }
    } catch (err) {
      console.error('❌ Erro ao buscar salão do usuário:', err)
      setError('Erro ao carregar dados do salão')
      setUserSalon(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Criar salão
  const createSalon = useCallback(async (salonData: CreateSalonData) => {
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    try {
      console.log('🏗️ Criando salão:', salonData)
      
      const { data, error } = await supabase
        .from('salons_studios')
        .insert({
          owner_id: userId,
          ...salonData
        })
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao criar salão:', error)
        throw error
      }

      console.log('✅ Salão criado:', data)

      // Criar vínculo automático do profissional com o salão
      try {
        console.log('🔗 Criando vínculo profissional-salão:', { salonId: data.id, professionalId: userId })
        
        const { error: linkError } = await supabase
          .from('salon_professionals')
          .insert({
            salon_id: data.id,
            professional_id: userId,
            status: 'accepted' // O dono do salão é automaticamente aceito
          })

        if (linkError) {
          console.error('❌ Erro ao criar vínculo profissional:', linkError)
          // Não vamos falhar a criação do salão por causa disso
        } else {
          console.log('✅ Vínculo profissional criado com sucesso')
        }
      } catch (linkErr) {
        console.error('❌ Erro ao criar vínculo profissional:', linkErr)
        // Não vamos falhar a criação do salão por causa disso
      }

      setUserSalon(data)
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erro ao criar salão:', err)
      return { success: false, error: err }
    }
  }, [userId])

  // Atualizar salão
  const updateSalon = useCallback(async (salonId: string, updates: Partial<CreateSalonData>) => {
    if (!userId) {
      throw new Error('Usuário não autenticado')
    }

    try {
      console.log('🔄 Atualizando salão:', salonId, updates)
      
      // Verificar se o usuário é o proprietário do salão
      const { data: currentSalon, error: fetchError } = await supabase
        .from('salons_studios')
        .select('owner_id')
        .eq('id', salonId)
        .single()

      if (fetchError) {
        console.error('❌ Erro ao buscar salão para validação:', fetchError)
        throw fetchError
      }

      if (currentSalon.owner_id !== userId) {
        throw new Error('Apenas o proprietário pode atualizar o salão')
      }
      
      const { data, error } = await supabase
        .from('salons_studios')
        .update(updates)
        .eq('id', salonId)
        .select()
        .single()

      if (error) {
        console.error('❌ Erro ao atualizar salão:', error)
        throw error
      }

      console.log('✅ Salão atualizado:', data)
      setUserSalon(data)
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erro ao atualizar salão:', err)
      return { success: false, error: err }
    }
  }, [userId])

  // Buscar salão por ID
  const fetchSalonById = useCallback(async (salonId: string) => {
    try {
      console.log('🔍 Buscando salão por ID:', salonId)
      
      const { data, error } = await supabase
        .from('salons_studios')
        .select('*')
        .eq('id', salonId)
        .single()

      if (error) {
        console.error('❌ Erro ao buscar salão por ID:', error)
        throw error
      }

      console.log('📊 Salão encontrado:', data)
      return { success: true, data }
    } catch (err) {
      console.error('❌ Erro ao buscar salão por ID:', err)
      return { success: false, error: err }
    }
  }, [])

  // Verificar se usuário tem salão
  const hasSalon = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('salons_studios')
        .select('id')
        .eq('owner_id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return !!data
    } catch (err) {
      console.error('❌ Erro ao verificar se usuário tem salão:', err)
      return false
    }
  }, [])

  // Carregar dados iniciais
  useEffect(() => {
    if (userId) {
      fetchUserSalon()
    }
  }, [userId, fetchUserSalon])

  return {
    userSalon,
    loading,
    error,
    createSalon,
    updateSalon,
    fetchSalonById,
    hasSalon,
    refetch: fetchUserSalon
  }
}
