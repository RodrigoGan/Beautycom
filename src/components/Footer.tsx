import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Instagram, Facebook, Twitter, Mail, Phone, MapPin, CheckCircle } from "lucide-react"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

export function Footer() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { toast } = useToast()

  const handleNewsletterSubmit = async () => {
    if (!email || !email.includes('@')) {
      alert("Por favor, insira um e-mail válido.")
      return
    }

    setIsSubmitting(true)

    try {
      // Simular envio de e-mail (em produção, você usaria um serviço real)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Aqui você pode integrar com um serviço de e-mail real
      // Por exemplo: EmailJS, SendGrid, ou sua própria API
      console.log('E-mail para newsletter:', email)
      console.log('Enviando para: beautycom.app@gmail.com')
      
      setIsSubmitted(true)
      setEmail("")
      
      // Tentar usar toast se disponível, senão usar alert
      try {
        toast({
          title: "E-mail cadastrado!",
          description: "Você receberá nossas novidades em breve.",
        })
      } catch {
        alert("E-mail cadastrado! Você receberá nossas novidades em breve.")
      }
    } catch (error) {
      try {
        toast({
          title: "Erro ao cadastrar",
          description: "Tente novamente em alguns instantes.",
          variant: "destructive",
        })
      } catch {
        alert("Erro ao cadastrar. Tente novamente em alguns instantes.")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <footer className="bg-gradient-card py-16 border-t border-primary/10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo e descrição */}
          <div className="lg:col-span-1">
            <div className="flex items-center mb-4">
              <img 
                src="/image/logotipobeautycom.png" 
                alt="Beautycom" 
                className="h-8 w-8 mr-3"
              />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Beautycom
              </span>
            </div>
            <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
              A plataforma que conecta profissionais e amantes da beleza, criando uma comunidade única e inspiradora.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:text-primary">
                <Twitter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Links rápidos */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Links Rápidos</h4>
            <ul className="space-y-2">
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">Sobre Nós</Button></li>
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">Como Funciona</Button></li>
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">Profissionais</Button></li>
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">BeautyWall</Button></li>
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">Planos</Button></li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Suporte</h4>
            <ul className="space-y-2">
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">Central de Ajuda</Button></li>
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">Contato</Button></li>
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">FAQ</Button></li>
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">Política de Privacidade</Button></li>
              <li><Button variant="ghost" className="h-auto p-0 text-muted-foreground hover:text-primary text-sm">Termos de Uso</Button></li>
            </ul>
          </div>

          {/* Contato */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Fale Conosco</h4>
            <div className="space-y-3">
              <div className="flex items-center text-sm text-muted-foreground">
                <Mail className="h-4 w-4 mr-2" />
                contato@beautycom.com
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-4 w-4 mr-2" />
                (11) 9999-9999
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 mr-2" />
                São Paulo, Brasil
              </div>
            </div>

            {/* Newsletter */}
            <div className="mt-6">
              <h5 className="font-medium text-foreground mb-3 text-sm">Newsletter</h5>
              {isSubmitted ? (
                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>E-mail cadastrado!</span>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <Input 
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Seu e-mail" 
                    className="text-sm border-primary/20 focus:border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && handleNewsletterSubmit()}
                  />
                  <Button 
                    variant="beauty" 
                    size="sm"
                    onClick={handleNewsletterSubmit}
                    disabled={isSubmitting}
                    className="min-w-[80px]"
                  >
                    {isSubmitting ? "..." : "Enviar"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-primary/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 Beautycom. Todos os direitos reservados.
            </p>
            <p className="text-muted-foreground text-sm mt-2 md:mt-0">
              Feito com ❤️ para a comunidade da beleza
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}