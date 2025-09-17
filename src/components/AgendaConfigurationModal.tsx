import React from 'react'
import { Button } from './ui/button'
import { Gift, Settings, Clock, Calendar, CheckCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface AgendaConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfigureNow: () => void
  onRemindLater: () => void
  daysRemaining: number
  missingItems: string[]
  hasActiveAgenda?: boolean
}

export const AgendaConfigurationModal: React.FC<AgendaConfigurationModalProps> = ({
  isOpen,
  onClose,
  onConfigureNow,
  onRemindLater,
  daysRemaining,
  missingItems,
  hasActiveAgenda = true
}) => {
  const getItemIcon = (item: string) => {
    switch (item) {
      case 'Serviços oferecidos':
        return <Settings className="h-4 w-4" />
      case 'Horários de funcionamento':
        return <Clock className="h-4 w-4" />
      case 'Dias de atendimento':
        return <Calendar className="h-4 w-4" />
      default:
        return <CheckCircle className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-blue-700">
            <Gift className="h-6 w-6" />
            {!hasActiveAgenda ? 'Ative sua agenda profissional' : 'Complete a configuração de sua agenda online'}
          </DialogTitle>
          <DialogDescription className="text-left space-y-3">
            <p className="text-gray-700">
              Você tem <span className="font-semibold text-blue-600">{daysRemaining} dias restantes</span> no seu trial gratuito.
            </p>
            
            {!hasActiveAgenda ? (
              <p className="text-gray-700">
                Sua agenda profissional está desativada. Ative sua agenda para começar a receber agendamentos de clientes e aproveitar ao máximo a <span className="font-semibold">BeautyTime</span>.
              </p>
            ) : (
              <p className="text-gray-700">
                Sua agenda ainda não está totalmente configurada.
                Complete a configuração para aproveitar ao máximo
                a <span className="font-semibold">BeautyTime</span> e começar a receber agendamentos.
              </p>
            )}

            {hasActiveAgenda && missingItems.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  O que está faltando:
                </p>
                <ul className="space-y-2">
                  {missingItems.map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      {getItemIcon(item)}
                      <span>• {item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-6">
          <Button 
            onClick={onConfigureNow}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Settings className="h-4 w-4 mr-2" />
            {!hasActiveAgenda ? 'Ativar Agenda' : 'Configurar Agora'}
          </Button>
          
          <Button 
            onClick={onRemindLater}
            variant="outline"
            className="w-full"
          >
            Lembrar Depois
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Este lembrete aparecerá uma vez por dia até sua agenda estar completa
        </p>
      </DialogContent>
    </Dialog>
  )
}

