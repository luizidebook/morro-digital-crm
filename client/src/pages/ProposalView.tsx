import { trpc } from "@/lib/trpc";
import { formatCurrency, formatDate } from "@/lib/crm";
import { Building2, CheckCircle2, Clock, FileText } from "lucide-react";
import { useParams } from "wouter";

export default function ProposalView() {
  const { token } = useParams<{ token: string }>();
  const { data: proposal, isLoading } = trpc.proposals.getByToken.useQuery({ token });

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
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-amber-950/20 border border-amber-800/20">
            <Clock className="h-4 w-4 text-amber-400" />
            <span>Esta proposta é válida até <strong className="text-amber-400">{formatDate((proposal as any).validUntil)}</strong></span>
          </div>
        )}

        {/* CTA */}
        <div className="text-center space-y-3 pt-4">
          <p className="text-sm text-muted-foreground">Interessado? Entre em contato conosco pelo WhatsApp para dar continuidade.</p>
          <a
            href="https://wa.me/5575999999999?text=Ol%C3%A1!%20Tenho%20interesse%20na%20proposta%20do%20Morro%20Digital."
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-700 hover:bg-green-600 text-white font-semibold transition-colors"
          >
            💬 Aceitar Proposta via WhatsApp
          </a>
          <p className="text-xs text-muted-foreground">Criado em {formatDate(proposal.createdAt)}</p>
        </div>
      </div>
    </div>
  );
}
