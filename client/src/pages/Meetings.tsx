import CRMLayout from "@/components/CRMLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { formatDateTime } from "@/lib/crm";
import { CalendarDays, ExternalLink, MapPin, Monitor, Video } from "lucide-react";
import { useLocation } from "wouter";

export default function Meetings() {
  const [, setLocation] = useLocation();
  const { data: meetings = [], isLoading } = trpc.meetings.list.useQuery({});

  return (
    <CRMLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reuniões</h1>
            <p className="text-sm text-muted-foreground">{meetings.length} reunião(ões) agendada(s)</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-24 rounded-xl bg-card/50 border border-border/30 animate-pulse" />)}</div>
        ) : meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma reunião agendada</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Agende reuniões a partir da página de um lead</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((meeting: any) => (
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
                      <Badge variant="outline" className={`text-xs ${meeting.status === "scheduled" ? "border-violet-800/50 text-violet-400" : meeting.status === "done" ? "border-emerald-800/50 text-emerald-400" : "border-red-800/50 text-red-400"}`}>
                        {meeting.status === "scheduled" ? "Agendada" : meeting.status === "done" ? "Realizada" : "Cancelada"}
                      </Badge>
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
    </CRMLayout>
  );
}
