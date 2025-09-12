import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface ProfessionalSalonInfo {
  salon_id: string | null
  salon_name?: string
  is_owner?: boolean
}

export const useProfessionalSalon = () => {
  // Buscar salon_id de um profissional
  const getProfessionalSalonId = useCallback(async (professionalId: string): Promise<string | null> => {
    if (!professionalId) return null
    
    try {
      // console.log('🔍 Buscando salon_id para profissional:', professionalId)
      
      const { data, error } = await supabase
        .from('salon_professionals')
        .select('salon_id')
        .eq('professional_id', professionalId)
        .eq('status', 'accepted')
        .single()
      
      if (error) {
        // Se não encontrou vínculo, profissional é independente
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Profissional independente (sem vínculo com salão):', professionalId)
          return null
        }
        console.error('❌ Erro ao buscar salon_id:', error)
        return null
      }
      
      console.log('✅ Salon_id encontrado:', data.salon_id, 'para profissional:', professionalId)
      return data.salon_id
      
    } catch (error) {
      console.error('❌ Erro ao buscar salon_id:', error)
      return null
    }
  }, [])

  // Buscar informações completas do salão do profissional
  const getProfessionalSalonInfo = useCallback(async (professionalId: string): Promise<ProfessionalSalonInfo | null> => {
    if (!professionalId) return null
    
    try {
      // console.log('🔍 Buscando informações do salão para profissional:', professionalId)
      
      const { data, error } = await supabase
        .from('salon_professionals')
        .select(`
          salon_id,
          salon:salons_studios!salon_professionals_salon_id_fkey(
            id,
            name,
            owner_id
          )
        `)
        .eq('professional_id', professionalId)
        .eq('status', 'accepted')
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ Profissional independente:', professionalId)
          return { salon_id: null }
        }
        console.error('❌ Erro ao buscar informações do salão:', error)
        return null
      }
      
      const salonInfo: ProfessionalSalonInfo = {
        salon_id: data.salon_id,
        salon_name: data.salon?.name,
        is_owner: data.salon?.owner_id === professionalId
      }
      
      console.log('✅ Informações do salão encontradas:', salonInfo)
      return salonInfo
      
    } catch (error) {
      console.error('❌ Erro ao buscar informações do salão:', error)
      return null
    }
  }, [])

  // Buscar salon_id para múltiplos profissionais (otimizado)
  const getMultipleProfessionalSalonIds = useCallback(async (professionalIds: string[]): Promise<Record<string, string | null>> => {
    if (!professionalIds.length) return {}
    
    try {
      // console.log('🔍 Buscando salon_ids para múltiplos profissionais:', professionalIds.length)
      
      const { data, error } = await supabase
        .from('salon_professionals')
        .select('professional_id, salon_id')
        .in('professional_id', professionalIds)
        .eq('status', 'accepted')
      
      if (error) {
        console.error('❌ Erro ao buscar múltiplos salon_ids:', error)
        return {}
      }
      
      // Criar mapa de professional_id -> salon_id
      const salonIdMap: Record<string, string | null> = {}
      
      // Inicializar todos como null (independentes)
      professionalIds.forEach(id => {
        salonIdMap[id] = null
      })
      
      // Preencher com dados encontrados
      data?.forEach(item => {
        salonIdMap[item.professional_id] = item.salon_id
      })
      
      console.log('✅ Mapa de salon_ids criado:', salonIdMap)
      return salonIdMap
      
    } catch (error) {
      console.error('❌ Erro ao buscar múltiplos salon_ids:', error)
      return {}
    }
  }, [])

  return {
    getProfessionalSalonId,
    getProfessionalSalonInfo,
    getMultipleProfessionalSalonIds
  }
}
