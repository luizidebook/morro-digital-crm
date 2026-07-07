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
import { formatDateTime } from "@/lib/crm";
import { CalendarDays, CheckCircle2, ExternalLink, MapPin, Monitor, Plus, Video, XCircle } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function Meetings() {
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    leadId: 0,
    title: "",
    scheduledAt: new Date().toISOString().slice(0, 16),
    modality: "online" as "online" | "in_person",
    meetingLink: "",
    location: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: meetings = [], isLoading } = trpc.meetings.list.useQuery({});
  const { data: leads = [] } = trpc.leads.list.useQuery({});

  const createMeeting = trpc.meetings.create.useMutation({
    onSuccess: () => {
      toast.success("Reunião agendada!");
      utils.meetings.list.invalidate();
      setShowForm(false);
      setForm({ leadId: 0, title: "", scheduledAt: new Date().toISOString().slice(0, 16), modality: "online", meetingLink: "", location: "", notes: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMeeting = trpc.meetings.update.useMutation({
    onSuccess: () => { toast.success("Reunião atualizada!"); utils.meetings.list.invalidate(); },
    onError: (e: any) => toast.error(e.message),
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      scheduled: "border-violet-800/50 text-violet-400",
      done: "border-emerald-800/50 text-emerald-400",
      cancelled: "border-red-800/50 text-red-400",
      no_show: "border-amber-800/50 text-amber-400",
    };
    const labels: Record<string, string> = { scheduled: "Agendada", done: "Realizada", cancelled: "Cancelada", no_show: "Não compareceu" };
    return <Badge variant="outline" className={`text-xs ${styles[status] || ""}`}>{labels[status] || status}</Badge>;
  };

  return (
    <CRMLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reuniões</h1>
            <p className="text-sm text-muted-foreground">{meetings.length} reunião(ões) agendada(s)</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2 bg-primary text-primary-foreground">
            <Plus className="h-4 w-4" /> Nova Reunião
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-card/50 border border-border/30 animate-pulse" />)}</div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma reunião agendada</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Agende reuniões diretamente aqui ou a partir da página de um lead</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 gap-2" size="sm"><Plus className="h-4 w-4" /> Agendar Reunião</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {(meetings as any[]).map((meeting) => (
              <Card key={meeting.id} className="border-border/40 bg-card/60 hover:border-primary/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-xl bg-violet-950/60 border border-violet-800/30 flex items-center justify-center shrink-0">
                        {meeting.modality === "online" ? <Monitor className="h-5 w-5 text-violet-400" /> : <MapPin className="h-5 w-5 text-violet-400" />}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{meeting.title || "Reunião"}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDateTime(meeting.scheduledAt)}</p>
                        {meeting.meetingLink && (
                          <a href={meeting.meetingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-1">
                            <Video className="h-3 w-3" /> Abrir link da reunião <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {meeting.location && <p className="text-xs text-muted-foreground mt-0.5"><MapPin className="h-3 w-3 inline mr-1" />{meeting.location}</p>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant="outline" className={`text-xs ${meeting.modality === "online" ? "border-blue-800/50 text-blue-400" : "border-amber-800/50 text-amber-400"}`}>
                        {meeting.modality === "online" ? "Online" : "Presencial"}
                      </Badge>
                      {getStatusBadge(meeting.status)}

                      {/* Ações de atualização de status */}
                      {meeting.status === "scheduled" && (
                        <>
                          <button onClick={() => updateMeeting.mutate({ id: meeting.id, status: "done" })}
                            className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Marcar realizada
                          </button>
                          <button onClick={() => updateMeeting.mutate({ id: meeting.id, status: "no_show" })}
                            className="text-xs text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1">
                            Não compareceu
                          </button>
                          <button onClick={() => updateMeeting.mutate({ id: meeting.id, status: "cancelled" })}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Cancelar
                          </button>
                        </>
                      )}

                      <button onClick={() => setLocation(`/leads/${meeting.leadId}`)} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                        Ver lead <ExternalLink className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                  {meeting.notes && <p className="text-xs text-muted-foreground mt-3 pt-3 border-t border-border/30">{meeting.notes}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Meeting Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-violet-400" /> Agendar Reunião</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (!form.leadId) return toast.error("Selecione um lead");
            if (!form.title.trim()) return toast.error("Informe o título da reunião");
            createMeeting.mutate({
              leadId: form.leadId,
              title: form.title,
              scheduledAt: new Date(form.scheduledAt).toISOString(),
              modality: form.modality,
              meetingLink: form.meetingLink || undefined,
              location: form.location || undefined,
              notes: form.notes || undefined,
            });
          }} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Lead / Empresa *</Label>
              <Select value={form.leadId ? String(form.leadId) : ""} onValueChange={(v) => setForm({ ...form, leadId: parseInt(v) })}>
                <SelectTrigger className="bg-background/50"><SelectValue placeholder="Selecione o lead..." /></SelectTrigger>
                <SelectContent>{(leads as any[]).map((l) => <SelectItem key={l.id} value={String(l.id)}>{l.companyName}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Título *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Apresentação do Morro Digital" className="bg-background/50" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Data e Hora *</Label>
                <Input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="bg-background/50" />
              </div>
              <div className="space-y-1.5">
                <Label>Modalidade</Label>
                <Select value={form.modality} onValueChange={(v) => setForm({ ...form, modality: v as "online" | "in_person" })}>
                  <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="in_person">Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.modality === "online" ? (
              <div className="space-y-1.5">
                <Label>Link da Reunião</Label>
                <Input value={form.meetingLink} onChange={(e) => setForm({ ...form, meetingLink: e.target.value })} placeholder="https://meet.google.com/..." className="bg-background/50" />
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label>Local</Label>
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Endereço ou ponto de referência" className="bg-background/50" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Observações</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Pauta, objetivos da reunião..." className="bg-background/50 min-h-20" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
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
