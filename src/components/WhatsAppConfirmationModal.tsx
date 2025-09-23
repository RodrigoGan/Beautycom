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
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessagePreview } from '@/components/MessagePreview'
import {
  Phone,
  Calendar,
  Clock,
  User,
  Package,
  MapPin,
  Send,
  X,
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
import { useToast } from '@/hooks/use-toast'

interface WhatsAppConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onSend?: () => void
}

export const WhatsAppConfirmationModal: React.FC<WhatsAppConfirmationModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onSend
}) => {
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  // Carregar template e dados quando o modal abrir
  useEffect(() => {
    if (isOpen && appointment) {
      loadTemplateAndData()
    }
  }, [isOpen, appointment])

  const loadTemplateAndData = () => {
    if (!appointment) return

    // Buscar template de agendamento
    const template = getTemplateById('agendamento_confirmacao')
    if (!template) {
      console.error('Template de agendamento não encontrado')
      return
    }

    // Formatar dados do agendamento
    const formattedData = formatAppointmentData(appointment)
    
    // Substituir placeholders no template
    const finalMessage = replaceTemplatePlaceholders(template.content, formattedData)
    
    setMessage(finalMessage)
  }

  const handleSendWhatsApp = async () => {
    if (!appointment?.client?.phone) {
      toast({
        title: 'Telefone não encontrado',
        description: 'O cliente não possui telefone cadastrado.',
        variant: 'destructive'
      })
      return
    }

    if (!validateBrazilianPhone(appointment.client.phone)) {
      toast({
        title: 'Telefone inválido',
        description: 'O número de telefone do cliente não é válido.',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      // Gerar URL do WhatsApp
      const whatsappUrl = generateWhatsAppUrl(appointment.client.phone, message)
      
      // Abrir WhatsApp
      window.open(whatsappUrl, '_blank')
      
      // Log da ação (para métricas)
      console.log('📱 WhatsApp enviado:', {
        appointmentId: appointment.id,
        clientPhone: appointment.client.phone,
        messageLength: message.length,
        timestamp: new Date().toISOString()
      })

      // Callback de sucesso
      if (onSend) {
        onSend()
      }

      toast({
        title: 'WhatsApp aberto',
        description: 'O WhatsApp foi aberto com a mensagem pronta para envio.',
      })

      // Fechar modal após sucesso
      onClose()

    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error)
      toast({
        title: 'Erro ao abrir WhatsApp',
        description: 'Não foi possível abrir o WhatsApp. Tente novamente.',
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
        title: 'Mensagem copiada',
        description: 'A mensagem foi copiada para a área de transferência.',
      })
    } catch (error) {
      console.error('Erro ao copiar mensagem:', error)
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar a mensagem.',
        variant: 'destructive'
      })
    }
  }

  if (!appointment) {
    return null
  }

  const hasValidPhone = appointment.client?.phone && validateBrazilianPhone(appointment.client.phone)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[calc(100vw-16px)] mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden my-6 sm:my-0 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            Enviar Confirmação por WhatsApp
          </DialogTitle>
          <DialogDescription>
            Confirme os dados do agendamento e envie a mensagem para o cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          {/* Resumo do Agendamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Resumo do Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Cliente</p>
                    <p className="text-sm text-gray-600">{appointment.client?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Profissional</p>
                    <p className="text-sm text-gray-600">{appointment.professional?.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Data</p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.date).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm font-medium">Horário</p>
                    <p className="text-sm text-gray-600">
                      {appointment.start_time.substring(0, 5)} - {appointment.end_time.substring(0, 5)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Package className="h-4 w-4 text-indigo-600" />
                  <div>
                    <p className="text-sm font-medium">Serviço</p>
                    <p className="text-sm text-gray-600">{appointment.service?.name}</p>
                  </div>
                </div>

              </div>

              {appointment.salon?.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-red-600" />
                  <div>
                    <p className="text-sm font-medium">Endereço</p>
                    <p className="text-sm text-gray-600">{appointment.salon.address}</p>
                  </div>
                </div>
              )}

              {/* Status do Telefone */}
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Telefone</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-gray-600">
                      {appointment.client?.phone || 'Não informado'}
                    </p>
                    {hasValidPhone ? (
                      <Badge variant="default" className="text-xs">Válido</Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs">Inválido</Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preview da Mensagem */}
          <MessagePreview
            message={message}
            onMessageChange={setMessage}
            isEditable={true}
            maxLength={1000}
          />

          {/* Aviso se telefone inválido */}
          {!hasValidPhone && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">
                {!appointment.client?.phone 
                  ? 'O cliente não possui telefone cadastrado. Não é possível enviar WhatsApp.'
                  : 'O número de telefone do cliente não é válido. Verifique o formato.'
                }
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between pt-4">
          <Button
            variant="outline"
            onClick={handleCopyMessage}
            disabled={!message}
            className="w-full sm:w-auto order-2"
          >
            <Copy className="h-4 w-4 mr-2" />
            Copiar Mensagem
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto order-1">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Fechar
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              disabled={!hasValidPhone || isLoading}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              <Send className="h-4 w-4 mr-2" />
              {isLoading ? 'Abrindo...' : 'Enviar WhatsApp'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
