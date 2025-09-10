// Categorias de beleza reutilizáveis em todo o app
export const BEAUTY_CATEGORIES = [
  "Cabelos Femininos",
  "Cabelos Masculinos", 
  "Cuidados com as Unhas",
  "Cuidados com a Barba",
  "Estética Corporal",
  "Estética Facial",
  "Tatuagem",
  "Piercing",
  "Maquiagem",
  "Sobrancelhas/Cílios"
] as const

export type BeautyCategory = typeof BEAUTY_CATEGORIES[number]

// Mapeamento de categorias para ícones (opcional)
export const CATEGORY_ICONS: Record<BeautyCategory, string> = {
  "Cabelos Femininos": "👩‍🦰",
  "Cabelos Masculinos": "👨‍🦱", 
  "Cuidados com as Unhas": "💅",
  "Cuidados com a Barba": "🧔",
  "Estética Corporal": "💪",
  "Estética Facial": "✨",
  "Tatuagem": "🎨",
  "Piercing": "💎",
  "Maquiagem": "💄",
  "Sobrancelhas/Cílios": "👁️"
} 