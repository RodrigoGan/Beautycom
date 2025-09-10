import React from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Header } from '@/components/Header'

const TestPage = () => {
  console.log('🚀 TestPage component iniciando renderização...')
  
  const { user, loading } = useAuthContext()
  
  console.log('🚀 TestPage - user:', user)
  console.log('🚀 TestPage - loading:', loading)
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        <Header />
        <div className="pt-20 pb-8 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="pt-20 pb-8 container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Página de Teste</h1>
          <p className="text-lg mb-4">Esta é uma página de teste para verificar se o roteamento está funcionando.</p>
          
          {user ? (
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">Usuário Logado</h2>
              <p><strong>Nome:</strong> {user.name || 'N/A'}</p>
              <p><strong>Email:</strong> {user.email || 'N/A'}</p>
              <p><strong>ID:</strong> {user.id || 'N/A'}</p>
              <p><strong>Tipo:</strong> {user.user_type || 'N/A'}</p>
            </div>
          ) : (
            <div className="bg-yellow-100 p-6 rounded-lg shadow-lg max-w-md mx-auto">
              <h2 className="text-xl font-semibold mb-2">Nenhum Usuário Logado</h2>
              <p>Você não está logado no sistema.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TestPage

