import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MessagePreview } from '@/components/MessagePreview'
import {
  Send,
  X,
  MessageSquare,
  Clock,
  AlertCircle,
  Copy
} from 'lucide-react'
import { Appointment } from '@/hooks/useAppointments'
import {
  formatAppointmentData,
  replaceTemplatePlaceholders,
  validateBrazilianPhone,
  generateWhatsAppUrl
} from '@/utils/whatsappEncoding'
import { getTemplateById } from '@/data/whatsappTemplates'
import { getTemplateByIdPreferDb } from '@/utils/whatsappTemplatesDb'
import { useToast } from '@/hooks/use-toast'

interface WhatsAppTemplateSelectorProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onSend?: () => void
}

const appointmentTemplates = [
  {
    id: 'agendamento_confirmacao',
    name: 'Confirmação',
    description: 'Dados completos do agendamento',
    icon: MessageSquare,
    color: 'bg-green-500'
  },
  {
    id: 'agendamento_lembrete',
    name: 'Lembrete',
    description: 'Lembrar que profissional está aguardando',
    icon: Clock,
    color: 'bg-blue-500'
  },
  {
    id: 'agendamento_pontualidade',
    name: 'Pontualidade',
    description: 'Solicitar chegada 10 minutos antes',
    icon: AlertCircle,
    color: 'bg-orange-500'
  }
]

export const WhatsAppTemplateSelector: React.FC<WhatsAppTemplateSelectorProps> = ({
  isOpen,
  onClose,
  appointment,
  onSend
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Resetar estados apenas quando o modal abre pela primeira vez
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 Resetando estados do modal - primeira abertura')
      setSelectedTemplate(null)
      setMessage('')
    }
  }, [isOpen]) // Removido 'appointment' da dependência

  // Debug: Log quando message muda
  useEffect(() => {
    console.log('📝 Message state mudou:', message)
  }, [message])

  // Debug: Log quando selectedTemplate muda
  useEffect(() => {
    console.log('🎯 SelectedTemplate state mudou:', selectedTemplate)
  }, [selectedTemplate])

  // Carregar template quando selecionado
  const handleTemplateSelect = async (templateId: string, e?: React.MouseEvent) => {
    // Evita que o clique atual borbulhe e acione elementos renderizados após o setState
    e?.preventDefault()
    e?.stopPropagation()
    if (!appointment) {
      console.error('❌ Appointment não encontrado!')
      return
    }

    console.log('🔍 Selecionando template:', templateId)
    console.log('📋 Appointment:', appointment)

    // Buscar template no banco com fallback local
    const template = await getTemplateByIdPreferDb(templateId)
    if (!template) {
      console.error('❌ Template não encontrado!')
      setMessage('Erro: Template não encontrado.')
      return
    }

    console.log('✅ Template encontrado:', template)

    const formattedData = formatAppointmentData(appointment)
    console.log('📊 Dados formatados:', formattedData)

    const finalMessage = replaceTemplatePlaceholders(template.content, formattedData)
    console.log('💬 Mensagem final:', finalMessage)

    // Adia a mudança de estado para o próximo frame, evitando reuso do mesmo clique
    requestAnimationFrame(() => {
      setSelectedTemplate(templateId)
      setMessage(finalMessage || 'Erro ao processar template.')
    })
  }

  const handleSendMessage = () => {
    if (!appointment?.client?.phone) {
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: 'O cliente não possui um número de telefone cadastrado.',
        variant: 'destructive'
      })
      return
    }

    if (!validateBrazilianPhone(appointment.client.phone)) {
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: 'O número de telefone do cliente é inválido.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)
    try {
      const whatsappUrl = generateWhatsAppUrl(appointment.client.phone, message)
      window.open(whatsappUrl, '_blank')
      toast({
        title: 'WhatsApp aberto!',
        description: 'Verifique a nova aba/janela para enviar a mensagem.',
        variant: 'default'
      })
      onSend?.()
      onClose()
    } catch (error) {
      console.error('Erro ao gerar URL do WhatsApp:', error)
      toast({
        title: 'Erro ao abrir WhatsApp',
        description: 'Não foi possível gerar a URL do WhatsApp. Tente novamente.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message)
      toast({
        title: 'Mensagem copiada!',
        description: 'A mensagem foi copiada para a área de transferência.',
        variant: 'success'
      })
    } catch (err) {
      console.error('Erro ao copiar mensagem:', err)
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar a mensagem.',
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    setSelectedTemplate(null)
    setMessage('')
    onClose()
  }

  if (!appointment) return null

  const clientPhone = appointment.client?.phone
  const isPhoneValid = clientPhone ? validateBrazilianPhone(clientPhone) : false

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose() }}>
      <DialogContent className="sm:max-w-[600px] max-w-[calc(100vw-16px)] mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden my-6 sm:my-0 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5 text-purple-600" />
            Enviar Mensagem WhatsApp
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Escolha um template e envie uma mensagem para o cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Seleção de Template */}
          {!selectedTemplate && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Escolha o tipo de mensagem:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {appointmentTemplates.map((template) => {
                  const IconComponent = template.icon
                  return (
                    <Card 
                      key={template.id}
                      className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-purple-300"
                      onClick={(e) => handleTemplateSelect(template.id, e)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${template.color} text-white`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <CardDescription className="text-sm">
                              {template.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Preview da Mensagem */}
          {selectedTemplate && (
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-semibold">Preview da Mensagem</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { console.log('↩️ Trocar Template (reset)'); setSelectedTemplate(null) }}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4 mr-2" />
                  Trocar Template
                </Button>
              </div>

              <MessagePreview
                key={selectedTemplate || 'preview'}
                message={message}
                onMessageChange={setMessage}
                isEditable={true}
                maxLength={1000}
              />
            </div>
          )}

          {/* Informações do Cliente */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2 text-gray-700">
                <MessageSquare className="h-4 w-4" /> Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <p><strong>Nome:</strong> {appointment.client?.name}</p>
              <p><strong>Telefone:</strong> {clientPhone || 'Não informado'} {!isPhoneValid && clientPhone && <Badge variant="destructive">Inválido</Badge>}</p>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={handleClose}
            className="w-full sm:w-auto order-3 sm:order-1"
          >
            <X className="h-4 w-4 mr-2" /> Fechar
          </Button>
          {selectedTemplate && (
            <>
              <Button
                variant="secondary"
                onClick={handleCopyMessage}
                disabled={isLoading || !message}
                className="w-full sm:w-auto order-2"
              >
                <Copy className="h-4 w-4 mr-2" /> Copiar Mensagem
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={isLoading || !clientPhone || !isPhoneValid || !message}
                className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg order-1 sm:order-3"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" /> Enviar pelo WhatsApp
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
