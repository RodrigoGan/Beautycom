import React, { useState, useEffect } from 'react'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Copy, Edit3, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface MessagePreviewProps {
  message: string
  onMessageChange: (message: string) => void
  isEditable?: boolean
  maxLength?: number
}

export const MessagePreview: React.FC<MessagePreviewProps> = ({
  message,
  onMessageChange,
  isEditable = true,
  maxLength = 1000
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editMessage, setEditMessage] = useState(message)
  const { toast } = useToast()

  useEffect(() => {
    setEditMessage(message)
  }, [message])

  const handleSave = () => {
    onMessageChange(editMessage)
    setIsEditing(false)
    toast({
      title: 'Mensagem atualizada',
      description: 'A mensagem foi atualizada com sucesso.',
    })
  }

  const handleCancel = () => {
    setEditMessage(message)
    setIsEditing(false)
  }

  const handleCopy = async () => {
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

  const characterCount = message?.length || 0
  const isOverLimit = characterCount > maxLength

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Preview da Mensagem
        </Label>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={isOverLimit ? 'destructive' : 'secondary'}>
            {characterCount}/{maxLength} caracteres
          </Badge>
          {isEditable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              {isEditing ? 'Visualizar' : 'Editar'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4 mr-1" />
            Copiar
          </Button>
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <Textarea
            value={editMessage}
            onChange={(e) => setEditMessage(e.target.value)}
            placeholder="Digite sua mensagem aqui..."
            className={`min-h-[200px] resize-none ${
              isOverLimit ? 'border-red-500 focus:border-red-500' : ''
            }`}
            maxLength={maxLength}
          />
          {isOverLimit && (
            <p className="text-sm text-red-600">
              A mensagem excede o limite de {maxLength} caracteres.
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isOverLimit}
            >
              Salvar
            </Button>
          </div>
        </div>
      ) : (
        <div className="border rounded-lg p-3 sm:p-4 bg-gray-50 min-h-[150px] sm:min-h-[200px]">
          <div className="whitespace-pre-wrap text-sm leading-relaxed break-words">
            {message || 'Nenhuma mensagem para exibir'}
          </div>
        </div>
      )}
    </div>
  )
}
