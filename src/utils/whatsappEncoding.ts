/**
 * Utilitários para encoding de mensagens WhatsApp
 */

import { Appointment } from '@/hooks/useAppointments'

// Mapeamento de categorias para ícones
const CATEGORY_ICONS: Record<string, string> = {
  'Cabelos Femininos': '👩‍🦰',
  'Cabelos Masculinos': '👨‍🦱',
  'Maquiagem': '💄',
  'Unhas': '💅',
  'Barba': '🧔',
  'Estética Facial': '✨',
  'Estética Corporal': '💪',
  'Sobrancelhas': '👁️',
  'Tatuagem': '🎨',
  'Depilação': '🪒',
  'Cuidados com as Unhas': '💅',
  'Cuidados com a Barba': '🧔',
  'Sobrancelhas / Cílios': '👁️',
  'Piercing': '💎'
}

// Função para obter ícone da categoria
export const getCategoryIcon = (categoryName: string): string => {
  return CATEGORY_ICONS[categoryName] || '💅' // Fallback para unhas se não encontrar
}

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
 * Formata dados do agendamento para template WhatsApp
 * @param appointment - Dados do agendamento
 * @returns Objeto com dados formatados
 */
export const formatAppointmentData = (appointment: Appointment) => {
  if (!appointment) return {}

  // Formatar data para português brasileiro
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Formatar hora
  const formatTime = (timeString: string) => {
    return timeString.substring(0, 5) // HH:MM
  }

  // Formatar valor
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  // Formatar endereço do profissional
  const formatProfessionalAddress = () => {
    const prof = appointment.professional
    if (!prof) return 'Endereço não informado'
    
    const parts = []
    if (prof.logradouro) parts.push(prof.logradouro)
    if (prof.numero) parts.push(prof.numero)
    if (prof.complemento) parts.push(prof.complemento)
    if (prof.bairro) parts.push(prof.bairro)
    if (prof.cidade) parts.push(prof.cidade)
    if (prof.uf) parts.push(prof.uf)
    
    return parts.length > 0 ? parts.join(', ') : 'Endereço não informado'
  }

  return {
    CLIENTE: appointment.client?.name || 'Cliente',
    PROFISSIONAL: appointment.professional?.name || 'Profissional',
    SERVICO: appointment.service?.name || 'Serviço',
    SERVICO_ICONE: getCategoryIcon(appointment.service?.category || ''),
    DATA: formatDate(appointment.date),
    HORA: formatTime(appointment.start_time),
    DURACAO: appointment.duration_minutes || appointment.service?.duration || 60,
    VALOR: formatPrice(appointment.price || appointment.service?.price || 0),
    ENDERECO: formatProfessionalAddress()
  }
}

/**
 * Substitui placeholders em template com dados do agendamento
 * @param template - Template com placeholders
 * @param data - Dados formatados do agendamento
 * @returns Template com placeholders substituídos
 */
export const replaceTemplatePlaceholders = (template: string, data: Record<string, string | number>) => {
  let result = template

  const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `[${key}]`
    const regex = new RegExp(escapeRegExp(placeholder), 'g')
    result = result.replace(regex, String(value))
  })

  return result
}

/**
 * Valida número de telefone brasileiro
 * @param phone - Número de telefone
 * @returns true se válido, false caso contrário
 */
export const validateBrazilianPhone = (phone: string): boolean => {
  if (!phone) return false
  
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Verifica se tem 10 ou 11 dígitos (com DDD)
  return cleanPhone.length === 10 || cleanPhone.length === 11
}

/**
 * Formata número de telefone para WhatsApp (E.164)
 * @param phone - Número de telefone
 * @returns Número formatado para WhatsApp
 */
export const formatPhoneForWhatsApp = (phone: string): string => {
  if (!phone) return ''
  
  // Remove caracteres não numéricos
  const cleanPhone = phone.replace(/\D/g, '')
  
  // Se não tem DDD, adiciona 11 (São Paulo)
  if (cleanPhone.length === 8 || cleanPhone.length === 9) {
    return `5511${cleanPhone}`
  }
  
  // Se tem DDD mas não tem código do país
  if (cleanPhone.length === 10 || cleanPhone.length === 11) {
    return `55${cleanPhone}`
  }
  
  // Se já tem código do país
  if (cleanPhone.startsWith('55')) {
    return cleanPhone
  }
  
  return cleanPhone
}

/**
 * Gera URL do WhatsApp para agendamento
 * @param phone - Número de telefone do cliente
 * @param message - Mensagem formatada
 * @returns URL do WhatsApp
 */
export const generateWhatsAppUrl = (phone: string, message: string): string => {
  const formattedPhone = formatPhoneForWhatsApp(phone)
  const encodedMessage = encodeMessageForWhatsAppUrl(message)
  
  // Detectar se é mobile ou desktop
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  
  if (isMobile) {
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
  } else {
    return `https://web.whatsapp.com/send?phone=${formattedPhone}&text=${encodedMessage}`
  }
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