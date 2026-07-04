import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate, getWhatsAppLink } from "@/lib/crm";
import { Copy, ExternalLink, FileSignature, FileText, Loader2, MessageSquare, Plus, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { toast } from "sonner";

const getAbsoluteContractUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${window.location.origin}${url.startsWith("/") ? url : `/${url}`}`;
};

export default function Proposals() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedLeadId = params.get("leadId") ? parseInt(params.get("leadId")!) : undefined;

  const [showForm, setShowForm] = useState(!!preselectedLeadId);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({
    leadId: preselectedLeadId || 0,
    title: "Proposta Comercial — Morro Digital",
    planName: "Plano Essencial Morro Digital",
    monthlyValue: "",
    setupFee: "",
    validUntil: "",
    customMessage: "",
    features: "Página personalizada no site Morro Digital\nFotos profissionais do estabelecimento\nPresença no mapa interativo\nAtualização mensal de informações\nDivulgação nas redes sociais\nSuporte dedicado",
  });
  const [generatedMsg, setGeneratedMsg] = useState("");

  const utils = trpc.useUtils();
  const { data: proposals = [], isLoading } = trpc.proposals.list.useQuery({});
  const { data: leads = [] } = trpc.leads.list.useQuery({});

  const createProposal = trpc.proposals.create.useMutation({
    onSuccess: () => {
      toast.success("Proposta criada com sucesso!");
      utils.proposals.list.invalidate();
      setShowForm(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const generateMessage = trpc.llm.generateProposalMessage.useMutation({
    onSuccess: (data) => { setGeneratedMsg(data.message); setGenerating(false); },
    onError: (e) => { toast.error("Erro ao gerar mensagem: " + e.message); setGenerating(false); },
  });

  const generateDigitalContract = trpc.contracts.generateDigitalFromProposal.useMutation({
    onSuccess: (data) => {
      toast.success(data.reused ? "Contrato digital já existia!" : "Contrato digital gerado!");
      utils.contracts.list.invalidate();
      if (data.signingUrl) {
        navigator.clipboard.writeText(getAbsoluteContractUrl(data.signingUrl));
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const handleGenerate = () => {
    if (!form.leadId) return toast.error("Selecione um lead primeiro");
    setGenerating(true);
    generateMessage.mutate({ leadId: form.leadId, planName: form.planName, monthlyValue: form.monthlyValue });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.leadId) return toast.error("Selecione um lead");
    if (!form.monthlyValue) return toast.error("Informe o valor mensal");
    createProposal.mutate({
      leadId: form.leadId,
      title: form.title,
      planName: form.planName,
      monthlyValue: form.monthlyValue,
      setupFee: form.setupFee || undefined,
      customMessage: generatedMsg || form.customMessage || undefined,
      features: form.features ? form.features.split("\n").filter(Boolean) : undefined,
    });
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: "bg-slate-800 text-slate-300 border-slate-700",
      sent: "bg-blue-950 text-blue-300 border-blue-800",
      accepted: "bg-emerald-950 text-emerald-300 border-emerald-800",
      rejected: "bg-red-950 text-red-300 border-red-800",
      expired: "bg-zinc-900 text-zinc-400 border-zinc-700",
    };
    const labels: Record<string, string> = { draft: "Rascunho", sent: "Enviada", accepted: "Aceita", rejected: "Recusada", expired: "Expirada" };
    return <Badge className={`text-[10px] border px-2 py-0.5 ${map[status] || "bg-muted"}`}>{labels[status] || status}</Badge>;
  };

  return (
    <CRMLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Propostas</h1>
            <p className="text-sm text-muted-foreground">{proposals.length} proposta(s) criada(s)</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Nova Proposta
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-card/50 border border-border/30 animate-pulse" />)}</div>
        ) : proposals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileText className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma proposta criada</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2" size="sm"><Plus className="h-4 w-4" /> Criar Proposta</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {proposals.map((proposal: any) => (
              <Card key={proposal.id} className="border-border/40 bg-card/60 hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-amber-950/60 border border-amber-800/30 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-amber-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{proposal.planName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(proposal.createdAt)}</p>
                        <p className="text-sm font-bold text-amber-400 mt-1">{formatCurrency(proposal.monthlyValue)}/mês</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(proposal.status)}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/proposals/view/${proposal.shareToken}`); toast.success("Link copiado!"); }}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors" title="Copiar link"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => window.open(`/proposals/view/${proposal.shareToken}`, "_blank")}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors" title="Visualizar"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                        {proposal.status === "accepted" && (
                          <button
                            onClick={() => generateDigitalContract.mutate({ proposalId: proposal.id })}
                            className="p-1.5 rounded-md hover:bg-accent text-emerald-400 transition-colors" title="Gerar contrato digital"
                            disabled={generateDigitalContract.isPending}
                          >
                            <FileSignature className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => setLocation(`/leads/${proposal.leadId}`)}
                          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors text-xs"
                        >
                          Lead
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Proposal Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-amber-400" /> Nova Proposta Comercial
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Lead / Empresa *</Label>
                <Select value={form.leadId ? String(form.leadId) : ""} onValueChange={(v) => setForm({ ...form, leadId: parseInt(v) })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione o lead..." /></SelectTrigger>
                  <SelectContent>{(leads as any[]).map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.companyName}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nome do Plano</Label>
                <Input value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Valor Mensal (R$) *</Label>
                <Input value={form.monthlyValue} onChange={(e) => setForm({ ...form, monthlyValue: e.target.value })} placeholder="299.00" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Taxa de Implantação (R$)</Label>
                <Input value={form.setupFee} onChange={(e) => setForm({ ...form, setupFee: e.target.value })} placeholder="0.00" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Válida até</Label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} className="bg-background/50" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Funcionalidades incluídas</Label>
              <Textarea value={form.features} onChange={(e) => setForm({ ...form, features: e.target.value })} className="bg-background/50 min-h-28 text-sm" placeholder="Uma por linha..." />
            </div>

            {/* AI Message Generator */}
            <div className="space-y-2 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Mensagem Personalizada (IA)</Label>
                <Button type="button" size="sm" variant="outline" onClick={handleGenerate} disabled={generating || !form.leadId} className="gap-2 h-7 text-xs border-primary/30 text-primary hover:bg-primary/10">
                  {generating ? <><Loader2 className="h-3 w-3 animate-spin" /> Gerando...</> : <><Sparkles className="h-3 w-3" /> Gerar com IA</>}
                </Button>
              </div>
              {generatedMsg ? (
                <div className="relative">
                  <Textarea value={generatedMsg} onChange={(e) => setGeneratedMsg(e.target.value)} className="bg-background/50 min-h-24 text-sm" />
                  <button type="button" onClick={() => { navigator.clipboard.writeText(generatedMsg); toast.success("Copiado!"); }}
                    className="absolute top-2 right-2 p-1.5 rounded-md bg-card/80 hover:bg-card text-muted-foreground transition-colors">
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">Selecione um lead e clique em "Gerar com IA" para criar uma mensagem personalizada para WhatsApp.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createProposal.isPending} className="bg-primary text-primary-foreground">
                {createProposal.isPending ? "Criando..." : "Criar Proposta"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}