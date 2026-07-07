import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  CHECKLIST_LABELS, formatCurrency, formatDate, formatDateTime, formatRelativeTime,
  getWhatsAppLink, INTERACTION_ICONS, INTERACTION_LABELS, SEGMENTS, STAGE_COLORS, STAGE_LABELS, STAGE_ORDER,
} from "@/lib/crm";
import {
  ArrowLeft, Building2, CalendarDays, CheckSquare, Clock, Edit, FileText,
  MessageSquare, Phone, Plus, Save, User, Zap,
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function LeadDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const leadId = parseInt(id || "0");
  const [editMode, setEditMode] = useState(false);
  const [showInteraction, setShowInteraction] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showAutoContractAlert, setShowAutoContractAlert] = useState(false);
  const [interactionForm, setInteractionForm] = useState({ type: "note" as any, content: "" });
  const [meetingForm, setMeetingForm] = useState({ title: "", scheduledAt: "", modality: "online" as any, meetingLink: "", location: "", notes: "" });
  const [editForm, setEditForm] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: lead, isLoading } = trpc.leads.get.useQuery({ id: leadId });

  // Sync editForm when lead data loads
  if (lead && !editForm) setEditForm(lead);
  const { data: checklist = [] } = trpc.checklist.getByLead.useQuery({ leadId });
  const { data: interactions = [] } = trpc.interactions.list.useQuery({ leadId });

  const updateStage = trpc.leads.updateStage.useMutation({
    onSuccess: () => { utils.leads.get.invalidate({ id: leadId }); utils.metrics.funnel.invalidate(); toast.success("Etapa atualizada!"); },
  });

  const updateLead = trpc.leads.update.useMutation({
    onSuccess: () => { utils.leads.get.invalidate({ id: leadId }); setEditMode(false); toast.success("Lead atualizado!"); },
  });

  const toggleChecklist = trpc.checklist.toggle.useMutation({
    onSuccess: () => { utils.checklist.getByLead.invalidate({ leadId }); utils.interactions.list.invalidate({ leadId }); },
  });

  const addInteraction = trpc.interactions.add.useMutation({
    onSuccess: () => { utils.interactions.list.invalidate({ leadId }); setShowInteraction(false); setInteractionForm({ type: "note", content: "" }); toast.success("Interação registrada!"); },
  });

  const createMeeting = trpc.meetings.create.useMutation({
    onSuccess: () => { utils.interactions.list.invalidate({ leadId }); setShowMeeting(false); toast.success("Reunião agendada!"); },
  });

  // Detectar proposta aceita sem contrato gerado
  const { data: proposals = [] } = trpc.proposals.list.useQuery({ leadId });
  const { data: contracts = [] } = trpc.contracts.list.useQuery({ leadId });
  const hasAcceptedProposal = (proposals as any[]).some((p: any) => p.status === "accepted");
  const hasContract = (contracts as any[]).length > 0;

  if (isLoading) return <CRMLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Carregando...</div></CRMLayout>;
  if (!lead) return <CRMLayout><div className="flex items-center justify-center h-64 text-muted-foreground">Lead não encontrado</div></CRMLayout>;

  const completedSteps = checklist.filter((c: any) => c.completed).length;
  const progress = checklist.length > 0 ? Math.round((completedSteps / checklist.length) * 100) : 0;

  return (
    <CRMLayout>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation("/leads")} className="p-2 rounded-lg hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <span className="text-base font-bold text-primary">{lead.companyName.charAt(0).toUpperCase()}</span>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{lead.companyName}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                {lead.segment && <span className="text-xs text-muted-foreground">{lead.segment}</span>}
                <Badge className={`text-[10px] border px-2 py-0.5 ${STAGE_COLORS[lead.stage] || "bg-muted"}`}>
                  {STAGE_LABELS[lead.stage]}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {lead.whatsapp && (
              <Button variant="outline" size="sm" className="gap-2 border-green-800/50 text-green-400 hover:bg-green-900/20"
                onClick={() => window.open(getWhatsAppLink(lead.whatsapp!), "_blank")}>
                <MessageSquare className="h-4 w-4" /> WhatsApp
              </Button>
            )}
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowMeeting(true)}>
              <CalendarDays className="h-4 w-4" /> Reunião
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => setShowInteraction(true)}>
              <Plus className="h-4 w-4" /> Interação
            </Button>
          </div>
        </div>

        {/* Stage Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {STAGE_ORDER.slice(0, 12).map((stage, i) => (
            <button key={stage} onClick={() => updateStage.mutate({ id: leadId, stage })}
              className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${lead.stage === stage ? `${STAGE_COLORS[stage]} ring-2 ring-primary/30` : "bg-card/50 border-border/30 text-muted-foreground hover:border-primary/30"}`}>
              {i + 1}. {STAGE_LABELS[stage]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left: Info + Checklist */}
          <div className="xl:col-span-2 space-y-4">
            <Tabs defaultValue="checklist">
              <TabsList className="bg-card/50 border border-border/30">
                <TabsTrigger value="checklist" className="gap-2"><CheckSquare className="h-3.5 w-3.5" /> Checklist ({completedSteps}/{checklist.length})</TabsTrigger>
                <TabsTrigger value="history" className="gap-2"><Clock className="h-3.5 w-3.5" /> Histórico ({interactions.length})</TabsTrigger>
                <TabsTrigger value="info" className="gap-2"><Building2 className="h-3.5 w-3.5" /> Dados</TabsTrigger>
              </TabsList>

              {/* Checklist Tab */}
              <TabsContent value="checklist" className="mt-3">
                <Card className="border-border/40 bg-card/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-semibold">Progresso do Funil</CardTitle>
                      <span className="text-sm font-bold text-primary">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1 pt-0">
                    {checklist.map((item: any) => {
                      const info = CHECKLIST_LABELS[item.step];
                      return (
                        <div key={item.step} className={`flex items-start gap-3 p-3 rounded-lg transition-all ${item.completed ? "bg-emerald-950/20 border border-emerald-800/20" : "hover:bg-accent/20"}`}>
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={(checked) => {
                              if (item.id) toggleChecklist.mutate({ id: item.id, completed: !!checked, leadId });
                            }}
                            className="mt-0.5 border-border data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                          />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>{info?.label || item.step}</p>
                            <p className="text-xs text-muted-foreground">{info?.description}</p>
                            {item.completedAt && <p className="text-[10px] text-emerald-400 mt-0.5">Concluído em {formatDate(item.completedAt)}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="mt-3">
                <Card className="border-border/40 bg-card/50">
                  <CardContent className="p-0">
                    {interactions.length === 0 ? (
                      <div className="p-8 text-center text-sm text-muted-foreground">Nenhuma interação registrada</div>
                    ) : (
                      <div className="relative">
                        <div className="absolute left-8 top-0 bottom-0 w-px bg-border/30" />
                        <div className="space-y-0">
                          {interactions.map((interaction: any, i: number) => (
                            <div key={interaction.id} className="flex gap-4 px-4 py-3 hover:bg-accent/10 transition-colors">
                              <div className="relative z-10 h-8 w-8 rounded-full bg-card border border-border/50 flex items-center justify-center shrink-0 text-sm">
                                {INTERACTION_ICONS[interaction.type] || "📌"}
                              </div>
                              <div className="flex-1 min-w-0 pt-1">
                                <p className="text-sm leading-snug">{interaction.content}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-border/40">
                                    {INTERACTION_LABELS[interaction.type]}
                                  </Badge>
                                  <span className="text-[10px] text-muted-foreground">{formatRelativeTime(interaction.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Info Tab */}
              <TabsContent value="info" className="mt-3">
                <Card className="border-border/40 bg-card/50">
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Dados da Empresa</CardTitle>
                    <Button variant="outline" size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setEditMode(!editMode)}>
                      <Edit className="h-3 w-3" /> {editMode ? "Cancelar" : "Editar"}
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {editMode && editForm ? (
                      <form onSubmit={(e) => { e.preventDefault(); updateLead.mutate({ id: leadId, ...editForm }); }} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1"><Label className="text-xs">Empresa</Label><Input value={editForm.companyName || ""} onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })} className="h-8 text-sm bg-background/50" /></div>
                          <div className="space-y-1"><Label className="text-xs">Segmento</Label>
                            <Select value={editForm.segment || ""} onValueChange={(v) => setEditForm({ ...editForm, segment: v })}>
                              <SelectTrigger className="h-8 text-sm bg-background/50"><SelectValue /></SelectTrigger>
                              <SelectContent>{SEGMENTS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1"><Label className="text-xs">Contato</Label><Input value={editForm.contactName || ""} onChange={(e) => setEditForm({ ...editForm, contactName: e.target.value })} className="h-8 text-sm bg-background/50" /></div>
                          <div className="space-y-1"><Label className="text-xs">WhatsApp</Label><Input value={editForm.whatsapp || ""} onChange={(e) => setEditForm({ ...editForm, whatsapp: e.target.value })} className="h-8 text-sm bg-background/50" /></div>
                          <div className="space-y-1"><Label className="text-xs">E-mail</Label><Input value={editForm.email || ""} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-8 text-sm bg-background/50" /></div>
                          <div className="space-y-1"><Label className="text-xs">Valor Mensal</Label><Input value={editForm.monthlyValue || ""} onChange={(e) => setEditForm({ ...editForm, monthlyValue: e.target.value })} className="h-8 text-sm bg-background/50" /></div>
                        </div>
                        <div className="space-y-1"><Label className="text-xs">Endereço</Label><Input value={editForm.address || ""} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="h-8 text-sm bg-background/50" /></div>
                        <div className="space-y-1"><Label className="text-xs">Observações</Label><Textarea value={editForm.notes || ""} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} className="text-sm bg-background/50 min-h-16" /></div>
                        <Button type="submit" size="sm" className="gap-1.5 bg-primary text-primary-foreground" disabled={updateLead.isPending}>
                          <Save className="h-3.5 w-3.5" /> {updateLead.isPending ? "Salvando..." : "Salvar"}
                        </Button>
                      </form>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {[
                          { label: "Empresa", value: lead.companyName },
                          { label: "Segmento", value: lead.segment },
                          { label: "Contato", value: lead.contactName },
                          { label: "WhatsApp", value: lead.whatsapp },
                          { label: "Telefone", value: lead.phone },
                          { label: "E-mail", value: lead.email },
                          { label: "Valor Mensal", value: formatCurrency(lead.monthlyValue) },
                          { label: "Origem", value: lead.source },
                          { label: "Cadastrado", value: formatDate(lead.createdAt) },
                          { label: "Último Contato", value: formatDate(lead.lastContactAt) },
                        ].map(({ label, value }) => value ? (
                          <div key={label}>
                            <p className="text-xs text-muted-foreground">{label}</p>
                            <p className="font-medium text-sm">{value}</p>
                          </div>
                        ) : null)}
                        {lead.address && <div className="col-span-2"><p className="text-xs text-muted-foreground">Endereço</p><p className="font-medium text-sm">{lead.address}</p></div>}
                        {lead.notes && <div className="col-span-2"><p className="text-xs text-muted-foreground">Observações</p><p className="text-sm text-muted-foreground">{lead.notes}</p></div>}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right: Quick Actions */}
          <div className="space-y-4">
            {/* Alerta automação: proposta aceita sem contrato */}
            {hasAcceptedProposal && !hasContract && (
              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-700/40 space-y-2">
                <div className="flex items-center gap-2 text-amber-300">
                  <Zap className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-semibold">Proposta aceita! Gerar contrato?</p>
                </div>
                <p className="text-xs text-amber-400/70">Uma proposta foi aceita por este lead. Crie o contrato agora para avançar o fluxo.</p>
                <Button
                  size="sm"
                  className="w-full h-8 text-xs bg-amber-700 hover:bg-amber-600 text-white"
                  onClick={() => setLocation(`/contracts?leadId=${leadId}`)}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" /> Criar Contrato Agora
                </Button>
              </div>
            )}

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Ações Rápidas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9 border-border/40" onClick={() => setLocation(`/proposals?leadId=${leadId}`)}>
                  <FileText className="h-4 w-4 text-amber-400" /> Criar Proposta
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9 border-border/40" onClick={() => {
                  const acceptedProposal = (proposals as any[]).find((p: any) => p.status === "accepted");
                  const query = acceptedProposal
                    ? `/contracts?leadId=${leadId}&proposalId=${acceptedProposal.id}&monthlyValue=${encodeURIComponent(acceptedProposal.monthlyValue || "")}`
                    : `/contracts?leadId=${leadId}`;
                  setLocation(query);
                }}>
                  <FileText className="h-4 w-4 text-emerald-400" /> Criar Contrato
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9 border-border/40" onClick={() => setLocation(`/trials?leadId=${leadId}`)}>
                  <Clock className="h-4 w-4 text-cyan-400" /> Iniciar Trial
                </Button>
                <Button variant="outline" className="w-full justify-start gap-2 text-sm h-9 border-border/40" onClick={() => setLocation(`/follow-ups?leadId=${leadId}`)}>
                  <MessageSquare className="h-4 w-4 text-blue-400" /> Follow-up
                </Button>
              </CardContent>
            </Card>

            <Card className="border-border/40 bg-card/50">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">Resumo</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Etapa</span><Badge className={`text-[10px] border ${STAGE_COLORS[lead.stage]}`}>{STAGE_LABELS[lead.stage]}</Badge></div>
                {lead.monthlyValue && <div className="flex justify-between"><span className="text-muted-foreground">Valor</span><span className="font-semibold text-amber-400">{formatCurrency(lead.monthlyValue)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Progresso</span><span className="font-semibold text-primary">{progress}%</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Interações</span><span>{interactions.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Cadastrado</span><span>{formatDate(lead.createdAt)}</span></div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Add Interaction Dialog */}
      <Dialog open={showInteraction} onOpenChange={setShowInteraction}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader><DialogTitle>Registrar Interação</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addInteraction.mutate({ leadId, ...interactionForm }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={interactionForm.type} onValueChange={(v) => setInteractionForm({ ...interactionForm, type: v as any })}>
                <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(INTERACTION_LABELS).filter(([k]) => k !== "system" && k !== "stage_change").map(([k, v]) => (
                    <SelectItem key={k} value={k}>{INTERACTION_ICONS[k]} {v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Descrição</Label>
              <Textarea value={interactionForm.content} onChange={(e) => setInteractionForm({ ...interactionForm, content: e.target.value })} placeholder="Descreva a interação..." className="bg-background/50 min-h-24" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowInteraction(false)}>Cancelar</Button>
              <Button type="submit" disabled={addInteraction.isPending} className="bg-primary text-primary-foreground">
                {addInteraction.isPending ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Schedule Meeting Dialog */}
      <Dialog open={showMeeting} onOpenChange={setShowMeeting}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Agendar Reunião</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMeeting.mutate({ leadId, ...meetingForm }); }} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Título</Label>
              <Input value={meetingForm.title} onChange={(e) => setMeetingForm({ ...meetingForm, title: e.target.value })} placeholder="Ex: Apresentação Morro Digital" className="bg-background/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data e Hora</Label>
                <Input type="datetime-local" value={meetingForm.scheduledAt} onChange={(e) => setMeetingForm({ ...meetingForm, scheduledAt: e.target.value })} className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Modalidade</Label>
                <Select value={meetingForm.modality} onValueChange={(v) => setMeetingForm({ ...meetingForm, modality: v as any })}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in_person">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {meetingForm.modality === "online" ? (
              <div className="space-y-1.5">
                <Label>Link da Reunião</Label>
                <Input value={meetingForm.meetingLink} onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." className="bg-background/50" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Local</Label>
                <Input value={meetingForm.location} onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })} placeholder="Endereço do encontro" className="bg-background/50" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={meetingForm.notes} onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })} className="bg-background/50 min-h-16" />
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setShowMeeting(false)}>Cancelar</Button>
              <Button type="submit" disabled={createMeeting.isPending} className="bg-primary text-primary-foreground">
                {createMeeting.isPending ? "Agendando..." : "Agendar Reunião"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </CRMLayout>
  );
}
