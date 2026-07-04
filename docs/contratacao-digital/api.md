# API — Contratação Digital

## 1. Gerar contrato a partir da proposta

```http
POST /api/contracts/from-proposal/:proposalId
```

### Regras

- A proposta precisa estar aceita.
- O cliente precisa possuir dados obrigatórios.
- Não pode existir outro contrato ativo para a mesma proposta.

### Resposta de sucesso

```json
{
  "success": true,
  "message": "Contrato gerado e enviado para assinatura.",
  "data": {
    "contractId": "uuid",
    "status": "waiting_signature",
    "signingUrl": "https://..."
  }
}
```

---

## 2. Consultar contrato

```http
GET /api/contracts/:contractId
```

### Resposta

```json
{
  "id": "uuid",
  "status": "waiting_signature",
  "signingUrl": "https://...",
  "signedPdfUrl": null,
  "certificateUrl": null,
  "clientId": "uuid",
  "proposalId": "uuid"
}
```

---

## 3. Cancelar contrato

```http
POST /api/contracts/:contractId/cancel
```

### Regras

- Não permitir cancelar contrato já assinado.
- Cancelar também no provider externo.
- Registrar auditoria.

---

## 4. Reenviar contrato

```http
POST /api/contracts/:contractId/resend
```

### MVP

No MVP, esse endpoint pode apenas retornar novamente o `signingUrl` para o frontend abrir o WhatsApp.

---

## 5. Webhook de assinatura

```http
POST /api/webhooks/signature
```

### Eventos esperados

```txt
document_created
document_viewed
document_signed
document_completed
document_rejected
document_cancelled
document_expired
```

### Regras

- Salvar payload bruto.
- Processar de forma idempotente.
- Validar assinatura do webhook quando o provider oferecer suporte.
- Retornar 200 para evitar loops agressivos.

### Ao receber assinatura concluída

```txt
contract.status = signed
contract.signed_at = now()
client.status = cliente_ativo
proposal.status = accepted_signed
criar tarefas de onboarding
registrar audit_log contract_signed
```

---

## 6. Dados mínimos para a tela

A tela da proposta deve conseguir consultar:

```txt
contract.id
contract.status
contract.signingUrl
contract.signedPdfUrl
contract.certificateUrl
contract.sentAt
contract.signedAt
contract.provider
contract.events[]
```

---

## 7. Mensagem WhatsApp

```js
const message = `Olá, ${client.responsibleName}! Tudo bem?\n\nConforme conversamos, segue o link para finalizar sua contratação como parceiro do Morro Digital:\n\n${contract.signingUrl}\n\nÉ só abrir pelo celular, conferir os dados e assinar digitalmente.\n\nAssim que você finalizar, o sistema me avisa automaticamente e já iniciamos sua ativação na plataforma.`;

const whatsappUrl = `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
```
