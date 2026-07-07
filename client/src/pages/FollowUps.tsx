import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { formatDate, formatRelativeTime, getWhatsAppLink } from "@/lib/crm";
import { Bell, CheckCircle2, Copy, Loader2, MessageSquare, Plus, Settings, Sparkles } from "lucide-react";
import { useState } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

export default function FollowUps() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedLeadId = params.get("leadId") ? parseInt(params.get("leadId")!) : undefined;

  const [showSettings, setShowSettings] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [generating, setGenerating] = useState<number | null>(null);
  const [settingsId, setSettingsId] = useState<number | undefined>(undefined);
  const [settingsForm, setSettingsForm] = useState({ name: "Padrão", intervalDays: 3, maxAttempts: 5, isActive: true });
  const [createForm, setCreateForm] = useState({
    leadId: preselectedLeadId || 0,
    scheduledAt: new Date().toISOString().split("T")[0],
    attemptNumber: 1,
  });

  const utils = trpc.useUtils();
  const { data: followUps = [], isLoading } = trpc.followUps.list.useQuery(
    preselectedLeadId ? { leadId: preselectedLeadId } : {}
  );
  const { data: settings = [] } = trpc.followUps.settings.useQuery();
  const { data: leads = [] } = trpc.leads.list.useQuery({});

  const activeSetting = (settings as any[]).find((s: any) => s.isActive);

  const saveSettings = trpc.followUps.saveSetting.useMutation({
    onSuccess: () => { toast.success("Configurações salvas!"); utils.followUps.settings.invalidate(); setShowSettings(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const createFollowUp = trpc.followUps.create.useMutation({
    onSuccess: () => {
      toast.success("Follow-up criado!");
      utils.followUps.list.invalidate();
      setShowCreateForm(false);
      setCreateForm({ leadId: preselectedLeadId || 0, scheduledAt: new Date().toISOString().split("T")[0], attemptNumber: 1 });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateMessage = trpc.followUps.generateMessage.useMutation({
    onSuccess: () => {
      toast.success("Mensagem gerada!");
      utils.followUps.list.invalidate();
      setGenerating(null);
    },
    onError: (e: any) => { toast.error("Erro ao gerar: " + e.message); setGenerating(null); },
  });

  const markSent = trpc.followUps.markSent.useMutation({
    onSuccess: () => { toast.success("Marcado como enviado!"); utils.followUps.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const markResponded = trpc.followUps.markResponded.useMutation({
    onSuccess: () => { toast.success("Lead marcado como respondeu!"); utils.followUps.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-950 text-amber-300 border-amber-800",
      sent: "bg-blue-950 text-blue-300 border-blue-800",
      responded: "bg-emerald-950 text-emerald-300 border-emerald-800",
      skipped: "bg-zinc-900 text-zinc-400 border-zinc-700",
    };
    const labels: Record<string, string> = { pending: "Pendente", sent: "Enviado", responded: "Respondido", skipped: "Ignorado" };
    return <Badge className={`text-[10px] border px-2 py-0.5 ${map[status] || "bg-muted"}`}>{labels[status] || status}</Badge>;
  };

  return (
    <CRMLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Follow-ups</h1>
            <p className="text-sm text-muted-foreground">{followUps.length} follow-up(s) gerado(s)</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowCreateForm(true)} className="gap-2 border-border/50">
              <Plus className="h-4 w-4" /> Novo Follow-up
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
              const s = activeSetting;
              if (s) { setSettingsId(s.id); setSettingsForm({ name: s.name || "Padrão", intervalDays: s.intervalDays, maxAttempts: s.maxAttempts, isActive: s.isActive }); }
              setShowSettings(true);
            }} className="gap-2 border-border/50">
              <Settings className="h-4 w-4" /> Configurar
            </Button>
          </div>
        </div>

        {/* Active Settings Banner */}
        {activeSetting && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 text-sm">
            <Bell className="h-4 w-4 text-primary shrink-0" />
            <span>Follow-up automático ativo: a cada <strong className="text-primary">{activeSetting.intervalDays} dias</strong>, máximo <strong className="text-primary">{activeSetting.maxAttempts} tentativas</strong> por lead</span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-xl bg-card/50 border border-border/30 animate-pulse" />)}</div>
        ) : followUps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum follow-up gerado</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Os follow-ups são gerados automaticamente para leads sem resposta, ou você pode criar um manualmente.</p>
            <Button onClick={() => setShowCreateForm(true)} className="mt-4 gap-2" size="sm"><Plus className="h-4 w-4" /> Criar Follow-up Manual</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {(followUps as any[]).map((fu) => {
              const lead = (leads as any[]).find((l) => l.id === fu.leadId);
              return (
                <Card key={fu.id} className="border-border/40 bg-card/60 hover:border-primary/20 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-950/60 border border-blue-800/30 flex items-center justify-center shrink-0">
                          <MessageSquare className="h-4 w-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{lead?.companyName || `Lead #${fu.leadId}`}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(fu.scheduledAt)}
                            {fu.attemptNumber && <span className="ml-2 text-muted-foreground/60">· Tentativa #{fu.attemptNumber}</span>}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(fu.status)}
                    </div>

                    {fu.generatedMessage ? (
                      <div className="relative p-3 rounded-lg bg-background/50 border border-border/30 text-sm text-muted-foreground leading-relaxed">
                        <p className="whitespace-pre-wrap text-xs">{fu.generatedMessage}</p>
                        <div className="flex items-center gap-2 mt-3 flex-wrap">
                          <button onClick={() => { navigator.clipboard.writeText(fu.generatedMessage); toast.success("Copiado!"); }}
                            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                            <Copy className="h-3 w-3" /> Copiar
                          </button>
                          {lead?.whatsapp && (
                            <a href={getWhatsAppLink(lead.whatsapp, fu.generatedMessage)} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-xs text-green-400 hover:text-green-300 transition-colors">
                              <MessageSquare className="h-3 w-3" /> Abrir WhatsApp
                            </a>
                          )}
                          <div className="ml-auto flex items-center gap-2">
                            {fu.status === "pending" && (
                              <button onClick={() => markSent.mutate({ id: fu.id, leadId: fu.leadId })}
                                className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                Marcar como enviado
                              </button>
                            )}
                            {fu.status === "sent" && (
                              <button onClick={() => markResponded.mutate({ id: fu.id, leadId: fu.leadId })}
                                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                                <CheckCircle2 className="h-3 w-3" /> Lead respondeu
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setGenerating(fu.id); generateMessage.mutate({ leadId: fu.leadId, followUpId: fu.id }); }}
                          disabled={generating === fu.id} className="gap-2 h-7 text-xs border-primary/30 text-primary hover:bg-primary/10">
                          {generating === fu.id ? <><Loader2 className="h-3 w-3 animate-spin" /> Gerando...</> : <><Sparkles className="h-3 w-3" /> Gerar Mensagem</>}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Follow-up Manual Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-400" /> Novo Follow-up Manual</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!createForm.leadId) return toast.error("Selecione um lead");
            createFollowUp.mutate({
              leadId: createForm.leadId,
              scheduledAt: new Date(createForm.scheduledAt).toISOString(),
              attemptNumber: createForm.attemptNumber,
            });
          }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Lead / Empresa *</Label>
              <Select value={createForm.leadId ? String(createForm.leadId) : ""} onValueChange={(v) => setCreateForm({ ...createForm, leadId: parseInt(v) })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione o lead..." /></SelectTrigger>
                <SelectContent>{(leads as any[]).map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.companyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data Agendada</Label>
                <Input type="date" value={createForm.scheduledAt} onChange={(e) => setCreateForm({ ...createForm, scheduledAt: e.target.value })} className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Nº da Tentativa</Label>
                <Input type="number" min={1} max={20} value={createForm.attemptNumber} onChange={(e) => setCreateForm({ ...createForm, attemptNumber: parseInt(e.target.value) || 1 })} className="bg-background/50" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">Após criar, use o botão "Gerar Mensagem" para criar a mensagem personalizada com IA.</p>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createFollowUp.isPending} className="bg-primary text-primary-foreground">
                {createFollowUp.isPending ? "Criando..." : "Criar Follow-up"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Configurar Follow-up Automático</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveSettings.mutate({ ...settingsForm, id: settingsId }); }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Intervalo entre tentativas (dias)</Label>
              <Input type="number" min={1} max={30} value={settingsForm.intervalDays} onChange={(e) => setSettingsForm({ ...settingsForm, intervalDays: parseInt(e.target.value) || 3 })} className="bg-background/50" />
              <p className="text-xs text-muted-foreground">Quantos dias sem resposta antes de gerar um follow-up</p>
            </div>
            <div className="space-y-1.5">
              <Label>Máximo de tentativas por lead</Label>
              <Input type="number" min={1} max={20} value={settingsForm.maxAttempts} onChange={(e) => setSettingsForm({ ...settingsForm, maxAttempts: parseInt(e.target.value) || 5 })} className="bg-background/50" />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/30">
              <input type="checkbox" id="active" checked={settingsForm.isActive} onChange={(e) => setSettingsForm({ ...settingsForm, isActive: e.target.checked })} className="h-4 w-4 accent-primary" />
              <label htmlFor="active" className="text-sm cursor-pointer">Ativar follow-up automático</label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowSettings(false)}>Cancelar</Button>
              <Button type="submit" disabled={saveSettings.isPending} className="bg-primary text-primary-foreground">
                {saveSettings.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}
