# Contratação Digital — CRM Morro Digital

## Objetivo

Implementar no CRM do Morro Digital um fluxo de contratação digital que reduza o atrito entre proposta aceita e contrato assinado.

Fluxo desejado:

```txt
Lead cadastrado
↓
Proposta enviada
↓
Proposta aceita
↓
Contrato gerado
↓
Link de assinatura enviado por WhatsApp
↓
Cliente assina digitalmente
↓
Webhook atualiza CRM
↓
Cliente vira ativo
↓
Onboarding é iniciado
```

## Nome interno

**Projeto Contratação em 60 segundos**

## Estratégia recomendada

Para o MVP, integrar um provedor de assinatura eletrônica, em vez de criar uma infraestrutura jurídica própria.

Provider inicial recomendado:

```txt
ZapSign
```

Alternativa empresarial:

```txt
Clicksign
```

A aplicação deve usar uma camada abstrata chamada `SignatureProvider`, permitindo trocar o provedor no futuro sem reescrever o CRM.

---

## Módulos necessários

```txt
contracts
contract_signers
signature_events
audit_logs
signature_provider
webhooks
onboarding_tasks
```

---

## Novos status comerciais

```txt
novo_lead
contato_realizado
proposta_enviada
proposta_aceita
contrato_gerado
contrato_enviado
aguardando_assinatura
contrato_assinado
pagamento_pendente
cliente_ativo
onboarding_iniciado
```

---

## Regras principais

1. Não gerar contrato sem proposta aceita.
2. Não gerar contrato se cadastro obrigatório estiver incompleto.
3. Não permitir dois contratos ativos para a mesma proposta.
4. Contrato assinado não pode ser editado.
5. Alterações comerciais relevantes exigem novo contrato.
6. Webhooks devem ser idempotentes.
7. Tokens de assinatura nunca devem ir para o frontend.
8. Todos os eventos importantes devem gerar auditoria.

---

## Campos obrigatórios para gerar contrato

```txt
Nome da empresa
Nome jurídico / razão social
CPF ou CNPJ
Nome do responsável
E-mail
WhatsApp
Plano contratado
Valor contratado
Forma de pagamento
Data de início
Aceite da proposta
```

---

## Estados do contrato

```txt
draft
generated
sent
waiting_signature
viewed
signed
rejected
cancelled
expired
error
```

---

## Tela recomendada no CRM

### Na tela da proposta

Bloco: **Contratação Digital**

Quando não há contrato:

```txt
Status: Contrato ainda não gerado
[Gerar contrato digital]
```

Quando aguardando assinatura:

```txt
Status: Aguardando assinatura
[Copiar link]
[Enviar pelo WhatsApp]
[Reenviar]
[Cancelar contrato]
```

Quando assinado:

```txt
Status: Contrato assinado
[Baixar contrato assinado]
[Baixar certificado]
[Iniciar onboarding]
```

---

## Mensagem WhatsApp padrão

```txt
Olá, {{nome}}! Tudo bem?

Conforme conversamos, segue o link para finalizar sua contratação como parceiro do Morro Digital:

{{link_assinatura}}

É só abrir pelo celular, conferir os dados e assinar digitalmente.

Assim que você finalizar, o sistema me avisa automaticamente e já iniciamos sua ativação na plataforma.
```

---

## Métricas do dashboard

```txt
Contratos aguardando assinatura
Contratos assinados esta semana
Tempo médio entre proposta aceita e assinatura
Contratos expirados
Taxa proposta aceita → contrato assinado
Contratos parados há mais de 24 horas
```

---

## Ordem de execução recomendada

```txt
1. Criar tabelas do banco
2. Criar camada SignatureProvider
3. Criar provider ZapSign
4. Criar endpoint para gerar contrato
5. Criar bloco Contratação Digital na tela da proposta
6. Criar botão WhatsApp
7. Criar webhook de assinatura
8. Criar atualização automática de status
9. Criar tarefas de onboarding
10. Criar métricas no dashboard
```
