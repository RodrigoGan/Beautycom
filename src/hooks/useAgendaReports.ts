import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface AgendaReportMetrics {
  total_agendamentos: number
  clientes_unicos: number
  profissionais_ativos: number
  faturamento_total: number
  agendamentos_faturados: number
}

export interface ProfessionalPerformance {
  nome_profissional: string
  total_agendamentos: number
  faturamento: number
  porcentagem_ocupacao: number
}

export interface TopService {
  nome_servico: string
  quantidade_agendamentos: number
  porcentagem: number
}

export interface AgendaReports {
  metrics: AgendaReportMetrics | null
  professionalPerformance: ProfessionalPerformance[]
  topServices: TopService[]
}

export const useAgendaReports = (salonId: string, dateRange: { start: string, end: string }) => {
  const [reports, setReports] = useState<AgendaReports>({
    metrics: null,
    professionalPerformance: [],
    topServices: []
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Buscar métricas gerais
  const fetchMetrics = useCallback(async () => {
    try {
      console.log('🔍 fetchMetrics - Parâmetros:', { salonId, dateRange })
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .eq('salon_id', salonId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .in('status', ['confirmed', 'pending', 'completed'])

      if (error) throw error
      
      console.log('🔍 fetchMetrics - Dados encontrados:', data?.length || 0)
      console.log('🔍 fetchMetrics - Status dos agendamentos:', data?.map(a => a.status))
      console.log('🔍 fetchMetrics - Datas dos agendamentos:', data?.map(a => a.date))

      const totalAgendamentos = data?.length || 0
      const clientesUnicos = new Set(data?.map(a => a.client_id) || []).size
      const profissionaisAtivos = new Set(data?.map(a => a.professional_id) || []).size

      // Buscar faturamento
      const { data: faturamentoData, error: faturamentoError } = await supabase
        .from('appointments')
        .select(`
          *,
          service:professional_services!inner(price)
        `)
        .eq('salon_id', salonId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .in('status', ['completed', 'confirmed'])

      if (faturamentoError) throw faturamentoError

      const faturamentoTotal = faturamentoData?.reduce((sum, a) => sum + (a.service?.price || 0), 0) || 0
      const agendamentosFaturados = faturamentoData?.length || 0

      console.log('🔍 fetchMetrics - Resultados:', {
        total_agendamentos: totalAgendamentos,
        clientes_unicos: clientesUnicos,
        profissionais_ativos: profissionaisAtivos,
        faturamento_total: faturamentoTotal,
        agendamentos_faturados: agendamentosFaturados
      })

      return {
        total_agendamentos: totalAgendamentos,
        clientes_unicos: clientesUnicos,
        profissionais_ativos: profissionaisAtivos,
        faturamento_total: faturamentoTotal,
        agendamentos_faturados: agendamentosFaturados
      }
    } catch (err) {
      console.error('Erro ao buscar métricas:', err)
      return null
    }
  }, [salonId, dateRange])

  // Buscar desempenho por profissional
  const fetchProfessionalPerformance = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          professional:users!appointments_professional_id_fkey(name),
          service:professional_services!inner(price)
        `)
        .eq('salon_id', salonId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .in('status', ['completed', 'confirmed', 'pending'])

      if (error) throw error

      // Agrupar por profissional
      const performanceMap = new Map<string, ProfessionalPerformance>()
      
      data?.forEach(appointment => {
        const profId = appointment.professional_id
        const profName = appointment.professional?.name || 'Profissional'
        
        if (!performanceMap.has(profId)) {
          performanceMap.set(profId, {
            nome_profissional: profName,
            total_agendamentos: 0,
            faturamento: 0,
            porcentagem_ocupacao: 0
          })
        }
        
        const perf = performanceMap.get(profId)!
        perf.total_agendamentos++
        perf.faturamento += appointment.service?.price || 0
      })

      // Calcular porcentagem de ocupação
      const totalAppointments = data?.length || 0
      performanceMap.forEach(perf => {
        perf.porcentagem_ocupacao = totalAppointments > 0 ? 
          Math.round((perf.total_agendamentos * 100.0 / totalAppointments) * 100) / 100 : 0
      })

      return Array.from(performanceMap.values()).sort((a, b) => b.total_agendamentos - a.total_agendamentos)
    } catch (err) {
      console.error('Erro ao buscar desempenho profissional:', err)
      return []
    }
  }, [salonId, dateRange])

  // Buscar serviços mais procurados
  const fetchTopServices = useCallback(async (professionalId?: string) => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          service:professional_services!inner(name)
        `)
        .eq('salon_id', salonId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .in('status', ['confirmed', 'pending', 'completed'])

      // Filtrar por profissional específico se fornecido
      if (professionalId && professionalId !== 'todos') {
        query = query.eq('professional_id', professionalId)
      }

      const { data, error } = await query

      if (error) throw error
      
      console.log('🔍 fetchTopServices - Dados encontrados:', data?.length || 0)
      console.log('🔍 fetchTopServices - Serviços:', data?.map(a => ({ 
        service_id: a.service_id, 
        service_name: a.service?.name,
        status: a.status 
      })))

      // Agrupar por serviço
      const serviceMap = new Map<string, TopService>()
      
      data?.forEach(appointment => {
        const serviceId = appointment.service_id
        const serviceName = appointment.service?.name || 'Serviço'
        
        if (!serviceMap.has(serviceId)) {
          serviceMap.set(serviceId, {
            nome_servico: serviceName,
            quantidade_agendamentos: 0,
            porcentagem: 0
          })
        }
        
        const service = serviceMap.get(serviceId)!
        service.quantidade_agendamentos++
      })

      // Calcular porcentagens
      const totalAppointments = data?.length || 0
      serviceMap.forEach(service => {
        service.porcentagem = totalAppointments > 0 ? 
          Math.round((service.quantidade_agendamentos * 100.0 / totalAppointments) * 100) / 100 : 0
      })

      return Array.from(serviceMap.values())
        .sort((a, b) => b.quantidade_agendamentos - a.quantidade_agendamentos)
        .slice(0, 5)
    } catch (err) {
      console.error('Erro ao buscar serviços mais procurados:', err)
      return []
    }
  }, [salonId, dateRange])

  // Buscar todos os relatórios
  const fetchReports = useCallback(async (professionalId?: string) => {
    setLoading(true)
    setError(null)

    try {
      const [metrics, professionalPerformance, topServices] = await Promise.all([
        fetchMetrics(),
        fetchProfessionalPerformance(),
        fetchTopServices(professionalId)
      ])

      setReports({
        metrics,
        professionalPerformance,
        topServices
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar relatórios')
    } finally {
      setLoading(false)
    }
  }, [fetchMetrics, fetchProfessionalPerformance, fetchTopServices])

  return {
    reports,
    loading,
    error,
    fetchReports
  }
}

