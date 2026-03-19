import { useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { supabase } from "@/lib/supabase"
import { Link } from "react-router-dom"
import {
  BarChart3,
  Users,
  Calendar,
  Activity,
  ArrowLeft,
  TrendingUp
} from "lucide-react"

type PeriodPreset = "7d" | "30d" | "90d" | "custom"

interface ReportsMetrics {
  newUsers: number
  newProfessionals: number
  newRegularUsers: number
  newSalons: number
  professionalsWithActiveSubscription: number
  appointmentsInPeriod: number
  confirmedAppointments: number
  cancelledAppointments: number
  professionalsWithAppointments: number
}

const AdminReports = () => {
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>("30d")
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date()
    const start = new Date()
    start.setDate(end.getDate() - 30)
    return {
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0]
    }
  })
  const [metrics, setMetrics] = useState<ReportsMetrics>({
    newUsers: 0,
    newProfessionals: 0,
    newRegularUsers: 0,
    newSalons: 0,
    professionalsWithActiveSubscription: 0,
    appointmentsInPeriod: 0,
    confirmedAppointments: 0,
    cancelledAppointments: 0,
    professionalsWithAppointments: 0
  })
  const [loading, setLoading] = useState(true)

  const computeDateRangeFromPreset = (preset: PeriodPreset) => {
    if (preset === "custom") return
    const end = new Date()
    const start = new Date()
    if (preset === "7d") start.setDate(end.getDate() - 7)
    if (preset === "30d") start.setDate(end.getDate() - 30)
    if (preset === "90d") start.setDate(end.getDate() - 90)
    setDateRange({
      start: start.toISOString().split("T")[0],
      end: end.toISOString().split("T")[0]
    })
  }

  const loadReports = async () => {
    try {
      setLoading(true)

      const startDate = new Date(dateRange.start + "T00:00:00")
      const endDate = new Date(dateRange.end + "T23:59:59")

      // Usuários
      const { data: usersData, error: usersError } = await supabase
        .from("users")
        .select("id, user_type, created_at, subscription_status")

      if (usersError) {
        console.error("Erro ao carregar usuários para relatórios:", usersError)
        return
      }

      const users = usersData || []

      const usersInPeriod = users.filter((u: any) => {
        const createdAt = new Date(u.created_at)
        return createdAt >= startDate && createdAt <= endDate
      })

      const newUsers = usersInPeriod.length
      const newProfessionals = usersInPeriod.filter((u: any) => u.user_type === "profissional").length
      const newRegularUsers = usersInPeriod.filter((u: any) => u.user_type === "usuario").length

      const professionalsWithActiveSubscription = users.filter(
        (u: any) => u.user_type === "profissional" && u.subscription_status === "active"
      ).length

      // Salões
      const { data: salonsData, error: salonsError } = await supabase
        .from("salons_studios")
        .select("id, created_at")

      if (salonsError) {
        console.error("Erro ao carregar salões para relatórios:", salonsError)
      }

      const newSalons =
        (salonsData || []).filter((s: any) => {
          const createdAt = new Date(s.created_at)
          return createdAt >= startDate && createdAt <= endDate
        }).length || 0

      // Agendamentos
      const { data: appointmentsData, error: appointmentsError } = await supabase
        .from("appointments")
        .select("id, status, professional_id, client_id, date, created_at")

      if (appointmentsError) {
        console.error("Erro ao carregar agendamentos para relatórios:", appointmentsError)
      }

      const appointments = (appointmentsData || []).filter((a: any) => {
        // Usar campo date se existir, senão created_at
        const baseDateStr = a.date || a.created_at
        if (!baseDateStr) return false
        const baseDate = new Date(baseDateStr)
        return baseDate >= startDate && baseDate <= endDate
      })

      const appointmentsInPeriod = appointments.length
      const confirmedAppointments = appointments.filter((a: any) => a.status === "confirmed").length
      const cancelledAppointments = appointments.filter((a: any) => a.status === "cancelled").length
      const professionalsWithAppointments = new Set(
        appointments.map((a: any) => a.professional_id).filter(Boolean)
      ).size

      setMetrics({
        newUsers,
        newProfessionals,
        newRegularUsers,
        newSalons,
        professionalsWithActiveSubscription,
        appointmentsInPeriod,
        confirmedAppointments,
        cancelledAppointments,
        professionalsWithAppointments
      })
    } catch (error) {
      console.error("Erro inesperado ao carregar relatórios admin:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.start, dateRange.end])

  const getPercentage = (part: number, total: number) => {
    if (!total) return 0
    return Math.round((part / total) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="pt-20 pb-8 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Relatórios Gerais
              </h1>
            </div>
            <p className="text-muted-foreground">
              Acompanhe o crescimento da base, criação de salões e uso da agenda.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Admin
              </Link>
            </Button>
            <Badge variant="secondary" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              Relatórios
            </Badge>
          </div>
        </div>

        {/* Filtros de período */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Período de análise
            </CardTitle>
            <CardDescription>
              Escolha o intervalo de datas para calcular os indicadores.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {[
                { id: "7d", label: "Últimos 7 dias" },
                { id: "30d", label: "Últimos 30 dias" },
                { id: "90d", label: "Últimos 90 dias" },
                { id: "custom", label: "Personalizado" }
              ].map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  size="sm"
                  variant={periodPreset === p.id ? "hero" : "outline"}
                  onClick={() => {
                    setPeriodPreset(p.id as PeriodPreset)
                    computeDateRangeFromPreset(p.id as PeriodPreset)
                  }}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
              <div>
                <Label className="text-xs">Data inicial</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => {
                    setPeriodPreset("custom")
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label className="text-xs">Data final</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => {
                    setPeriodPreset("custom")
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPIs principais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Novos usuários
              </p>
              <p className="text-2xl font-bold">
                {metrics.newUsers}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.newProfessionals} profissionais • {metrics.newRegularUsers} usuários
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Novos salões criados
              </p>
              <p className="text-2xl font-bold">
                {metrics.newSalons}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Proprietários que criaram um salão no período
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Profissionais com assinatura ativa
              </p>
              <p className="text-2xl font-bold">
                {metrics.professionalsWithActiveSubscription}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total atualmente com status ativo
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                Agendamentos no período
              </p>
              <p className="text-2xl font-bold">
                {metrics.appointmentsInPeriod}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {metrics.professionalsWithAppointments} profissionais com agendamentos
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Funil simples e status da agenda */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                Funil de profissionais
              </CardTitle>
              <CardDescription>
                Do cadastro até a assinatura ativa (visão macro, não filtrada por período).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Cadastrados no período</span>
                  <span>{metrics.newProfessionals}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${getPercentage(metrics.newProfessionals, Math.max(metrics.newProfessionals, 1))}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Salões criados no período</span>
                  <span>{metrics.newSalons}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-secondary"
                    style={{ width: `${getPercentage(metrics.newSalons, Math.max(metrics.newProfessionals, 1))}%` }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Profissionais com assinatura ativa (total)</span>
                  <span>{metrics.professionalsWithActiveSubscription}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${getPercentage(metrics.professionalsWithActiveSubscription, Math.max(metrics.newProfessionals, 1))}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" />
                Status dos agendamentos
              </CardTitle>
              <CardDescription>
                Distribuição de status dos agendamentos no período selecionado.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Confirmados</span>
                  <span>
                    {metrics.confirmedAppointments} (
                    {getPercentage(metrics.confirmedAppointments, metrics.appointmentsInPeriod)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${getPercentage(metrics.confirmedAppointments, metrics.appointmentsInPeriod)}%`
                    }}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Cancelados</span>
                  <span>
                    {metrics.cancelledAppointments} (
                    {getPercentage(metrics.cancelledAppointments, metrics.appointmentsInPeriod)}%)
                  </span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-rose-500"
                    style={{
                      width: `${getPercentage(metrics.cancelledAppointments, metrics.appointmentsInPeriod)}%`
                    }}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Use esses números para acompanhar se os agendamentos estão evoluindo bem ao longo do tempo.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminReports

