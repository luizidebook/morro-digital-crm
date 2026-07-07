import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/crm";
import { Building2, CheckCircle2, Clock, FileText, ThumbsDown, ThumbsUp, XCircle, AlertCircle } from "lucide-react";
import { useParams } from "wouter";
import { useState } from "react";
import { toast } from "sonner";

export default function ProposalView() {
  const { token } = useParams<{ token: string }>();
  const { data: proposal, isLoading, refetch } = trpc.proposals.getByToken.useQuery({ token });
  const { data: config } = trpc.config.public.useQuery();
  const [respondentName, setRespondentName] = useState("");
  const [showNameInput, setShowNameInput] = useState(false);
  const [pendingAction, setPendingAction] = useState<"accept" | "reject" | null>(null);
  const [responded, setResponded] = useState(false);

  const respondMutation = trpc.proposals.respondByToken.useMutation({
    onSuccess: (data) => {
      setResponded(true);
      if (data.accepted) {
        toast.success("Proposta aceita com sucesso! Nossa equipe entrará em contato em breve.");
      } else {
        toast.info("Proposta recusada. Obrigado pelo retorno.");
      }
      refetch();
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao processar resposta. Tente novamente.");
    },
  });

  const handleRespond = (accepted: boolean) => {
    if (!respondentName.trim()) {
      setPendingAction(accepted ? "accept" : "reject");
      setShowNameInput(true);
      return;
    }
    respondMutation.mutate({ token, accepted, respondentName: respondentName.trim() });
  };

  const handleConfirmWithName = () => {
    if (!respondentName.trim()) {
      toast.error("Por favor, informe seu nome antes de continuar.");
      return;
    }
    if (pendingAction) {
      respondMutation.mutate({
        token,
        accepted: pendingAction === "accept",
        respondentName: respondentName.trim(),
      });
      setShowNameInput(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando proposta...</div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Proposta não encontrada ou expirada</p>
        </div>
      </div>
    );
  }

  const features: string[] = Array.isArray(proposal.features) ? proposal.features : [];
  const isExpired = (proposal as any).validUntil && new Date((proposal as any).validUntil) < new Date();
  const alreadyAccepted = proposal.status === "accepted";
  const alreadyRejected = proposal.status === "rejected";
  const alreadyResponded = alreadyAccepted || alreadyRejected;

  // Número de WhatsApp vindo da configuração do servidor (não hardcoded)
  const whatsappNumber = config?.contactWhatsApp ?? "5575999999999";
  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Tenho dúvidas sobre a proposta do Morro Digital.")}`;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold gold-text">Morro Digital</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{proposal.title}</h1>
          <p className="text-muted-foreground">Proposta Comercial Personalizada</p>
        </div>

        {/* Status Banner — se já respondida */}
        {alreadyAccepted && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Proposta Aceita</p>
              <p className="text-sm text-emerald-400/80">Você aceitou esta proposta em {formatDate(proposal.respondedAt)}. Nossa equipe entrará em contato em breve.</p>
            </div>
          </div>
        )}
        {alreadyRejected && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-700/40 text-red-300">
            <XCircle className="h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Proposta Recusada</p>
              <p className="text-sm text-red-400/80">Esta proposta foi recusada em {formatDate(proposal.respondedAt)}.</p>
            </div>
          </div>
        )}
        {isExpired && !alreadyResponded && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border border-zinc-700/40 text-zinc-400">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">Esta proposta está expirada. Entre em contato para obter uma nova proposta atualizada.</p>
          </div>
        )}

        {/* Plan Card */}
        <div className="gradient-border p-6 rounded-xl space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{proposal.planName || "Plano Morro Digital"}</h2>
              <p className="text-muted-foreground text-sm mt-1">Solução completa de presença digital</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{formatCurrency(proposal.monthlyValue)}</p>
              <p className="text-xs text-muted-foreground">por mês</p>
              {proposal.setupFee && parseFloat(proposal.setupFee) > 0 && (
                <p className="text-sm text-muted-foreground mt-1">+ {formatCurrency(proposal.setupFee)} implantação</p>
              )}
            </div>
          </div>

          {features.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-border/30">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">O que está incluído</p>
              <div className="space-y-2">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Custom Message */}
        {proposal.customMessage && (
          <div className="p-5 rounded-xl bg-card/60 border border-border/40">
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Mensagem Personalizada</p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{proposal.customMessage}</p>
          </div>
        )}

        {/* Validity */}
        {(proposal as any).validUntil && (
          <div className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${isExpired ? "bg-zinc-900/40 border-zinc-700/30 text-zinc-500" : "bg-amber-950/20 border-amber-800/20 text-muted-foreground"}`}>
            <Clock className={`h-4 w-4 ${isExpired ? "text-zinc-500" : "text-amber-400"}`} />
            <span>
              {isExpired ? "Proposta expirada em " : "Esta proposta é válida até "}
              <strong className={isExpired ? "text-zinc-400" : "text-amber-400"}>{formatDate((proposal as any).validUntil)}</strong>
            </span>
          </div>
        )}

        {/* CTA — Aceite/Recusa ou Contato */}
        {!alreadyResponded && !isExpired && (
          <div className="space-y-4 pt-2">
            {/* Input de nome do signatário */}
            {showNameInput ? (
              <div className="p-5 rounded-xl bg-card/60 border border-border/40 space-y-3">
                <p className="text-sm font-semibold">Para confirmar, informe seu nome completo:</p>
                <input
                  type="text"
                  value={respondentName}
                  onChange={(e) => setRespondentName(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full px-4 py-2.5 rounded-lg bg-background/70 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  onKeyDown={(e) => e.key === "Enter" && handleConfirmWithName()}
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    onClick={handleConfirmWithName}
                    disabled={respondMutation.isPending || !respondentName.trim()}
                    className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${pendingAction === "accept" ? "bg-emerald-700 hover:bg-emerald-600 text-white" : "bg-red-800 hover:bg-red-700 text-white"} disabled:opacity-50`}
                  >
                    {respondMutation.isPending ? "Processando..." : pendingAction === "accept" ? "✓ Confirmar Aceite" : "✗ Confirmar Recusa"}
                  </button>
                  <button
                    onClick={() => { setShowNameInput(false); setPendingAction(null); }}
                    className="px-4 py-2.5 rounded-xl border border-border/50 text-sm text-muted-foreground hover:border-primary/30 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-center text-muted-foreground">Deseja prosseguir com esta proposta?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleRespond(true)}
                    disabled={respondMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50"
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Aceitar Proposta
                  </button>
                  <button
                    onClick={() => handleRespond(false)}
                    disabled={respondMutation.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-card border border-border/50 hover:border-red-700/50 hover:text-red-400 text-muted-foreground font-semibold transition-colors disabled:opacity-50"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Recusar
                  </button>
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  Ao aceitar, nossa equipe receberá uma notificação e entrará em contato para os próximos passos.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Contato via WhatsApp — sempre disponível */}
        <div className="text-center pt-2 border-t border-border/20">
          <p className="text-xs text-muted-foreground mb-2">Dúvidas? Fale conosco diretamente:</p>
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-800/60 hover:bg-green-700/70 text-green-300 text-sm font-medium transition-colors border border-green-700/30"
          >
            💬 Falar com a equipe no WhatsApp
          </a>
          <p className="text-xs text-muted-foreground mt-3">Criado em {formatDate(proposal.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
