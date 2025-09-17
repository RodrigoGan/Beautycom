/**
 * Utilitários para encoding de mensagens WhatsApp
 */

/**
 * Corrige a exibição de emojis no editor
 * @param text - Texto para corrigir
 * @returns Texto com emojis corrigidos
 */
export const fixEmojiDisplay = (text: string): string => {
  if (!text) return text
  
  // Apenas normalizar para NFC, sem processamento adicional
  return text.normalize('NFC')
}

/**
 * Codifica mensagem para URL do WhatsApp
 * @param message - Mensagem para codificar
 * @returns Mensagem codificada para URL
 */
export const encodeMessageForWhatsAppUrl = (message: string): string => {
  // Codificação simples e direta para WhatsApp
  return encodeURIComponent(message)
}

/**
 * Testa URL do WhatsApp
 * @param message - Mensagem para testar
 */
export const testWhatsAppUrl = (message: string) => {
  const encoded = encodeMessageForWhatsAppUrl(message)
  const testUrl = `https://wa.me/5511999999999?text=${encoded}`
  const decoded = decodeURIComponent(encoded)
  
  console.log('🧪 Teste de URL WhatsApp:')
  console.log('Mensagem original:', message)
  console.log('URL de teste:', testUrl)
  console.log('Decodificando URL:', decoded)
  
  return testUrl
}