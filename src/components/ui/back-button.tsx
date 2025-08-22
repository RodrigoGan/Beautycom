import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface BackButtonProps {
  className?: string
  variant?: "default" | "ghost" | "outline"
  size?: "sm" | "default" | "lg"
  children?: React.ReactNode
}

export function BackButton({ 
  className = "", 
  variant = "ghost", 
  size = "default",
  children = "Voltar"
}: BackButtonProps) {
  const navigate = useNavigate()

  const handleBack = () => {
    // Volta para a página anterior
    navigate(-1)
    
    // Scroll para o topo após um pequeno delay
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }, 100)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleBack}
      className={`group transition-all duration-300 hover:scale-105 ${className}`}
    >
      <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
      {children}
    </Button>
  )
} 