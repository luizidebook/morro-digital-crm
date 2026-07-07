import { trpc } from "@/lib/trpc";
import { formatDate } from "@/lib/crm";
import {
  Building2,
  CheckCircle2,
  FileSignature,
  AlertCircle,
  XCircle,
  RotateCcw,
  PenLine,
} from "lucide-react";
import { useParams } from "wouter";
import { useRef, useState, useEffect, useCallback } from "react";
import { toast } from "sonner";

// ─── Signature Canvas ─────────────────────────────────────────────────────────
function SignatureCanvas({
  onSave,
  disabled,
}: {
  onSave: (dataUrl: string) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: MouseEvent | TouchEvent) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    isDrawing.current = true;
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }, [disabled]);

  const draw = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isDrawing.current || disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e, canvas);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e8d5a3";
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasSignature(true);
  }, [disabled]);

  const stopDraw = useCallback(() => {
    isDrawing.current = false;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDraw);
    canvas.addEventListener("mouseleave", stopDraw);
    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", stopDraw);
    return () => {
      canvas.removeEventListener("mousedown", startDraw);
      canvas.removeEventListener("mousemove", draw);
      canvas.removeEventListener("mouseup", stopDraw);
      canvas.removeEventListener("mouseleave", stopDraw);
      canvas.removeEventListener("touchstart", startDraw);
      canvas.removeEventListener("touchmove", draw);
      canvas.removeEventListener("touchend", stopDraw);
    };
  }, [startDraw, draw, stopDraw]);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) {
      toast.error("Por favor, assine no campo acima antes de confirmar.");
      return;
    }
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl border-2 border-dashed border-primary/30 bg-card/40 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full touch-none cursor-crosshair"
          style={{ display: "block" }}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-muted-foreground/40 text-sm flex items-center gap-2">
              <PenLine className="h-4 w-4" /> Assine aqui
            </p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border/40 text-xs text-muted-foreground hover:border-primary/30 transition-colors"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Limpar
        </button>
        <button
          type="button"
          onClick={save}
          disabled={!hasSignature || disabled}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-40"
        >
          <CheckCircle2 className="h-4 w-4" /> Confirmar Assinatura
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ContractView() {
  const { token } = useParams<{ token: string }>();
  const { data: contract, isLoading, refetch } = trpc.contracts.getByToken.useQuery({ token });
  const { data: config } = trpc.config.public.useQuery();
  const [signerName, setSignerName] = useState("");
  const [step, setStep] = useState<"read" | "sign" | "done">("read");
  const [agreed, setAgreed] = useState(false);

  const signMutation = trpc.contracts.signByToken.useMutation({
    onSuccess: () => {
      setStep("done");
      toast.success("Contrato assinado com sucesso!");
      refetch();
    },
    onError: (e) => {
      toast.error(e.message || "Erro ao assinar o contrato. Tente novamente.");
    },
  });

  const handleSignatureSave = (dataUrl: string) => {
    if (!signerName.trim()) {
      toast.error("Informe seu nome completo antes de assinar.");
      return;
    }
    signMutation.mutate({
      token,
      signatureData: dataUrl,
      signerName: signerName.trim(),
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Carregando contrato...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileSignature className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Contrato não encontrado</p>
        </div>
      </div>
    );
  }

  const isSigned = contract.status === "signed";
  const isCancelled = contract.status === "cancelled";

  // Número de WhatsApp vindo da configuração do servidor (não hardcoded)
  const whatsappNumber = config?.contactWhatsApp ?? "5575999999999";
  const whatsappLinkDuvidas = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Tenho dúvidas sobre a proposta do Morro Digital.")}`;
  const whatsappLinkAssinado = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent("Olá! Acabei de assinar o contrato do Morro Digital.")}`;

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-7 w-7 text-primary" />
            <span className="text-2xl font-bold gold-text">Morro Digital</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{contract.title}</h1>
          <p className="text-muted-foreground text-sm">Contrato de Prestação de Serviços Digitais</p>
        </div>

        {/* Status Banners */}
        {isSigned && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/40 text-emerald-300">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Contrato Assinado</p>
              <p className="text-sm text-emerald-400/80">
                Assinado por <strong>{(contract as any).signerName || "cliente"}</strong> em {formatDate(contract.signedAt)}.
                {(contract as any).signerIp && (
                  <span className="text-emerald-500/60 ml-1">(IP: {(contract as any).signerIp})</span>
                )}
              </p>
            </div>
          </div>
        )}
        {isCancelled && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/40 border border-red-700/40 text-red-300">
            <XCircle className="h-5 w-5 shrink-0" />
            <p className="font-semibold">Este contrato foi cancelado.</p>
          </div>
        )}
        {contract.status === "draft" && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-950/30 border border-amber-700/30 text-amber-300">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm">Este contrato ainda está em rascunho e não está disponível para assinatura.</p>
          </div>
        )}

        {/* Contract Content */}
        <div className="p-6 rounded-xl bg-card/60 border border-border/40">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-4">Conteúdo do Contrato</p>
          <div className="prose prose-sm prose-invert max-w-none">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans text-foreground/90 bg-transparent border-0 p-0">
              {contract.content}
            </pre>
          </div>
          {contract.monthlyValue && (
            <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Valor Mensal</span>
              <span className="text-lg font-bold text-primary">
                {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(parseFloat(contract.monthlyValue))}
                /mês
              </span>
            </div>
          )}
        </div>

        {/* Signature Section */}
        {!isSigned && !isCancelled && contract.status === "sent" && step !== "done" && (
          <div className="p-6 rounded-xl bg-card/60 border border-border/40 space-y-5">
            <div className="flex items-center gap-2">
              <FileSignature className="h-5 w-5 text-primary" />
              <h2 className="font-semibold">Assinar Contrato</h2>
            </div>

            {step === "read" && (
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-primary cursor-pointer"
                  />
                  <label htmlFor="agree" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                    Li e concordo com todos os termos e condições do contrato acima. Estou ciente de que esta assinatura eletrônica tem validade legal nos termos da Lei nº 14.063/2020.
                  </label>
                </div>
                <button
                  onClick={() => {
                    if (!agreed) {
                      toast.error("Você precisa concordar com os termos para prosseguir.");
                      return;
                    }
                    setStep("sign");
                  }}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
                >
                  Prosseguir para Assinatura →
                </button>
              </div>
            )}

            {step === "sign" && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Seu Nome Completo *</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    placeholder="Digite seu nome completo"
                    className="w-full px-4 py-2.5 rounded-lg bg-background/70 border border-border/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Assinatura *</label>
                  <p className="text-xs text-muted-foreground">Use o mouse ou o dedo para assinar no campo abaixo:</p>
                  <SignatureCanvas
                    onSave={handleSignatureSave}
                    disabled={signMutation.isPending || !signerName.trim()}
                  />
                </div>
                {signMutation.isPending && (
                  <p className="text-sm text-center text-muted-foreground animate-pulse">Registrando assinatura...</p>
                )}
                <button
                  type="button"
                  onClick={() => setStep("read")}
                  className="w-full py-2 rounded-lg border border-border/40 text-sm text-muted-foreground hover:border-primary/30 transition-colors"
                >
                  ← Voltar e reler o contrato
                </button>
              </div>
            )}
          </div>
        )}

        {/* Done State */}
        {(step === "done" || isSigned) && (
          <div className="text-center space-y-3 py-6">
            <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto" />
            <h2 className="text-xl font-bold">Contrato Assinado com Sucesso!</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Sua assinatura foi registrada. Nossa equipe receberá uma notificação e dará início ao processo de onboarding.
            </p>
            <a
              href={whatsappLinkAssinado}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-800/60 hover:bg-green-700/70 text-green-300 text-sm font-medium transition-colors border border-green-700/30 mt-2"
            >
              💬 Falar com a equipe no WhatsApp
            </a>
          </div>
        )}

        {/* Rodapé com link de dúvidas — disponível sempre que não estiver na tela de assinatura concluída */}
        {step !== "done" && !isSigned && (
          <div className="text-center pt-2 border-t border-border/20">
            <p className="text-xs text-muted-foreground mb-2">Dúvidas sobre o contrato?</p>
            <a
              href={whatsappLinkDuvidas}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-green-800/40 hover:bg-green-700/50 text-green-300 text-xs font-medium transition-colors border border-green-700/20"
            >
              💬 Falar com a equipe
            </a>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground pb-4">
          Contrato criado em {formatDate(contract.createdAt)} · Morro Digital © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
