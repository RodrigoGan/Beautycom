import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  message?: string
  size?: 'sm' | 'md' | 'lg'
}

export const LoadingSpinner = ({ 
  message = "Carregando...", 
  size = 'md' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
        <p className="text-sm text-gray-600 font-medium">{message}</p>
      </div>
    </div>
  )
}

// Componente para loading inline (menor)
export const InlineLoadingSpinner = ({ 
  message = "Carregando...", 
  size = 'sm' 
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className="flex items-center justify-center space-x-2">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-600`} />
      <span className="text-sm text-gray-600">{message}</span>
    </div>
  )
}
