import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatRelativeTime, INTERACTION_ICONS, INTERACTION_LABELS, STAGE_LABELS, STAGE_ORDER } from "@/lib/crm";
import {
  ArrowUpRight,
  Building2,
  Clock,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useLocation } from "wouter";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

// Paleta de cores para o gráfico de funil — gerada dinamicamente a partir do STAGE_ORDER canônico
const FUNNEL_COLORS: Record<string, string> = {
  new_lead: "#64748b",
  first_contact: "#3b82f6",
  meeting_scheduled: "#8b5cf6",
  proposal_sent: "#f59e0b",
  trial: "#06b6d4",
  contract_sent: "#f97316",
  contract_signed: "#10b981",
  payment_pending: "#eab308",
  payment_done: "#22c55e",
  onboarding: "#14b8a6",
  photo_visit_scheduled: "#6366f1",
  photo_visit_done: "#a855f7",
  published: "#84cc16",
  announced: "#ec4899",
  feedback: "#f43f5e",
  active_client: "#10b981",
};

// Exibir apenas as etapas principais no gráfico para não sobrecarregar a visualização
const FUNNEL_CHART_STAGES = [
  "new_lead", "first_contact", "meeting_scheduled", "proposal_sent",
  "trial", "contract_signed", "payment_done", "active_client",
];

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: metrics, isLoading } = trpc.metrics.funnel.useQuery(undefined, { refetchInterval: 30000 });

  const funnelData = FUNNEL_CHART_STAGES.map((key) => ({
    key,
    label: STAGE_LABELS[key] || key,
    color: FUNNEL_COLORS[key] || "#64748b",
    count: metrics?.stageGroups?.[key] || 0,
  }));

  const statCards = [
    {
      title: "Total de Leads",
      value: metrics?.total ?? 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-950/40",
      border: "border-blue-800/30",
      sub: `${metrics?.active ?? 0} ativos`,
    },
    {
      title: "Clientes Ativos",
      value: metrics?.converted ?? 0,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bg: "bg-emerald-950/40",
      border: "border-emerald-800/30",
      sub: `${metrics?.conversionRate ?? 0}% de conversão`,
    },
    {
      title: "Receita Mensal",
      value: formatCurrency(metrics?.totalRevenue ?? 0),
      icon: DollarSign,
      color: "text-amber-400",
      bg: "bg-amber-950/40",
      border: "border-amber-800/30",
      sub: "MRR estimado",
      isText: true,
    },
    {
      title: "Leads Perdidos",
      value: metrics?.lost ?? 0,
      icon: AlertCircle,
      color: "text-red-400",
      bg: "bg-red-950/40",
      border: "border-red-800/30",
      sub: "Oportunidades perdidas",
    },
  ];

  return (
    <CRMLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Visão geral do funil de vendas em tempo real</p>
          </div>
          <button
            onClick={() => setLocation("/leads")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Users className="h-4 w-4" />
            Novo Lead
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map((card) => (
            <Card key={card.title} className={`border ${card.border} ${card.bg} backdrop-blur-sm`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">{card.title}</p>
                    <p className={`text-2xl font-bold ${card.isText ? "text-amber-400" : "text-foreground"}`}>
                      {isLoading ? "—" : card.value}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
                  </div>
                  <div className={`p-2 rounded-lg ${card.bg} border ${card.border}`}>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Funnel Chart + Recent Activity */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Funnel Chart */}
          <Card className="xl:col-span-2 border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Funil de Vendas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                    <XAxis type="number" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={90} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #334155", borderRadius: 8, fontSize: 12 }}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                      formatter={(value: any) => [`${value} lead${value !== 1 ? "s" : ""}`, ""]}
                    />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={28}>
                      {funnelData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} fillOpacity={0.85} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Recent Leads */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Leads Recentes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
              ) : metrics?.recentLeads?.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nenhum lead cadastrado ainda
                </div>
              ) : (
                <div className="divide-y divide-border/30">
                  {metrics?.recentLeads?.map((lead: any) => (
                    <button
                      key={lead.id}
                      onClick={() => setLocation(`/leads/${lead.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/30 transition-colors text-left"
                    >
                      <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-primary">
                          {lead.companyName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{lead.companyName}</p>
                        <p className="text-xs text-muted-foreground truncate">{STAGE_LABELS[lead.stage] || lead.stage}</p>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Interactions */}
        <Card className="border-border/50 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground">Carregando...</div>
            ) : metrics?.recentInteractions?.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">Nenhuma atividade registrada</div>
            ) : (
              <div className="divide-y divide-border/30">
                {metrics?.recentInteractions?.map((interaction: any) => (
                  <div key={interaction.id} className="flex items-start gap-3 px-4 py-3">
                    <span className="text-base shrink-0 mt-0.5">{INTERACTION_ICONS[interaction.type] || "📌"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground/90 leading-snug">{interaction.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/50">
                          {INTERACTION_LABELS[interaction.type] || interaction.type}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">{formatRelativeTime(interaction.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
