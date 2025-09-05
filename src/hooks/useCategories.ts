import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface Category {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  parent_id?: string
  level: number
  is_active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Carregar categorias
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true })

      if (fetchError) throw fetchError

      setCategories(data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }, [])

  // Carregar categorias quando o hook for inicializado
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Função para obter nomes das categorias por IDs
  const getCategoryNames = useCallback((categoryIds: string[]) => {
    if (!categoryIds || categoryIds.length === 0) return []
    
    return categoryIds
      .map(id => categories.find(cat => cat.id === id)?.name)
      .filter(name => name) // Remove undefined values
  }, [categories])

  return {
    categories,
    loading,
    error,
    reload: loadCategories,
    getCategoryNames
  }
} 