// API para gerenciar automação WhatsApp no backend
// Este arquivo será usado para chamadas da API, não para executar Puppeteer

export interface WhatsAppMessage {
  phone: string
  message: string
  professionalId: string
  professionalName: string
}

export interface WhatsAppCampaignRequest {
  messages: WhatsAppMessage[]
  options?: {
    delayBetweenMessages?: number
    maxRetries?: number
  }
}

export interface WhatsAppCampaignResponse {
  success: boolean
  sentCount: number
  failedCount: number
  errors: string[]
  details: {
    professionalId: string
    phone: string
    status: 'sent' | 'failed'
    error?: string
  }[]
}

/**
 * Inicializa a automação WhatsApp no backend
 */
const BACKEND_URL = 'http://localhost:3001'

export const initializeWhatsApp = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/whatsapp/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Verifica status do login WhatsApp
 */
export const checkWhatsAppStatus = async (): Promise<{ isLoggedIn: boolean; message: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/whatsapp/status`, {
      method: 'GET',
    })
    
    const result = await response.json()
    return result
  } catch (error) {
    return {
      isLoggedIn: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Envia campanha WhatsApp
 */
export const sendWhatsAppCampaign = async (campaign: WhatsAppCampaignRequest): Promise<WhatsAppCampaignResponse> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/whatsapp/send-campaign`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(campaign),
    })
    
    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      sentCount: 0,
      failedCount: 0,
      errors: [error instanceof Error ? error.message : 'Erro desconhecido'],
      details: []
    }
  }
}

/**
 * Para a campanha atual
 */
export const stopWhatsAppCampaign = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/whatsapp/stop`, {
      method: 'POST',
    })
    
    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}

/**
 * Reinicia a sessão WhatsApp
 */
export const restartWhatsApp = async (): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/whatsapp/restart`, {
      method: 'POST',
    })
    
    const result = await response.json()
    return result
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erro desconhecido'
    }
  }
}
