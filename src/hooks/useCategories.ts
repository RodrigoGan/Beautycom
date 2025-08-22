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
  created_at: string
  updated_at: string
}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (fetchError) {
        console.error('❌ Erro ao buscar categorias:', fetchError.message)
        setError(fetchError.message)
        return
      }

      setCategories(data || [])
    } catch (err) {
      console.error('❌ Erro geral ao buscar categorias:', err)
      setError('Erro ao buscar categorias')
    } finally {
      setLoading(false)
    }
  }

  // Função para mapear UUIDs para nomes de categorias
  const getCategoryNames = useCallback((categoryIds: string[]): string[] => {
    if (!categoryIds || categoryIds.length === 0) return []
    
    return categoryIds
      .map(id => {
        const category = categories.find(cat => cat.id === id)
        return category?.name || id
      })
      .filter(name => name !== '')
  }, [categories])

  // Função para buscar categoria por ID
  const getCategoryById = (id: string): Category | undefined => {
    return categories.find(cat => cat.id === id)
  }

  // Função para buscar categorias por IDs
  const getCategoriesByIds = (ids: string[]): Category[] => {
    return categories.filter(cat => ids.includes(cat.id))
  }

  useEffect(() => {
    fetchCategories()
  }, []) // Dependências vazias - executar apenas uma vez

  return {
    categories,
    loading,
    error,
    fetchCategories,
    getCategoryNames,
    getCategoryById,
    getCategoriesByIds
  }
} 