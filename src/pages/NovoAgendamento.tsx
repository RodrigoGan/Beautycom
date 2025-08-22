import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, User, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { Header } from "@/components/Header"

const NovoAgendamento = () => {
  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl pt-20 pb-8">
        <div className="mb-8">
          <Link to="/agenda-pessoal" className="inline-flex items-center text-muted-foreground hover:text-primary mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Agenda Pessoal
          </Link>
          <h1 className="text-3xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Novo Agendamento
          </h1>
          <p className="text-muted-foreground">
            Crie um novo agendamento para seus clientes
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Informações do Agendamento</CardTitle>
            <CardDescription>
              Preencha os dados do agendamento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Input id="cliente" placeholder="Nome do cliente" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input id="telefone" placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="servico">Serviço</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o serviço" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="corte-escova">Corte + Escova</SelectItem>
                  <SelectItem value="manicure">Manicure</SelectItem>
                  <SelectItem value="pedicure">Pedicure</SelectItem>
                  <SelectItem value="barba">Barba + Bigode</SelectItem>
                  <SelectItem value="coloracao">Coloração</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profissional">Profissional</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o profissional" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="joao">João Silva</SelectItem>
                  <SelectItem value="maria">Maria Santos</SelectItem>
                  <SelectItem value="carlos">Carlos Lima</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input id="data" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horario">Horário</Label>
                <Input id="horario" type="time" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea 
                id="observacoes" 
                placeholder="Observações adicionais sobre o agendamento..."
                rows={3}
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button className="flex-1">
                <Calendar className="h-4 w-4 mr-2" />
                Criar Agendamento
              </Button>
              <Button variant="outline" asChild>
                <Link to="/agenda-pessoal">Cancelar</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NovoAgendamento;