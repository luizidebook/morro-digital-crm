import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, FileSignature, Loader2 } from "lucide-react";
import { useState } from "react";
import { useRoute } from "wouter";
import { toast } from "sonner";

export default function ContractView() {
  const [, params] = useRoute("/contracts/view/:token");
  const token = params?.token || "";
  const [signerName, setSignerName] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const { data: contract, isLoading, refetch } = trpc.contracts.getByToken.useQuery({ token }, { enabled: !!token });
  const publicSign = trpc.contracts.publicSign.useMutation({
    onSuccess: async () => {
      toast.success("Contrato assinado com sucesso!");
      await refetch();
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full border-border/50 bg-card/70">
          <CardContent className="p-8 text-center">
            <FileSignature className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
            <h1 className="text-xl font-bold">Contrato não encontrado</h1>
            <p className="text-sm text-muted-foreground mt-2">Verifique se o link está correto.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSigned = contract.status === "signed";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 py-8">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center">
            <FileSignature className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">{contract.title}</h1>
          <p className="text-sm text-muted-foreground">Contratação Digital — Morro Digital</p>
        </div>

        {isSigned && (
          <Card className="border-emerald-800/40 bg-emerald-950/20">
            <CardContent className="p-4 flex items-center gap-3 text-emerald-300">
              <CheckCircle2 className="h-5 w-5" />
              <div>
                <p className="font-semibold">Contrato assinado digitalmente</p>
                <p className="text-xs opacity-80">Recebemos sua autorização e iniciaremos a próxima etapa.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-border/50 bg-card/70">
          <CardContent className="p-6">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground/90">{contract.content}</pre>
          </CardContent>
        </Card>

        {!isSigned && (
          <Card className="border-border/50 bg-card/70">
            <CardContent className="p-6 space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Assinatura digital</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Preencha seu nome, confirme que leu os termos e finalize a contratação.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label>Nome do responsável *</Label>
                <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Digite seu nome completo" />
              </div>

              <label className="flex items-start gap-3 rounded-lg border border-border/50 p-3 text-sm cursor-pointer">
                <Checkbox checked={acceptedTerms} onCheckedChange={(checked) => setAcceptedTerms(!!checked)} className="mt-0.5" />
                <span>Li, compreendi e aceito os termos deste contrato de prestação de serviços digitais.</span>
              </label>

              <Button
                className="w-full bg-primary text-primary-foreground"
                disabled={publicSign.isPending || !acceptedTerms || signerName.trim().length < 2}
                onClick={() => publicSign.mutate({ token, signerName, acceptedTerms })}
              >
                {publicSign.isPending ? "Assinando..." : "Assinar e finalizar contratação"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
