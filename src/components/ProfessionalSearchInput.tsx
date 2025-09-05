import React, { useState, useEffect, useRef } from 'react'
import { Input } from './ui/input'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { User, Search, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

interface Professional {
  id: string
  name: string
  profile_photo?: string
  salon_id: string | null
}

interface ProfessionalSearchInputProps {
  onProfessionalSelect: (professional: Professional) => void
  selectedProfessional?: Professional | null
  placeholder?: string
  disabled?: boolean
}

export const ProfessionalSearchInput: React.FC<ProfessionalSearchInputProps> = ({
  onProfessionalSelect,
  selectedProfessional,
  placeholder = "Buscar profissional...",
  disabled = false
}) => {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Buscar profissionais com agenda ativa
  const searchProfessionals = async (term: string) => {
    if (!term || term.length < 2) {
      setProfessionals([])
      return
    }

    try {
      setLoading(true)
      
      // Primeiro tentar a função do banco
      const { data: functionResults, error: functionError } = await supabase
        .rpc('get_active_professionals')

      if (functionError) {
        console.warn('⚠️ Função get_active_professionals falhou, usando busca direta:', functionError)
      }

      let searchResults: Professional[] = []

      if (functionResults && functionResults.length > 0) {
        // Filtrar resultados da função
        searchResults = functionResults
          .filter(prof => 
            prof.name.toLowerCase().includes(term.toLowerCase())
          )
          .map(prof => ({
            id: prof.id,
            name: prof.name,
            profile_photo: prof.profile_photo,
            salon_id: prof.salon_id
          }))
      } else {
        // Fallback: busca direta na tabela users
        const { data: directResults, error: directError } = await supabase
          .from('users')
          .select('id, name, profile_photo')
          .eq('user_type', 'profissional')
          .eq('agenda_enabled', true)
          .ilike('name', `%${term}%`)
          .order('name')
          .limit(10)

        if (directError) {
          console.error('❌ Erro na busca direta:', directError)
          throw directError
        }

        searchResults = directResults?.map(prof => ({
          id: prof.id,
          name: prof.name,
          profile_photo: prof.profile_photo,
          salon_id: null // Profissionais independentes
        })) || []
      }

      setProfessionals(searchResults)
      
    } catch (error) {
      console.error('❌ Erro ao buscar profissionais:', error)
      toast({
        title: 'Erro ao buscar profissionais',
        description: 'Não foi possível carregar a lista de profissionais.',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchProfessionals(searchTerm)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [searchTerm])

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navegação com teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || professionals.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < professionals.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : professionals.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < professionals.length) {
          handleProfessionalSelect(professionals[selectedIndex])
        }
        break
      case 'Escape':
        setShowDropdown(false)
        setSelectedIndex(-1)
        break
    }
  }

  const handleProfessionalSelect = (professional: Professional) => {
    onProfessionalSelect(professional)
    setSearchTerm(professional.name)
    setShowDropdown(false)
    setSelectedIndex(-1)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowDropdown(true)
    setSelectedIndex(-1)
    
    // Se limpar o campo, limpar seleção
    if (!value) {
      onProfessionalSelect(null)
    }
  }

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowDropdown(true)
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Dropdown de resultados */}
      {showDropdown && (professionals.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {loading ? (
            <div className="p-3 text-center">
              <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Buscando profissionais...</p>
            </div>
          ) : professionals.length === 0 ? (
            <div className="p-3 text-center">
              <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhum profissional encontrado
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tente outro termo de busca
              </p>
            </div>
          ) : (
            <div className="py-1">
              {professionals.map((professional, index) => (
                <div
                  key={professional.id}
                  className={`px-3 py-2 cursor-pointer flex items-center gap-3 hover:bg-gray-50 ${
                    index === selectedIndex ? 'bg-gray-50' : ''
                  }`}
                  onClick={() => handleProfessionalSelect(professional)}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={professional.profile_photo} alt={professional.name} />
                    <AvatarFallback className="text-xs">
                      {professional.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {professional.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {professional.salon_id ? 'Profissional de Salão' : 'Profissional Independente'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profissional selecionado */}
      {selectedProfessional && (
        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={selectedProfessional.profile_photo} alt={selectedProfessional.name} />
              <AvatarFallback className="text-xs">
                {selectedProfessional.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-green-800">
              {selectedProfessional.name}
            </span>
            <span className="text-xs text-green-600">
              {selectedProfessional.salon_id ? 'Salão' : 'Independente'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}


