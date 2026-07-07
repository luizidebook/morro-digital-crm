import CRMLayout from "@/components/CRMLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { STAGE_LABELS, STAGE_ORDER } from "@/lib/crm";
import { Bell, Building2, MessageSquare, Settings as SettingsIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Settings() {
  const [followUpForm, setFollowUpForm] = useState({
    name: "Padrão",
    intervalDays: 3,
    maxAttempts: 5,
    isActive: true,
  });

  const utils = trpc.useUtils();
  const { data: settings = [] } = trpc.followUps.settings.useQuery();
  const activeSetting = (settings as any[])[0];

  // Hidratar o formulário com os dados reais do banco quando carregados
  useEffect(() => {
    if (activeSetting) {
      setFollowUpForm({
        name: activeSetting.name ?? "Padrão",
        intervalDays: activeSetting.intervalDays ?? 3,
        maxAttempts: activeSetting.maxAttempts ?? 5,
        isActive: activeSetting.isActive ?? true,
      });
    }
  }, [activeSetting?.id]);

  const saveSetting = trpc.followUps.saveSetting.useMutation({
    onSuccess: () => {
      toast.success("Configurações de follow-up salvas!");
      utils.followUps.settings.invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleFollowUpSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSetting.mutate({ ...followUpForm, id: activeSetting?.id });
  };

  return (
    <CRMLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie as configurações do sistema CRM</p>
        </div>

        {/* Follow-up Settings */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquare className="h-5 w-5 text-blue-400" /> Follow-up Automático
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleFollowUpSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nome da configuração</Label>
                  <Input
                    value={followUpForm.name}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, name: e.target.value })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Intervalo entre tentativas (dias)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={30}
                    value={followUpForm.intervalDays}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, intervalDays: parseInt(e.target.value) || 3 })}
                    className="bg-background/50"
                  />
                  <p className="text-xs text-muted-foreground">Dias sem resposta antes de gerar um follow-up</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Máximo de tentativas por lead</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={followUpForm.maxAttempts}
                    onChange={(e) => setFollowUpForm({ ...followUpForm, maxAttempts: parseInt(e.target.value) || 5 })}
                    className="bg-background/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <div className="flex items-center gap-3 h-9">
                    <Switch
                      checked={followUpForm.isActive}
                      onCheckedChange={(v) => setFollowUpForm({ ...followUpForm, isActive: v })}
                    />
                    <span className="text-sm">{followUpForm.isActive ? "Ativo" : "Inativo"}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={saveSetting.isPending}
                  size="sm"
                  className="bg-primary text-primary-foreground"
                >
                  {saveSetting.isPending ? "Salvando..." : "Salvar Configurações"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-primary" /> Sobre o Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              {[
                { label: "Sistema", value: "Morro Digital CRM" },
                { label: "Versão", value: "1.1.0" },
                { label: "Funil", value: `${STAGE_ORDER.length} etapas configuradas` },
                { label: "Automação", value: "Follow-up com IA ativo" },
                { label: "Integrações", value: "WhatsApp, LLM (IA), Propostas e Contratos Digitais" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between py-2 border-b border-border/20 last:border-0"
                >
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Funnel Stages — gerado dinamicamente a partir das constantes canônicas */}
        <Card className="border-border/40 bg-card/60">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <SettingsIcon className="h-5 w-5 text-violet-400" /> Etapas do Funil de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {STAGE_ORDER.map((stage, i) => (
                <div
                  key={stage}
                  className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0"
                >
                  <div className="h-6 w-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-primary">{i + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{STAGE_LABELS[stage]}</p>
                    <p className="text-xs text-muted-foreground font-mono text-primary/50">{stage}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  );
}
