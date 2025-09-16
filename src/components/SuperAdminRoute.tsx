import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSuperAdminAccess } from '@/hooks/useSuperAdminAccess'
import { useAdminKeyVerification } from '@/hooks/useAdminKeyVerification'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Alert, AlertDescription } from './ui/alert'
import { Loader2, Shield, Key } from 'lucide-react'

interface SuperAdminRouteProps {
  children: React.ReactNode
}

/**
 * Componente de proteção de rota para funcionalidades de super admin
 * Implementa dupla verificação: super admin + palavra-chave
 */
export const SuperAdminRoute: React.FC<SuperAdminRouteProps> = ({ children }) => {
  const { isSuperAdmin, user } = useSuperAdminAccess()
  const { 
    isKeyVerified, 
    isVerifying, 
    error, 
    verifyAdminKey, 
    clearVerification,
    checkSessionVerification 
  } = useAdminKeyVerification()
  
  const [adminKey, setAdminKey] = useState('')
  
  // Verificar se já foi verificado nesta sessão
  useEffect(() => {
    checkSessionVerification()
  }, [checkSessionVerification])
  
  // Se não é super admin, redirecionar
  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <CardTitle className="text-xl text-red-600">Acesso Negado</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta área administrativa.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full">
              <Navigate to="/" replace />
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Se é super admin mas não verificou a palavra-chave
  if (!isKeyVerified) {
    const handleKeySubmit = async (e: React.FormEvent) => {
      e.preventDefault()
      if (adminKey.trim()) {
        await verifyAdminKey(adminKey.trim())
      }
    }
    
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Key className="h-12 w-12 mx-auto text-blue-500 mb-4" />
            <CardTitle className="text-xl">Verificação de Segurança</CardTitle>
            <CardDescription>
              Digite sua palavra-chave de administrador para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleKeySubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminKey">Palavra-chave</Label>
                <Input
                  id="adminKey"
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  placeholder="Digite sua palavra-chave"
                  disabled={isVerifying}
                  required
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isVerifying || !adminKey.trim()}
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Verificando...
                  </>
                ) : (
                  'Verificar'
                )}
              </Button>
            </form>
            
            <div className="mt-4 text-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.history.back()}
              >
                Voltar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  // Se passou em todas as verificações, renderizar o conteúdo
  return <>{children}</>
}
