import { nanoid } from "nanoid";

export type SignatureDocumentInput = {
  contractId: number;
  contractToken: string;
  title: string;
  content: string;
  signer: {
    name?: string | null;
    email?: string | null;
    phone?: string | null;
    documentNumber?: string | null;
  };
  metadata?: Record<string, unknown>;
};

export type SignatureDocumentOutput = {
  provider: string;
  providerDocumentId: string;
  providerSignerId?: string;
  signingUrl: string;
  status: "waiting_signature" | "sent";
  rawResponse: Record<string, unknown>;
};

export function getPublicAppUrl() {
  return (process.env.PUBLIC_APP_URL || process.env.APP_URL || "").replace(/\/+$/, "");
}

export function buildInternalSigningUrl(token: string) {
  const baseUrl = getPublicAppUrl();
  const path = `/contracts/view/${token}`;
  return baseUrl ? `${baseUrl}${path}` : path;
}

export function buildContractContentFromProposal(input: {
  lead: any;
  proposal: any;
}) {
  const { lead, proposal } = input;
  const today = new Date().toLocaleDateString("pt-BR");
  const features = (() => {
    try {
      const parsed = typeof proposal.features === "string" ? JSON.parse(proposal.features) : proposal.features;
      if (Array.isArray(parsed) && parsed.length) return parsed.map((f) => `- ${f}`).join("\n");
    } catch {}
    return "- Página personalizada no portal Morro Digital\n- Presença no mapa interativo\n- Divulgação digital\n- Suporte comercial e operacional";
  })();

  return `CONTRATO DE PRESTAÇÃO DE SERVIÇOS DIGITAIS\n\nCONTRATANTE: ${lead.companyName}, representada por ${lead.contactName || "responsável legal não informado"}, com contato ${lead.whatsapp || lead.phone || "não informado"} e e-mail ${lead.email || "não informado"}.\n\nCONTRATADA: Morro Digital, plataforma de presença digital, marketing e divulgação turística em Morro de São Paulo/BA.\n\nCLÁUSULA 1ª — OBJETO\nA CONTRATADA prestará serviços digitais relacionados ao plano ${proposal.planName || "Morro Digital"}, incluindo:\n${features}\n\nCLÁUSULA 2ª — VALOR\nO valor mensal contratado é de R$ ${proposal.monthlyValue}. ${proposal.setupFee ? `Taxa de implantação: R$ ${proposal.setupFee}.` : ""}\n\nCLÁUSULA 3ª — VIGÊNCIA\nA contratação inicia a partir da assinatura digital deste instrumento e segue conforme as condições comerciais alinhadas entre as partes.\n\nCLÁUSULA 4ª — OBRIGAÇÕES DA CONTRATANTE\nA CONTRATANTE deverá fornecer informações, imagens, dados, acessos e aprovações necessárias para execução dos serviços.\n\nCLÁUSULA 5ª — OBRIGAÇÕES DA CONTRATADA\nA CONTRATADA deverá executar os serviços digitais contratados com zelo, transparência e comunicação adequada.\n\nCLÁUSULA 6ª — ACEITE DIGITAL\nAo assinar eletronicamente este documento, a CONTRATANTE declara ter lido, compreendido e aceitado as condições comerciais e operacionais aqui descritas.\n\nMorro de São Paulo/BA, ${today}.`;
}

export class InternalSignatureProvider {
  async createDocument(input: SignatureDocumentInput): Promise<SignatureDocumentOutput> {
    const signingUrl = buildInternalSigningUrl(input.contractToken);
    return {
      provider: "internal",
      providerDocumentId: `internal_${input.contractId}_${nanoid(10)}`,
      providerSignerId: `signer_${nanoid(10)}`,
      signingUrl,
      status: "waiting_signature",
      rawResponse: {
        mode: "internal_mvp",
        signingUrl,
        signer: input.signer,
        metadata: input.metadata,
      },
    };
  }
}

export function buildWhatsappContractMessage(input: {
  contactName?: string | null;
  signingUrl: string;
}) {
  const name = input.contactName || "tudo bem";
  return `Olá, ${name}! Tudo bem?\n\nConforme conversamos, segue o link para finalizar sua contratação como parceiro do Morro Digital:\n\n${input.signingUrl}\n\nÉ só abrir pelo celular, conferir os dados e assinar digitalmente.\n\nAssim que você finalizar, o sistema me avisa automaticamente e já iniciamos sua ativação na plataforma.`;
}
