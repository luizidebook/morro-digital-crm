export interface CreateSignatureDocumentInput {
  contractId: string;
  title: string;
  pdfUrl?: string;
  pdfBase64?: string;
  signer: {
    name: string;
    email?: string;
    phone?: string;
    documentNumber?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface CreateSignatureDocumentOutput {
  provider: string;
  providerDocumentId: string;
  providerSignerId?: string;
  signingUrl: string;
  status: string;
  rawResponse: unknown;
}

export interface SignatureProvider {
  createDocument(input: CreateSignatureDocumentInput): Promise<CreateSignatureDocumentOutput>;
  getDocument(providerDocumentId: string): Promise<unknown>;
  cancelDocument(providerDocumentId: string): Promise<unknown>;
  handleWebhook(payload: unknown, headers: Record<string, unknown>): Promise<unknown>;
}

function normalizePhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  return phone.replace(/\D/g, '').replace(/^55/, '');
}

export class ZapSignProvider implements SignatureProvider {
  private apiUrl: string;
  private token: string;

  constructor() {
    this.apiUrl = process.env.ZAPSIGN_BASE_URL || 'https://api.zapsign.com.br';
    this.token = process.env.ZAPSIGN_API_TOKEN || '';

    if (!this.token) {
      throw new Error('ZAPSIGN_API_TOKEN não configurado.');
    }
  }

  async createDocument(input: CreateSignatureDocumentInput): Promise<CreateSignatureDocumentOutput> {
    const response = await fetch(`${this.apiUrl}/api/v1/docs/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: input.title,
        base64_pdf: input.pdfBase64,
        external_id: input.contractId,
        lang: 'pt-br',
        signers: [
          {
            name: input.signer.name,
            email: input.signer.email,
            phone_country: '55',
            phone_number: normalizePhone(input.signer.phone),
            auth_mode: 'assinaturaTela',
            require_selfie_photo: false,
            require_document_photo: false
          }
        ],
        metadata: input.metadata
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao criar documento no provider de assinatura: ${error}`);
    }

    const data: any = await response.json();

    return {
      provider: 'zapsign',
      providerDocumentId: data.token || data.id,
      providerSignerId: data.signers?.[0]?.token || data.signers?.[0]?.id,
      signingUrl: data.signers?.[0]?.sign_url || data.sign_url,
      status: data.status || 'waiting_signature',
      rawResponse: data
    };
  }

  async getDocument(providerDocumentId: string): Promise<unknown> {
    const response = await fetch(`${this.apiUrl}/api/v1/docs/${providerDocumentId}/`, {
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao consultar documento no provider de assinatura: ${error}`);
    }

    return response.json();
  }

  async cancelDocument(providerDocumentId: string): Promise<unknown> {
    const response = await fetch(`${this.apiUrl}/api/v1/docs/${providerDocumentId}/`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erro ao cancelar documento no provider de assinatura: ${error}`);
    }

    return response.json();
  }

  async handleWebhook(payload: unknown): Promise<unknown> {
    return payload;
  }
}
