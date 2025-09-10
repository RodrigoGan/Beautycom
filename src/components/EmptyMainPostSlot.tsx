import { Star } from 'lucide-react'

interface EmptyMainPostSlotProps {
  position: number
  className?: string
}

export const EmptyMainPostSlot = ({ position, className = '' }: EmptyMainPostSlotProps) => {
  const phrases = [
    "Escolha um post principal para aparecer aqui",
    "Destaque seu melhor trabalho nesta posição",
    "Selecione um post para ocupar este espaço"
  ]

  return (
    <div 
      className={`
        aspect-square bg-gradient-card rounded-lg overflow-hidden 
        border-2 border-yellow-400/30 border-dashed
        flex flex-col items-center justify-center
        group relative cursor-pointer
        hover:border-yellow-400/50 transition-all duration-300
        ${className}
      `}
    >
      {/* Estrela vazia no centro */}
      <div className="flex flex-col items-center gap-2 text-center p-4">
        <Star className="h-8 w-8 text-yellow-400/60 group-hover:text-yellow-400 transition-colors duration-300" />
        <p className="text-xs text-muted-foreground font-medium leading-tight">
          {phrases[position - 1] || phrases[0]}
        </p>
      </div>

      {/* Indicador de posição sutil */}
      <div className="absolute top-2 left-2 w-6 h-6 bg-yellow-400/20 rounded-full flex items-center justify-center">
        <span className="text-xs font-bold text-yellow-600">{position}</span>
      </div>
    </div>
  )
}
