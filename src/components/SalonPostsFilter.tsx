import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Search, X, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

interface Professional {
  id: string
  name: string
  nickname: string
  profile_photo?: string
}

interface Category {
  id: string
  name: string
}

interface SalonPostsFilterProps {
  salonId: string
  onFilterChange: (filters: {
    professionals: string[]
    searchText: string
    categories: string[]
  }) => void
  className?: string
}

export const SalonPostsFilter: React.FC<SalonPostsFilterProps> = ({
  salonId,
  onFilterChange,
  className
}) => {
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  
  // Estados dos filtros
  const [selectedProfessionals, setSelectedProfessionals] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  
  // Estados do carrossel
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const carouselRef = useRef<HTMLDivElement>(null)

  // Buscar profissionais e categorias
  useEffect(() => {
    const fetchFilterData = async () => {
      if (!salonId) return

      try {
        setLoading(true)

        // Buscar profissionais do salão
        const { data: professionalsData } = await supabase
          .from('salon_professionals')
          .select(`
            professional_id,
            professional:users!salon_professionals_professional_id_fkey(
              id,
              name,
              nickname,
              profile_photo
            )
          `)
          .eq('salon_id', salonId)
          .eq('status', 'accepted')

        // Buscar categorias dos posts dos profissionais
        const professionalIds = professionalsData?.map(p => p.professional_id) || []
        const { data: categoriesData } = await supabase
          .from('posts')
          .select('category_id, category:categories!posts_category_id_fkey(id, name)')
          .in('user_id', professionalIds)
          .eq('is_active', true)

        // Processar dados
        const processedProfessionals = (professionalsData || [])
          .map(p => p.professional)
          .filter(Boolean) as Professional[]

        const uniqueCategories = (categoriesData || [])
          .map(p => p.category)
          .filter(Boolean)
          .filter((cat, index, arr) => arr.findIndex(c => c.id === cat.id) === index) as Category[]

        setProfessionals(processedProfessionals)
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Erro ao buscar dados do filtro:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFilterData()
  }, [salonId])

  // Verificar scroll do carrossel
  useEffect(() => {
    const checkScroll = () => {
      if (!carouselRef.current) return
      
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }

    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [professionals])

  // Scroll do carrossel
  const scrollCarousel = (direction: 'left' | 'right') => {
    if (!carouselRef.current) return
    
    const scrollAmount = 200
    const newScrollLeft = carouselRef.current.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount)
    
    carouselRef.current.scrollTo({
      left: newScrollLeft,
      behavior: 'smooth'
    })
  }

  // Toggle profissional
  const toggleProfessional = (professionalId: string) => {
    setSelectedProfessionals(prev => 
      prev.includes(professionalId)
        ? prev.filter(id => id !== professionalId)
        : [...prev, professionalId]
    )
  }

  // Toggle categoria
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  // Limpar filtros
  const clearFilters = () => {
    setSelectedProfessionals([])
    setSearchText('')
    setSelectedCategories([])
  }

  // Notificar mudanças nos filtros
  useEffect(() => {
    onFilterChange({
      professionals: selectedProfessionals,
      searchText,
      categories: selectedCategories
    })
  }, [selectedProfessionals, searchText, selectedCategories, onFilterChange])

  if (loading) {
    return (
      <Card className={cn("p-4", className)}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-8 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    )
  }

  const hasActiveFilters = selectedProfessionals.length > 0 || searchText || selectedCategories.length > 0

  return (
    <div className={cn("space-y-4", className)}>
      {/* Buscador de texto */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por texto ou @profissional..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="pl-10"
        />
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Carrossel de profissionais */}
      {professionals.length > 0 && (
        <div className="relative group">
          {/* Botões de navegação - Desktop */}
          <div className="hidden md:block">
            {canScrollLeft && (
              <Button
                variant="outline"
                size="icon"
                className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={() => scrollCarousel('left')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            {canScrollRight && (
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-background/80 backdrop-blur-sm"
                onClick={() => scrollCarousel('right')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Carrossel */}
          <div
            ref={carouselRef}
            className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
            onScroll={() => {
              if (carouselRef.current) {
                const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current
                setCanScrollLeft(scrollLeft > 0)
                setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
              }
            }}
          >
            {professionals.map((professional) => {
              const isSelected = selectedProfessionals.includes(professional.id)
              return (
                <div
                  key={professional.id}
                  className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer"
                  onClick={() => toggleProfessional(professional.id)}
                >
                  <Avatar className={cn(
                    "h-12 w-12 transition-all duration-200",
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}>
                    <AvatarImage src={professional.profile_photo} />
                    <AvatarFallback className="text-sm font-medium">
                      {professional.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className={cn(
                    "text-xs text-center max-w-16 truncate",
                    isSelected ? "text-primary font-medium" : "text-muted-foreground"
                  )}>
                    {professional.name}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Filtro por categoria */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const isSelected = selectedCategories.includes(category.id)
            return (
              <Badge
                key={category.id}
                variant={isSelected ? "default" : "secondary"}
                className={cn(
                  "cursor-pointer transition-colors",
                  isSelected && "bg-primary text-primary-foreground"
                )}
                onClick={() => toggleCategory(category.id)}
              >
                {category.name}
              </Badge>
            )
          })}
        </div>
      )}

      {/* Indicador de filtros ativos */}
      {hasActiveFilters && (
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
            {selectedProfessionals.length > 0 && (
              <span>{selectedProfessionals.length} profissional{selectedProfessionals.length > 1 ? 'is' : ''}</span>
            )}
            {searchText && (
              <span>• Busca: "{searchText}"</span>
            )}
            {selectedCategories.length > 0 && (
              <span>• {selectedCategories.length} categoria{selectedCategories.length > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
