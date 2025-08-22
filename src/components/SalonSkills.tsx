import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Badge } from './ui/badge'
import { Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase'

// Função para salvar logs no banco
const saveDebugLog = async (componentName: string, logLevel: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any) => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('debug_logs').insert({
      component_name: componentName,
      log_level: logLevel,
      message,
      data: data ? JSON.stringify(data) : null,
      user_id: user.id
    })
  } catch (error) {
    console.error('Erro ao salvar log:', error)
  }
}

interface Skill {
  id: string
  name: string
  category: string
  professionals_count: number
}

interface SalonSkillsProps {
  salonId: string
}

export const SalonSkills: React.FC<SalonSkillsProps> = ({ salonId }) => {
  const [skills, setSkills] = useState<Skill[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Buscar habilidades dos profissionais do salão
  const fetchSalonSkills = async () => {
    if (!salonId) {
      setSkills([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      await saveDebugLog('SalonSkills', 'info', 'Iniciando busca de habilidades', { salonId })

      // Primeiro, buscar profissionais vinculados ao salão
      await saveDebugLog('SalonSkills', 'debug', 'Buscando profissionais com status accepted', { salonId })
      const { data: professionalsData, error: professionalsError } = await supabase
        .from('salon_professionals')
        .select('professional_id, status')
        .eq('salon_id', salonId)
        .eq('status', 'accepted')

      if (professionalsError) {
        await saveDebugLog('SalonSkills', 'error', 'Erro ao buscar profissionais', { error: professionalsError })
        throw professionalsError
      }

      if (!professionalsData || professionalsData.length === 0) {
        await saveDebugLog('SalonSkills', 'warn', 'Nenhum profissional vinculado ao salão', { salonId })
        setSkills([])
        setLoading(false)
        return
      }

      const professionalIds = professionalsData.map(p => p.professional_id)
      await saveDebugLog('SalonSkills', 'info', 'Profissionais encontrados', { 
        professionalIds, 
        count: professionalIds.length,
        data: professionalsData 
      })

      // Buscar habilidades dos profissionais - tentar abordagem alternativa
      await saveDebugLog('SalonSkills', 'debug', 'Buscando habilidades para profissionais', { professionalIds })
      
      // Buscar habilidades dos profissionais (campo categories da tabela users)
      const { data: professionalsWithSkills, error: skillsError } = await supabase
        .from('users')
        .select('id, name, categories')
        .in('id', professionalIds)

      await saveDebugLog('SalonSkills', 'debug', 'Query executada para users com categories', { 
        user_ids: professionalIds,
        professionals_with_skills: professionalsWithSkills,
        skills_error: skillsError 
      })

      if (skillsError) {
        await saveDebugLog('SalonSkills', 'error', 'Erro ao buscar habilidades', { error: skillsError })
        throw skillsError
      }

      if (!professionalsWithSkills || professionalsWithSkills.length === 0) {
        await saveDebugLog('SalonSkills', 'warn', 'Nenhum profissional encontrado com dados', { professionalIds })
        setSkills([])
        setLoading(false)
        return
      }

      // Coletar todas as categorias únicas dos profissionais
      const allCategoryIds = new Set<string>()
      professionalsWithSkills.forEach(professional => {
        if (professional.categories && Array.isArray(professional.categories)) {
          professional.categories.forEach(categoryId => {
            if (categoryId) allCategoryIds.add(categoryId)
          })
        }
      })

      const categoryIdsArray = Array.from(allCategoryIds)
      await saveDebugLog('SalonSkills', 'debug', 'Categorias encontradas nos profissionais', { 
        category_ids: categoryIdsArray,
        total_categories: categoryIdsArray.length 
      })

      if (categoryIdsArray.length === 0) {
        await saveDebugLog('SalonSkills', 'warn', 'Nenhuma categoria encontrada nos profissionais', { professionalIds })
        setSkills([])
        setLoading(false)
        return
      }

      // Buscar detalhes das categorias
      const { data: categoryDetails, error: categoryDetailsError } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', categoryIdsArray)

      await saveDebugLog('SalonSkills', 'debug', 'Detalhes das categorias obtidos', { 
        category_details: categoryDetails,
        category_details_error: categoryDetailsError 
      })

      if (categoryDetailsError) {
        await saveDebugLog('SalonSkills', 'error', 'Erro ao buscar detalhes das categorias', { error: categoryDetailsError })
        throw categoryDetailsError
      }

      // Criar mapa de categorias
      const categoriesMap = new Map<string, string>()
      categoryDetails?.forEach(cat => {
        categoriesMap.set(cat.id, cat.name)
      })

      // Processar e agrupar habilidades (categorias)
      const skillsMap = new Map<string, Skill>()
      
      professionalsWithSkills.forEach(professional => {
        if (professional.categories && Array.isArray(professional.categories)) {
          professional.categories.forEach(categoryId => {
            if (categoryId && categoriesMap.has(categoryId)) {
              const categoryName = categoriesMap.get(categoryId)!
              
              if (skillsMap.has(categoryId)) {
                skillsMap.get(categoryId)!.professionals_count++
              } else {
                skillsMap.set(categoryId, {
                  id: categoryId,
                  name: categoryName,
                  category: categoryName,
                  professionals_count: 1
                })
              }
            }
          })
        }
      })

      const processedSkills = Array.from(skillsMap.values())
        .sort((a, b) => b.professionals_count - a.professionals_count)

      await saveDebugLog('SalonSkills', 'info', 'Habilidades processadas com sucesso', { 
        processed_skills: processedSkills,
        total_skills: processedSkills.length 
      })
      setSkills(processedSkills)

    } catch (err) {
      await saveDebugLog('SalonSkills', 'error', 'Erro geral ao buscar habilidades', { error: err })
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  // Buscar habilidades quando o salão mudar
  useEffect(() => {
    fetchSalonSkills()
  }, [salonId])

  if (loading) {
    return (
      <Card className="mb-6 bg-gradient-card border-accent/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Habilidades dos Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando habilidades...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="mb-6 bg-gradient-card border-accent/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Habilidades dos Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Erro ao carregar habilidades</p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (skills.length === 0) {
    return (
      <Card className="mb-6 bg-gradient-card border-accent/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Habilidades dos Profissionais
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Ainda não há profissionais com habilidades cadastradas no salão.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6 bg-gradient-card border-accent/20 shadow-beauty-card hover:shadow-beauty transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Habilidades dos Profissionais
          <Badge variant="secondary" className="ml-2">
            {skills.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {skills.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill) => (
              <Badge 
                key={skill.id} 
                variant="secondary" 
                className="bg-gradient-primary text-white border-0 shadow-sm"
                title={`${skill.professionals_count} profissional${skill.professionals_count > 1 ? 'is' : ''} com esta habilidade`}
              >
                {skill.name}
                {skill.professionals_count > 1 && (
                  <span className="ml-1 opacity-80">
                    ({skill.professionals_count})
                  </span>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            Nenhuma habilidade encontrada para os profissionais deste salão.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
