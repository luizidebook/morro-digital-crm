import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/crm";
import { CheckCircle2, FileSignature, Plus } from "lucide-react";
import { useState } from "react";
import { useSearch } from "wouter";
import { toast } from "sonner";

export default function Contracts() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const preselectedLeadId = params.get("leadId") ? parseInt(params.get("leadId")!) : undefined;

  const [showForm, setShowForm] = useState(!!preselectedLeadId);
  const [form, setForm] = useState({
    leadId: preselectedLeadId || 0,
    title: "Contrato de Prestação de Serviços — Morro Digital",
    monthlyValue: "",
    startDate: "",
    endDate: "",
    content: `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS

Pelo presente instrumento, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços Digitais, que se regerá pelas cláusulas e condições seguintes:

CLÁUSULA 1ª — DO OBJETO
A CONTRATADA prestará ao CONTRATANTE os seguintes serviços de presença digital em Morro de São Paulo:
- Página personalizada no portal Morro Digital
- Produção fotográfica profissional do estabelecimento
- Inclusão no mapa interativo do portal
- Atualização mensal de informações e imagens
- Divulgação nas redes sociais do Morro Digital

CLÁUSULA 2ª — DO VALOR E FORMA DE PAGAMENTO
O CONTRATANTE pagará à CONTRATADA o valor mensal de R$ [VALOR], a ser pago até o dia [DIA] de cada mês.

CLÁUSULA 3ª — DO PRAZO
O presente contrato tem vigência de 12 (doze) meses, com renovação automática, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 dias.

CLÁUSULA 4ª — DAS OBRIGAÇÕES
O CONTRATANTE se compromete a fornecer as informações e materiais necessários para a execução dos serviços.

Morro de São Paulo, [DATA].`,
  });

  const utils = trpc.useUtils();
  const { data: contracts = [], isLoading } = trpc.contracts.list.useQuery({});
  const { data: leads = [] } = trpc.leads.list.useQuery({});

  const createContract = trpc.contracts.create.useMutation({
    onSuccess: () => { toast.success("Contrato criado!"); utils.contracts.list.invalidate(); setShowForm(false); },
    onError: (e) => toast.error(e.message),
  });

  const sendContract = trpc.contracts.send.useMutation({
    onSuccess: () => { toast.success("Contrato marcado como enviado!"); utils.contracts.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const signContract = trpc.contracts.sign.useMutation({
    onSuccess: () => { toast.success("Contrato marcado como assinado!"); utils.contracts.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      draft: "bg-slate-800 text-slate-300 border-slate-700",
      sent: "bg-blue-950 text-blue-300 border-blue-800",
      signed: "bg-emerald-950 text-emerald-300 border-emerald-800",
      cancelled: "bg-red-950 text-red-300 border-red-800",
    };
    const labels: Record<string, string> = { draft: "Rascunho", sent: "Enviado", signed: "Assinado", cancelled: "Cancelado" };
    return <Badge className={`text-[10px] border px-2 py-0.5 ${map[status] || "bg-muted"}`}>{labels[status] || status}</Badge>;
  };

  return (
    <CRMLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
            <p className="text-sm text-muted-foreground">{contracts.length} contrato(s)</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Novo Contrato
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-card/50 border border-border/30 animate-pulse" />)}</div>
        ) : contracts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <FileSignature className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum contrato criado</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2" size="sm"><Plus className="h-4 w-4" /> Criar Contrato</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {contracts.map((contract: any) => (
              <Card key={contract.id} className="border-border/40 bg-card/60 hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-950/60 border border-emerald-800/30 flex items-center justify-center shrink-0">
                        <FileSignature className="h-5 w-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{contract.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Criado em {formatDate(contract.createdAt)}</p>
                        {contract.monthlyValue && <p className="text-sm font-bold text-emerald-400 mt-1">{formatCurrency(contract.monthlyValue)}/mês</p>}
                        {contract.signedAt && <p className="text-xs text-emerald-400 mt-0.5 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Assinado em {formatDate(contract.signedAt)}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(contract.status)}
                      {contract.status === "draft" && (
                        <button onClick={() => sendContract.mutate({ id: contract.id, leadId: contract.leadId })}
                          className="text-xs text-blue-400 hover:text-blue-300 transition-colors">Marcar como enviado</button>
                      )}
                      {contract.status === "sent" && (
                        <button onClick={() => signContract.mutate({ id: contract.id, leadId: contract.leadId })}
                          className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Marcar como assinado</button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-emerald-400" /> Novo Contrato
            </DialogTitle>
          </DialogHeader>
            <form onSubmit={(e) => { e.preventDefault(); if (!form.leadId) return toast.error("Selecione um lead"); createContract.mutate({ leadId: form.leadId, title: form.title, content: form.content, monthlyValue: form.monthlyValue || undefined }); }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Lead / Empresa *</Label>
              <Select value={form.leadId ? String(form.leadId) : ""} onValueChange={(v) => setForm({ ...form, leadId: parseInt(v) })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione o lead..." /></SelectTrigger>
                <SelectContent>{(leads as any[]).map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.companyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Título do Contrato</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="bg-background/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor Mensal (R$)</Label>
                <Input value={form.monthlyValue} onChange={(e) => setForm({ ...form, monthlyValue: e.target.value })} placeholder="299.00" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Data de Início</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="bg-background/50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Corpo do Contrato</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="bg-background/50 min-h-64 text-xs font-mono" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createContract.isPending} className="bg-primary text-primary-foreground">
                {createContract.isPending ? "Criando..." : "Criar Contrato"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}
