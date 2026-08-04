# Sprint 0 — Inventário e Congelamento Arquitetural do Admin CRM

## Objetivo

Estabelecer uma linha segura de evolução do `morro-digital-crm` para que ele se torne o Admin CRM oficial do ecossistema Morro Digital, sem alterar a branch `main` durante a fase de auditoria e planejamento técnico.

## Branch oficial de trabalho

`architecture/admin-crm-integration`

A branch `main` permanece como referência estável e não deve receber refatorações arquiteturais antes da conclusão da Sprint 0.

## Escopo da Sprint 0

### 1. Inventário técnico

- [ ] Mapear todas as páginas do frontend.
- [ ] Mapear componentes compartilhados e específicos do CRM.
- [ ] Mapear rotas tRPC e dependências entre módulos.
- [ ] Mapear entidades e migrations Drizzle.
- [ ] Mapear autenticação, sessão e autorização.
- [ ] Mapear jobs agendados e cron handlers.
- [ ] Mapear integrações externas.
- [ ] Mapear arquivos e dependências específicos do ambiente Manus.
- [ ] Mapear testes existentes e lacunas de cobertura.
- [ ] Mapear variáveis de ambiente e segredos necessários.

### 2. Arquitetura alvo

- [ ] Definir o CRM como aplicação administrativa separada do Business Portal.
- [ ] Definir integração por Admin API, sem acesso direto ao banco do sistema principal.
- [ ] Definir módulos por domínio: comercial, empresas, assinaturas, financeiro, conteúdo, afiliados, operação e auditoria.
- [ ] Definir RBAC administrativo.
- [ ] Definir cliente oficial da Platform/Admin API.
- [ ] Definir estratégia de observabilidade e auditoria.
- [ ] Definir política de versionamento e compatibilidade da API.

### 3. Riscos que bloqueiam implementação

- Drizzle/MySQL no CRM e Prisma/PostgreSQL no sistema principal.
- Backend concentrado em `server/routers.ts` e `server/db.ts`.
- Ausência de RBAC granular.
- Dependências específicas do Manus.
- Ausência de contratos formais para integração com a Admin API.
- Ausência de segregação explícita entre dados comerciais locais e dados da plataforma.

## Decisões já aprovadas

1. O Business Portal continuará existindo para proprietários de empresas.
2. O Admin CRM será usado somente por Luiz e usuários administrativos autorizados.
3. O CRM não acessará diretamente o banco principal do Morro Digital.
4. O CRM consumirá uma Admin API autenticada e versionada.
5. Afiliados pertencem exclusivamente ao Morro Digital, não aos sellers.
6. O CRM será o centro de controle administrativo da rede de afiliados, comissões, wallets e payouts.
7. A base visual e parte da estrutura atual do CRM serão reaproveitadas.
8. A branch `main` permanecerá protegida durante a refatoração arquitetural.

## Critérios de conclusão da Sprint 0

- Inventário completo de frontend, backend, banco, autenticação, integrações e testes.
- Gap analysis consolidada.
- Matriz de módulos: manter, adaptar, remover ou criar.
- Contrato inicial da Admin API.
- Matriz RBAC aprovada.
- Plano de remoção/isolamento de dependências Manus.
- Backlog técnico priorizado em P0, P1 e P2.
- Nenhuma alteração funcional em produção antes da aprovação desses entregáveis.

## Próxima entrega

Documento `CRM-CURRENT-STATE-AUDIT.md` com o estado atual real do repositório, arquivos críticos, dependências, fluxos e riscos.