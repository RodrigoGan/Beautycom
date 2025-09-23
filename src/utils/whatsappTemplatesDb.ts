import { supabase } from '@/lib/supabase'
import { WhatsAppTemplate, getTemplateById } from '@/data/whatsappTemplates'

export interface DbWhatsAppTemplate {
  id: string
  name: string
  description: string | null
  category: 'profissional' | 'usuario' | 'geral'
  variables: string[] | null
  content: string
  use_case: string | null
  created_at?: string
  updated_at?: string
}

/**
 * Busca um template no banco por ID. Se falhar ou não existir, faz fallback para o template local.
 */
export const getTemplateByIdPreferDb = async (id: string): Promise<WhatsAppTemplate | null> => {
  try {
    const { data, error } = await supabase
      .from('whatsapp_templates')
      .select('*')
      .eq('id', id)
      .maybeSingle<DbWhatsAppTemplate>()

    if (error) {
      console.warn('getTemplateByIdPreferDb - erro ao buscar no banco:', error)
    }

    if (data) {
      // Converter para WhatsAppTemplate (mantendo compatibilidade)
      const tpl: WhatsAppTemplate = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        category: data.category,
        variables: (data.variables || []) as string[],
        content: data.content,
        useCase: data.use_case || ''
      }
      return tpl
    }
  } catch (e) {
    console.warn('getTemplateByIdPreferDb - exceção:', e)
  }

  // Fallback local
  const local = getTemplateById(id)
  return local || null
}


