import { useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Link } from "react-router-dom"
import { useAuthContext } from "@/contexts/AuthContext"
import { supabase } from "@/lib/supabase"
import { 
  Shield, 
  MessageSquare, 
  Users, 
  BarChart3, 
  Activity 
} from "lucide-react"

interface DashboardMetrics {
  totalUsers: number
  regularUsers: number
  professionals: number
  professionalsWithSalon: number
  professionalsWithActiveSubscription: number
  stateDistribution: Array<{ uf: string; total: number }>
  loading: boolean
}

const AdminHome = () => {
  const { user } = useAuthContext()
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalUsers: 0,
    regularUsers: 0,
    professionals: 0,
    professionalsWithSalon: 0,
    professionalsWithActiveSubscription: 0,
    stateDistribution: [],
    loading: true
  })

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        // Buscar todos os usuários com os campos necessários
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, user_type, subscription_status, uf")

        if (usersError) {
          console.error("Erro ao carregar usuários para métricas:", usersError)
          return
        }

        const users = usersData || []
        const totalUsers = users.length
        const professionals = users.filter((u) => u.user_type === "profissional")
        const regularUsers = users.filter((u) => u.user_type === "usuario").length
        const professionalsCount = professionals.length

        // Distribuição por estado (UF)
        const statesMap = new Map<string, number>()
        users.forEach((u) => {
          const uf = (u.uf || "").trim().toUpperCase()
          if (!uf) return
          statesMap.set(uf, (statesMap.get(uf) || 0) + 1)
        })
        const stateDistribution = Array.from(statesMap.entries())
          .map(([uf, total]) => ({ uf, total }))
          .sort((a, b) => b.total - a.total)

        // Profissionais com assinatura ativa
        const professionalsWithActiveSubscription = professionals.filter(
          (u) => u.subscription_status === "active"
        ).length

        // Buscar salões para identificar profissionais que são donos de salão
        const { data: salonsData, error: salonsError } = await supabase
          .from("salons_studios")
          .select("owner_id")

        if (salonsError) {
          console.error("Erro ao carregar salões para métricas:", salonsError)
        }

        const salonOwnersIds = Array.from(
          new Set((salonsData || []).map((s: any) => s.owner_id))
        )

        const professionalsWithSalon = professionals.filter((p) =>
          salonOwnersIds.includes(p.id)
        ).length

        setMetrics({
          totalUsers,
          regularUsers,
          professionals: professionalsCount,
          professionalsWithSalon,
          professionalsWithActiveSubscription,
          stateDistribution,
          loading: false
        })
      } catch (error) {
        console.error("Erro inesperado ao carregar métricas do painel admin:", error)
        setMetrics((prev) => ({ ...prev, loading: false }))
      }
    }

    loadMetrics()
  }, [])

  const getPercentage = (part: number, total: number) => {
    if (!total) return 0
    return Math.round((part / total) * 100)
  }

  const maxStateTotal = metrics.stateDistribution[0]?.total || 1

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="pt-20 pb-8 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Shield className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Painel Super Admin
              </h1>
            </div>
            <p className="text-muted-foreground">
              Central de controle para ferramentas administrativas da Beautycom.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/admin/whatsapp-campaigns">
                <MessageSquare className="h-4 w-4 mr-2" />
                WhatsApp
              </Link>
            </Button>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Activity className="h-3 w-3" />
              Super Admin
            </Badge>
            {user?.email && (
              <Badge variant="outline">
                {user.email}
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Visão Geral</CardTitle>
              <CardDescription>
                Acesse rapidamente as principais ferramentas administrativas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <MessageSquare className="h-4 w-4 text-primary" />
                      Campanhas WhatsApp
                    </CardTitle>
                    <CardDescription>
                      Envie campanhas segmentadas para profissionais e usuários.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button asChild className="w-full" size="sm">
                      <Link to="/admin/whatsapp-campaigns">
                        Abrir módulo
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Users className="h-4 w-4 text-primary" />
                      Usuários & Profissionais
                    </CardTitle>
                    <CardDescription>
                      Consulte e filtre usuários e profissionais da plataforma.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link to="/admin/users">
                        Abrir módulo
                      </Link>
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Relatórios
                    </CardTitle>
                    <CardDescription>
                      Painéis de uso e conversão para decisões estratégicas.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Button asChild variant="outline" className="w-full" size="sm">
                      <Link to="/admin/reports">
                        Abrir módulo
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Usuários</CardTitle>
              <CardDescription>
                Panorama rápido da base de usuários e profissionais da plataforma.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <div className="text-sm text-muted-foreground">
                  Carregando métricas...
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Usuários Totais
                      </p>
                      <p className="text-2xl font-bold">
                        {metrics.totalUsers}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {metrics.regularUsers} comuns • {metrics.professionals} profissionais
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Profissionais com Salão
                      </p>
                      <p className="text-2xl font-bold">
                        {metrics.professionalsWithSalon}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getPercentage(metrics.professionalsWithSalon, metrics.professionals)}% dos profissionais
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                        Profissionais com Assinatura Ativa
                      </p>
                      <p className="text-2xl font-bold">
                        {metrics.professionalsWithActiveSubscription}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {getPercentage(metrics.professionalsWithActiveSubscription, metrics.professionals)}% dos profissionais
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Distribuição de usuários</span>
                        <span>
                          {metrics.regularUsers} comuns • {metrics.professionals} profissionais
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${getPercentage(metrics.regularUsers, metrics.totalUsers)}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Profissionais com salão</span>
                          <span>
                            {metrics.professionalsWithSalon}/{metrics.professionals}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-secondary"
                            style={{ width: `${getPercentage(metrics.professionalsWithSalon, metrics.professionals)}%` }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Profissionais com assinatura ativa</span>
                          <span>
                            {metrics.professionalsWithActiveSubscription}/{metrics.professionals}
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${getPercentage(metrics.professionalsWithActiveSubscription, metrics.professionals)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários por Estado</CardTitle>
              <CardDescription>
                Quantidade de usuários agrupada por UF.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.loading ? (
                <div className="text-sm text-muted-foreground">
                  Carregando distribuição por estado...
                </div>
              ) : metrics.stateDistribution.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  Não há dados de estado (UF) para exibir.
                </div>
              ) : (
                <div className="space-y-3">
                  {metrics.stateDistribution.map((state) => (
                    <div key={state.uf}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{state.uf}</span>
                        <span className="text-muted-foreground">{state.total} usuários</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${getPercentage(state.total, maxStateTotal)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default AdminHome

