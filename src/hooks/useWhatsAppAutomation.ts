import { useState, useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { 
  initializeWhatsApp, 
  checkWhatsAppStatus, 
  sendWhatsAppCampaign, 
  stopWhatsAppCampaign, 
  restartWhatsApp,
  WhatsAppMessage,
  WhatsAppCampaignResponse
} from '@/api/whatsapp'

export interface AutomationStatus {
  isInitialized: boolean
  isLoggedIn: boolean
  isSending: boolean
  progress: {
    current: number
    total: number
    currentMessage?: WhatsAppMessage
  }
}

export const useWhatsAppAutomation = () => {
  const [status, setStatus] = useState<AutomationStatus>({
    isInitialized: false,
    isLoggedIn: false,
    isSending: false,
    progress: { current: 0, total: 0 }
  })

  const [lastResult, setLastResult] = useState<WhatsAppCampaignResponse | null>(null)

  /**
   * Inicializa a automação WhatsApp
   */
  const initialize = useCallback(async () => {
    try {
      setStatus(prev => ({ ...prev, isInitialized: false }))
      
      toast({
        title: "Inicializando WhatsApp...",
        description: "Conectando com o servidor real...",
        variant: "default"
      })

      const result = await initializeWhatsApp()
      
      if (result.success) {
        setStatus(prev => ({ 
          ...prev, 
          isInitialized: true, 
          isLoggedIn: false // Será verificado separadamente
        }))

        toast({
          title: "WhatsApp Inicializado!",
          description: "Aguarde o login no navegador que abriu.",
          variant: "default"
        })
        return true
      } else {
        toast({
          title: "Erro ao Inicializar",
          description: result.message,
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Erro ao inicializar WhatsApp:', error)
      toast({
        title: "Erro ao Inicializar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
      return false
    }
  }, [])

  /**
   * Verifica status do login
   */
  const checkLoginStatus = useCallback(async () => {
    if (!status.isInitialized) return false

    try {
      const result = await checkWhatsAppStatus()
      setStatus(prev => ({ ...prev, isLoggedIn: result.isLoggedIn }))
      return result.isLoggedIn
    } catch (error) {
      console.error('Erro ao verificar login:', error)
      return false
    }
  }, [status.isInitialized])

  /**
   * Envia mensagens em lote
   */
  const sendBulkMessages = useCallback(async (
    messages: WhatsAppMessage[],
    options: {
      delayBetweenMessages?: number
      maxRetries?: number
    } = {}
  ): Promise<WhatsAppCampaignResponse> => {
    if (!status.isInitialized) {
      throw new Error('WhatsApp não foi inicializado')
    }

    if (!status.isLoggedIn) {
      throw new Error('WhatsApp não está logado')
    }

    try {
      setStatus(prev => ({ 
        ...prev, 
        isSending: true,
        progress: { current: 0, total: messages.length }
      }))

      toast({
        title: "Iniciando Campanha",
        description: `Enviando ${messages.length} mensagens...`,
        variant: "default"
      })

      const result = await sendWhatsAppCampaign({
        messages,
        options
      })

      setLastResult(result)
      setStatus(prev => ({ 
        ...prev, 
        isSending: false,
        progress: { current: 0, total: 0 }
      }))

      // Toast de resultado
      if (result.success) {
        toast({
          title: "Campanha Concluída!",
          description: `${result.sentCount} mensagens enviadas com sucesso`,
          variant: "default"
        })
      } else {
        toast({
          title: "Campanha Finalizada",
          description: `${result.sentCount} enviadas, ${result.failedCount} falharam`,
          variant: "destructive"
        })
      }

      return result
    } catch (error) {
      setStatus(prev => ({ 
        ...prev, 
        isSending: false,
        progress: { current: 0, total: 0 }
      }))

      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido"
      
      toast({
        title: "Erro na Campanha",
        description: errorMessage,
        variant: "destructive"
      })

      throw error
    }
  }, [status.isInitialized, status.isLoggedIn])

  /**
   * Para a campanha atual
   */
  const stopCampaign = useCallback(async () => {
    try {
      // Simular parada de campanha
      setStatus(prev => ({ 
        ...prev, 
        isInitialized: false,
        isLoggedIn: false,
        isSending: false,
        progress: { current: 0, total: 0 }
      }))

      toast({
        title: "Campanha Interrompida",
        description: "WhatsApp foi desconectado (modo simulado)",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao parar campanha:', error)
    }
  }, [])

  /**
   * Reinicia a sessão
   */
  const restart = useCallback(async () => {
    try {
      // Simular reinicialização
      setStatus(prev => ({ 
        ...prev, 
        isInitialized: true,
        isLoggedIn: true,
        isSending: false,
        progress: { current: 0, total: 0 }
      }))

      toast({
        title: "WhatsApp Reiniciado",
        description: "Modo simulado ativo",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao reiniciar WhatsApp:', error)
      toast({
        title: "Erro ao Reiniciar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    }
  }, [])

  /**
   * Fecha a conexão
   */
  const close = useCallback(async () => {
    try {
      // Simular fechamento
      setStatus(prev => ({ 
        ...prev, 
        isInitialized: false,
        isLoggedIn: false,
        isSending: false,
        progress: { current: 0, total: 0 }
      }))
    } catch (error) {
      console.error('Erro ao fechar WhatsApp:', error)
    }
  }, [])

  return {
    status,
    lastResult,
    initialize,
    checkLoginStatus,
    sendBulkMessages,
    stopCampaign,
    restart,
    close
  }
}
