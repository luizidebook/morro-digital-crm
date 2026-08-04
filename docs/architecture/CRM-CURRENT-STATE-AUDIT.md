# Auditoria do Estado Atual — Admin CRM Morro Digital

## 1. Objetivo

Este documento registra o estado atual do repositório `luizidebook/morro-digital-crm` antes de qualquer refatoração estrutural. Ele serve como referência oficial para a transformação do CRM existente no Admin CRM do ecossistema Morro Digital.

## 2. Escopo

A auditoria cobre:

- arquitetura de frontend;
- arquitetura de backend;
- persistência;
- autenticação;
- testes;
- jobs agendados;
- dependências externas;
- módulos atuais;
- riscos;
- decisões de reaproveitamento.

## 3. Stack atual

### Frontend

- React 19
- TypeScript
- Vite
- Wouter
- TanStack Query
- tRPC client
- React Hook Form
- Zod
- Tailwind CSS
- Radix UI
- Recharts
- Framer Motion

### Backend

- Node.js
- Express
- TypeScript
- tRPC server
- Drizzle ORM
- MySQL
- Zod
- JWT/cookies
- Vitest
- S3 compatível

## 4. Estrutura atual

```text
client/
  src/
    _core/
    components/
    contexts/
    pages/
server/
  _core/
  db.ts
  routers.ts
  scheduledHandlers.ts
  storage.ts
shared/
drizzle/
references/
patches/
```

## 5. Páginas e módulos identificados

### Reaproveitar

- Dashboard
- Leads
- Lead Detail
- Meetings
- Proposals
- Proposal View
- Contracts
- Contract View
- Follow-ups
- Trials
- Referrals
- Settings

### Componentes relevantes

- CRMLayout
- DashboardLayout
- DashboardLayoutSkeleton
- ErrorBoundary
- Map
- AIChatBox
- biblioteca UI baseada em Radix
- componentes de gráficos

## 6. Diagnóstico de arquitetura

### Pontos fortes

- separação entre frontend, backend e código compartilhado;
- uso de TypeScript em toda a aplicação;
- APIs tipadas com tRPC;
- validação com Zod;
- base visual rica e reutilizável;
- testes já existentes;
- arquitetura adequada para backoffice administrativo;
- suporte a jobs agendados e armazenamento de arquivos.

### Fragilidades

- `server/routers.ts` concentra responsabilidades demais;
- `server/db.ts` concentra acesso a múltiplos domínios;
- backend orientado a arquivos centrais, ainda sem modularização por domínio;
- ausência de RBAC granular;
- ausência de trilha de auditoria completa;
- dependências e artefatos específicos do ambiente Manus;
- ausência de camada de integração formal com a Admin API do Morro Digital;
- banco MySQL/Drizzle incompatível com o PostgreSQL/Prisma do sistema principal;
- ausência de observabilidade estruturada;
- cobertura de testes insuficiente para o futuro Admin CRM.

## 7. Decisão de integração

O CRM não deverá consultar diretamente o banco do Morro Digital.

Arquitetura aprovada:

```text
Admin CRM
  -> Admin API / Platform API
  -> Morro Digital Core
  -> PostgreSQL
```

O banco local do CRM ficará restrito a responsabilidades próprias do backoffice, quando necessário, como preferências administrativas, configurações locais, rascunhos, cache controlado e dados operacionais não canônicos.

## 8. Classificação dos módulos

| Módulo | Estado | Decisão |
|---|---|---|
| Dashboard | Parcial | Refatorar e expandir |
| Leads | Maduro | Reaproveitar |
| Reuniões | Maduro | Reaproveitar |
| Propostas | Parcial | Integrar ao domínio comercial |
| Contratos | Parcial | Integrar ao Core |
| Follow-ups | Maduro | Reaproveitar |
| Trials | Parcial | Reavaliar nomenclatura e finalidade |
| Referrals | Conflitante | Não confundir com afiliados da plataforma |
| Configurações | Parcial | Expandir |
| Autenticação | Parcial | Reforçar |
| RBAC | Insuficiente | Criar |
| Auditoria | Insuficiente | Criar |
| Empresas | Ausente | Criar |
| Assinaturas | Ausente | Criar |
| Cobranças | Ausente | Criar |
| Pagamentos | Ausente | Criar |
| Permutas | Ausente | Criar |
| Afiliados | Ausente | Criar |
| Marketplace | Ausente | Criar futuramente |
| Reservas | Ausente | Criar futuramente |
| Ledger | Ausente | Criar futuramente |

## 9. Dependências Manus

Devem ser catalogadas e classificadas em:

- manter temporariamente;
- isolar;
- substituir;
- remover.

Itens já identificados incluem componentes, plugins e scripts de debug específicos do ambiente Manus.

## 10. Segurança

Itens obrigatórios antes de produção:

- RBAC granular;
- MFA para perfis privilegiados;
- cookies `httpOnly`, `secure` e `sameSite`;
- rotação e expiração de sessão;
- proteção CSRF;
- rate limiting;
- validação centralizada;
- trilha de auditoria;
- segregação de permissões;
- logs sem dados sensíveis;
- gestão segura de segredos;
- revisão de upload e storage;
- política de acesso administrativo.

## 11. Refatoração-alvo

Estrutura recomendada:

```text
server/
  modules/
    identity/
    crm/
    businesses/
    subscriptions/
    finance/
    affiliates/
    audit/
    settings/
  integrations/
    morro-admin-api/
  shared/
    auth/
    errors/
    logging/
    validation/
client/
  app/
  modules/
    dashboard/
    crm/
    businesses/
    subscriptions/
    finance/
    affiliates/
    settings/
  shared/
    ui/
    hooks/
    api/
    auth/
```

## 12. Primeira sequência de trabalho

1. inventário completo de rotas, tabelas e componentes;
2. catálogo de dependências Manus;
3. matriz de permissões;
4. definição da Admin API;
5. criação do cliente oficial da Admin API;
6. primeiro módulo integrado: Empresas;
7. segundo módulo integrado: Assinaturas;
8. auditoria e logs administrativos;
9. testes de integração e regressão.

## 13. Critérios de conclusão da Sprint 0

A Sprint 0 será considerada concluída quando existirem:

- inventário técnico completo;
- arquitetura AS-IS;
- arquitetura TO-BE;
- matriz de módulos;
- matriz de dependências;
- matriz de permissões;
- catálogo de integrações;
- backlog priorizado;
- riscos documentados;
- plano de migração aprovado.

## 14. Regra de governança

Nenhuma funcionalidade estrutural nova será implementada sem:

- vínculo com um domínio;
- documentação no Blueprint;
- critérios de aceite;
- definição de permissões;
- estratégia de teste;
- impacto de segurança analisado.
