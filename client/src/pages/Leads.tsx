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
import { formatDate, getWhatsAppLink, SEGMENTS, STAGE_COLORS, STAGE_LABELS, STAGE_ORDER } from "@/lib/crm";
import {
  Building2,
  ExternalLink,
  MessageSquare,
  Phone,
  Plus,
  Search,
  SlidersHorizontal,
  User,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Leads() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    companyName: "", segment: "", contactName: "", phone: "", whatsapp: "", email: "", address: "", website: "", notes: "", source: "", monthlyValue: "",
  });

  const utils = trpc.useUtils();
  const { data: leads = [], isLoading } = trpc.leads.list.useQuery({
    search: search || undefined,
    stage: stageFilter !== "all" ? stageFilter : undefined,
  });

  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      toast.success("Lead cadastrado com sucesso!");
      utils.leads.list.invalidate();
      utils.metrics.funnel.invalidate();
      setShowForm(false);
      setForm({ companyName: "", segment: "", contactName: "", phone: "", whatsapp: "", email: "", address: "", website: "", notes: "", source: "", monthlyValue: "" });
    },
    onError: (e) => toast.error(e.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return toast.error("Nome da empresa é obrigatório");
    createLead.mutate(form);
  };

  const stageGroups = STAGE_ORDER.reduce((acc, stage) => {
    const count = leads.filter((l: any) => l.stage === stage).length;
    if (count > 0) acc[stage] = count;
    return acc;
  }, {} as Record<string, number>);

  return (
    <CRMLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
            <p className="text-sm text-muted-foreground">{leads.length} lead{leads.length !== 1 ? "s" : ""} encontrado{leads.length !== 1 ? "s" : ""}</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Novo Lead
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar empresa, contato ou WhatsApp..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card border-border/50" />
          </div>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-full sm:w-52 bg-card border-border/50">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por etapa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as etapas</SelectItem>
              {STAGE_ORDER.map((s) => (
                <SelectItem key={s} value={s}>{STAGE_LABELS[s]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stage summary pills */}
        {Object.keys(stageGroups).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {Object.entries(stageGroups).map(([stage, count]) => (
              <button key={stage} onClick={() => setStageFilter(stage === stageFilter ? "all" : stage)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${STAGE_COLORS[stage] || "bg-muted text-muted-foreground border-border"} ${stageFilter === stage ? "ring-2 ring-primary/50" : ""}`}>
                {STAGE_LABELS[stage]} · {count}
              </button>
            ))}
          </div>
        )}

        {/* Leads Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 rounded-xl bg-card/50 border border-border/30 animate-pulse" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhum lead encontrado</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Cadastre o primeiro lead para começar</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2" size="sm">
              <Plus className="h-4 w-4" /> Cadastrar Lead
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {leads.map((lead: any) => (
              <Card key={lead.id} className="border-border/40 bg-card/60 hover:bg-card/80 hover:border-primary/20 transition-all cursor-pointer group"
                onClick={() => setLocation(`/leads/${lead.id}`)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">{lead.companyName.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-sm leading-tight">{lead.companyName}</p>
                        {lead.segment && <p className="text-xs text-muted-foreground">{lead.segment}</p>}
                      </div>
                    </div>
                    <Badge className={`text-[10px] border px-2 py-0.5 ${STAGE_COLORS[lead.stage] || "bg-muted text-muted-foreground border-border"}`}>
                      {STAGE_LABELS[lead.stage] || lead.stage}
                    </Badge>
                  </div>

                  {lead.contactName && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <User className="h-3 w-3" /> {lead.contactName}
                    </div>
                  )}
                  {lead.whatsapp && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                      <Phone className="h-3 w-3" /> {lead.whatsapp}
                    </div>
                  )}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <span className="text-[10px] text-muted-foreground">{formatDate(lead.createdAt)}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {lead.whatsapp && (
                        <button
                          onClick={(e) => { e.stopPropagation(); window.open(getWhatsAppLink(lead.whatsapp), "_blank"); }}
                          className="p-1.5 rounded-md hover:bg-green-900/40 text-green-400 transition-colors"
                          title="Abrir WhatsApp"
                        >
                          <MessageSquare className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button className="p-1.5 rounded-md hover:bg-accent text-muted-foreground transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Lead Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" /> Cadastrar Novo Lead
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nome da Empresa *</Label>
                <Input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} placeholder="Ex: Pousada Paraíso" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Segmento</Label>
                <Select value={form.segment} onValueChange={(v) => setForm({ ...form, segment: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Nome do Contato</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} placeholder="Ex: João Silva" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp</Label>
                <Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="(75) 99999-9999" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(75) 3333-3333" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="contato@empresa.com" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Valor Mensal (R$)</Label>
                <Input value={form.monthlyValue} onChange={(e) => setForm({ ...form, monthlyValue: e.target.value })} placeholder="Ex: 299.00" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Origem</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger className="bg-background/50"><SelectValue placeholder="Como chegou até nós?" /></SelectTrigger>
                  <SelectContent>
                    {["Indicação", "Instagram", "WhatsApp", "Visita presencial", "Site", "Google", "Outro"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Endereço</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Rua, número, bairro — Morro de São Paulo" className="bg-background/50" />
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Informações adicionais sobre o lead..." className="bg-background/50 min-h-20" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createLead.isPending} className="bg-primary text-primary-foreground">
                {createLead.isPending ? "Salvando..." : "Cadastrar Lead"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}
