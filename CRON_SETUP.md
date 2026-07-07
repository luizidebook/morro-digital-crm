# Configuração das Tarefas Agendadas (Cron)

Os handlers de automação já estão implementados no servidor. Para ativá-los, configure os jobs de cron no painel do WebDev onde o CRM está hospedado.

## Endpoints Disponíveis

| Handler | Endpoint | Frequência Recomendada |
|---------|----------|------------------------|
| Follow-up automático | `POST /api/scheduled/followup-check` | Diariamente às 08:00 |
| Verificação de trials | `POST /api/scheduled/trial-expiry` | Diariamente às 07:00 |

## Como Configurar no Painel WebDev

1. Acesse o painel do seu projeto no WebDev
2. Navegue até **Settings → Cron Jobs** (ou **Scheduled Tasks**)
3. Crie dois jobs com as seguintes configurações:

### Job 1 — Follow-up Automático
```
Name: followup-check
Method: POST
URL: /api/scheduled/followup-check
Cron: 0 0 8 * * *   (todos os dias às 08:00)
```

### Job 2 — Verificação de Trials
```
Name: trial-expiry
Method: POST
URL: /api/scheduled/trial-expiry
Cron: 0 0 7 * * *   (todos os dias às 07:00)
```

## O que cada job faz

**followup-check**: Verifica todos os leads nas etapas ativas do funil que estão sem contato há mais dias do que o intervalo configurado nas Settings. Para cada lead elegível, gera automaticamente uma mensagem personalizada via IA e cria um follow-up na fila. O operador recebe uma notificação e pode revisar/enviar pelo CRM.

**trial-expiry**: Verifica todos os trials ativos. Notifica o operador sobre trials que vencem em 3 dias e atualiza automaticamente o status dos trials já vencidos para "expirado".

## Observações

- Os endpoints são protegidos: só aceitam chamadas com o header de autenticação de cron da plataforma (`isCron: true`). Chamadas externas não autorizadas retornam 403.
- Se o follow-up automático estiver desativado nas Settings do CRM, o job é executado mas não gera nenhuma mensagem (comportamento seguro).
