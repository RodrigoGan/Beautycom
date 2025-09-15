import React from 'react'
import { Button } from './ui/button'
import { Calendar, MessageSquare, Bell, AlertCircle, Settings, Clock } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface AgendaUnavailableModalProps {
  isOpen: boolean
  onClose: () => void
  professional: {
    id: string
    name: string
    profile_photo?: string
    phone?: string
    whatsapp?: string
  }
  scenario: 'no_services' | 'trial_expired' | 'agenda_disabled'
}

export const AgendaUnavailableModal: React.FC<AgendaUnavailableModalProps> = ({
  isOpen,
  onClose,
  professional,
  scenario
}) => {
  // Configurações por cenário
  const getScenarioConfig = () => {
    switch (scenario) {
      case 'no_services':
        return {
          title: 'Serviços em Configuração',
          description: 'Este profissional está configurando seus serviços na Beautycom. Enquanto isso, você pode entrar em contato diretamente.',
          icon: <Settings className="h-8 w-8 text-amber-500" />,
          whatsappMessage: 'Olá! Tentei agendar com você pela Beautycom, mas vi que você ainda está configurando seus serviços. Gostaria de agendar diretamente. Quando você vai deixar sua agenda disponível?',
          buttonText: 'Enviar WhatsApp',
          color: 'amber'
        }
      case 'trial_expired':
        return {
          title: 'Agenda Temporariamente Indisponível',
          description: 'Este profissional não possui agenda ativa no momento. Você pode entrar em contato para agendar diretamente.',
          icon: <Clock className="h-8 w-8 text-orange-500" />,
          whatsappMessage: 'Olá! Tentei agendar com você pela Beautycom, mas vi que sua agenda está temporariamente indisponível. Gostaria de agendar diretamente. Quando você vai deixar sua agenda disponível?',
          buttonText: 'Enviar WhatsApp',
          color: 'orange'
        }
      case 'agenda_disabled':
        return {
          title: 'Agenda Desabilitada',
          description: 'Este profissional desabilitou sua agenda temporariamente. Você pode entrar em contato para agendar diretamente.',
          icon: <AlertCircle className="h-8 w-8 text-red-500" />,
          whatsappMessage: 'Olá! Tentei agendar com você pela Beautycom, mas vi que sua agenda está desabilitada no momento. Gostaria de agendar diretamente. Quando você vai deixar sua agenda disponível?',
          buttonText: 'Enviar WhatsApp',
          color: 'red'
        }
      default:
        return {
          title: 'Agenda Indisponível',
          description: 'Este profissional não possui agenda ativa no momento.',
          icon: <AlertCircle className="h-8 w-8 text-gray-500" />,
          whatsappMessage: 'Olá! Tentei agendar com você pela Beautycom, mas vi que sua agenda está indisponível no momento. Gostaria de agendar diretamente.',
          buttonText: 'Enviar WhatsApp',
          color: 'gray'
        }
    }
  }

  const config = getScenarioConfig()
  const whatsappNumber = professional.whatsapp || professional.phone

  const handleWhatsAppClick = () => {
    if (whatsappNumber) {
      const cleanNumber = whatsappNumber.replace(/\D/g, '')
      const message = encodeURIComponent(config.whatsappMessage)
      const whatsappUrl = `https://wa.me/55${cleanNumber}?text=${message}`
      window.open(whatsappUrl, '_blank')
    }
  }

  const handleNotifyClick = () => {
    // TODO: Implementar sistema de notificação
    console.log('Notificar quando ativar agenda')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            {config.icon}
            {config.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações do profissional */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-semibold">
              {professional.profile_photo ? (
                <img 
                  src={professional.profile_photo} 
                  alt={professional.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                professional.name.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="font-medium">{professional.name}</p>
              <p className="text-sm text-muted-foreground">Profissional</p>
            </div>
          </div>

          {/* Mensagem que será enviada */}
          <div className="p-3 bg-muted/30 rounded-lg border-l-4 border-primary">
            <p className="text-sm font-medium mb-2">Mensagem que será enviada:</p>
            <p className="text-sm text-muted-foreground italic">
              "{config.whatsappMessage}"
            </p>
          </div>

          {/* Botões de ação */}
          <div className="flex flex-col gap-2">
            {whatsappNumber && (
              <Button 
                onClick={handleWhatsAppClick}
                className="w-full"
                variant="default"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                {config.buttonText}
              </Button>
            )}
            
            <Button 
              onClick={handleNotifyClick}
              variant="outline"
              className="w-full"
            >
              <Bell className="h-4 w-4 mr-2" />
              Notificar quando ativar
            </Button>
          </div>

          {/* Informação adicional */}
          <div className="text-xs text-muted-foreground text-center">
            Esta funcionalidade incentiva o profissional a usar a agenda da Beautycom
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
