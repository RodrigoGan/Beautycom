import { Fragment, useEffect, useState } from "react"
import { Header } from "@/components/Header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { User } from "@/lib/supabase"
import { Users, Search, Loader2, ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type ExtendedUser = User & {
  subscription_status?: string
  subscription_plan?: string
}

const AdminUsersProfessionals = () => {
  const [users, setUsers] = useState<ExtendedUser[]>([])
  const [filtered, setFiltered] = useState<ExtendedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [userType, setUserType] = useState<"all" | "usuario" | "profissional">("all")
  const [cityFilter, setCityFilter] = useState("")
  const [stateFilter, setStateFilter] = useState("")
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [subscriptionModalUser, setSubscriptionModalUser] = useState<ExtendedUser | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<"start" | "pro" | "plus">("start")
  const [durationDays, setDurationDays] = useState(30)
  const [savingSubscription, setSavingSubscription] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from("users")
          .select("id, email, name, user_type, profile_photo, nickname, phone, cidade, uf, subscription_status, subscription_plan")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Erro ao carregar usuários:", error)
          return
        }

        setUsers((data as ExtendedUser[]) || [])
        setFiltered((data as ExtendedUser[]) || [])
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  useEffect(() => {
    let list = [...users]

    if (userType !== "all") {
      list = list.filter((u) => u.user_type === userType)
    }

    if (search.trim()) {
      const term = search.toLowerCase()
      list = list.filter(
        (u) =>
          u.name?.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term) ||
          u.nickname?.toLowerCase().includes(term)
      )
    }

    if (cityFilter.trim()) {
      const cityTerm = cityFilter.toLowerCase()
      list = list.filter((u) => u.cidade?.toLowerCase().includes(cityTerm))
    }

    if (stateFilter.trim()) {
      const stateTerm = stateFilter.toLowerCase()
      list = list.filter((u) => u.uf?.toLowerCase().includes(stateTerm))
    }

    setFiltered(list)
  }, [users, search, userType, cityFilter, stateFilter])

  const getPlanBadge = (u: ExtendedUser) => {
    if (u.subscription_status === "active") {
      return <Badge variant="default">Assinante {u.subscription_plan || ""}</Badge>
    }
    return <Badge variant="outline">Sem plano ativo</Badge>
  }

  const filteredProfessionalsCount = filtered.filter((u) => u.user_type === "profissional").length
  const filteredRegularUsersCount = filtered.filter((u) => u.user_type === "usuario").length

  const handleOpenSubscriptionModal = (user: ExtendedUser) => {
    setSubscriptionModalUser(user)
    setSelectedPlan("start")
    setDurationDays(30)
  }

  const handleSaveSubscription = async () => {
    if (!subscriptionModalUser) return

    try {
      setSavingSubscription(true)

      const now = new Date()
      const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000)

      // Registrar em trials como controle de validade
      const { error: trialError } = await supabase
        .from("trials")
        .upsert({
          user_id: subscriptionModalUser.id,
          plan_type: selectedPlan,
          status: "active",
          expires_at: expiresAt.toISOString()
        })

      if (trialError) {
        console.error("Erro ao registrar trial manual:", trialError)
        toast({
          title: "Erro ao salvar assinatura",
          description: "Não foi possível registrar o período de validade.",
          variant: "destructive"
        })
        return
      }

      // Atualizar campos resumidos do usuário
      const planNameMap: Record<string, string> = {
        start: "BeautyTime Start",
        pro: "BeautyTime Pro",
        plus: "BeautyTime Plus"
      }

      const { error: userError } = await supabase
        .from("users")
        .update({
          subscription_status: "active",
          subscription_plan: planNameMap[selectedPlan] || selectedPlan,
          trial_activated_at: now.toISOString() // reaproveita campo existente para registrar início
        })
        .eq("id", subscriptionModalUser.id)

      if (userError) {
        console.error("Erro ao atualizar usuário com assinatura manual:", userError)
        toast({
          title: "Erro ao salvar assinatura",
          description: "Ocorreu um erro ao atualizar os dados do usuário.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Assinatura ativada",
        description: `Plano ${planNameMap[selectedPlan]} ativado por ${durationDays} dias.`
      })

      // Atualizar estado local para refletir mudança
      setUsers((prev) =>
        prev.map((u) =>
          u.id === subscriptionModalUser.id
            ? { ...u, subscription_status: "active", subscription_plan: planNameMap[selectedPlan] || selectedPlan }
            : u
        )
      )
      setFiltered((prev) =>
        prev.map((u) =>
          u.id === subscriptionModalUser.id
            ? { ...u, subscription_status: "active", subscription_plan: planNameMap[selectedPlan] || selectedPlan }
            : u
        )
      )

      setSubscriptionModalUser(null)
    } catch (error) {
      console.error("Erro inesperado ao salvar assinatura manual:", error)
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    } finally {
      setSavingSubscription(false)
    }
  }

  const handleCancelSubscription = async (targetUser: ExtendedUser) => {
    try {
      setSavingSubscription(true)

      // Marcar trial/assinatura manual como expirada no controle de validade
      const { error: trialError } = await supabase
        .from("trials")
        .update({
          status: "expired",
          expires_at: new Date().toISOString()
        })
        .eq("user_id", targetUser.id)
        .eq("status", "active")

      if (trialError) {
        console.error("Erro ao expirar trial manual:", trialError)
      }

      // Atualizar usuário para assinatura inativa
      const { error: userError } = await supabase
        .from("users")
        .update({
          subscription_status: "inactive",
          subscription_plan: null
        })
        .eq("id", targetUser.id)

      if (userError) {
        console.error("Erro ao cancelar assinatura no usuário:", userError)
        toast({
          title: "Erro ao cancelar assinatura",
          description: "Não foi possível atualizar os dados do usuário.",
          variant: "destructive"
        })
        return
      }

      toast({
        title: "Assinatura cancelada",
        description: "A assinatura manual foi encerrada com sucesso."
      })

      // Atualizar estado local para refletir mudança
      setUsers((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, subscription_status: "inactive", subscription_plan: undefined }
            : u
        )
      )
      setFiltered((prev) =>
        prev.map((u) =>
          u.id === targetUser.id
            ? { ...u, subscription_status: "inactive", subscription_plan: undefined }
            : u
        )
      )
    } catch (error) {
      console.error("Erro inesperado ao cancelar assinatura manual:", error)
      toast({
        title: "Erro inesperado",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      })
    } finally {
      setSavingSubscription(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      <div className="pt-20 pb-8 container mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="mb-6">
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-6 w-6 text-primary" />
                <CardTitle>Usuários & Profissionais</CardTitle>
              </div>
              <CardDescription>
                Visão geral dos usuários cadastrados na plataforma, com filtro por tipo e busca rápida.
              </CardDescription>
            </div>
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link to="/admin">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para Admin
                </Link>
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email ou apelido..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-64"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Tipo</span>
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as any)}
                    className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                  >
                    <option value="all">Todos</option>
                    <option value="profissional">Profissionais</option>
                    <option value="usuario">Usuários</option>
                  </select>
                </div>
                <Input
                  placeholder="Cidade"
                  value={cityFilter}
                  onChange={(e) => setCityFilter(e.target.value)}
                  className="h-9 w-36"
                />
                <Input
                  placeholder="UF"
                  value={stateFilter}
                  onChange={(e) => setStateFilter(e.target.value.toUpperCase())}
                  className="h-9 w-24"
                  maxLength={2}
                />
                <button
                  type="button"
                  onClick={() => {
                    setSearch("")
                    setUserType("all")
                    setCityFilter("")
                    setStateFilter("")
                  }}
                  className="h-9 rounded-md border border-input bg-background px-3 text-xs hover:bg-accent"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Listagem ({filtered.length})
              </CardTitle>
              <div className="text-right">
                <CardDescription>
                  Clique em uma linha para ver os principais dados do usuário.
                </CardDescription>
                <p className="text-xs text-muted-foreground mt-1">
                  {filteredProfessionalsCount} profissionais • {filteredRegularUsersCount} usuários
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                <span className="text-muted-foreground text-sm">Carregando usuários...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-3 py-2 text-left font-medium">Nome</th>
                      <th className="px-3 py-2 text-left font-medium">Email</th>
                      <th className="px-3 py-2 text-left font-medium">Tipo</th>
                      <th className="px-3 py-2 text-left font-medium">Localização</th>
                      <th className="px-3 py-2 text-left font-medium">Plano</th>
                      <th className="px-3 py-2 text-left font-medium">Telefone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => (
                      <Fragment key={u.id}>
                        <tr
                          className="border-b hover:bg-muted/40 cursor-pointer"
                          onClick={() => setExpandedUserId((prev) => (prev === u.id ? null : u.id))}
                        >
                          <td className="px-3 py-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{u.name || u.nickname || "Sem nome"}</span>
                              {u.nickname && (
                                <span className="text-xs text-muted-foreground">@{u.nickname}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2">{u.email}</td>
                          <td className="px-3 py-2">
                            <Badge variant={u.user_type === "profissional" ? "default" : "secondary"}>
                              {u.user_type === "profissional" ? "Profissional" : "Usuário"}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {u.cidade && u.uf ? `${u.cidade} - ${u.uf}` : "-"}
                          </td>
                          <td className="px-3 py-2">{getPlanBadge(u)}</td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">
                            {u.phone || "-"}
                          </td>
                        </tr>
                        {expandedUserId === u.id && (
                          <tr className="border-b bg-muted/20">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <p className="text-muted-foreground">ID</p>
                                  <p className="font-medium break-all">{u.id}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Tipo de usuário</p>
                                  <p className="font-medium">
                                    {u.user_type === "profissional" ? "Profissional" : "Usuário"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Plano</p>
                                  <p className="font-medium">
                                    {u.subscription_status === "active"
                                      ? `Ativo (${u.subscription_plan || "sem plano"})`
                                      : "Sem assinatura ativa"}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Email</p>
                                  <p className="font-medium break-all">{u.email || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Telefone</p>
                                  <p className="font-medium">{u.phone || "-"}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">Localização</p>
                                  <p className="font-medium">
                                    {u.cidade || "-"} {u.uf ? `- ${u.uf}` : ""}
                                  </p>
                                </div>
                                {u.user_type === "profissional" && (
                                  <div className="md:col-span-3 mt-2 flex justify-end">
                                    <div className="flex gap-2">
                                      {u.subscription_status === "active" ? (
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          disabled={savingSubscription}
                                          onClick={() => handleCancelSubscription(u)}
                                        >
                                          {savingSubscription ? "Cancelando..." : "Cancelar assinatura manual"}
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleOpenSubscriptionModal(u)}
                                        >
                                          Ativar assinatura manual
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))}
                  </tbody>
                </table>

                {filtered.length === 0 && !loading && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Nenhum usuário encontrado com os filtros atuais.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!subscriptionModalUser} onOpenChange={() => !savingSubscription && setSubscriptionModalUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ativar assinatura manual</DialogTitle>
            <DialogDescription>
              Escolha um plano e o período de validade para ativar a assinatura deste profissional.
            </DialogDescription>
          </DialogHeader>
          {subscriptionModalUser && (
            <div className="space-y-4">
              <div className="text-sm">
                <p className="font-medium">{subscriptionModalUser.name || subscriptionModalUser.email}</p>
                <p className="text-muted-foreground text-xs">{subscriptionModalUser.email}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Plano</Label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { id: "start", label: "BeautyTime Start" },
                    { id: "pro", label: "BeautyTime Pro" },
                    { id: "plus", label: "BeautyTime Plus" }
                  ] as const).map((plan) => (
                    <Button
                      key={plan.id}
                      type="button"
                      size="sm"
                      variant={selectedPlan === plan.id ? "hero" : "outline"}
                      onClick={() => setSelectedPlan(plan.id)}
                    >
                      {plan.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2 max-w-xs">
                <Label className="text-xs">Duração (dias)</Label>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  value={durationDays}
                  onChange={(e) => setDurationDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))}
                  className="h-8 text-sm"
                />
                <p className="text-[11px] text-muted-foreground">
                  A assinatura será considerada ativa para campanhas e relatórios durante este período.
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={savingSubscription}
                  onClick={() => setSubscriptionModalUser(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveSubscription}
                  disabled={savingSubscription}
                >
                  {savingSubscription ? "Salvando..." : "Ativar assinatura"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default AdminUsersProfessionals

