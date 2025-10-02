import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Share2, Copy, MessageSquare, ExternalLink, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuthContext } from '@/contexts/AuthContext'
import { encodeMessageForWhatsAppUrl, generateWhatsAppUrl } from '@/utils/whatsappEncoding'

interface ShareAgendaCardProps {
  professionalId: string
  professionalName: string
}

export const ShareAgendaCard: React.FC<ShareAgendaCardProps> = ({
  professionalId,
  professionalName
}) => {
  const { user } = useAuthContext()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)
  const [shortUrl, setShortUrl] = useState<string | null>(null)
  const [urlLoading, setUrlLoading] = useState(false)

  // Gerar link do perfil público
  const generateProfileLink = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/perfil/${professionalId}`
  }

  // Encurtar URL usando API gratuita
  const shortenUrl = async (url: string): Promise<string> => {
    // Detectar se é localhost ou produção
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1')
    
    if (isLocalhost) {
      // Em localhost, não tentar encurtar (APIs não aceitam localhost)
      console.log('URL localhost detectada - usando URL original')
      return url
    }
    
    try {
      // Em produção, usar API de encurtamento
      const response = await fetch(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(url)}`)
      
      if (response.ok) {
        const data = await response.json()
        if (data.ok && data.result && data.result.short_link) {
          console.log('URL encurtada com sucesso:', data.result.short_link)
          return data.result.short_link
        }
      }
      
      throw new Error('Resposta inválida da API')
    } catch (error) {
      console.warn('Erro ao encurtar URL em produção:', error)
      
      // Fallback: tentar com outra API
      try {
        const response = await fetch(`https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`)
        
        if (response.ok) {
          const shortUrl = await response.text()
          if (shortUrl.startsWith('http')) {
            console.log('URL encurtada com fallback:', shortUrl)
            return shortUrl
          }
        }
      } catch (fallbackError) {
        console.warn('Erro no fallback:', fallbackError)
      }
      
      // Se tudo falhar, retornar URL original
      console.log('Usando URL original como fallback')
      return url
    }
  }

  // Gerar mensagem personalizada
  const generateMessage = () => {
    const profileLink = shortUrl || generateProfileLink()
    return `Olá!
Agora você pode agendar comigo pelo aplicativo Beautycom!

Acesse aqui: ${profileLink}

Escolha o melhor horário. É mais prático e seguro!`
  }

  // Copiar link para área de transferência
  const handleCopyLink = async () => {
    try {
      const link = shortUrl || generateProfileLink()
      await navigator.clipboard.writeText(link)
      setCopied(true)
      toast({
        title: "Link copiado!",
        description: "O link do seu perfil foi copiado para a área de transferência.",
        variant: "default"
      })
      
      // Reset do estado após 2 segundos
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar link:', error)
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link. Tente novamente.",
        variant: "destructive"
      })
    }
  }

  // Abrir WhatsApp com mensagem pronta
  const handleWhatsAppShare = async () => {
    setUrlLoading(true)
    
    try {
      // Encurtar URL se ainda não foi encurtada
      let linkToUse = shortUrl
      if (!linkToUse) {
        const originalLink = generateProfileLink()
        linkToUse = await shortenUrl(originalLink)
        setShortUrl(linkToUse)
      }
      
      const message = generateMessage()
      // Usar a função padrão do sistema
      const whatsappUrl = generateWhatsAppUrl('', message)
      
      // Abrir WhatsApp em nova aba
      window.open(whatsappUrl, '_blank')
      
      toast({
        title: "WhatsApp aberto!",
        description: "Escolha os contatos para enviar sua mensagem.",
        variant: "default"
      })
    } catch (error) {
      console.error('Erro ao preparar mensagem:', error)
      toast({
        title: "Erro",
        description: "Não foi possível preparar a mensagem. Tente novamente.",
        variant: "destructive"
      })
    } finally {
      setUrlLoading(false)
    }
  }


  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-700">
          <Share2 className="h-5 w-5" />
          Compartilhar Agenda
        </CardTitle>
        <CardDescription className="text-green-600">
          Divulgue sua agenda para seus clientes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview da mensagem */}
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {generateMessage()}
          </div>
        </div>

        {/* Botão de ação principal */}
        <Button 
          onClick={handleWhatsAppShare}
          disabled={urlLoading}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          {urlLoading ? 'Preparando link...' : 'Enviar no WhatsApp'}
        </Button>

        {/* Informações do link */}
        <div className="bg-white rounded-lg p-3 border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <ExternalLink className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Seu link de agendamento:</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-gray-100 px-2 py-1 rounded text-gray-600 break-all">
              {shortUrl || generateProfileLink()}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="flex-shrink-0"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copiar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Dicas de uso */}
        <div className="text-xs text-green-600 bg-green-100 rounded-lg p-3">
          <p className="font-medium mb-1">💡 Dicas:</p>
          <ul className="space-y-1 text-xs">
            <li>• Compartilhe o link nas suas redes sociais</li>
            <li>• Envie por WhatsApp para seus clientes</li>
            <li>• Adicione o link na sua bio do Instagram</li>
            <li>• Use em cartões de visita digitais</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
