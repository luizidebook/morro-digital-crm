type ContractStatus =
  | 'draft'
  | 'generated'
  | 'sent'
  | 'waiting_signature'
  | 'viewed'
  | 'signed'
  | 'rejected'
  | 'cancelled'
  | 'expired'
  | 'error';

type Contract = {
  id: string;
  status: ContractStatus;
  signingUrl?: string;
  signedPdfUrl?: string;
  certificateUrl?: string;
  sentAt?: string;
  signedAt?: string;
};

type Client = {
  responsibleName: string;
  phone: string;
};

type Props = {
  contract?: Contract | null;
  client: Client;
  proposalId: string;
  onGenerateContract: (proposalId: string) => Promise<void>;
};

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '').replace(/^55/, '');
}

function buildWhatsappUrl(client: Client, contract: Contract) {
  const message = `Olá, ${client.responsibleName}! Tudo bem?\n\nConforme conversamos, segue o link para finalizar sua contratação como parceiro do Morro Digital:\n\n${contract.signingUrl}\n\nÉ só abrir pelo celular, conferir os dados e assinar digitalmente.\n\nAssim que você finalizar, o sistema me avisa automaticamente e já iniciamos sua ativação na plataforma.`;

  return `https://wa.me/55${normalizePhone(client.phone)}?text=${encodeURIComponent(message)}`;
}

export function ContractStatusCard({ contract, client, proposalId, onGenerateContract }: Props) {
  if (!contract) {
    return (
      <section className="rounded-xl border p-4">
        <h3 className="text-lg font-semibold">Contratação Digital</h3>
        <p className="mt-2 text-sm opacity-80">Nenhum contrato foi gerado para esta proposta.</p>

        <button
          type="button"
          className="mt-4 rounded-lg px-4 py-2 font-medium"
          onClick={() => onGenerateContract(proposalId)}
        >
          Gerar contrato digital
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-xl border p-4">
      <h3 className="text-lg font-semibold">Contratação Digital</h3>

      <div className="mt-2 text-sm">
        <p>Status: {contract.status}</p>
        {contract.sentAt && <p>Enviado em: {contract.sentAt}</p>}
        {contract.signedAt && <p>Assinado em: {contract.signedAt}</p>}
      </div>

      {contract.signingUrl && contract.status !== 'signed' && (
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={() => navigator.clipboard.writeText(contract.signingUrl || '')}>
            Copiar link
          </button>

          <a href={buildWhatsappUrl(client, contract)} target="_blank" rel="noreferrer">
            Enviar pelo WhatsApp
          </a>
        </div>
      )}

      {contract.status === 'signed' && (
        <div className="mt-4 flex gap-2">
          {contract.signedPdfUrl && (
            <a href={contract.signedPdfUrl} target="_blank" rel="noreferrer">
              Baixar contrato assinado
            </a>
          )}

          {contract.certificateUrl && (
            <a href={contract.certificateUrl} target="_blank" rel="noreferrer">
              Baixar certificado
            </a>
          )}
        </div>
      )}
    </section>
  );
}
