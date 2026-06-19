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
import { formatDate } from "@/lib/crm";
import { Gift, Plus, Share2, Users } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Referrals() {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    referrerLeadId: 0,
    referredName: "",
    referredPhone: "",
    referredEmail: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: referrals = [], isLoading } = trpc.referrals.list.useQuery({});
  const { data: leads = [] } = trpc.leads.list.useQuery({});

  const createReferral = trpc.referrals.create.useMutation({
    onSuccess: () => { toast.success("Indicação registrada!"); utils.referrals.list.invalidate(); setShowForm(false); },
    onError: (e: any) => toast.error(e.message),
  });

  const grantBenefit = trpc.referrals.update.useMutation({
    onSuccess: () => { toast.success("Benefício concedido!"); utils.referrals.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-amber-950 text-amber-300 border-amber-800",
      contacted: "bg-blue-950 text-blue-300 border-blue-800",
      converted: "bg-emerald-950 text-emerald-300 border-emerald-800",
      lost: "bg-red-950 text-red-300 border-red-800",
    };
    const labels: Record<string, string> = { pending: "Pendente", contacted: "Contactado", converted: "Convertida", lost: "Perdida" };
    return <Badge className={`text-[10px] border px-2 py-0.5 ${map[status] || "bg-muted"}`}>{labels[status] || status}</Badge>;
  };

  const getLead = (id: number) => (leads as any[]).find((l) => l.id === id);

  return (
    <CRMLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Indicações</h1>
            <p className="text-sm text-muted-foreground">{referrals.length} indicação(ões) registrada(s)</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Nova Indicação
          </Button>
        </div>

        {/* Stats */}
        {(referrals as any[]).length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Total", value: referrals.length, icon: Share2, color: "text-violet-400" },
              { label: "Convertidas", value: (referrals as any[]).filter((r) => r.status === "converted").length, icon: Users, color: "text-emerald-400" },
              { label: "Benefícios Pendentes", value: (referrals as any[]).filter((r) => r.status === "converted" && !r.benefitGrantedAt).length, icon: Gift, color: "text-amber-400" },
            ].map((stat) => (
              <Card key={stat.label} className="border-border/40 bg-card/60">
                <CardContent className="p-3 flex items-center gap-3">
                  <stat.icon className={`h-5 w-5 ${stat.color} shrink-0`} />
                  <div>
                    <p className="text-lg font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-card/50 border border-border/30 animate-pulse" />)}</div>
        ) : referrals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Share2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma indicação registrada</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Registre indicações de clientes ativos para rastrear benefícios</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2" size="sm"><Plus className="h-4 w-4" /> Registrar Indicação</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {(referrals as any[]).map((referral) => {
              const referrer = getLead(referral.referrerLeadId);
              return (
                <Card key={referral.id} className="border-border/40 bg-card/60 hover:border-primary/20 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-xl bg-violet-950/60 border border-violet-800/30 flex items-center justify-center shrink-0">
                          <Share2 className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm">{referrer?.companyName || `Lead #${referral.referrerLeadId}`}</p>
                            <span className="text-xs text-muted-foreground">indicou</span>
                            <p className="font-semibold text-sm text-primary">{referral.referredName}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(referral.createdAt)}</p>
                          {referral.referredPhone && <p className="text-xs text-muted-foreground mt-0.5">📱 {referral.referredPhone}</p>}
                          {referral.benefitDescription && (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Gift className="h-3 w-3 text-amber-400" />
                              <span className="text-xs text-amber-400">{referral.benefitDescription}</span>
                              {referral.benefitGrantedAt && <span className="text-xs text-emerald-400">(concedido em {formatDate(referral.benefitGrantedAt)})</span>}
                            </div>
                          )}
                          {referral.notes && <p className="text-xs text-muted-foreground mt-1">{referral.notes}</p>}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getStatusBadge(referral.status)}
                        {referral.status === "converted" && !referral.benefitGrantedAt && referral.benefitDescription && (
                          <button onClick={() => grantBenefit.mutate({ id: referral.id, benefitGrantedAt: new Date().toISOString() })}
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                            <Gift className="h-3 w-3" /> Conceder benefício
                          </button>
                        )}
                        {referral.status === "pending" && (
                          <button onClick={() => grantBenefit.mutate({ id: referral.id, status: "converted" })}
                            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                            Marcar convertida
                          </button>
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
            <DialogTitle className="flex items-center gap-2"><Share2 className="h-5 w-5 text-violet-400" /> Registrar Indicação</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!form.referrerLeadId) return toast.error("Selecione o indicador");
            if (!form.referredName.trim()) return toast.error("Informe o nome do indicado");
            createReferral.mutate({
              referrerLeadId: form.referrerLeadId,
              referredName: form.referredName,
              referredPhone: form.referredPhone || undefined,
              referredEmail: form.referredEmail || undefined,
              notes: form.notes || undefined,
            });
          }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Quem indicou (cliente ativo) *</Label>
              <Select value={form.referrerLeadId ? String(form.referrerLeadId) : ""} onValueChange={(v) => setForm({ ...form, referrerLeadId: parseInt(v) })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione o indicador..." /></SelectTrigger>
                <SelectContent>{(leads as any[]).map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.companyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nome do indicado *</Label>
              <Input value={form.referredName} onChange={(e) => setForm({ ...form, referredName: e.target.value })} placeholder="Nome da empresa ou pessoa indicada" className="bg-background/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>WhatsApp do indicado</Label>
                <Input value={form.referredPhone} onChange={(e) => setForm({ ...form, referredPhone: e.target.value })} placeholder="(75) 99999-9999" className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>E-mail do indicado</Label>
                <Input value={form.referredEmail} onChange={(e) => setForm({ ...form, referredEmail: e.target.value })} placeholder="email@empresa.com" className="bg-background/50" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Contexto da indicação..." className="bg-background/50 min-h-20" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button type="submit" disabled={createReferral.isPending} className="bg-primary text-primary-foreground">
                {createReferral.isPending ? "Registrando..." : "Registrar Indicação"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}
