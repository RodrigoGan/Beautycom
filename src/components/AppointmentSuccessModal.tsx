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
  CheckCircle,
  Calendar,
  Clock,
  User,
  Package,
  MapPin,
  Send,
  X,
  Copy,
  Sparkles
} from 'lucide-react'
import { Appointment } from '@/hooks/useAppointments'
import {
  formatAppointmentData,
  replaceTemplatePlaceholders,
  validateBrazilianPhone,
  generateWhatsAppUrl
} from '@/utils/whatsappEncoding'
import { getTemplateByIdPreferDb } from '@/utils/whatsappTemplatesDb'
import { useToast } from '@/hooks/use-toast'

interface AppointmentSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  appointment: Appointment | null
  onSend?: () => void
}

export const AppointmentSuccessModal: React.FC<AppointmentSuccessModalProps> = ({
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

  const loadTemplateAndData = async () => {
    if (!appointment) return

    const template = await getTemplateByIdPreferDb('agendamento_confirmacao')
    if (!template) {
      console.error('Template de agendamento não encontrado!')
      setMessage('Erro: Template de agendamento não encontrado.')
      return
    }

    const formattedData = formatAppointmentData(appointment)
    const finalMessage = replaceTemplatePlaceholders(template.content, formattedData)
    setMessage(finalMessage)
  }

  const handleSendWhatsApp = () => {
    if (!appointment?.client?.phone) {
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: 'Você não possui um número de telefone cadastrado.',
        variant: 'destructive'
      })
      return
    }

    if (!validateBrazilianPhone(appointment.client.phone)) {
      toast({
        title: 'Erro ao enviar WhatsApp',
        description: 'Seu número de telefone é inválido.',
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

  if (!appointment) return null

  const clientPhone = appointment.client?.phone
  const hasValidPhone = clientPhone ? validateBrazilianPhone(clientPhone) : false

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[calc(100vw-16px)] mx-auto p-4 sm:p-6 max-h-[90vh] overflow-y-auto overflow-x-hidden my-6 sm:my-0 rounded-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
            <span className="text-green-600">Agendamento Confirmado!</span>
          </DialogTitle>
          <DialogDescription className="text-center text-base">
            Parabéns! Seu agendamento foi criado com sucesso. 
            <br />
            <span className="text-sm text-muted-foreground">
              Que tal salvar os detalhes no seu WhatsApp?
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6 py-2 sm:py-4">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-lg text-green-700">Resumo do Agendamento</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600 space-y-1">
              <p className="flex items-center gap-2"><User className="h-4 w-4 text-purple-500" /> Cliente: <strong>{appointment.client?.name}</strong></p>
              <p className="flex items-center gap-2"><User className="h-4 w-4 text-pink-500" /> Profissional: <strong>{appointment.professional?.name}</strong></p>
              <p className="flex items-center gap-2"><Package className="h-4 w-4 text-blue-500" /> Serviço: <strong>{appointment.service?.name}</strong></p>
              <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-green-500" /> Data: <strong>{formatAppointmentData(appointment).DATA}</strong></p>
              <p className="flex items-center gap-2"><Clock className="h-4 w-4 text-yellow-500" /> Horário: <strong>{formatAppointmentData(appointment).HORA}</strong></p>
              <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-red-500" /> Local: <strong>{formatAppointmentData(appointment).ENDERECO}</strong></p>
            </CardContent>
          </Card>

          {!hasValidPhone && clientPhone && (
            <div className="flex items-center gap-2 text-orange-600 text-sm">
              <X className="h-4 w-4" />
              Seu número de telefone é inválido. Não será possível enviar a mensagem.
            </div>
          )}

          <MessagePreview
            message={message}
            onMessageChange={setMessage}
            isEditable={true}
            maxLength={1000}
          />
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
              {isLoading ? 'Abrindo...' : 'Enviar para meu WhatsApp'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
