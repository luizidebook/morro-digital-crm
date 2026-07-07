import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/crm";
import { CheckCircle2, Clock, Plus, Timer, XCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

export default function Trials() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedLeadId = params.get("leadId") ? parseInt(params.get("leadId")!) : undefined;

  const [showForm, setShowForm] = useState(!!preselectedLeadId);
  const [form, setForm] = useState({
    leadId: preselectedLeadId || 0,
    durationDays: 30,
    startDate: new Date().toISOString().split("T")[0],
  });

  const utils = trpc.useUtils();
  const { data: trials = [], isLoading } = trpc.trials.list.useQuery(
    preselectedLeadId ? { leadId: preselectedLeadId } : {}
  );
  const { data: leads = [] } = trpc.leads.list.useQuery({});

  const createTrial = trpc.trials.create.useMutation({
    onSuccess: () => { toast.success("Trial iniciado!"); utils.trials.list.invalidate(); setShowForm(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const convertTrial = trpc.trials.convert.useMutation({
    onSuccess: () => { toast.success("Trial convertido! Lead avançado para Cliente Ativo."); utils.trials.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const cancelTrial = trpc.trials.cancel.useMutation({
    onSuccess: () => { toast.success("Trial cancelado."); utils.trials.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const expireTrial = trpc.trials.expire.useMutation({
    onSuccess: () => { toast.success("Trial marcado como expirado."); utils.trials.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: "bg-cyan-950 text-cyan-300 border-cyan-800",
      expired: "bg-red-950 text-red-300 border-red-800",
      converted: "bg-emerald-950 text-emerald-300 border-emerald-800",
      cancelled: "bg-zinc-900 text-zinc-400 border-zinc-700",
    };
    const labels: Record<string, string> = { active: "Ativo", expired: "Expirado", converted: "Convertido", cancelled: "Cancelado" };
    return <Badge className={`text-[10px] border px-2 py-0.5 ${map[status] || "bg-muted"}`}>{labels[status] || status}</Badge>;
  };

  const getDaysRemaining = (endDate: string | Date) => {
    const now = new Date();
    const end = new Date(endDate);
    return Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <CRMLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Trial</h1>
            <p className="text-sm text-muted-foreground">{trials.length} trial(s)</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Novo Trial
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-card/50 border border-border/30 animate-pulse" />)}</div>
        ) : trials.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Timer className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum trial ativo</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2" size="sm"><Plus className="h-4 w-4" /> Iniciar Trial</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {(trials as any[]).map((trial) => {
              const daysLeft = getDaysRemaining(trial.endDate);
              const lead = (leads as any[]).find((l) => l.id === trial.leadId);
              const isActive = trial.status === "active";
              return (
                <Card key={trial.id} className="border-border/40 bg-card/60 hover:border-primary/20 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${daysLeft > 7 ? "bg-cyan-950/60 border-cyan-800/30" : daysLeft > 0 ? "bg-amber-950/60 border-amber-800/30" : "bg-red-950/60 border-red-800/30"}`}>
                          <Timer className={`h-5 w-5 ${daysLeft > 7 ? "text-cyan-400" : daysLeft > 0 ? "text-amber-400" : "text-red-400"}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{lead?.companyName || `Lead #${trial.leadId}`}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(trial.startDate)} → {formatDate(trial.endDate)}
                          </p>
                          {isActive && (
                            <p className={`text-xs mt-1 font-medium ${daysLeft > 7 ? "text-cyan-400" : daysLeft > 0 ? "text-amber-400" : "text-red-400"}`}>
                              {daysLeft > 0 ? `${daysLeft} dias restantes` : "Expirado (aguardando atualização)"}
                            </p>
                          )}
                          {trial.convertedAt && (
                            <p className="text-xs text-emerald-400 mt-1">Convertido em {formatDate(trial.convertedAt)}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(trial.status)}
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{trial.durationDays} dias</span>
                        </div>

                        {/* Ações disponíveis apenas para trials ativos */}
                        {isActive && (
                          <div className="flex flex-col items-end gap-1 mt-1">
                            <button
                              onClick={() => convertTrial.mutate({ id: trial.id, leadId: trial.leadId })}
                              disabled={convertTrial.isPending}
                              className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Converter em cliente
                            </button>
                            {daysLeft <= 0 && (
                              <button
                                onClick={() => expireTrial.mutate({ id: trial.id, leadId: trial.leadId })}
                                disabled={expireTrial.isPending}
                                className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
                              >
                                <AlertCircle className="h-3 w-3" /> Marcar como expirado
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (window.confirm("Tem certeza que deseja cancelar este trial?")) {
                                  cancelTrial.mutate({ id: trial.id, leadId: trial.leadId });
                                }
                              }}
                              disabled={cancelTrial.isPending}
                              className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1"
                            >
                              <XCircle className="h-3 w-3" /> Cancelar trial
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Timer className="h-5 w-5 text-cyan-400" /> Iniciar Trial</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (!form.leadId) return toast.error("Selecione um lead"); createTrial.mutate({ leadId: form.leadId, durationDays: form.durationDays, startDate: form.startDate }); }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Lead / Empresa *</Label>
              <Select value={form.leadId ? String(form.leadId) : ""} onValueChange={(v) => setForm({ ...form, leadId: parseInt(v) })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione o lead..." /></SelectTrigger>
                <SelectContent>{(leads as any[]).map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.companyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duração (dias)</Label>
                <Input type="number" min={1} max={365} value={form.durationDays} onChange={(e) => setForm({ ...form, durationDays: parseInt(e.target.value) || 30 })} className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Início</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-background/50" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createTrial.isPending} className="bg-primary text-primary-foreground">
                {createTrial.isPending ? "Iniciando..." : "Iniciar Trial"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}
